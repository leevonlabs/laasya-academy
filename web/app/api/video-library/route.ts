import { NextRequest, NextResponse } from 'next/server';
import {
  getVideoLibraryItems,
  getCoursesWithDetails,
  getStudentsForCourse,
  createEventFolder,
  createUniversalEventFolders,
  getGuruComplianceData,
} from '@/lib/videoLibrary';
import { sendFcmToUser, sendFcmToBatch, sendFcmToCourse, sendFcmToRole } from '@/lib/fcm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isCompliance = searchParams.get('compliance') === 'true' || searchParams.get('guruCompliance') === 'true';

    // If requesting Guru performance video compliance audit
    if (isCompliance) {
      const month = searchParams.get('month') || undefined;
      const year = searchParams.get('year') || undefined;
      const trainerId = searchParams.get('trainerId') || undefined;
      const trainerName = searchParams.get('trainerName') || undefined;

      const compliance = await getGuruComplianceData({ month, year, trainerId, trainerName });
      return NextResponse.json({ success: true, ...compliance }, { headers: corsHeaders });
    }

    const courseId = searchParams.get('courseId') || undefined;
    const courseTitle = searchParams.get('courseTitle') || undefined;
    const batchId = searchParams.get('batchId') || undefined;
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const sharedByType = searchParams.get('shared_by_type') || searchParams.get('sharedByType') || undefined;
    const trainerId = searchParams.get('trainerId') || undefined;
    const includeCourses = searchParams.get('includeCourses') === 'true';
    const courseStudents = searchParams.get('courseStudents');


    // If requesting enrolled students for a specific course
    if (courseStudents) {
      const students = await getStudentsForCourse(courseStudents, batchId);
      return NextResponse.json({ success: true, students }, { headers: corsHeaders });
    }

    const items = await getVideoLibraryItems({
      courseId,
      courseTitle,
      batchId,
      search,
      category,
      sharedByType,
      trainerId
    });

    let courses = undefined;
    if (includeCourses) {
      courses = await getCoursesWithDetails();
    }

    return NextResponse.json(
      {
        success: true,
        items,
        courses,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('GET /api/video-library error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch video library data' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      drive_url,
      youtube_url,
      shared_by_type,
      trainer_id,
      trainer_name,
      description,
      event_name,
      event_date,
      is_universal,
      selected_courses,
      target_course_id,
      target_course_title,
      target_batch_id,
      target_batch_name,
      access_level,
      created_by,
      category,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Video / Event Title is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanDriveUrl = drive_url && drive_url.trim().length > 0 ? drive_url.trim() : null;
    const cleanYoutubeUrl = youtube_url && youtube_url.trim().length > 0 ? youtube_url.trim() : null;

    if (!cleanDriveUrl && !cleanYoutubeUrl) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least a Google Drive link or YouTube link' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Universal / Multi-course sharing
    if (is_universal && Array.isArray(selected_courses) && selected_courses.length > 0) {
      const result = await createUniversalEventFolders({
        title: title.trim(),
        drive_url: cleanDriveUrl,
        youtube_url: cleanYoutubeUrl,
        shared_by_type: shared_by_type || 'admin',
        trainer_id: trainer_id || null,
        trainer_name: trainer_name || null,
        description: description?.trim() || '',
        event_name: event_name?.trim() || title.trim(),
        event_date,
        selected_courses,
        created_by: created_by || (shared_by_type === 'guru' ? (trainer_name || 'Guru Faculty') : 'Academy Owner'),
      });

      // Dispatch FCM Push Notifications
      if (selected_courses.some((c: any) => c.id === 'all')) {
        sendFcmToRole('all', {
          title: 'New Video Shared',
          body: `New video "${title.trim()}" has been shared for all academy students and gurus.`,
          data: {
            type: 'video_shared',
            route: '/messages',
            video_id: String(result[0]?.id || '')
          }
        }).catch(err => console.error('[FCM] Error notifying universal video:', err));
      } else {
        for (const c of selected_courses) {
          if (c.id && c.id !== 'all') {
            sendFcmToCourse(c.id, {
              title: 'New Video Shared',
              body: `New video "${title.trim()}" shared for ${c.title || 'Course'}.`,
              data: {
                type: 'video_shared',
                route: '/messages',
                course_id: String(c.id),
                video_id: String(result[0]?.id || '')
              }
            }).catch(err => console.error('[FCM] Error notifying course video:', err));
          }
        }
      }

      return NextResponse.json(
        { success: true, item: result[0], count: selected_courses.length },
        { headers: corsHeaders }
      );
    }

    // Multiple batches chosen for a course
    if (Array.isArray(body.selected_batches) && body.selected_batches.length > 0) {
      const createdItems = [];
      for (const batch of body.selected_batches) {
        const singleItem = await createEventFolder({
          title: title.trim(),
          drive_url: cleanDriveUrl,
          youtube_url: cleanYoutubeUrl,
          shared_by_type: shared_by_type || 'admin',
          trainer_id: trainer_id || null,
          trainer_name: trainer_name || null,
          category: category || (shared_by_type === 'guru' ? 'guru_share' : 'event_folder'),
          description: description?.trim() || '',
          event_name: event_name?.trim() || title.trim(),
          event_date,
          target_course_id: batch.course_id || target_course_id,
          target_course_title: batch.course_title || target_course_title,
          target_batch_id: batch.id === 'all' ? null : batch.id,
          target_batch_name: batch.name || 'All Batches',
          access_level: batch.id === 'all' ? 'Course' : 'Batch',
          created_by: created_by || (shared_by_type === 'guru' ? (trainer_name || 'Guru Faculty') : 'Academy Owner'),
        });
        if (singleItem) {
          createdItems.push(singleItem);
          if (batch.id && batch.id !== 'all') {
            sendFcmToBatch(batch.id, {
              title: 'New Class Video Available',
              body: `New video "${title.trim()}" shared for ${batch.course_title || target_course_title || ''} (${batch.name || ''}).`,
              data: {
                type: 'video_shared',
                route: '/messages',
                batch_id: String(batch.id),
                video_id: String(singleItem.id || '')
              }
            }).catch(err => console.error('[FCM] Error notifying batch video:', err));
          }
        }
      }
      return NextResponse.json(
        { success: true, items: createdItems, item: createdItems[0] || null },
        { headers: corsHeaders }
      );
    }

    // Single course or specific batch sharing
    const item = await createEventFolder({
      title: title.trim(),
      drive_url: cleanDriveUrl,
      youtube_url: cleanYoutubeUrl,
      shared_by_type: shared_by_type || 'admin',
      trainer_id: trainer_id || null,
      trainer_name: trainer_name || null,
      category: category || (shared_by_type === 'guru' ? 'guru_share' : 'event_folder'),
      description: description?.trim() || '',
      event_name: event_name?.trim() || title.trim(),
      event_date,
      target_course_id,
      target_course_title,
      target_batch_id,
      target_batch_name: target_batch_name || 'All Batches',
      target_students: body.target_students || null,
      target_student_names: body.target_student_names || null,
      access_level,
      created_by: created_by || (shared_by_type === 'guru' ? (trainer_name || 'Guru Faculty') : 'Academy Owner'),
    });

    // Send real-time FCM Push Notification to target recipients
    if (Array.isArray(body.target_students) && body.target_students.length > 0) {
      for (const stuId of body.target_students) {
        sendFcmToUser(stuId, {
          title: 'New Performance Video Shared',
          body: `Guru ${trainer_name || 'Faculty'} has shared "${title.trim()}" with you.`,
          data: {
            type: 'video_shared',
            route: '/messages',
            video_id: String(item?.id || ''),
            course_title: String(target_course_title || '')
          }
        }).catch(err => console.error('[FCM] Error notifying student video:', err));
      }
    } else if (target_batch_id && target_batch_id !== 'all') {
      sendFcmToBatch(target_batch_id, {
        title: 'New Class Video Available',
        body: `New video "${title.trim()}" shared for ${target_course_title || ''} (${target_batch_name || ''}).`,
        data: {
          type: 'video_shared',
          route: '/messages',
          batch_id: String(target_batch_id),
          video_id: String(item?.id || '')
        }
      }).catch(err => console.error('[FCM] Error notifying batch video:', err));
    } else if (target_course_id && target_course_id !== 'all') {
      sendFcmToCourse(target_course_id, {
        title: 'New Class Video Available',
        body: `New video "${title.trim()}" shared for ${target_course_title || ''}.`,
        data: {
          type: 'video_shared',
          route: '/messages',
          course_id: String(target_course_id),
          video_id: String(item?.id || '')
        }
      }).catch(err => console.error('[FCM] Error notifying course video:', err));
    } else {
      sendFcmToRole('all', {
        title: 'New Class Video Available',
        body: `New video "${title.trim()}" shared for all academy disciples.`,
        data: {
          type: 'video_shared',
          route: '/messages',
          video_id: String(item?.id || '')
        }
      }).catch(err => console.error('[FCM] Error notifying all video:', err));
    }

    return NextResponse.json({ success: true, item }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('POST /api/video-library error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save event folder link' },
      { status: 500, headers: corsHeaders }
    );
  }
}

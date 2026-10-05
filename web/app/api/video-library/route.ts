import { NextRequest, NextResponse } from 'next/server';
import {
  getVideoLibraryItems,
  getCoursesWithDetails,
  getStudentsForCourse,
  createEventFolder,
  createUniversalEventFolders,
} from '@/lib/videoLibrary';

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
    const courseId = searchParams.get('courseId') || undefined;
    const courseTitle = searchParams.get('courseTitle') || undefined;
    const batchId = searchParams.get('batchId') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeCourses = searchParams.get('includeCourses') === 'true';
    const courseStudents = searchParams.get('courseStudents');

    // If requesting enrolled students for a specific course
    if (courseStudents) {
      const students = await getStudentsForCourse(courseStudents, batchId);
      return NextResponse.json({ success: true, students }, { headers: corsHeaders });
    }

    const items = await getVideoLibraryItems({ courseId, courseTitle, batchId, search });

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
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Event Title is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!drive_url || !drive_url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Google Drive folder link is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Universal / Multi-course sharing
    if (is_universal && Array.isArray(selected_courses) && selected_courses.length > 0) {
      const result = await createUniversalEventFolders({
        title: title.trim(),
        drive_url: drive_url.trim(),
        description: description?.trim() || '',
        event_name: event_name?.trim() || title.trim(),
        event_date,
        selected_courses,
        created_by: 'Academy Owner',
      });
      return NextResponse.json(
        { success: true, item: result[0], count: selected_courses.length },
        { headers: corsHeaders }
      );
    }

    // Single course or specific batch sharing
    const item = await createEventFolder({
      title: title.trim(),
      drive_url: drive_url.trim(),
      description: description?.trim() || '',
      event_name: event_name?.trim() || title.trim(),
      event_date,
      target_course_id,
      target_course_title,
      target_batch_id,
      target_batch_name: target_batch_name || 'All Batches',
      access_level,
      created_by: 'Academy Owner',
    });

    return NextResponse.json({ success: true, item }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('POST /api/video-library error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save event folder link' },
      { status: 500, headers: corsHeaders }
    );
  }
}

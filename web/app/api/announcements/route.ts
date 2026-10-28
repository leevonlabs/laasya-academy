import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncements, createAnnouncement } from '@/lib/announcements';
import { getCurrentUser } from '@/lib/auth';
import { sendFcmToRole, sendFcmToBatch, sendFcmToCourse, sendFcmToUser } from '@/lib/fcm';
import { queryOne } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const audience = searchParams.get('audience') || undefined;
    const typeTag = searchParams.get('typeTag') || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const announcementType = searchParams.get('announcementType') || searchParams.get('type') || undefined;

    const announcements = await getAnnouncements({
      status,
      audience,
      typeTag,
      search,
      startDate,
      endDate,
      announcementType,
    });

    return NextResponse.json({
      success: true,
      announcements
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const isOwner = user?.role === 'owner';
    const isReceptionist = user?.role === 'receptionist';
    let verifiedRole: 'admin' | 'trainer' | 'receptionist';
    let verifiedName: string;
    let verifiedTrainerId: string | null = null;

    if (isOwner) {
      verifiedRole = 'admin';
      verifiedName = user.fullName || 'Academy Director';
    } else if (isReceptionist) {
      verifiedRole = 'receptionist';
      verifiedName = user.fullName ? `${user.fullName} (Reception)` : 'Reception';
    } else if (body.sender_role === 'trainer' && body.trainer_id) {
      // Validate that trainer exists and is active in database
      const activeTrainer = await queryOne<{ id: string; full_name: string; is_active: boolean }>(
        `SELECT t.id, p.full_name, t.is_active
         FROM public.trainers t
         JOIN public.profiles p ON t.profile_id = p.id
         WHERE (t.id = $1 OR t.profile_id = $1) AND t.is_active = true
         LIMIT 1`,
        [body.trainer_id]
      );

      if (!activeTrainer) {
        return NextResponse.json(
          { error: 'Unauthorized: Valid active faculty credentials required.' },
          { status: 403, headers: corsHeaders }
        );
      }

      verifiedRole = 'trainer';
      verifiedName = activeTrainer.full_name;
      verifiedTrainerId = activeTrainer.id;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to publish announcements.' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Title is required', field: 'title' }, { status: 400, headers: corsHeaders });
    }
    if (!body.message || body.message.trim() === '') {
      // For banners or ads where description is optional, default message to the title
      if (body.announcement_type === 'banner' || body.image_url) {
        body.message = body.title.trim();
      } else {
        return NextResponse.json({ error: 'Message is required', field: 'message' }, { status: 400, headers: corsHeaders });
      }
    }
    if (!body.publish_date) {
      body.publish_date = new Date().toISOString().split('T')[0];
    }

    const created = await createAnnouncement({
      ...body,
      type_tag: body.type_tag || 'General',
      audience: body.audience || 'All Students & Gurus',
      sender_role: verifiedRole,
      created_by: verifiedName,
      trainer_name: verifiedRole === 'trainer' ? verifiedName : null,
      trainer_id: verifiedTrainerId,
    });

    // Send real-time FCM Push Notification to target audience
    if (body.announcement_type !== 'banner') {
      const targetAudience = (body.audience || '').toLowerCase();
      const notifPayload = {
        title: body.title || 'Academy Notice',
        body: body.message || 'A new announcement has been published.',
        channelId: 'laasya_announcements',
        route: '/announcements',
        data: {
          type: 'announcement',
          route: '/announcements',
          id: String(created?.id || ''),
          sender: isReceptionist ? 'Reception' : String(verifiedName),
          sender_role: verifiedRole,
          title: body.title || (isReceptionist ? 'Reception Notice' : 'Academy Notice'),
          body: body.message || 'A new announcement has been published.',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      };

      let studentList: any[] = [];
      if (Array.isArray(body.target_students)) {
        studentList = body.target_students;
      } else if (typeof body.target_students === 'string' && body.target_students.trim().startsWith('[')) {
        try {
          studentList = JSON.parse(body.target_students);
        } catch (_) {}
      }

      if (studentList.length > 0) {
        for (const st of studentList) {
          const sId = String(st.id || st.student_id || st.profile_id || '');
          if (sId) {
            sendFcmToUser(sId, notifPayload).catch(e => console.error('[FCM] Error notifying student:', e));
          }
        }
      } else if (body.target_batch_id) {
        sendFcmToBatch(body.target_batch_id, notifPayload).catch(e => console.error('[FCM] Error notifying batch:', e));
      } else if (body.target_course_id) {
        sendFcmToCourse(body.target_course_id, notifPayload).catch(e => console.error('[FCM] Error notifying course:', e));
      } else if (targetAudience.includes('student') && (targetAudience.includes('guru') || targetAudience.includes('trainer'))) {
        sendFcmToRole('all', notifPayload).catch(e => console.error('[FCM] Error notifying all:', e));
      } else if (targetAudience.includes('student') || targetAudience.includes('disciple')) {
        sendFcmToRole('student', notifPayload).catch(e => console.error('[FCM] Error notifying students:', e));
      } else if (targetAudience.includes('trainer') || targetAudience.includes('guru')) {
        sendFcmToRole('trainer', notifPayload).catch(e => console.error('[FCM] Error notifying gurus:', e));
      } else {
        sendFcmToRole('all', notifPayload).catch(e => console.error('[FCM] Error notifying all:', e));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      announcement: created
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: error.message || 'Failed to create announcement' }, { status: 400, headers: corsHeaders });
  }
}

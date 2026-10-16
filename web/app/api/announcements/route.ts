import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncements, createAnnouncement } from '@/lib/announcements';
import { getCurrentUser } from '@/lib/auth';
import { sendFcmToRole, sendFcmToBatch } from '@/lib/fcm';

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

    const isGuru = body.sender_role === 'trainer' || body.trainer_name || body.trainer_id;
    const isAdmin = user?.role === 'owner' || body.sender_role === 'admin' || body.announcement_type === 'banner' || (!isGuru && !user);
    if (!user && !isGuru && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
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

    const senderRole = isGuru ? 'trainer' : (user?.role === 'owner' ? 'admin' : 'trainer');
    const createdBy = isGuru ? (body.trainer_name || 'Guru Faculty') : (user?.fullName || 'Academy Director');

    const created = await createAnnouncement({
      ...body,
      sender_role: senderRole,
      created_by: createdBy,
      trainer_name: body.trainer_name || (isGuru ? createdBy : null),
      trainer_id: body.trainer_id || null,
    });

    // Send real-time FCM Push Notification to target audience
    if (body.announcement_type !== 'banner') {
      const targetAudience = (body.audience || '').toLowerCase();
      const notifPayload = {
        title: body.title || 'Academy Notice',
        body: body.message || 'A new announcement has been published.',
        data: {
          type: 'announcement',
          id: String(created?.id || ''),
          sender: String(createdBy)
        }
      };

      if (targetAudience.includes('trainer') || targetAudience.includes('guru')) {
        sendFcmToRole('trainer', notifPayload).catch(e => console.error('[FCM] Error notifying gurus:', e));
      } else if (targetAudience.includes('student') || targetAudience.includes('disciple')) {
        sendFcmToRole('student', notifPayload).catch(e => console.error('[FCM] Error notifying students:', e));
      } else if (body.target_batch_id) {
        sendFcmToBatch(body.target_batch_id, notifPayload).catch(e => console.error('[FCM] Error notifying batch:', e));
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

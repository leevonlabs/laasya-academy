import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncements, createAnnouncement } from '@/lib/announcements';
import { getCurrentUser } from '@/lib/auth';

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
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Title is required', field: 'title' }, { status: 400 });
    }
    if (!body.message || body.message.trim() === '') {
      return NextResponse.json({ error: 'Message is required', field: 'message' }, { status: 400 });
    }
    if (!body.publish_date) {
      return NextResponse.json({ error: 'Publish date is required', field: 'publish_date' }, { status: 400 });
    }

    const created = await createAnnouncement({
      ...body,
      created_by: user.fullName || 'Academy Director'
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      announcement: created
    });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: error.message || 'Failed to create announcement' }, { status: 400 });
  }
}

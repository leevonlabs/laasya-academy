import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncements, createAnnouncement } from '@/lib/announcements';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const audience = searchParams.get('audience') || undefined;
    const typeTag = searchParams.get('typeTag') || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const announcements = await getAnnouncements({
      status,
      audience,
      typeTag,
      search,
      startDate,
      endDate
    });

    return NextResponse.json({
      success: true,
      announcements
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

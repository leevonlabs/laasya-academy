import { NextRequest, NextResponse } from 'next/server';
import { unpublishAnnouncement } from '@/lib/announcements';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const unpublished = await unpublishAnnouncement(id);

    return NextResponse.json({
      success: true,
      message: 'Announcement unpublished and moved to Draft',
      announcement: unpublished
    });
  } catch (error: any) {
    console.error('Error unpublishing announcement:', error);
    return NextResponse.json({ error: error.message || 'Failed to unpublish announcement' }, { status: 400 });
  }
}

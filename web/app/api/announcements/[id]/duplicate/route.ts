import { NextRequest, NextResponse } from 'next/server';
import { duplicateAnnouncement } from '@/lib/announcements';
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
    const duplicated = await duplicateAnnouncement(id);

    return NextResponse.json({
      success: true,
      message: 'Announcement duplicated as draft',
      announcement: duplicated
    });
  } catch (error: any) {
    console.error('Error duplicating announcement:', error);
    return NextResponse.json({ error: error.message || 'Failed to duplicate announcement' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { updateAnnouncement, deleteAnnouncement } from '@/lib/announcements';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Title is required', field: 'title' }, { status: 400 });
    }
    if (!body.message || body.message.trim() === '') {
      return NextResponse.json({ error: 'Message is required', field: 'message' }, { status: 400 });
    }

    const updated = await updateAnnouncement(id, body);

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: updated
    });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: error.message || 'Failed to update announcement' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteAnnouncement(id);

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
      announcement: deleted
    });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete announcement' }, { status: 400 });
  }
}

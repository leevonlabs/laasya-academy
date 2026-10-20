import { NextRequest, NextResponse } from 'next/server';
import { updateAnnouncement, deleteAnnouncement } from '@/lib/announcements';
import { getCurrentUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const user = await getCurrentUser();
    const isOwnerOrStaff = user?.role === 'owner' || user?.role === 'receptionist';
    const isTrainer = body?.sender_role === 'trainer' || body?.role === 'trainer';
    const isSystemAdmin = body?.sender_role === 'admin' || body?.announcement_type === 'banner';

    if (!user && !isOwnerOrStaff && !isTrainer && !isSystemAdmin) {
      // allow if direct API with valid payload
    }

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Title is required', field: 'title' }, { status: 400, headers: corsHeaders });
    }
    if (!body.message || body.message.trim() === '') {
      if (body.announcement_type === 'banner' || body.image_url) {
        body.message = body.title.trim();
      } else {
        return NextResponse.json({ error: 'Message is required', field: 'message' }, { status: 400, headers: corsHeaders });
      }
    }

    const updated = await updateAnnouncement(id, body);

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: updated
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: error.message || 'Failed to update announcement' }, { status: 400, headers: corsHeaders });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteAnnouncement(id);

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
      announcement: deleted
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete announcement' }, { status: 400, headers: corsHeaders });
  }
}

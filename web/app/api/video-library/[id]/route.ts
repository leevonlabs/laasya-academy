import { NextRequest, NextResponse } from 'next/server';
import { deleteVideoLibraryItem, updateVideoLibraryItem } from '@/lib/videoLibrary';
import { getCurrentUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && !(user.role === 'receptionist' && user.canDelete))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Delete permission denied' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400, headers: corsHeaders });
    }

    const success = await deleteVideoLibraryItem(id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Item not found or could not be deleted' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, message: 'Event folder link deleted successfully' }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('DELETE /api/video-library/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete event folder' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'trainer')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Owner or Faculty access required' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400, headers: corsHeaders });
    }

    const body = await request.json();
    const updated = await updateVideoLibraryItem(id, {
      title: body.title,
      drive_url: body.drive_url,
      youtube_url: body.youtube_url,
      event_name: body.event_name || body.title,
      event_date: body.event_date,
      description: body.description,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Item not found or could not be updated' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, item: updated }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('PUT /api/video-library/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event folder' },
      { status: 500, headers: corsHeaders }
    );
  }
}

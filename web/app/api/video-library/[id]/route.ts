import { NextRequest, NextResponse } from 'next/server';
import { deleteVideoLibraryItem } from '@/lib/videoLibrary';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
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

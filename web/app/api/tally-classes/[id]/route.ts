import { NextRequest, NextResponse } from 'next/server';
import { deleteTallyClass, updateTallyClassStatus, updateTallyClassDetails } from '@/lib/holidayTally';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTallyClass(id);
    return NextResponse.json({ success: true, message: 'Tally class deleted' }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete tally class' }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.rescheduled_date || body.start_time || body.end_time || body.room_or_hall || body.reason) {
      const updated = await updateTallyClassDetails(id, body);
      return NextResponse.json({ success: true, message: 'Schedule updated', tallyClass: updated }, { headers: corsHeaders });
    }
    
    if (body.status) {
      await updateTallyClassStatus(id, body.status);
      return NextResponse.json({ success: true, message: 'Status updated' }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'No update fields provided' }, { status: 400, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update tally class' }, { status: 500, headers: corsHeaders });
  }
}

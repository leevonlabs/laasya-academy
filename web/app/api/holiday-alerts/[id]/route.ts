import { NextRequest, NextResponse } from 'next/server';
import { deleteHolidayAlert } from '@/lib/holidayTally';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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
    await deleteHolidayAlert(id);
    return NextResponse.json({ success: true, message: 'Holiday alert deleted' }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete holiday alert' }, { status: 500, headers: corsHeaders });
  }
}

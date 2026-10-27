import { NextRequest, NextResponse } from 'next/server';
import { deleteGuruAbsence } from '@/lib/holidayTally';
import { getCurrentUser } from '@/lib/auth';

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
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
      return NextResponse.json({ error: 'Unauthorized: Staff access required' }, { status: 403, headers: corsHeaders });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400, headers: corsHeaders });
    }

    await deleteGuruAbsence(id);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error deleting guru absence:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete guru absence' }, { status: 500, headers: corsHeaders });
  }
}

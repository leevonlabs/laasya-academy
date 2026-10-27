import { NextRequest, NextResponse } from 'next/server';
import { getGuruAbsences, createGuruAbsence } from '@/lib/holidayTally';
import { getCurrentUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const absences = await getGuruAbsences();
    return NextResponse.json({ success: true, absences }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch guru absences' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'receptionist' && user.role !== 'trainer')) {
      return NextResponse.json({ error: 'Unauthorized: Staff or Faculty access required' }, { status: 403, headers: corsHeaders });
    }

    const body = await request.json();

    if (!body.trainer_id) {
      return NextResponse.json({ error: 'Trainer selection is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.batch_id) {
      return NextResponse.json({ error: 'Batch selection is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.absence_date) {
      return NextResponse.json({ error: 'Absence date is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json({ error: 'Reason for absence is required' }, { status: 400, headers: corsHeaders });
    }

    const created = await createGuruAbsence({
      ...body,
      created_by: user?.fullName || 'Academy Admin'
    });

    return NextResponse.json({ success: true, absence: created }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error recording guru absence:', error);
    return NextResponse.json({ error: error.message || 'Failed to record guru absence' }, { status: 500, headers: corsHeaders });
  }
}

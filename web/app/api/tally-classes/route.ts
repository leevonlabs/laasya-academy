import { NextRequest, NextResponse } from 'next/server';
import { getTallyClasses, createTallyClass } from '@/lib/holidayTally';
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
    const classes = await getTallyClasses();
    return NextResponse.json({ success: true, classes }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tally classes' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'receptionist' && user.role !== 'trainer')) {
      return NextResponse.json({ error: 'Unauthorized: Staff or Faculty access required' }, { status: 403, headers: corsHeaders });
    }

    const body = await request.json();

    if (!body.batch_id) {
      return NextResponse.json({ error: 'Batch selection is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.rescheduled_date) {
      return NextResponse.json({ error: 'Rescheduled date is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.start_time || !body.end_time) {
      return NextResponse.json({ error: 'Start and end time are required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.room_or_hall) {
      return NextResponse.json({ error: 'Room selection is required' }, { status: 400, headers: corsHeaders });
    }

    const created = await createTallyClass({
      ...body,
      created_by: user?.fullName || 'Academy Admin'
    });

    return NextResponse.json({ success: true, tallyClass: created }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error creating tally class:', error);
    return NextResponse.json({ error: error.message || 'Failed to create tally class' }, { status: 500, headers: corsHeaders });
  }
}

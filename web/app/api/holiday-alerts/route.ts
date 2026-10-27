import { NextRequest, NextResponse } from 'next/server';
import { getHolidayAlerts, createHolidayAlert, updateHolidayAlert } from '@/lib/holidayTally';
import { getCurrentUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const alerts = await getHolidayAlerts();
    return NextResponse.json({ success: true, alerts }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch holiday alerts' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
      return NextResponse.json({ error: 'Unauthorized: Staff access required' }, { status: 403, headers: corsHeaders });
    }

    const body = await request.json();

    if (!body.holiday_date) {
      return NextResponse.json({ error: 'Holiday date is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Holiday title is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.reason || body.reason.trim() === '') {
      return NextResponse.json({ error: 'Reason/Description is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.target_course_ids || body.target_course_ids.length === 0) {
      return NextResponse.json({ error: 'At least one course must be selected' }, { status: 400, headers: corsHeaders });
    }
    if (!body.target_batch_ids || body.target_batch_ids.length === 0) {
      return NextResponse.json({ error: 'At least one batch must be selected' }, { status: 400, headers: corsHeaders });
    }

    const created = await createHolidayAlert({
      ...body,
      created_by: user?.fullName || 'Academy Admin'
    });

    return NextResponse.json({ success: true, alert: created }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error creating holiday alert:', error);
    return NextResponse.json({ error: error.message || 'Failed to create holiday alert' }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
      return NextResponse.json({ error: 'Unauthorized: Staff access required' }, { status: 403, headers: corsHeaders });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Holiday alert ID is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.holiday_date) {
      return NextResponse.json({ error: 'Holiday date is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Holiday title is required' }, { status: 400, headers: corsHeaders });
    }
    if (!body.reason || body.reason.trim() === '') {
      return NextResponse.json({ error: 'Reason/Description is required' }, { status: 400, headers: corsHeaders });
    }

    const updated = await updateHolidayAlert(body);
    return NextResponse.json({ success: true, alert: updated }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error updating holiday alert:', error);
    return NextResponse.json({ error: error.message || 'Failed to update holiday alert' }, { status: 500, headers: corsHeaders });
  }
}

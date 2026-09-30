import { NextResponse } from 'next/server';
import { getAttendanceAuditRecords } from '@/lib/academy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || searchParams.get('course_id') || undefined;
    const startDate = searchParams.get('startDate') || searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('endDate') || searchParams.get('end_date') || undefined;
    const dateFilter = searchParams.get('dateFilter') || searchParams.get('date') || undefined;

    const records = await getAttendanceAuditRecords({
      courseId,
      startDate,
      endDate,
      dateFilter
    });

    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

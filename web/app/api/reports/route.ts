import { NextRequest, NextResponse } from 'next/server';
import { 
  getAttendanceReport, 
  getFeesReport, 
  getSalariesReport, 
  getIncomeVsExpensesReport,
  ReportType 
} from '@/lib/reports';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'attendance') as ReportType;
    const courseId = searchParams.get('courseId') || undefined;
    const batchId = searchParams.get('batchId') || undefined;
    const studentId = searchParams.get('studentId') || undefined;
    const trainerId = searchParams.get('trainerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const payrollMonth = searchParams.get('payrollMonth') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    switch (type) {
      case 'attendance': {
        const result = await getAttendanceReport({ courseId, batchId, studentId, startDate, endDate });
        return NextResponse.json({ success: true, type, ...result });
      }
      case 'fees': {
        const result = await getFeesReport({ courseId, batchId, status, startDate, endDate });
        return NextResponse.json({ success: true, type, ...result });
      }
      case 'salaries': {
        const result = await getSalariesReport({ payrollMonth, trainerId, status });
        return NextResponse.json({ success: true, type, ...result });
      }
      case 'income_expenses': {
        const result = await getIncomeVsExpensesReport({ startDate, endDate });
        return NextResponse.json({ success: true, type, ...result });
      }
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ 
      error: error.message || 'Unable to generate report. Please try again.',
      success: false 
    }, { status: 500 });
  }
}

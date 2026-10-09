import { NextRequest, NextResponse } from 'next/server';
import { 
  getAttendanceReport, 
  getFeesReport, 
  getSalariesReport, 
  getIncomeVsExpensesReport,
  getAbsenceReport,
  getStudentCourseAbsenceReport,
  getStudentBatchSessionAudit,
  getBatchAttendanceReport,
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

    const courseIdsParam = searchParams.get('courseIds');
    const courseIds = courseIdsParam ? courseIdsParam.split(',').filter(Boolean) : undefined;
    const batchIdsParam = searchParams.get('batchIds');
    const batchIds = batchIdsParam ? batchIdsParam.split(',').filter(Boolean) : undefined;

    // Absence specific parameters
    const studentIdsParam = searchParams.get('studentIds');
    const studentIds = studentIdsParam ? studentIdsParam.split(',').filter(Boolean) : undefined;
    const sort = (searchParams.get('sort') || 'high_absence') as 'high_absence' | 'low_absence';

    switch (type) {
      case 'attendance': {
        const result = await getAttendanceReport({ courseId, courseIds, batchId, batchIds, studentId, startDate, endDate });
        return NextResponse.json({ success: true, type, ...result });
      }
      case 'absence': {
        // Level 3: Individual session attendance details for student and batch
        if (studentId && batchId) {
          const result = await getStudentBatchSessionAudit({ studentId, batchId, startDate, endDate });
          return NextResponse.json({ success: true, type, level: 'sessions', ...result });
        }
        // Level 2: Student course-wise breakdown
        if (studentId) {
          const result = await getStudentCourseAbsenceReport({ studentId, startDate, endDate });
          return NextResponse.json({ success: true, type, level: 'courses', ...result });
        }
        // Level 1: Overall student absence report
        const result = await getAbsenceReport({ studentIds, sort, startDate, endDate });
        return NextResponse.json({ success: true, type, level: 'main', ...result });
      }
      case 'fees': {
        const result = await getFeesReport({ courseId, courseIds, batchId, batchIds, status, startDate, endDate });
        return NextResponse.json({ success: true, type, ...result });
      }
      case 'salaries': {
        const result = await getSalariesReport({ payrollMonth, trainerId, status, startDate, endDate });
        return NextResponse.json({ success: true, type, ...result });
      }
      case 'income_expenses': {
        const result = await getIncomeVsExpensesReport({ startDate, endDate });
        return NextResponse.json({ success: true, type, ...result });
      }
      case 'batch_attendance':
      case 'batch': {
        const result = await getBatchAttendanceReport({
          courseIds,
          batchIds,
          sort,
          startDate,
          endDate
        });
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

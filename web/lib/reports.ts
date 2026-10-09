import { query, queryOne } from './db';
import { getExpenses } from './expenses';

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------

export type ReportType = 'attendance' | 'fees' | 'salaries' | 'income_expenses' | 'absence' | 'batch_attendance' | 'batch';

export interface BatchAttendanceReportRow {
  batch_id: string;
  batch_name: string;
  course_id: string;
  course_name: string;
  trainer_id: string;
  trainer_name: string;
  trainer_contact: string;
  total_registered_students: number;
  total_classes_held: number;
  total_absences: number;
  absence_percentage: number;
}

export interface BatchAttendanceReportSummary {
  totalCourses: number;
  totalBatches: number;
  totalStudents: number;
}

export interface AbsenceReportRow {
  student_id: string;
  student_name: string;
  roll_number: string;
  student_contact: string;
  parent_contact: string;
  total_classes_held: number;
  total_absent_days: number;
  total_present_days: number;
}

export interface StudentCourseAbsenceRow {
  course_id: string;
  course_name: string;
  batch_id: string;
  batch_name: string;
  total_classes_held: number;
  total_present_days: number;
  total_absent_days: number;
}

export interface SessionAttendanceAuditRow {
  session_id: string;
  session_date: string;
  trainer_name: string;
  course_name: string;
  batch_name: string;
  audit_status: string;
  remarks?: string | null;
}

export interface StudentAbsenceProfile {
  student_id: string;
  student_name: string;
  roll_number: string;
  student_contact: string;
  parent_contact: string;
}

export interface AttendanceReportSummary {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

export interface AttendanceReportRow {
  session_date: string;
  course_title: string;
  batch_name: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent';
  check_in_time?: string | null;
  remarks?: string | null;
}

export interface FeesReportSummary {
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  totalDiscounts: number;
  totalRefunds: number;
  paymentMethodBreakdown: { method: string; count: number; total: number }[];
  paymentStatusBreakdown?: { status: string; label: string; count: number; total: number }[];
}

export interface FeesReportRow {
  invoice_number: string;
  student_name: string;
  course_title: string;
  batch_name: string;
  fee_period: string;
  due_date: string;
  total_amount: number;
  discount_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: string;
  last_payment_date?: string | null;
  payment_method?: string | null;
}

export interface SalariesReportSummary {
  totalPayable: number;
  totalPaid: number;
  totalPending: number;
  totalBonuses: number;
  totalDeductions: number;
  trainerCount: number;
}

export interface SalariesReportRow {
  trainer_name: string;
  display_title: string;
  payroll_month: string;
  base_salary: number;
  classes_conducted: number;
  bonus_amount: number;
  deduction_amount: number;
  advance_deducted: number;
  net_salary: number;
  status: string;
  payment_date?: string | null;
  payment_method?: string | null;
}

export interface IncomeExpensesReportSummary {
  totalIncome: number;
  totalSalaries: number;
  totalOtherExpenses: number;
  totalExpenses: number;
  netOperatingAmount: number;
  status: 'Surplus' | 'Deficit';
}

export interface IncomeExpensesReportRow {
  category: string;
  type: 'Income' | 'Salary Expense' | 'General Expense';
  description: string;
  date: string;
  amount: number;
  payment_method: string;
  reference?: string | null;
}

// -------------------------------------------------------------
// 1. ATTENDANCE REPORT
// -------------------------------------------------------------
export async function getAttendanceReport(filters: {
  courseId?: string;
  courseIds?: string[];
  batchId?: string;
  batchIds?: string[];
  studentId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  summary: AttendanceReportSummary;
  records: AttendanceReportRow[];
  generatedAt: string;
}> {
  try {
    let sql = `
      SELECT 
        cs.session_date::text as session_date,
        COALESCE(c.title, 'General Course') as course_title,
        COALESCE(b.name, 'All Batches') as batch_name,
        COALESCE(p.full_name, 'Student') as student_name,
        COALESCE(s.roll_number, 'N/A') as roll_number,
        COALESCE(a.status, 'not-marked') as status,
        a.check_in_time::text as check_in_time,
        a.remarks
      FROM public.class_sessions cs
      LEFT JOIN public.batches b ON b.id = cs.batch_id
      LEFT JOIN public.courses c ON c.id = b.course_id
      LEFT JOIN public.batch_enrollments be ON be.batch_id = cs.batch_id
      LEFT JOIN public.students s ON s.id = be.student_id
      LEFT JOIN public.profiles p ON p.id = s.profile_id
      LEFT JOIN public.attendance a ON a.session_id = cs.id AND a.student_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.courseIds && filters.courseIds.length > 0) {
      params.push(filters.courseIds);
      sql += ` AND c.id = ANY($${params.length}::uuid[])`;
    } else if (filters.courseId && filters.courseId !== 'all') {
      params.push(filters.courseId);
      sql += ` AND c.id = $${params.length}`;
    }

    if (filters.batchIds && filters.batchIds.length > 0) {
      params.push(filters.batchIds);
      sql += ` AND b.id = ANY($${params.length}::uuid[])`;
    } else if (filters.batchId && filters.batchId !== 'all') {
      params.push(filters.batchId);
      sql += ` AND b.id = $${params.length}`;
    }

    if (filters.studentId && filters.studentId !== 'all') {
      params.push(filters.studentId);
      sql += ` AND s.id = $${params.length}`;
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND cs.session_date::date >= $${params.length}::date`;
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND cs.session_date::date <= $${params.length}::date`;
    }

    sql += ` ORDER BY cs.session_date DESC, student_name ASC LIMIT 500;`;

    const rawRows = await query<AttendanceReportRow>(sql, params);

    let presentCount = 0;
    let absentCount = 0;

    for (const r of rawRows) {
      const st = (r.status || 'absent').toLowerCase();
      if (st === 'present' || st === 'late') {
        presentCount++;
        r.status = 'present';
      } else {
        absentCount++;
        r.status = 'absent';
      }
    }

    const totalSessions = rawRows.length;
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return {
      summary: {
        totalSessions,
        presentCount,
        absentCount,
        attendancePercentage: percentage
      },
      records: rawRows,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getAttendanceReport:', err);
    return {
      summary: {
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        attendancePercentage: 0
      },
      records: [],
      generatedAt: new Date().toISOString()
    };
  }
}

export function formatFifthOfMonth(dateStrOrPeriod?: string | null): string {
  if (!dateStrOrPeriod) return '05/10/2026';
  let d = new Date(dateStrOrPeriod);
  if (isNaN(d.getTime())) {
    const match = String(dateStrOrPeriod).match(/([a-zA-Z]+)\s+(\d{4})/);
    if (match) {
      const mNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
      const mIdx = mNames.findIndex(m => m.startsWith(match[1].toLowerCase()));
      if (mIdx !== -1) {
        d = new Date(parseInt(match[2], 10), mIdx, 5);
      }
    }
  }
  if (isNaN(d.getTime())) return '05/10/2026';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `05/${mm}/${yyyy}`;
}

// -------------------------------------------------------------
// 2. FEES REPORT
// -------------------------------------------------------------
export async function getFeesReport(filters: {
  courseId?: string;
  courseIds?: string[];
  batchId?: string;
  batchIds?: string[];
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  summary: FeesReportSummary;
  records: FeesReportRow[];
  generatedAt: string;
}> {
  try {
    let sql = `
      SELECT 
        i.invoice_number,
        p.full_name as student_name,
        COALESCE(c.title, 'General Course') as course_title,
        COALESCE(b.name, 'Default Batch') as batch_name,
        i.fee_period,
        i.due_date::text as due_date,
        i.total_amount::float as total_amount,
        i.discount_amount::float as discount_amount,
        i.paid_amount::float as paid_amount,
        i.balance_amount::float as balance_amount,
        i.status,
        (
          SELECT payment_date::text 
          FROM public.student_fee_payments 
          WHERE invoice_id = i.id 
          ORDER BY payment_date DESC LIMIT 1
        ) as last_payment_date,
        (
          SELECT payment_method 
          FROM public.student_fee_payments 
          WHERE invoice_id = i.id 
          ORDER BY payment_date DESC LIMIT 1
        ) as payment_method
      FROM public.student_fee_invoices i
      JOIN public.students s ON s.id = i.student_id
      JOIN public.profiles p ON p.id = s.profile_id
      LEFT JOIN public.courses c ON c.id = i.course_id
      LEFT JOIN public.batches b ON b.id = i.batch_id
      WHERE (i.paid_amount > 0 OR i.status IN ('paid', 'partial'))
    `;
    const params: any[] = [];

    if (filters.courseIds && filters.courseIds.length > 0) {
      params.push(filters.courseIds);
      sql += ` AND i.course_id = ANY($${params.length}::uuid[])`;
    } else if (filters.courseId && filters.courseId !== 'all') {
      params.push(filters.courseId);
      sql += ` AND i.course_id = $${params.length}`;
    }

    if (filters.batchIds && filters.batchIds.length > 0) {
      params.push(filters.batchIds);
      sql += ` AND i.batch_id = ANY($${params.length}::uuid[])`;
    } else if (filters.batchId && filters.batchId !== 'all') {
      params.push(filters.batchId);
      sql += ` AND i.batch_id = $${params.length}`;
    }

    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      sql += ` AND i.status = $${params.length}`;
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND i.due_date::date >= $${params.length}::date`;
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND i.due_date::date <= $${params.length}::date`;
    }

    sql += ` ORDER BY i.due_date DESC, i.created_at DESC;`;

    const rawRecords = await query<FeesReportRow>(sql, params);

    // Format due_date to 5th of every month
    const records = rawRecords.map(r => ({
      ...r,
      due_date: formatFifthOfMonth(r.fee_period || r.due_date)
    }));

    // Calculate Summary from the exact matched records
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalDiscounts = 0;
    const refunds = 0;

    for (const r of records) {
      totalCollected += Number(r.paid_amount) || 0;
      totalOutstanding += Number(r.balance_amount) || 0;
      totalDiscounts += Number(r.discount_amount) || 0;
      if (r.status === 'overdue') {
        totalOverdue += Number(r.balance_amount) || 0;
      }
    }

    // Payment status breakdown: All Status, Partial (orange), Paid (green)
    const paymentStatusBreakdown = [
      {
        status: 'all',
        label: 'All Status',
        count: records.length,
        total: totalCollected
      },
      {
        status: 'partial',
        label: 'Partial',
        count: records.filter(r => r.status === 'partial').length,
        total: records.filter(r => r.status === 'partial').reduce((sum, r) => sum + (Number(r.paid_amount) || 0), 0)
      },
      {
        status: 'paid',
        label: 'Paid',
        count: records.filter(r => r.status === 'paid').length,
        total: records.filter(r => r.status === 'paid').reduce((sum, r) => sum + (Number(r.paid_amount) || 0), 0)
      }
    ];

    return {
      summary: {
        totalCollected,
        totalOutstanding,
        totalOverdue,
        totalDiscounts,
        totalRefunds: refunds,
        paymentMethodBreakdown: [],
        paymentStatusBreakdown
      },
      records,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getFeesReport:', err);
    return {
      summary: {
        totalCollected: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        totalDiscounts: 0,
        totalRefunds: 0,
        paymentMethodBreakdown: [],
        paymentStatusBreakdown: [
          { status: 'all', label: 'All Status', count: 0, total: 0 },
          { status: 'partial', label: 'Partial', count: 0, total: 0 },
          { status: 'paid', label: 'Paid', count: 0, total: 0 }
        ]
      },
      records: [],
      generatedAt: new Date().toISOString()
    };
  }
}

// -------------------------------------------------------------
// 3. SALARIES REPORT
// -------------------------------------------------------------
export async function getSalariesReport(filters: {
  payrollMonth?: string;
  trainerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  summary: SalariesReportSummary;
  records: SalariesReportRow[];
  generatedAt: string;
}> {
  try {
    let sql = `
      SELECT 
        p.full_name as trainer_name,
        COALESCE(t.display_title, 'Classical Guru') as display_title,
        r.payroll_month,
        r.base_salary::float as base_salary,
        r.classes_conducted::int as classes_conducted,
        r.bonus_amount::float as bonus_amount,
        r.deduction_amount::float as deduction_amount,
        r.advance_deducted::float as advance_deducted,
        r.net_salary::float as net_salary,
        r.status,
        r.payment_date::text as payment_date,
        r.payment_method
      FROM public.guru_salary_records r
      JOIN public.trainers t ON t.id = r.trainer_id
      JOIN public.profiles p ON p.id = t.profile_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.payrollMonth && filters.payrollMonth !== 'all') {
      params.push(filters.payrollMonth);
      sql += ` AND r.payroll_month = $${params.length}`;
    }

    if (filters.trainerId && filters.trainerId !== 'all') {
      params.push(filters.trainerId);
      sql += ` AND r.trainer_id = $${params.length}`;
    }

    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      sql += ` AND r.status = $${params.length}`;
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND (
        (r.payment_date IS NOT NULL AND r.payment_date::date >= $${params.length}::date) 
        OR (TO_DATE(r.payroll_month, 'Month YYYY') >= DATE_TRUNC('month', $${params.length}::date))
      )`;
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND (
        (r.payment_date IS NOT NULL AND r.payment_date::date <= $${params.length}::date) 
        OR (TO_DATE(r.payroll_month, 'Month YYYY') <= DATE_TRUNC('month', $${params.length}::date))
      )`;
    }

    sql += ` ORDER BY r.payroll_month DESC, p.full_name ASC;`;

    const records = await query<SalariesReportRow>(sql, params);

    let totalPayable = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalBonuses = 0;
    let totalDeductions = 0;

    for (const r of records) {
      const net = Number(r.net_salary) || 0;
      totalPayable += net;
      if (r.status === 'paid') {
        totalPaid += net;
      } else {
        totalPending += net;
      }
      totalBonuses += Number(r.bonus_amount) || 0;
      totalDeductions += (Number(r.deduction_amount) || 0) + (Number(r.advance_deducted) || 0);
    }

    return {
      summary: {
        totalPayable,
        totalPaid,
        totalPending,
        totalBonuses,
        totalDeductions,
        trainerCount: records.length
      },
      records,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getSalariesReport:', err);
    return {
      summary: {
        totalPayable: 0,
        totalPaid: 0,
        totalPending: 0,
        totalBonuses: 0,
        totalDeductions: 0,
        trainerCount: 0
      },
      records: [],
      generatedAt: new Date().toISOString()
    };
  }
}

// -------------------------------------------------------------
// 4. INCOME VS EXPENSES REPORT (RULE: EXPENSES MUST COME FROM EXPENSES PAGE)
// -------------------------------------------------------------
export async function getIncomeVsExpensesReport(filters: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  summary: IncomeExpensesReportSummary;
  records: IncomeExpensesReportRow[];
  generatedAt: string;
}> {
  try {
    // 1. Fee Income (From student fee payments / invoices)
    let feeSql = `
      SELECT 
        'Student Tuition Fee' as category,
        'Income' as type,
        CONCAT('Fee payment for ', p.full_name, ' (', i.invoice_number, ')') as description,
        COALESCE(pay.payment_date::text, i.due_date::text) as date,
        COALESCE(pay.amount_paid, i.paid_amount)::float as amount,
        COALESCE(pay.payment_method, 'Online/UPI') as payment_method,
        COALESCE(pay.receipt_number, i.invoice_number) as reference
      FROM public.student_fee_invoices i
      JOIN public.students s ON s.id = i.student_id
      JOIN public.profiles p ON p.id = s.profile_id
      LEFT JOIN public.student_fee_payments pay ON pay.invoice_id = i.id
      WHERE (pay.amount_paid > 0 OR i.paid_amount > 0)
    `;
    const feeParams: any[] = [];
    if (filters.startDate) {
      feeParams.push(filters.startDate);
      feeSql += ` AND (
        (pay.payment_date IS NOT NULL AND pay.payment_date::date >= $${feeParams.length}::date) 
        OR (i.due_date::date >= $${feeParams.length}::date)
      )`;
    }
    if (filters.endDate) {
      feeParams.push(filters.endDate);
      feeSql += ` AND (
        (pay.payment_date IS NOT NULL AND pay.payment_date::date <= $${feeParams.length}::date) 
        OR (i.due_date::date <= $${feeParams.length}::date)
      )`;
    }

    const incomeRows = await query<IncomeExpensesReportRow>(feeSql, feeParams);

    // 2. Guru Salaries (From guru_salary_records where status = 'paid')
    let salSql = `
      SELECT 
        'Trainer Salary' as category,
        'Salary Expense' as type,
        CONCAT('Guru Salary: ', p.full_name, ' (', r.payroll_month, ')') as description,
        COALESCE(r.payment_date::text, CONCAT(r.payroll_month, '-28')) as date,
        r.net_salary::float as amount,
        COALESCE(r.payment_method, 'Bank transfer') as payment_method,
        r.transaction_reference as reference
      FROM public.guru_salary_records r
      JOIN public.trainers t ON t.id = r.trainer_id
      JOIN public.profiles p ON p.id = t.profile_id
      WHERE r.status = 'paid'
    `;
    const salParams: any[] = [];
    if (filters.startDate) {
      salParams.push(filters.startDate);
      salSql += ` AND (
        (r.payment_date IS NOT NULL AND r.payment_date::date >= $${salParams.length}::date) 
        OR (TO_DATE(r.payroll_month, 'Month YYYY') >= DATE_TRUNC('month', $${salParams.length}::date))
      )`;
    }
    if (filters.endDate) {
      salParams.push(filters.endDate);
      salSql += ` AND (
        (r.payment_date IS NOT NULL AND r.payment_date::date <= $${salParams.length}::date) 
        OR (TO_DATE(r.payroll_month, 'Month YYYY') <= DATE_TRUNC('month', $${salParams.length}::date))
      )`;
    }

    const salaryRows = await query<IncomeExpensesReportRow>(salSql, salParams);

    // 3. Other Expenses (MUST COME DIRECTLY FROM EXPENSES PAGE / TABLE!)
    const expenseRecords = await getExpenses({
      startDate: filters.startDate,
      endDate: filters.endDate,
      includeDeleted: false
    });

    const otherExpenseRows: IncomeExpensesReportRow[] = expenseRecords.map(e => ({
      category: e.category,
      type: 'General Expense',
      description: e.description,
      date: e.expense_date,
      amount: Number(e.amount),
      payment_method: e.payment_method,
      reference: e.reference_number || (e.vendor ? `Vendor: ${e.vendor}` : null)
    }));

    // Combine all underlying records
    const allRecords: IncomeExpensesReportRow[] = [
      ...incomeRows,
      ...salaryRows,
      ...otherExpenseRows
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Compute Exact Matching Totals
    const totalIncome = incomeRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalSalaries = salaryRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalOtherExpenses = otherExpenseRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalExpenses = totalSalaries + totalOtherExpenses;
    const netOperatingAmount = totalIncome - totalExpenses;

    return {
      summary: {
        totalIncome,
        totalSalaries,
        totalOtherExpenses,
        totalExpenses,
        netOperatingAmount,
        status: netOperatingAmount >= 0 ? 'Surplus' : 'Deficit'
      },
      records: allRecords,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getIncomeVsExpensesReport:', err);
    return {
      summary: {
        totalIncome: 0,
        totalSalaries: 0,
        totalOtherExpenses: 0,
        totalExpenses: 0,
        netOperatingAmount: 0,
        status: 'Surplus'
      },
      records: [],
      generatedAt: new Date().toISOString()
    };
  }
}

// -------------------------------------------------------------
// 5. ABSENCE REPORT (3-TIER DRILLDOWN)
// -------------------------------------------------------------

/**
 * Level 1: Overall student absence report across all enrolled courses
 */
export async function getAbsenceReport(filters: {
  studentIds?: string[];
  sort?: 'high_absence' | 'low_absence';
  startDate?: string;
  endDate?: string;
}): Promise<{
  records: AbsenceReportRow[];
  totalStudents: number;
  generatedAt: string;
}> {
  try {
    const params: any[] = [];
    let sql = `
      SELECT 
        s.id as student_id,
        COALESCE(p.full_name, 'Unknown Student') as student_name,
        COALESCE(s.roll_number, 'N/A') as roll_number,
        COALESCE(p.phone, 'N/A') as student_contact,
        COALESCE(s.parent_contact, s.emergency_contact, p.alternate_phone, 'N/A') as parent_contact,
        COUNT(DISTINCT cs.id)::int as total_classes_held,
        COUNT(DISTINCT CASE WHEN LOWER(a.status) = 'absent' THEN cs.id END)::int as total_absent_days,
        COUNT(DISTINCT CASE WHEN LOWER(a.status) = 'present' THEN cs.id END)::int as total_present_days
      FROM public.students s
      JOIN public.profiles p ON p.id = s.profile_id
      JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
      JOIN public.batches b ON b.id = be.batch_id
      JOIN public.courses c ON c.id = b.course_id
      LEFT JOIN public.class_sessions cs ON cs.batch_id = be.batch_id
        AND cs.session_date <= CURRENT_DATE
    `;

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND cs.session_date >= $${params.length}::date`;
    }
    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND cs.session_date <= $${params.length}::date`;
    }

    sql += `
      LEFT JOIN public.attendance a ON a.session_id = cs.id AND a.student_id = s.id
      WHERE 1=1
    `;

    if (filters.studentIds && filters.studentIds.length > 0) {
      params.push(filters.studentIds);
      sql += ` AND s.id = ANY($${params.length}::uuid[])`;
    }

    sql += `
      GROUP BY s.id, p.full_name, s.roll_number, p.phone, s.parent_contact, s.emergency_contact, p.alternate_phone
    `;

    if (filters.sort === 'low_absence') {
      sql += ` ORDER BY total_absent_days ASC, p.full_name ASC`;
    } else {
      // Default: High Absence
      sql += ` ORDER BY total_absent_days DESC, p.full_name ASC`;
    }

    const records = await query<AbsenceReportRow>(sql, params);

    return {
      records: records.map(r => ({
        ...r,
        total_classes_held: Number(r.total_classes_held || 0),
        total_absent_days: Number(r.total_absent_days || 0),
        total_present_days: Number(r.total_present_days || 0),
      })),
      totalStudents: records.length,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getAbsenceReport:', err);
    return {
      records: [],
      totalStudents: 0,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Level 2: Student course-wise absence breakdown
 */
export async function getStudentCourseAbsenceReport(filters: {
  studentId: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  student: StudentAbsenceProfile | null;
  records: StudentCourseAbsenceRow[];
  totalClassesHeld: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  generatedAt: string;
}> {
  try {
    // 1. Fetch Student Profile
    const studentProfileSql = `
      SELECT 
        s.id as student_id,
        COALESCE(p.full_name, 'Unknown Student') as student_name,
        COALESCE(s.roll_number, 'N/A') as roll_number,
        COALESCE(p.phone, 'N/A') as student_contact,
        COALESCE(s.parent_contact, s.emergency_contact, p.alternate_phone, 'N/A') as parent_contact
      FROM public.students s
      JOIN public.profiles p ON p.id = s.profile_id
      WHERE s.id = $1
    `;
    const studentProfile = await queryOne<StudentAbsenceProfile>(studentProfileSql, [filters.studentId]);

    // 2. Fetch Course & Batch Breakdown
    const params: any[] = [filters.studentId];
    let sql = `
      SELECT 
        c.id as course_id,
        c.title as course_name,
        b.id as batch_id,
        b.name as batch_name,
        COUNT(DISTINCT cs.id)::int as total_classes_held,
        COUNT(DISTINCT CASE WHEN LOWER(a.status) = 'present' THEN cs.id END)::int as total_present_days,
        COUNT(DISTINCT CASE WHEN LOWER(a.status) = 'absent' THEN cs.id END)::int as total_absent_days
      FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id
      JOIN public.courses c ON c.id = b.course_id
      LEFT JOIN public.class_sessions cs ON cs.batch_id = b.id
        AND cs.session_date <= CURRENT_DATE
    `;

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND cs.session_date >= $${params.length}::date`;
    }
    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND cs.session_date <= $${params.length}::date`;
    }

    sql += `
      LEFT JOIN public.attendance a ON a.session_id = cs.id AND a.student_id = be.student_id
      WHERE be.student_id = $1 AND be.status = 'active'
      GROUP BY c.id, c.title, b.id, b.name
      ORDER BY total_absent_days DESC, c.title ASC
    `;

    const rawRecords = await query<StudentCourseAbsenceRow>(sql, params);
    const records = rawRecords.map(r => ({
      ...r,
      total_classes_held: Number(r.total_classes_held || 0),
      total_present_days: Number(r.total_present_days || 0),
      total_absent_days: Number(r.total_absent_days || 0),
    }));

    const totalClassesHeld = records.reduce((sum, r) => sum + r.total_classes_held, 0);
    const totalPresentDays = records.reduce((sum, r) => sum + r.total_present_days, 0);
    const totalAbsentDays = records.reduce((sum, r) => sum + r.total_absent_days, 0);

    return {
      student: studentProfile,
      records,
      totalClassesHeld,
      totalPresentDays,
      totalAbsentDays,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getStudentCourseAbsenceReport:', err);
    return {
      student: null,
      records: [],
      totalClassesHeld: 0,
      totalPresentDays: 0,
      totalAbsentDays: 0,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Level 3: Individual session attendance details for student & course/batch
 */
export async function getStudentBatchSessionAudit(filters: {
  studentId: string;
  batchId: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  student: StudentAbsenceProfile | null;
  courseName: string;
  batchName: string;
  records: SessionAttendanceAuditRow[];
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  generatedAt: string;
}> {
  try {
    // 1. Fetch Student Profile
    const studentProfileSql = `
      SELECT 
        s.id as student_id,
        COALESCE(p.full_name, 'Unknown Student') as student_name,
        COALESCE(s.roll_number, 'N/A') as roll_number,
        COALESCE(p.phone, 'N/A') as student_contact,
        COALESCE(s.parent_contact, s.emergency_contact, p.alternate_phone, 'N/A') as parent_contact
      FROM public.students s
      JOIN public.profiles p ON p.id = s.profile_id
      WHERE s.id = $1
    `;
    const student = await queryOne<StudentAbsenceProfile>(studentProfileSql, [filters.studentId]);

    // 2. Fetch Batch & Course Names
    const batchInfoSql = `
      SELECT c.title as course_name, b.name as batch_name
      FROM public.batches b
      JOIN public.courses c ON c.id = b.course_id
      WHERE b.id = $1
    `;
    const batchInfo = await queryOne<{ course_name: string; batch_name: string }>(batchInfoSql, [filters.batchId]);

    // 3. Fetch Sessions with Attendance
    const params: any[] = [filters.studentId, filters.batchId];
    let sql = `
      SELECT 
        cs.id as session_id,
        TO_CHAR(cs.session_date, 'DD/MM/YYYY') as session_date,
        COALESCE(tp.full_name, 'Unassigned Trainer') as trainer_name,
        c.title as course_name,
        b.name as batch_name,
        CASE 
          WHEN LOWER(a.status) = 'present' THEN 'Present'
          WHEN LOWER(a.status) = 'absent' THEN 'Absent'
          WHEN cs.session_date > CURRENT_DATE THEN 'Scheduled'
          ELSE 'Unmarked'
        END as audit_status,
        a.remarks
      FROM public.class_sessions cs
      JOIN public.batches b ON b.id = cs.batch_id
      JOIN public.courses c ON c.id = b.course_id
      LEFT JOIN public.trainers t ON t.id = cs.trainer_id
      LEFT JOIN public.profiles tp ON tp.id = t.profile_id
      LEFT JOIN public.attendance a ON a.session_id = cs.id AND a.student_id = $1
      WHERE cs.batch_id = $2
        AND cs.session_date <= CURRENT_DATE
    `;

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND cs.session_date >= $${params.length}::date`;
    }
    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND cs.session_date <= $${params.length}::date`;
    }

    sql += ` ORDER BY cs.session_date DESC`;

    const records = await query<SessionAttendanceAuditRow>(sql, params);

    const presentCount = records.filter(r => r.audit_status === 'Present').length;
    const absentCount = records.filter(r => r.audit_status === 'Absent').length;

    return {
      student,
      courseName: batchInfo?.course_name || 'Course',
      batchName: batchInfo?.batch_name || 'Batch',
      records,
      totalSessions: records.length,
      presentCount,
      absentCount,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getStudentBatchSessionAudit:', err);
    return {
      student: null,
      courseName: 'Course',
      batchName: 'Batch',
      records: [],
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Batch Attendance Report:
 * Summarizes registered students, classes held, absences, and absence percentage per batch.
 */
export async function getBatchAttendanceReport(filters: {
  courseIds?: string[];
  batchIds?: string[];
  sort?: 'high_absence' | 'low_absence';
  startDate?: string;
  endDate?: string;
}): Promise<{
  records: BatchAttendanceReportRow[];
  summary: BatchAttendanceReportSummary;
  generatedAt: string;
}> {
  try {
    const params: any[] = [];
    let sql = `
      SELECT 
        b.id as batch_id,
        b.name as batch_name,
        c.id as course_id,
        c.title as course_name,
        COALESCE(t.id::text, '') as trainer_id,
        COALESCE(tp.full_name, 'Unassigned Trainer') as trainer_name,
        COALESCE(tp.phone, 'N/A') as trainer_contact,
        (SELECT COUNT(*)::int FROM public.batch_enrollments be WHERE be.batch_id = b.id AND be.status = 'active') as total_registered_students,
        COUNT(DISTINCT cs.id)::int as total_classes_held,
        COUNT(DISTINCT CASE WHEN LOWER(a.status) = 'absent' THEN a.id END)::int as total_absences,
        COUNT(DISTINCT CASE WHEN LOWER(a.status) = 'present' THEN a.id END)::int as total_presents
      FROM public.batches b
      JOIN public.courses c ON c.id = b.course_id
      LEFT JOIN public.trainers t ON t.id = b.trainer_id
      LEFT JOIN public.profiles tp ON tp.id = t.profile_id
      LEFT JOIN public.class_sessions cs ON cs.batch_id = b.id
        AND cs.session_date <= CURRENT_DATE
    `;

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND cs.session_date >= $${params.length}::date`;
    }
    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND cs.session_date <= $${params.length}::date`;
    }

    sql += `
      LEFT JOIN public.attendance a ON a.session_id = cs.id
      WHERE 1=1
    `;

    if (filters.courseIds && filters.courseIds.length > 0) {
      params.push(filters.courseIds);
      sql += ` AND c.id = ANY($${params.length}::uuid[])`;
    }

    if (filters.batchIds && filters.batchIds.length > 0) {
      params.push(filters.batchIds);
      sql += ` AND b.id = ANY($${params.length}::uuid[])`;
    }

    sql += `
      GROUP BY b.id, b.name, c.id, c.title, t.id, tp.full_name, tp.phone
    `;

    const rawRows = await query<any>(sql, params);

    const mapped: BatchAttendanceReportRow[] = rawRows.map(r => {
      const totalReg = Number(r.total_registered_students || 0);
      const classesHeld = Number(r.total_classes_held || 0);
      const absences = Number(r.total_absences || 0);
      const presents = Number(r.total_presents || 0);
      const totalMarked = absences + presents;

      const pct = totalMarked > 0 
        ? Math.round((absences / totalMarked) * 1000) / 10 
        : (classesHeld > 0 && totalReg > 0 ? Math.round((absences / (classesHeld * totalReg)) * 1000) / 10 : 0);

      return {
        batch_id: r.batch_id,
        batch_name: r.batch_name,
        course_id: r.course_id,
        course_name: r.course_name,
        trainer_id: r.trainer_id,
        trainer_name: r.trainer_name,
        trainer_contact: r.trainer_contact,
        total_registered_students: totalReg,
        total_classes_held: classesHeld,
        total_absences: absences,
        absence_percentage: pct
      };
    });

    if (filters.sort === 'low_absence') {
      mapped.sort((a, b) => a.absence_percentage - b.absence_percentage || a.total_absences - b.total_absences || a.course_name.localeCompare(b.course_name));
    } else {
      // Default: high_absence
      mapped.sort((a, b) => b.absence_percentage - a.absence_percentage || b.total_absences - a.total_absences || a.course_name.localeCompare(b.course_name));
    }

    const distinctCourses = new Set(mapped.map(m => m.course_id)).size;
    const totalBatches = mapped.length;
    const totalStudents = mapped.reduce((acc, m) => acc + m.total_registered_students, 0);

    return {
      records: mapped,
      summary: {
        totalCourses: distinctCourses,
        totalBatches,
        totalStudents
      },
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getBatchAttendanceReport:', err);
    return {
      records: [],
      summary: {
        totalCourses: 0,
        totalBatches: 0,
        totalStudents: 0
      },
      generatedAt: new Date().toISOString()
    };
  }
}


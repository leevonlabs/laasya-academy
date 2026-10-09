'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  X, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Users, 
  BookOpen, 
  Receipt, 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  FileSpreadsheet, 
  FileDown,
  UserX,
  ArrowLeft,
  ArrowRight,
  ArrowDownWideNarrow,
  Phone,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Course, Batch, Student, Trainer } from '@/lib/academy';
import { 
  ReportType, 
  AttendanceReportSummary, 
  AttendanceReportRow, 
  FeesReportSummary, 
  FeesReportRow, 
  SalariesReportSummary, 
  SalariesReportRow, 
  IncomeExpensesReportSummary, 
  IncomeExpensesReportRow,
  AbsenceReportRow,
  StudentCourseAbsenceRow,
  SessionAttendanceAuditRow,
  StudentAbsenceProfile,
  BatchAttendanceReportRow,
  BatchAttendanceReportSummary
} from '@/lib/reports';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';
import MonthYearRangeFilter, { MonthYearRangeResult } from '@/components/common/MonthYearRangeFilter';
import StudentSearchSelect, { StudentOption } from '@/components/common/StudentSearchSelect';
import StudentMultiSearchSelect from '@/components/common/StudentMultiSearchSelect';
import CourseMultiSearchSelect, { CourseOption } from '@/components/common/CourseMultiSearchSelect';
import BatchMultiSearchSelect, { BatchOption } from '@/components/common/BatchMultiSearchSelect';
import TrainerSearchSelect, { TrainerOption } from '@/components/common/TrainerSearchSelect';

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

interface Props {
  courses: Course[];
  batches: Batch[];
  students: Student[];
  trainers: Trainer[];
}

export default function ReportsClient({ courses, batches, students, trainers }: Props) {
  const [activeType, setActiveType] = useState<ReportType>('attendance');

  const currentMonthRange = useMemo(() => getCurrentMonthRange(), []);

  // Shared / Dynamic Filters
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [selectedTrainerId, setSelectedTrainerId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState(currentMonthRange.start);
  const [endDate, setEndDate] = useState(currentMonthRange.end);

  // Report Data State
  const [attendanceData, setAttendanceData] = useState<{
    summary: AttendanceReportSummary;
    records: AttendanceReportRow[];
    generatedAt: string;
  } | null>(null);

  const [feesData, setFeesData] = useState<{
    summary: FeesReportSummary;
    records: FeesReportRow[];
    generatedAt: string;
  } | null>(null);

  const [salariesData, setSalariesData] = useState<{
    summary: SalariesReportSummary;
    records: SalariesReportRow[];
    generatedAt: string;
  } | null>(null);

  const [incomeExpensesData, setIncomeExpensesData] = useState<{
    summary: IncomeExpensesReportSummary;
    records: IncomeExpensesReportRow[];
    generatedAt: string;
  } | null>(null);

  // Attendance Sub-view: 'general' vs 'absence' vs 'batch'
  const [attendanceSubView, setAttendanceSubView] = useState<'general' | 'absence' | 'batch'>('general');

  // Batch Attendance Report State
  const [batchAttendanceSort, setBatchAttendanceSort] = useState<'high_absence' | 'low_absence'>('high_absence');
  const [batchAttendanceData, setBatchAttendanceData] = useState<{
    records: BatchAttendanceReportRow[];
    summary: BatchAttendanceReportSummary;
    generatedAt: string;
  } | null>(null);

  // Absence Report Filters
  const [absenceSort, setAbsenceSort] = useState<'high_absence' | 'low_absence'>('high_absence');
  const [absenceSelectedStudentIds, setAbsenceSelectedStudentIds] = useState<string[]>([]);

  // Absence Drilldown State
  // Level 2: Selected student for course breakdown
  const [absenceSelectedStudent, setAbsenceSelectedStudent] = useState<AbsenceReportRow | null>(null);
  // Level 3: Selected batch for session breakdown
  const [absenceSelectedBatch, setAbsenceSelectedBatch] = useState<StudentCourseAbsenceRow | null>(null);

  // Absence Report Data States
  const [absenceData, setAbsenceData] = useState<{
    records: AbsenceReportRow[];
    totalStudents: number;
    generatedAt: string;
  } | null>(null);

  const [studentCoursesData, setStudentCoursesData] = useState<{
    student: StudentAbsenceProfile | null;
    records: StudentCourseAbsenceRow[];
    totalClassesHeld: number;
    totalPresentDays: number;
    totalAbsentDays: number;
    generatedAt: string;
  } | null>(null);

  const [sessionAuditData, setSessionAuditData] = useState<{
    student: StudentAbsenceProfile | null;
    courseName: string;
    batchName: string;
    records: SessionAttendanceAuditRow[];
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    generatedAt: string;
  } | null>(null);

  // Loading, Error & Refresh States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Available batches based on selected course (legacy single-select)
  const availableBatches = useMemo(() => {
    if (selectedCourseId === 'all') return batches;
    return batches.filter(b => b.course_id === selectedCourseId);
  }, [selectedCourseId, batches]);

  // Options for multi-select course and batch filters
  const courseOptions: CourseOption[] = useMemo(() => {
    return courses.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category
    }));
  }, [courses]);

  const batchOptions: BatchOption[] = useMemo(() => {
    return batches.map(b => {
      const crs = courses.find(c => c.id === b.course_id);
      return {
        id: b.id,
        name: b.name,
        course_id: b.course_id,
        course_title: crs ? crs.title : undefined
      };
    });
  }, [batches, courses]);

  const availableBatchOptions: BatchOption[] = useMemo(() => {
    if (selectedCourseIds.length === 0) return batchOptions;
    return batchOptions.filter(b => selectedCourseIds.includes(b.course_id));
  }, [batchOptions, selectedCourseIds]);

  // Fetch Report Data safely with isMounted guard and AbortController
  useEffect(() => {
    // If viewing absence report under attendance, skip general fetch
    if (activeType === 'attendance' && attendanceSubView === 'absence') {
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    async function fetchReportSafe() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();

        if (activeType === 'attendance' && attendanceSubView === 'batch') {
          params.set('type', 'batch_attendance');
          params.set('sort', batchAttendanceSort);
        } else {
          params.set('type', activeType);
        }

        if (selectedCourseIds.length > 0) {
          params.set('courseIds', selectedCourseIds.join(','));
        } else if (selectedCourseId !== 'all') {
          params.set('courseId', selectedCourseId);
        }

        if (selectedBatchIds.length > 0) {
          params.set('batchIds', selectedBatchIds.join(','));
        } else if (selectedBatchId !== 'all') {
          params.set('batchId', selectedBatchId);
        }

        if (selectedStudentId !== 'all') params.set('studentId', selectedStudentId);
        if (selectedTrainerId !== 'all') params.set('trainerId', selectedTrainerId);
        if (selectedStatus !== 'all') params.set('status', selectedStatus);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const res = await fetch(`/api/reports?${params.toString()}`, {
          signal: abortController.signal
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to generate report');
        }

        if (isMounted) {
          if (activeType === 'attendance') {
            if (attendanceSubView === 'batch') {
              setBatchAttendanceData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
            } else {
              setAttendanceData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
            }
          } else if (activeType === 'fees') {
            setFeesData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
          } else if (activeType === 'salaries') {
            setSalariesData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
          } else if (activeType === 'income_expenses') {
            setIncomeExpensesData({ summary: json.summary, records: json.records, generatedAt: json.generatedAt });
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          console.error('Error fetching report:', err);
          setErrorMessage(err.message || 'Unable to retrieve report records. Please verify connectivity and retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchReportSafe();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [
    activeType,
    attendanceSubView,
    batchAttendanceSort,
    selectedCourseId,
    selectedCourseIds,
    selectedBatchId,
    selectedBatchIds,
    selectedStudentId,
    selectedTrainerId,
    selectedStatus,
    startDate,
    endDate,
    refreshKey
  ]);

  // Fetch Absence Report Data safely with AbortController
  useEffect(() => {
    if (activeType !== 'attendance' || attendanceSubView !== 'absence') return;

    let isMounted = true;
    const abortController = new AbortController();

    async function fetchAbsenceSafe() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();
        params.set('type', 'absence');
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        if (absenceSelectedStudent && absenceSelectedBatch) {
          // Level 3: Individual session attendance details for student and batch
          params.set('studentId', absenceSelectedStudent.student_id);
          params.set('batchId', absenceSelectedBatch.batch_id);
        } else if (absenceSelectedStudent) {
          // Level 2: Student courses breakdown
          params.set('studentId', absenceSelectedStudent.student_id);
        } else {
          // Level 1: Overall student absence report
          params.set('sort', absenceSort);
          if (absenceSelectedStudentIds.length > 0) {
            params.set('studentIds', absenceSelectedStudentIds.join(','));
          }
        }

        const res = await fetch(`/api/reports?${params.toString()}`, {
          signal: abortController.signal
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to generate absence report');
        }

        if (isMounted) {
          if (absenceSelectedStudent && absenceSelectedBatch) {
            setSessionAuditData({
              student: json.student,
              courseName: json.courseName,
              batchName: json.batchName,
              records: json.records || [],
              totalSessions: json.totalSessions || 0,
              presentCount: json.presentCount || 0,
              absentCount: json.absentCount || 0,
              generatedAt: json.generatedAt
            });
          } else if (absenceSelectedStudent) {
            setStudentCoursesData({
              student: json.student,
              records: json.records || [],
              totalClassesHeld: json.totalClassesHeld || 0,
              totalPresentDays: json.totalPresentDays || 0,
              totalAbsentDays: json.totalAbsentDays || 0,
              generatedAt: json.generatedAt
            });
          } else {
            setAbsenceData({
              records: json.records || [],
              totalStudents: json.totalStudents || 0,
              generatedAt: json.generatedAt
            });
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          console.error('Error fetching absence report:', err);
          setErrorMessage(err.message || 'Unable to retrieve absence records. Please verify connectivity and retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAbsenceSafe();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [
    activeType,
    attendanceSubView,
    absenceSelectedStudent,
    absenceSelectedBatch,
    absenceSort,
    absenceSelectedStudentIds,
    startDate,
    endDate,
    refreshKey
  ]);

  // Searchable Student & Trainer options
  const studentOptions: StudentOption[] = useMemo(() => {
    return students.map(s => ({
      id: s.id,
      full_name: s.full_name,
      roll_number: s.roll_number
    })).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [students]);

  const trainerOptions: TrainerOption[] = useMemo(() => {
    return trainers.map(t => ({
      id: t.id,
      full_name: t.full_name,
      display_title: t.display_title || 'Guru',
      specialization: Array.isArray(t.specializations) ? t.specializations.join(', ') : undefined
    })).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [trainers]);

  // Reset batch when course changes
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedBatchId('all');
  };

  // Clear Filters
  const clearFilters = () => {
    setSelectedCourseId('all');
    setSelectedBatchId('all');
    setSelectedCourseIds([]);
    setSelectedBatchIds([]);
    setSelectedStudentId('all');
    setSelectedTrainerId('all');
    setSelectedStatus('all');
    setStartDate(currentMonthRange.start);
    setEndDate(currentMonthRange.end);
    setAbsenceSort('high_absence');
    setBatchAttendanceSort('high_absence');
    setAbsenceSelectedStudentIds([]);
    setAbsenceSelectedStudent(null);
    setAbsenceSelectedBatch(null);
  };

  const hasActiveFilters = Boolean(
    selectedCourseId !== 'all' ||
    selectedBatchId !== 'all' ||
    selectedCourseIds.length > 0 ||
    selectedBatchIds.length > 0 ||
    selectedStudentId !== 'all' ||
    selectedTrainerId !== 'all' ||
    selectedStatus !== 'all' ||
    (startDate && startDate !== currentMonthRange.start) ||
    (endDate && endDate !== currentMonthRange.end)
  );

  // Current Generated At Timestamp
  const currentGeneratedAt = useMemo(() => {
    if (activeType === 'attendance') {
      if (attendanceSubView === 'absence') return absenceData?.generatedAt;
      if (attendanceSubView === 'batch') return batchAttendanceData?.generatedAt;
      return attendanceData?.generatedAt;
    }
    if (activeType === 'fees') return feesData?.generatedAt;
    if (activeType === 'salaries') return salariesData?.generatedAt;
    return incomeExpensesData?.generatedAt;
  }, [activeType, attendanceSubView, attendanceData, absenceData, batchAttendanceData, feesData, salariesData, incomeExpensesData]);

  // Record Count
  const currentRecordCount = useMemo(() => {
    if (activeType === 'attendance') {
      if (attendanceSubView === 'absence') {
        if (absenceSelectedStudent && absenceSelectedBatch) return sessionAuditData?.records.length || 0;
        if (absenceSelectedStudent) return studentCoursesData?.records.length || 0;
        return absenceData?.records.length || 0;
      }
      if (attendanceSubView === 'batch') {
        return batchAttendanceData?.records.length || 0;
      }
      return attendanceData?.records.length || 0;
    }
    if (activeType === 'fees') return feesData?.records.length || 0;
    if (activeType === 'salaries') return salariesData?.records.length || 0;
    return incomeExpensesData?.records.length || 0;
  }, [
    activeType, 
    attendanceSubView, 
    absenceSelectedStudent, 
    absenceSelectedBatch, 
    sessionAuditData, 
    studentCoursesData, 
    absenceData, 
    batchAttendanceData, 
    attendanceData, 
    feesData, 
    salariesData, 
    incomeExpensesData
  ]);

  // ==========================================
  // EXPORTS IMPLEMENTATION (CSV, EXCEL, PDF)
  // ==========================================

  // 1. Export CSV
  const exportCSV = () => {
    let rows: string[][] = [];
    let filename = `laasya_${activeType}_report.csv`;

    if (activeType === 'attendance') {
      if (attendanceSubView === 'absence') {
        if (absenceSelectedStudent && absenceSelectedBatch && sessionAuditData) {
          filename = `laasya_${absenceSelectedBatch.course_name}_${absenceSelectedBatch.batch_name}_sessions_audit.csv`;
          rows.push(['Session Date', 'Trainer Name', 'Course', 'Batch', 'Audit Status', 'Remarks']);
          sessionAuditData.records.forEach(r => {
            rows.push([r.session_date, r.trainer_name, r.course_name, r.batch_name, r.audit_status, r.remarks || '']);
          });
        } else if (absenceSelectedStudent && studentCoursesData) {
          filename = `laasya_${absenceSelectedStudent.student_name}_course_absence.csv`;
          rows.push(['Course Name', 'Batch Name', 'Total Classes Held', 'Total Present Days', 'Total Absent Days']);
          studentCoursesData.records.forEach(r => {
            rows.push([r.course_name, r.batch_name, String(r.total_classes_held), String(r.total_present_days), String(r.total_absent_days)]);
          });
        } else if (absenceData) {
          filename = `laasya_student_absence_report.csv`;
          rows.push(['Student Name', 'Roll Number', 'Student Contact Number', 'Parent Contact Number', 'Total Classes Held', 'Total Absent Days']);
          absenceData.records.forEach(r => {
            rows.push([r.student_name, r.roll_number, r.student_contact, r.parent_contact, String(r.total_classes_held), String(r.total_absent_days)]);
          });
        }
      } else if (attendanceSubView === 'batch' && batchAttendanceData) {
        filename = `laasya_batch_attendance_report.csv`;
        rows.push(['Course Name', 'Batch Name', 'Trainer Name', 'Trainer Contact', 'Total Registered Students', 'Total Classes Held', 'Total Absences', 'Absence Percentage (%)']);
        batchAttendanceData.records.forEach(r => {
          rows.push([r.course_name, r.batch_name, r.trainer_name, r.trainer_contact, String(r.total_registered_students), String(r.total_classes_held), String(r.total_absences), `${r.absence_percentage}%`]);
        });
      } else if (attendanceData) {
        rows.push(['Session Date', 'Course', 'Batch', 'Student Name', 'Roll Number', 'Status', 'Check-in Time', 'Remarks']);
        attendanceData.records.forEach(r => {
          rows.push([r.session_date, r.course_title, r.batch_name, r.student_name, r.roll_number, r.status, r.check_in_time || 'N/A', r.remarks || '']);
        });
      }
    } else if (activeType === 'fees' && feesData) {
      rows.push(['Invoice Number', 'Student Name', 'Course', 'Batch', 'Period', 'Due Date', 'Billed (Rs)', 'Discount (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Status', 'Last Payment Date', 'Payment Method']);
      feesData.records.forEach(r => {
        rows.push([r.invoice_number, r.student_name, r.course_title, r.batch_name, r.fee_period, r.due_date, String(r.total_amount), String(r.discount_amount), String(r.paid_amount), String(r.balance_amount), r.status, r.last_payment_date || 'N/A', r.payment_method || 'N/A']);
      });
    } else if (activeType === 'salaries' && salariesData) {
      rows.push(['Trainer Name', 'Title', 'Payroll Month', 'Base Salary (Rs)', 'Classes Conducted', 'Bonus (Rs)', 'Deductions (Rs)', 'Advance Deducted (Rs)', 'Net Salary (Rs)', 'Status', 'Payment Date', 'Payment Method']);
      salariesData.records.forEach(r => {
        rows.push([r.trainer_name, r.display_title, r.payroll_month, String(r.base_salary), String(r.classes_conducted), String(r.bonus_amount), String(r.deduction_amount), String(r.advance_deducted), String(r.net_salary), r.status, r.payment_date || 'N/A', r.payment_method || 'N/A']);
      });
    } else if (activeType === 'income_expenses' && incomeExpensesData) {
      rows.push(['Date', 'Type', 'Category', 'Description', 'Amount (Rs)', 'Payment Method', 'Reference']);
      incomeExpensesData.records.forEach(r => {
        rows.push([r.date, r.type, r.category, r.description, String(r.amount), r.payment_method, r.reference || 'N/A']);
      });
    }

    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    const csvContent = '\uFEFF' + rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Excel
  const exportExcel = () => {
    let title = `Laasya Academy ${activeType.toUpperCase()} Report`;
    let filename = `laasya_${activeType}_report.xls`;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeType === 'attendance') {
      if (attendanceSubView === 'absence') {
        if (absenceSelectedStudent && absenceSelectedBatch && sessionAuditData) {
          title = `Session Attendance Audit - ${absenceSelectedBatch.course_name} (${absenceSelectedBatch.batch_name})`;
          filename = `laasya_${absenceSelectedBatch.batch_name}_sessions_audit.xls`;
          headers = ['Session Date', 'Trainer Name', 'Course', 'Batch', 'Audit Status', 'Remarks'];
          rows = sessionAuditData.records.map(r => [r.session_date, r.trainer_name, r.course_name, r.batch_name, r.audit_status, r.remarks || '']);
        } else if (absenceSelectedStudent && studentCoursesData) {
          title = `Course Absence Breakdown - ${absenceSelectedStudent.student_name}`;
          filename = `laasya_${absenceSelectedStudent.student_name}_courses_absence.xls`;
          headers = ['Course Name', 'Batch Name', 'Total Classes Held', 'Total Present Days', 'Total Absent Days'];
          rows = studentCoursesData.records.map(r => [r.course_name, r.batch_name, String(r.total_classes_held), String(r.total_present_days), String(r.total_absent_days)]);
        } else if (absenceData) {
          title = `Student Absence Report`;
          filename = `laasya_student_absence_report.xls`;
          headers = ['Student Name', 'Roll Number', 'Student Contact Number', 'Parent Contact Number', 'Total Classes Held', 'Total Absent Days'];
          rows = absenceData.records.map(r => [r.student_name, r.roll_number, r.student_contact, r.parent_contact, String(r.total_classes_held), String(r.total_absent_days)]);
        }
      } else if (attendanceSubView === 'batch' && batchAttendanceData) {
        title = `Batch Attendance & Absence Report`;
        filename = `laasya_batch_attendance_report.xls`;
        headers = ['Course Name', 'Batch Name', 'Trainer Name', 'Trainer Contact Number', 'Total Registered Students', 'Total Classes Held', 'Total Absences', 'Absence Percentage (%)'];
        rows = batchAttendanceData.records.map(r => [r.course_name, r.batch_name, r.trainer_name, r.trainer_contact, String(r.total_registered_students), String(r.total_classes_held), String(r.total_absences), `${r.absence_percentage}%`]);
      } else if (attendanceData) {
        headers = ['Session Date', 'Course', 'Batch', 'Student Name', 'Roll Number', 'Status', 'Remarks'];
        rows = attendanceData.records.map(r => [r.session_date, r.course_title, r.batch_name, r.student_name, r.roll_number, r.status, r.remarks || '']);
      }
    } else if (activeType === 'fees' && feesData) {
      headers = ['Invoice Number', 'Student Name', 'Course', 'Period', 'Due Date', 'Billed (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Status'];
      rows = feesData.records.map(r => [r.invoice_number, r.student_name, r.course_title, r.fee_period, r.due_date, String(r.total_amount), String(r.paid_amount), String(r.balance_amount), r.status]);
    } else if (activeType === 'salaries' && salariesData) {
      headers = ['Guru Name', 'Display Title', 'Month', 'Base (Rs)', 'Classes', 'Bonus (Rs)', 'Net (Rs)', 'Status'];
      rows = salariesData.records.map(r => [r.trainer_name, r.display_title, r.payroll_month, String(r.base_salary), String(r.classes_conducted), String(r.bonus_amount), String(r.net_salary), r.status]);
    } else if (activeType === 'income_expenses' && incomeExpensesData) {
      headers = ['Date', 'Type', 'Category', 'Description', 'Amount (Rs)', 'Method', 'Reference'];
      rows = incomeExpensesData.records.map(r => [r.date, r.type, r.category, r.description, String(r.amount), r.payment_method, r.reference || '']);
    }

    if (rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>
   <Row><Cell><Data ss:Type="String">${title}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Generated: ${new Date().toLocaleString('en-GB')}</Data></Cell></Row>
   <Row></Row>
   <Row>
    ${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}
   </Row>
   ${rows.map(r => `
   <Row>
    ${r.map(cell => `<Cell><Data ss:Type="String">${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`).join('')}
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export PDF
  const exportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let y = 15;

      // Header Banner
      doc.setFillColor(89, 2, 49); // #590231 Maroon
      doc.rect(0, 0, 210, 25, 'F');

      doc.setTextColor(249, 227, 58); // #F9E33A Gold
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('LAASYA CULTURAL ACADEMY', 14, 11);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        activeType === 'attendance' && attendanceSubView === 'absence'
          ? 'Official Academic Report: ABSENCE AUDIT'
          : activeType === 'attendance' && attendanceSubView === 'batch'
          ? 'Official Academic Report: BATCH ATTENDANCE & ABSENCE'
          : `Official Academic Report: ${activeType.toUpperCase().replace('_', ' ')}`,
        14, 
        18
      );

      y = 35;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      doc.text(`Date Range: ${startDate || 'All Time'} to ${endDate || 'Current'}`, 14, y);
      doc.text(`Generated On: ${new Date().toLocaleString('en-GB')}`, 130, y);

      y += 8;
      doc.setDrawColor(240, 213, 228);
      doc.line(14, y, 196, y);
      y += 8;

      // Report Specific Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(89, 2, 49);
      doc.text('EXECUTIVE METRICS SUMMARY', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      if (activeType === 'attendance') {
        if (attendanceSubView === 'absence') {
          if (absenceSelectedStudent && absenceSelectedBatch && sessionAuditData) {
            doc.text(`• Student: ${absenceSelectedStudent.student_name} (${absenceSelectedStudent.roll_number})`, 14, y);
            doc.text(`• Course: ${absenceSelectedBatch.course_name} - ${absenceSelectedBatch.batch_name}`, 14, y + 5);
            doc.text(`• Sessions Audited: ${sessionAuditData.totalSessions} | Present: ${sessionAuditData.presentCount} | Absent: ${sessionAuditData.absentCount}`, 14, y + 10);
            y += 12;
          } else if (absenceSelectedStudent && studentCoursesData) {
            doc.text(`• Student: ${absenceSelectedStudent.student_name} (${absenceSelectedStudent.roll_number})`, 14, y);
            doc.text(`• Total Classes Held: ${studentCoursesData.totalClassesHeld} | Present: ${studentCoursesData.totalPresentDays} | Absent: ${studentCoursesData.totalAbsentDays}`, 14, y + 5);
            y += 8;
          } else if (absenceData) {
            doc.text(`• Total Students Audited: ${absenceData.totalStudents}`, 14, y);
            const totalAbsences = absenceData.records.reduce((sum, r) => sum + r.total_absent_days, 0);
            doc.text(`• Total Absences Tracked: ${totalAbsences}`, 80, y);
            y += 5;
          }
        } else if (attendanceSubView === 'batch' && batchAttendanceData) {
          doc.text(`• Total Courses: ${batchAttendanceData.summary.totalCourses}`, 14, y);
          doc.text(`• Total Batches: ${batchAttendanceData.summary.totalBatches}`, 75, y);
          doc.text(`• Total Students: ${batchAttendanceData.summary.totalStudents}`, 135, y);
          y += 5;
        } else if (attendanceData) {
          doc.text(`• Total Tracked Sessions: ${attendanceData.summary.totalSessions}`, 14, y);
          doc.text(`• Present: ${attendanceData.summary.presentCount}`, 80, y);
          doc.text(`• Absent: ${attendanceData.summary.absentCount}`, 140, y);
          y += 5;
          doc.text(`• Attendance Rate: ${attendanceData.summary.attendancePercentage}%`, 14, y);
        }
      } else if (activeType === 'fees' && feesData) {
        doc.text(`• Total Collected: Rs. ${feesData.summary.totalCollected.toLocaleString('en-IN')}`, 14, y);
        doc.text(`• Outstanding: Rs. ${feesData.summary.totalOutstanding.toLocaleString('en-IN')}`, 80, y);
        doc.text(`• Overdue: Rs. ${feesData.summary.totalOverdue.toLocaleString('en-IN')}`, 140, y);
      } else if (activeType === 'salaries' && salariesData) {
        doc.text(`• Total Payable: Rs. ${salariesData.summary.totalPayable.toLocaleString('en-IN')}`, 14, y);
        doc.text(`• Paid: Rs. ${salariesData.summary.totalPaid.toLocaleString('en-IN')}`, 80, y);
        doc.text(`• Pending: Rs. ${salariesData.summary.totalPending.toLocaleString('en-IN')}`, 140, y);
      } else if (activeType === 'income_expenses' && incomeExpensesData) {
        doc.text(`• Fee Income: Rs. ${incomeExpensesData.summary.totalIncome.toLocaleString('en-IN')}`, 14, y);
        doc.text(`• Total Expenses: Rs. ${incomeExpensesData.summary.totalExpenses.toLocaleString('en-IN')}`, 80, y);
        doc.text(`• Net Surplus: Rs. ${incomeExpensesData.summary.netOperatingAmount.toLocaleString('en-IN')}`, 140, y);
      }

      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(89, 2, 49);
      doc.text(`DETAILED RECORDS (${currentRecordCount} Filtered Entries)`, 14, y);
      y += 6;

      // Table Header
      doc.setFillColor(255, 242, 248);
      doc.rect(14, y - 4, 182, 7, 'F');
      doc.setFontSize(8);
      doc.setTextColor(89, 2, 49);

      if (activeType === 'attendance') {
        if (attendanceSubView === 'absence') {
          if (absenceSelectedStudent && absenceSelectedBatch && sessionAuditData) {
            doc.text('Session Date', 16, y);
            doc.text('Trainer', 55, y);
            doc.text('Batch', 115, y);
            doc.text('Audit Status', 160, y);
            y += 6;
            sessionAuditData.records.slice(0, 30).forEach(r => {
              if (y > 275) { doc.addPage(); y = 20; }
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(40, 40, 40);
              doc.text(String(r.session_date), 16, y);
              doc.text(String(r.trainer_name).slice(0, 25), 55, y);
              doc.text(String(r.batch_name).slice(0, 18), 115, y);
              doc.text(String(r.audit_status), 160, y);
              y += 5.5;
            });
          } else if (absenceSelectedStudent && studentCoursesData) {
            doc.text('Course Name', 16, y);
            doc.text('Batch', 80, y);
            doc.text('Classes Held', 120, y);
            doc.text('Present', 145, y);
            doc.text('Absent', 170, y);
            y += 6;
            studentCoursesData.records.slice(0, 30).forEach(r => {
              if (y > 275) { doc.addPage(); y = 20; }
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(40, 40, 40);
              doc.text(String(r.course_name).slice(0, 28), 16, y);
              doc.text(String(r.batch_name).slice(0, 18), 80, y);
              doc.text(String(r.total_classes_held), 120, y);
              doc.text(String(r.total_present_days), 145, y);
              doc.text(String(r.total_absent_days), 170, y);
              y += 5.5;
            });
          } else if (absenceData) {
            doc.text('Student', 16, y);
            doc.text('Roll #', 60, y);
            doc.text('Student Contact', 90, y);
            doc.text('Classes Held', 135, y);
            doc.text('Absent Days', 165, y);
            y += 6;
            absenceData.records.slice(0, 30).forEach(r => {
              if (y > 275) { doc.addPage(); y = 20; }
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(40, 40, 40);
              doc.text(String(r.student_name).slice(0, 20), 16, y);
              doc.text(String(r.roll_number), 60, y);
              doc.text(String(r.student_contact).slice(0, 16), 90, y);
              doc.text(String(r.total_classes_held), 135, y);
              doc.text(String(r.total_absent_days), 165, y);
              y += 5.5;
            });
          }
        } else if (attendanceSubView === 'batch' && batchAttendanceData) {
          doc.text('Course Name', 16, y);
          doc.text('Batch', 60, y);
          doc.text('Trainer', 90, y);
          doc.text('Students', 135, y);
          doc.text('Held', 152, y);
          doc.text('Absent', 166, y);
          doc.text('Abs %', 182, y);
          y += 6;
          batchAttendanceData.records.slice(0, 35).forEach(r => {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            doc.text(String(r.course_name).slice(0, 18), 16, y);
            doc.text(String(r.batch_name).slice(0, 12), 60, y);
            doc.text(String(r.trainer_name).slice(0, 18), 90, y);
            doc.text(String(r.total_registered_students), 135, y);
            doc.text(String(r.total_classes_held), 152, y);
            doc.text(String(r.total_absences), 166, y);
            doc.text(`${r.absence_percentage}%`, 182, y);
            y += 5.5;
          });
        } else if (attendanceData) {
          doc.text('Date', 16, y);
          doc.text('Student', 40, y);
          doc.text('Course / Batch', 90, y);
          doc.text('Status', 150, y);
          doc.text('Roll No', 175, y);
          y += 6;
          attendanceData.records.slice(0, 30).forEach(r => {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            doc.text(String(r.session_date), 16, y);
            doc.text(String(r.student_name).slice(0, 22), 40, y);
            doc.text(String(r.course_title).slice(0, 25), 90, y);
            doc.text(String(r.status).toUpperCase(), 150, y);
            doc.text(String(r.roll_number), 175, y);
            y += 5.5;
          });
        }
      } else if (activeType === 'fees' && feesData) {
        doc.text('Invoice #', 16, y);
        doc.text('Student Name', 50, y);
        doc.text('Period', 105, y);
        doc.text('Paid (Rs)', 140, y);
        doc.text('Balance (Rs)', 170, y);
        y += 6;
        feesData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.invoice_number), 16, y);
          doc.text(String(r.student_name).slice(0, 24), 50, y);
          doc.text(String(r.fee_period), 105, y);
          doc.text(String(r.paid_amount), 140, y);
          doc.text(String(r.balance_amount), 170, y);
          y += 5.5;
        });
      } else if (activeType === 'salaries' && salariesData) {
        doc.text('Guru Name', 16, y);
        doc.text('Month', 65, y);
        doc.text('Classes', 105, y);
        doc.text('Net Salary (Rs)', 135, y);
        doc.text('Status', 170, y);
        y += 6;
        salariesData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.trainer_name).slice(0, 22), 16, y);
          doc.text(String(r.payroll_month), 65, y);
          doc.text(String(r.classes_conducted), 105, y);
          doc.text(String(r.net_salary), 135, y);
          doc.text(String(r.status).toUpperCase(), 170, y);
          y += 5.5;
        });
      } else if (activeType === 'income_expenses' && incomeExpensesData) {
        doc.text('Date', 16, y);
        doc.text('Category', 40, y);
        doc.text('Type', 85, y);
        doc.text('Description', 115, y);
        doc.text('Amount (Rs)', 170, y);
        y += 6;
        incomeExpensesData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.date), 16, y);
          doc.text(String(r.category).slice(0, 18), 40, y);
          doc.text(String(r.type).slice(0, 12), 85, y);
          doc.text(String(r.description).slice(0, 24), 115, y);
          doc.text(String(r.amount), 170, y);
          y += 5.5;
        });
      }

      // Save PDF
      doc.save(`laasya_${activeType}_report.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Unable to generate PDF directly. Please use Excel or CSV export.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#590231] tracking-tight">
              Academy Reports & Audits
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              Audit attendance, tuition fees, trainer payroll, and income vs expenses with direct export
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#F0D5E4] hover:bg-[#FFF2F8] text-gray-700 hover:text-[#8A064D] text-xs font-black shadow-xs transition cursor-pointer"
            title="Export filtered records as CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#F0D5E4] hover:bg-[#FFF2F8] text-gray-700 hover:text-[#8A064D] text-xs font-black shadow-xs transition cursor-pointer"
            title="Export filtered records as Excel Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700" />
            <span>Excel</span>
          </button>

          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-black shadow-md transition border border-[#F9E33A]/60 cursor-pointer"
            title="Download official PDF report"
          >
            <FileDown className="w-4 h-4 text-[#F9E33A]" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Attendance Tab */}
        <button
          onClick={() => {
            setActiveType('attendance');
            clearFilters();
          }}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
            activeType === 'attendance'
              ? 'bg-[#590231] text-white border-[#F9E33A] shadow-md'
              : 'bg-white text-gray-800 border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeType === 'attendance' ? 'bg-[#8A064D] text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Attendance</div>
            <div className={`text-[11px] font-semibold ${activeType === 'attendance' ? 'text-rose-200' : 'text-gray-500'}`}>
              Presence & audit rates
            </div>
          </div>
        </button>

        {/* Fees Tab */}
        <button
          onClick={() => {
            setActiveType('fees');
            clearFilters();
          }}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
            activeType === 'fees'
              ? 'bg-[#590231] text-white border-[#F9E33A] shadow-md'
              : 'bg-white text-gray-800 border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeType === 'fees' ? 'bg-[#8A064D] text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'}`}>
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Student Fees</div>
            <div className={`text-[11px] font-semibold ${activeType === 'fees' ? 'text-rose-200' : 'text-gray-500'}`}>
              Collections & dues
            </div>
          </div>
        </button>

        {/* Salaries Tab */}
        <button
          onClick={() => {
            setActiveType('salaries');
            clearFilters();
          }}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
            activeType === 'salaries'
              ? 'bg-[#590231] text-white border-[#F9E33A] shadow-md'
              : 'bg-white text-gray-800 border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeType === 'salaries' ? 'bg-[#8A064D] text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'}`}>
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Guru Salaries</div>
            <div className={`text-[11px] font-semibold ${activeType === 'salaries' ? 'text-rose-200' : 'text-gray-500'}`}>
              Payroll & bonuses
            </div>
          </div>
        </button>

        {/* Income vs Expenses Tab */}
        <button
          onClick={() => {
            setActiveType('income_expenses');
            clearFilters();
          }}
          className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
            activeType === 'income_expenses'
              ? 'bg-[#590231] text-white border-[#F9E33A] shadow-md'
              : 'bg-white text-gray-800 border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeType === 'income_expenses' ? 'bg-[#8A064D] text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Income vs Expenses</div>
            <div className={`text-[11px] font-semibold ${activeType === 'income_expenses' ? 'text-rose-200' : 'text-gray-500'}`}>
              P&L and net surplus
            </div>
          </div>
        </button>

      </div>

      {/* Attendance Sub-view Switcher: General Report vs Absence Report vs Batch Attendance Report */}
      {activeType === 'attendance' && (
        <div className="bg-white rounded-3xl p-3 border border-[#F0D5E4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAttendanceSubView('general');
                setAbsenceSelectedStudent(null);
                setAbsenceSelectedBatch(null);
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                attendanceSubView === 'general'
                  ? 'bg-[#590231] text-white shadow-md'
                  : 'bg-[#FFF9FB] text-gray-700 hover:text-[#8A064D] hover:bg-[#FFF2F8] border border-[#F0D5E4]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>General Report</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAttendanceSubView('absence');
                setAbsenceSelectedStudent(null);
                setAbsenceSelectedBatch(null);
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                attendanceSubView === 'absence'
                  ? 'bg-[#590231] text-white shadow-md'
                  : 'bg-[#FFF9FB] text-gray-700 hover:text-[#8A064D] hover:bg-[#FFF2F8] border border-[#F0D5E4]'
              }`}
            >
              <UserX className="w-4 h-4 text-[#F9E33A]" />
              <span>Absence Report</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAttendanceSubView('batch');
                setAbsenceSelectedStudent(null);
                setAbsenceSelectedBatch(null);
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                attendanceSubView === 'batch'
                  ? 'bg-[#590231] text-white shadow-md'
                  : 'bg-[#FFF9FB] text-gray-700 hover:text-[#8A064D] hover:bg-[#FFF2F8] border border-[#F0D5E4]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#F9E33A]" />
              <span>Batch Attendance Report</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-500 pr-2">
            {attendanceSubView === 'general' ? (
              <span>Auditing class session rosters & presence rate</span>
            ) : attendanceSubView === 'absence' ? (
              <span>Track overall absences, course breakdowns & session audits</span>
            ) : (
              <span>Audit batch-level registered students, classes held & absence %</span>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Filters Bar based on active report type */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0D5E4]/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#8A064D]" />
            <span className="text-xs font-black text-[#590231] uppercase tracking-wider">
              {activeType === 'attendance' && attendanceSubView === 'absence'
                ? 'Absence Report Parameters & Filters'
                : activeType === 'attendance' && attendanceSubView === 'batch'
                ? 'Batch Attendance Report Parameters & Filters'
                : `${activeType.replace('_', ' ')} Report Parameters & Filters`}
            </span>
          </div>

          {/* Timestamp & Date Range Quick Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {activeType === 'attendance' && (attendanceSubView === 'absence' || attendanceSubView === 'batch') ? (
              <MonthYearRangeFilter
                startDate={startDate}
                endDate={endDate}
                align="right"
                onApply={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
              />
            ) : (
              <DateRangeQuickFilter
                startDate={startDate}
                endDate={endDate}
                align="right"
                onApply={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                placeholder="Select Report Date Range"
              />
            )}
            <span className="flex items-center gap-1 text-emerald-800 font-bold text-xs bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Generated: {currentGeneratedAt ? new Date(currentGeneratedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Live'}
            </span>
          </div>
        </div>

        {/* Dynamic Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Attendance Report Filters: Batch Attendance Report */}
          {activeType === 'attendance' && attendanceSubView === 'batch' && (
            <>
              {/* Course: Searchable multi-select */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">
                  Course (Multi-select)
                </label>
                <CourseMultiSearchSelect
                  courses={courseOptions}
                  selectedIds={selectedCourseIds}
                  onChange={(ids) => {
                    setSelectedCourseIds(ids);
                    if (ids.length > 0) {
                      setSelectedBatchIds(prev => prev.filter(bId => {
                        const batch = batches.find(b => b.id === bId);
                        return batch && ids.includes(batch.course_id);
                      }));
                    }
                  }}
                  placeholder="All Courses (Multi-select)"
                  className="w-full"
                />
              </div>

              {/* Batch: Searchable multi-select, filtered based on selected courses */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">
                  Batch (Multi-select)
                </label>
                <BatchMultiSearchSelect
                  batches={availableBatchOptions}
                  selectedIds={selectedBatchIds}
                  onChange={(ids) => setSelectedBatchIds(ids)}
                  placeholder="All Batches (Multi-select)"
                  className="w-full"
                />
              </div>

              {/* Month and Year: date range selection */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">
                  Month & Year Range
                </label>
                <MonthYearRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  align="right"
                  onApply={({ startDate: s, endDate: e }) => {
                    setStartDate(s);
                    setEndDate(e);
                  }}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Attendance Report Filters: Absence */}
          {activeType === 'attendance' && attendanceSubView === 'absence' && (
            <>
              {/* Sort: High Absence (default) / Low Absence */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">
                  Sort
                </label>
                <select
                  value={absenceSort}
                  onChange={(e) => setAbsenceSort(e.target.value as 'high_absence' | 'low_absence')}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                >
                  <option value="high_absence">High Absence (default)</option>
                  <option value="low_absence">Low Absence</option>
                </select>
              </div>

              {/* Student Name: Searchable + multi-select */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">
                  Student Name (Multi-select)
                </label>
                <StudentMultiSearchSelect
                  students={studentOptions}
                  selectedIds={absenceSelectedStudentIds}
                  onChange={(ids) => setAbsenceSelectedStudentIds(ids)}
                  placeholder="All Students (Multi-select)"
                  className="w-full"
                />
              </div>

              {/* Month & Year: Select range */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">
                  Month & Year Range
                </label>
                <MonthYearRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  align="right"
                  onApply={({ startDate: s, endDate: e }) => {
                    setStartDate(s);
                    setEndDate(e);
                  }}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Attendance Report Filters: General */}
          {activeType === 'attendance' && attendanceSubView === 'general' && (
            <>
              {/* Course: Searchable + multi-select */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Course (Multi-select)</label>
                <CourseMultiSearchSelect
                  courses={courseOptions}
                  selectedIds={selectedCourseIds}
                  onChange={(ids) => {
                    setSelectedCourseIds(ids);
                    if (ids.length > 0) {
                      setSelectedBatchIds(prev => prev.filter(bId => {
                        const batch = batches.find(b => b.id === bId);
                        return batch && ids.includes(batch.course_id);
                      }));
                    }
                  }}
                  placeholder="All Courses (Multi-select)"
                  className="w-full"
                />
              </div>

              {/* Batch: Searchable + multi-select with Course in brackets */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Batch (Multi-select)</label>
                <BatchMultiSearchSelect
                  batches={availableBatchOptions}
                  selectedIds={selectedBatchIds}
                  onChange={(ids) => setSelectedBatchIds(ids)}
                  placeholder="All Batches (Multi-select)"
                  className="w-full"
                />
              </div>

              {/* Student (Searchable) */}
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Student</label>
                <StudentSearchSelect
                  students={studentOptions}
                  value={selectedStudentId === 'all' ? '' : selectedStudentId}
                  onChange={(id) => setSelectedStudentId(id || 'all')}
                  placeholder="All Students (Search)"
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Fees Report Filters: Course, Batch, Status */}
          {activeType === 'fees' && (
            <>
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Course (Multi-select)</label>
                <CourseMultiSearchSelect
                  courses={courseOptions}
                  selectedIds={selectedCourseIds}
                  onChange={(ids) => {
                    setSelectedCourseIds(ids);
                    if (ids.length > 0) {
                      setSelectedBatchIds(prev => prev.filter(bId => {
                        const batch = batches.find(b => b.id === bId);
                        return batch && ids.includes(batch.course_id);
                      }));
                    }
                  }}
                  placeholder="All Courses (Multi-select)"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Batch (Multi-select)</label>
                <BatchMultiSearchSelect
                  batches={availableBatchOptions}
                  selectedIds={selectedBatchIds}
                  onChange={(ids) => setSelectedBatchIds(ids)}
                  placeholder="All Batches (Multi-select)"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Payment Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                >
                  <option value="all">All Status</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </>
          )}

          {/* Salaries Report Filters: Trainer (Searchable), Status */}
          {activeType === 'salaries' && (
            <>
              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Trainer / Guru (Searchable)</label>
                <TrainerSearchSelect
                  trainers={trainerOptions}
                  value={selectedTrainerId === 'all' ? '' : selectedTrainerId}
                  onChange={(id) => setSelectedTrainerId(id || 'all')}
                  placeholder="All Gurus / Faculty"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-600 uppercase block mb-1">Disbursement Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-end pb-1">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-[#8A064D] text-xs font-bold cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Income vs Expenses Report Filters */}
          {activeType === 'income_expenses' && (
            <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4]/60">
              <span className="text-xs font-semibold text-gray-600">
                Auditing combined fee collections, faculty salaries, and operational expenses matching the selected date range.
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-[#8A064D] text-xs font-bold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="bg-white rounded-3xl p-12 border border-[#F0D5E4] shadow-xs text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#8A064D] animate-spin" />
          <h3 className="text-base font-black text-[#590231]">
            Compiling and auditing report records...
          </h3>
          <p className="text-xs font-semibold text-gray-400">
            Matching underlying ledger records for exact precision
          </p>
        </div>
      )}

      {/* Error State with Plain-Language Message & Retry */}
      {!isLoading && errorMessage && (
        <div className="bg-white rounded-3xl p-10 border border-red-200 shadow-xs text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-gray-900">
            Unable to load {activeType.replace('_', ' ')} report
          </h3>
          <p className="text-xs font-semibold text-gray-600 max-w-md">
            {errorMessage}
          </p>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8A064D] text-white text-xs font-black shadow-md hover:bg-[#590231] transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Loading Report</span>
          </button>
        </div>
      )}

      {/* Empty State: Rule: "No records match these filters. Clear filters or change the date range." */}
      {!isLoading && !errorMessage && currentRecordCount === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-[#F0D5E4] shadow-xs text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-black text-[#590231]">
              No records match these filters. Clear filters or change the date range.
            </h3>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              Adjust your course, batch, or date selection above to audit available records.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {activeType === 'attendance' && attendanceSubView === 'absence' && (
              <>
                {absenceSelectedBatch && (
                  <button
                    type="button"
                    onClick={() => setAbsenceSelectedBatch(null)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#F0D5E4] hover:bg-[#FFF2F8] text-[#8A064D] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Courses</span>
                  </button>
                )}
                {absenceSelectedStudent && !absenceSelectedBatch && (
                  <button
                    type="button"
                    onClick={() => setAbsenceSelectedStudent(null)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#F0D5E4] hover:bg-[#FFF2F8] text-[#8A064D] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to All Students</span>
                  </button>
                )}
              </>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-5 py-2 rounded-xl bg-[#8A064D] text-white text-xs font-black hover:bg-[#590231] shadow-md transition cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* REPORT CONTENT VIEWPORT */}
      {!isLoading && !errorMessage && currentRecordCount > 0 && (
        <div className="space-y-6">
          
          {/* ========================================================= */}
          {/* 1. ATTENDANCE REPORT VIEW: GENERAL VS ABSENCE */}
          {/* ========================================================= */}
          {activeType === 'attendance' && attendanceSubView === 'general' && attendanceData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                  <div className="text-xs font-black text-[#6E3955] uppercase tracking-wide">Sessions Audited</div>
                  <div className="text-3xl font-black text-[#590231] mt-2 tabular-nums">
                    {attendanceData.summary.totalSessions}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8C5E77] mt-1">Class sessions</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">Present</div>
                  <div className="text-3xl font-black text-emerald-700 mt-2 tabular-nums">
                    {attendanceData.summary.presentCount}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">Full attendance</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-red-200 shadow-xs">
                  <div className="text-xs font-black text-red-800 uppercase tracking-wide">Absent</div>
                  <div className="text-3xl font-black text-red-700 mt-2 tabular-nums">
                    {attendanceData.summary.absentCount}
                  </div>
                  <div className="text-[11px] font-semibold text-red-600 mt-1">Unexcused / Leave</div>
                </div>

                <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-5 border border-[#F9E33A] shadow-xs">
                  <div className="text-xs font-black text-[#854D0E] uppercase flex items-center justify-between">
                    <span>Attendance Rate</span>
                    <Percent className="w-4 h-4 text-[#854D0E]" />
                  </div>
                  <div className="text-3xl font-black text-[#590231] mt-2 tabular-nums">
                    {attendanceData.summary.attendancePercentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-1 font-bold">
                    Presence proportion
                  </div>
                </div>

              </div>

              {/* Attendance Progress Chart */}
              <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#590231] uppercase tracking-wider">
                    Attendance Composition Breakdown
                  </span>
                  <span className="text-xs font-bold text-[#6E3955] tabular-nums">
                    {attendanceData.summary.totalSessions} Total Tracked Entries
                  </span>
                </div>
                
                {/* Visual Stacked Progress Bar */}
                <div className="h-6 w-full rounded-xl bg-[#FFF2F8] border border-[#F0D5E4]/60 overflow-hidden flex shadow-inner">
                  {attendanceData.summary.totalSessions > 0 && (
                    <>
                      <div 
                        style={{ width: `${(attendanceData.summary.presentCount / attendanceData.summary.totalSessions) * 100}%` }}
                        className="bg-emerald-600 h-full transition-all"
                        title={`Present: ${attendanceData.summary.presentCount}`}
                      />
                      <div 
                        style={{ width: `${(attendanceData.summary.absentCount / attendanceData.summary.totalSessions) * 100}%` }}
                        className="bg-red-600 h-full transition-all"
                        title={`Absent: ${attendanceData.summary.absentCount}`}
                      />
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Present ({attendanceData.summary.presentCount})
                  </span>
                  <span className="flex items-center gap-1.5 text-red-800">
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Absent ({attendanceData.summary.absentCount})
                  </span>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Detailed Attendance Audit Records
                  </h3>
                  <span className="text-xs font-semibold text-[#6E3955] tabular-nums">
                    {attendanceData.records.length} records matching criteria
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Session Date</th>
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-5">Roll No</th>
                        <th className="py-3 px-5">Course</th>
                        <th className="py-3 px-5">Batch</th>
                        <th className="py-3 px-5 text-center">Audit Status</th>
                        <th className="py-3 px-5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {attendanceData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-700 whitespace-nowrap tabular-nums">
                            {r.session_date ? new Date(r.session_date).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-gray-900">
                            {r.student_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-[#6E3955] tabular-nums">
                            {r.roll_number}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-800">
                            {r.course_title}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-600">
                            {r.batch_name}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                              r.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-xs text-gray-500">
                            {r.remarks || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* ABSENCE REPORT (3-TIER DRILLDOWN NAVIGATION) */}
          {/* ========================================================= */}
          {activeType === 'attendance' && attendanceSubView === 'absence' && (
            <div className="space-y-6">

              {/* LEVEL 3: Individual Session Attendance Details */}
              {absenceSelectedStudent && absenceSelectedBatch ? (
                <div className="space-y-6">
                  {/* Breadcrumb Navigation Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setAbsenceSelectedBatch(null);
                          setAbsenceSelectedStudent(null);
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-[#8A064D] transition cursor-pointer"
                      >
                        Absence Report
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setAbsenceSelectedBatch(null)}
                        className="text-xs font-bold text-gray-500 hover:text-[#8A064D] transition cursor-pointer"
                      >
                        {absenceSelectedStudent.student_name}
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-black text-[#590231]">
                        {absenceSelectedBatch.course_name} ({absenceSelectedBatch.batch_name})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAbsenceSelectedBatch(null)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFF2F8] hover:bg-[#F0D5E4] text-[#8A064D] text-xs font-bold transition border border-[#F0D5E4] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to {absenceSelectedStudent.student_name}&apos;s Courses</span>
                    </button>
                  </div>

                  {/* Header Metrics Banner */}
                  <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-[#590231]">
                        {absenceSelectedBatch.course_name} — {absenceSelectedBatch.batch_name}
                      </h2>
                      <p className="text-xs font-semibold text-gray-600 mt-1">
                        Student: <strong className="text-gray-900">{absenceSelectedStudent.student_name}</strong> (Roll: {absenceSelectedStudent.roll_number})
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="px-3.5 py-2 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                        <div className="text-[10px] font-black uppercase text-amber-800">Classes Held</div>
                        <div className="text-xl font-black text-amber-700 tabular-nums">
                          {sessionAuditData?.totalSessions || absenceSelectedBatch.total_classes_held}
                        </div>
                      </div>
                      <div className="px-3.5 py-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                        <div className="text-[10px] font-black uppercase text-emerald-800">Present Days</div>
                        <div className="text-xl font-black text-emerald-700 tabular-nums">
                          {sessionAuditData?.presentCount ?? absenceSelectedBatch.total_present_days}
                        </div>
                      </div>
                      <div className="px-3.5 py-2 bg-rose-50 rounded-2xl border border-rose-200 text-center">
                        <div className="text-[10px] font-black uppercase text-rose-800">Absent Days</div>
                        <div className="text-xl font-black text-rose-700 tabular-nums">
                          {sessionAuditData?.absentCount ?? absenceSelectedBatch.total_absent_days}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sessions Audit Table */}
                  <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                      <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                        Course Attendance Details — Class Sessions
                      </h3>
                      <span className="text-xs font-semibold text-[#6E3955] tabular-nums">
                        {sessionAuditData?.records.length || 0} session records
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                            <th className="py-3 px-5">Session Date</th>
                            <th className="py-3 px-5">Trainer Name</th>
                            <th className="py-3 px-5">Course</th>
                            <th className="py-3 px-5">Batch</th>
                            <th className="py-3 px-5 text-center">Audit Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0D5E4]/60">
                          {sessionAuditData && sessionAuditData.records.length > 0 ? (
                            sessionAuditData.records.map((s, idx) => (
                              <tr key={s.session_id || idx} className="hover:bg-[#FFF9FB] transition">
                                <td className="py-3.5 px-5 font-bold text-gray-800 whitespace-nowrap tabular-nums">
                                  {s.session_date}
                                </td>
                                <td className="py-3.5 px-5 font-bold text-gray-900">
                                  {s.trainer_name}
                                </td>
                                <td className="py-3.5 px-5 font-semibold text-gray-800">
                                  {s.course_name}
                                </td>
                                <td className="py-3.5 px-5 font-semibold text-gray-600">
                                  {s.batch_name}
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <span className={`px-3 py-1 rounded-xl text-xs font-black inline-block ${
                                    s.audit_status === 'Present'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : s.audit_status === 'Absent'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                                  }`}>
                                    {s.audit_status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-xs text-gray-500 font-semibold">
                                No session attendance records found for this course and batch in the selected date range.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : absenceSelectedStudent ? (
                /* LEVEL 2: Student Details (Course-wise Breakdown) */
                <div className="space-y-6">
                  {/* Breadcrumb Navigation Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setAbsenceSelectedBatch(null);
                          setAbsenceSelectedStudent(null);
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-[#8A064D] transition cursor-pointer"
                      >
                        Absence Report
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-black text-[#590231]">
                        {absenceSelectedStudent.student_name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAbsenceSelectedBatch(null);
                        setAbsenceSelectedStudent(null);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFF2F8] hover:bg-[#F0D5E4] text-[#8A064D] text-xs font-bold transition border border-[#F0D5E4] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to All Students</span>
                    </button>
                  </div>

                  {/* Student Details Hero Card */}
                  <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl md:text-3xl font-black text-[#590231]">
                            {absenceSelectedStudent.student_name}
                          </h2>
                          <span className="px-3 py-1 bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] rounded-xl text-xs font-black font-mono">
                            {absenceSelectedStudent.roll_number}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#8A064D]" />
                            <span>Student: {absenceSelectedStudent.student_contact}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#8A064D]" />
                            <span>Parent: {absenceSelectedStudent.parent_contact}</span>
                          </div>
                        </div>
                      </div>

                      {/* Highlighted Stat Pills */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="px-4 py-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                          <div className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Total Classes Held</div>
                          <div className="text-2xl font-black text-amber-700 tabular-nums">
                            {studentCoursesData?.totalClassesHeld ?? absenceSelectedStudent.total_classes_held}
                          </div>
                        </div>
                        <div className="px-4 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                          <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Total Present</div>
                          <div className="text-2xl font-black text-emerald-700 tabular-nums">
                            {studentCoursesData?.totalPresentDays ?? absenceSelectedStudent.total_present_days}
                          </div>
                        </div>
                        <div className="px-4 py-2.5 bg-rose-50 rounded-2xl border border-rose-200 text-center">
                          <div className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Total Absent Days</div>
                          <div className="text-2xl font-black text-rose-700 tabular-nums">
                            {studentCoursesData?.totalAbsentDays ?? absenceSelectedStudent.total_absent_days}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Details: Course-wise Table */}
                  <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                      <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                        Enrolled Courses & Batch Attendance
                      </h3>
                      <span className="text-xs font-semibold text-[#6E3955] tabular-nums">
                        {studentCoursesData?.records.length || 0} active course enrollments
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                            <th className="py-3 px-5">Course Name</th>
                            <th className="py-3 px-5">Batch Name</th>
                            <th className="py-3 px-5 text-center">Total Classes Held</th>
                            <th className="py-3 px-5 text-center">Total Present Days</th>
                            <th className="py-3 px-5 text-center">Total Absent Days</th>
                            <th className="py-3 px-5 text-center">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0D5E4]/60">
                          {studentCoursesData && studentCoursesData.records.length > 0 ? (
                            studentCoursesData.records.map((crs, idx) => (
                              <tr key={crs.batch_id || idx} className="hover:bg-[#FFF9FB] transition">
                                <td className="py-3.5 px-5 font-bold text-gray-900">
                                  {crs.course_name}
                                </td>
                                <td className="py-3.5 px-5 font-semibold text-gray-700">
                                  {crs.batch_name}
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-black text-xs tabular-nums inline-block">
                                    {crs.total_classes_held}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-black text-xs tabular-nums inline-block">
                                    {crs.total_present_days}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-black text-xs tabular-nums inline-block">
                                    {crs.total_absent_days}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setAbsenceSelectedBatch(crs)}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold transition inline-flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                                  >
                                    <span>Details</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-xs text-gray-500 font-semibold">
                                No course enrollment records found for this student.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* LEVEL 1: Overall Student Absence Report */
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                      <div className="text-xs font-black text-[#6E3955] uppercase tracking-wide">Students Audited</div>
                      <div className="text-3xl font-black text-[#590231] mt-2 tabular-nums">
                        {absenceData?.totalStudents || 0}
                      </div>
                      <div className="text-[11px] font-semibold text-[#8C5E77] mt-1">Enrolled students</div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs">
                      <div className="text-xs font-black text-amber-800 uppercase tracking-wide">Classes Tracked</div>
                      <div className="text-3xl font-black text-amber-700 mt-2 tabular-nums">
                        {absenceData?.records.reduce((sum, r) => sum + r.total_classes_held, 0) || 0}
                      </div>
                      <div className="text-[11px] font-semibold text-amber-600 mt-1">Cumulative student sessions</div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-rose-200 shadow-xs">
                      <div className="text-xs font-black text-rose-800 uppercase tracking-wide">Absences Logged</div>
                      <div className="text-3xl font-black text-rose-700 mt-2 tabular-nums">
                        {absenceData?.records.reduce((sum, r) => sum + r.total_absent_days, 0) || 0}
                      </div>
                      <div className="text-[11px] font-semibold text-rose-600 mt-1">Total student absences</div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-5 border border-[#F9E33A] shadow-xs">
                      <div className="text-xs font-black text-[#854D0E] uppercase flex items-center justify-between">
                        <span>Current Sorting</span>
                        <ArrowDownWideNarrow className="w-4 h-4 text-[#854D0E]" />
                      </div>
                      <div className="text-lg font-black text-[#590231] mt-2 truncate">
                        {absenceSort === 'high_absence' ? 'High Absence' : 'Low Absence'}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-1 font-bold">
                        {absenceSort === 'high_absence' ? 'Highest absences first' : 'Lowest absences first'}
                      </div>
                    </div>
                  </div>

                  {/* Main Absence Table */}
                  <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                      <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                        Student Absence Ledger
                      </h3>
                      <span className="text-xs font-semibold text-[#6E3955] tabular-nums">
                        {absenceData?.records.length || 0} students listed
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                            <th className="py-3 px-5">Student Name</th>
                            <th className="py-3 px-5">Roll No.</th>
                            <th className="py-3 px-5">Student Contact Number</th>
                            <th className="py-3 px-5">Parent Contact Number</th>
                            <th className="py-3 px-5 text-center">Total Classes Held</th>
                            <th className="py-3 px-5 text-center">Total Absent Days</th>
                            <th className="py-3 px-5 text-center">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0D5E4]/60">
                          {absenceData && absenceData.records.length > 0 ? (
                            absenceData.records.map((r) => (
                              <tr key={r.student_id} className="hover:bg-[#FFF9FB] transition">
                                <td className="py-3.5 px-5 font-bold text-gray-900">
                                  {r.student_name}
                                </td>
                                <td className="py-3.5 px-5 font-semibold text-[#6E3955] tabular-nums">
                                  {r.roll_number}
                                </td>
                                <td className="py-3.5 px-5 font-semibold text-gray-700">
                                  {r.student_contact}
                                </td>
                                <td className="py-3.5 px-5 font-semibold text-gray-700">
                                  {r.parent_contact}
                                </td>
                                <td className="py-3.5 px-5 text-center font-black text-[#590231] tabular-nums">
                                  {r.total_classes_held}
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <span className={`px-3 py-1 rounded-xl text-xs font-black tabular-nums inline-block ${
                                    r.total_absent_days > 0
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {r.total_absent_days}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setAbsenceSelectedStudent(r)}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold transition inline-flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                                  >
                                    <span>Details</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-xs text-gray-500 font-semibold">
                                No absence records found matching the selected filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* 1C. BATCH ATTENDANCE REPORT VIEW */}
          {/* ========================================================= */}
          {activeType === 'attendance' && attendanceSubView === 'batch' && batchAttendanceData && (
            <div className="space-y-6">
              
              {/* Summary Bar: Total Courses Selected, Total Batches, Total Students, Sort by Absence Percentage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Courses Selected */}
                <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                  <div className="text-xs font-black text-[#6E3955] uppercase tracking-wide">
                    Total Courses Selected
                  </div>
                  <div className="text-3xl font-black text-[#590231] mt-2 tabular-nums">
                    {selectedCourseIds.length > 0 ? selectedCourseIds.length : (batchAttendanceData.summary.totalCourses || 0)}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8C5E77] mt-1">
                    {selectedCourseIds.length > 0 ? 'Specific courses filtered' : 'All available courses'}
                  </div>
                </div>

                {/* 2. Total Batches */}
                <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs">
                  <div className="text-xs font-black text-amber-800 uppercase tracking-wide">
                    Total Batches
                  </div>
                  <div className="text-3xl font-black text-amber-700 mt-2 tabular-nums">
                    {batchAttendanceData.summary.totalBatches || 0}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-600 mt-1">
                    Cohorts audited
                  </div>
                </div>

                {/* 3. Total Students */}
                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                    Total Students
                  </div>
                  <div className="text-3xl font-black text-emerald-700 mt-2 tabular-nums">
                    {batchAttendanceData.summary.totalStudents || 0}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">
                    Active enrollments
                  </div>
                </div>

                {/* 4. Sort by Absence Percentage [High Absence / Low Absence] */}
                <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-5 border border-[#F9E33A] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-[#854D0E] uppercase flex items-center justify-between">
                      <span>Sort by Absence %</span>
                      <ArrowDownWideNarrow className="w-4 h-4 text-[#854D0E]" />
                    </div>
                    <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                      Rank batches by absence
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 bg-[#FFF2F8] p-1 rounded-2xl border border-[#F0D5E4]">
                    <button
                      type="button"
                      onClick={() => setBatchAttendanceSort('high_absence')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition cursor-pointer text-center ${
                        batchAttendanceSort === 'high_absence'
                          ? 'bg-[#590231] text-white shadow-xs'
                          : 'text-gray-700 hover:text-[#8A064D]'
                      }`}
                    >
                      High Absence
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchAttendanceSort('low_absence')}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition cursor-pointer text-center ${
                        batchAttendanceSort === 'low_absence'
                          ? 'bg-[#590231] text-white shadow-xs'
                          : 'text-gray-700 hover:text-[#8A064D]'
                      }`}
                    >
                      Low Absence
                    </button>
                  </div>
                </div>

              </div>

              {/* Batch Attendance Report Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Batch Attendance & Absence Summary
                  </h3>
                  <span className="text-xs font-semibold text-[#6E3955] tabular-nums">
                    {batchAttendanceData.records.length} batches audited
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Course Name</th>
                        <th className="py-3 px-5">Batch Name</th>
                        <th className="py-3 px-5">Trainer Name</th>
                        <th className="py-3 px-5">Trainer Contact Number</th>
                        <th className="py-3 px-5 text-center">Total Registered Students</th>
                        <th className="py-3 px-5 text-center">Total Classes Held</th>
                        <th className="py-3 px-5 text-center">Total Absences</th>
                        <th className="py-3 px-5 text-center">Absence Percentage (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {batchAttendanceData.records.map((r) => (
                        <tr key={r.batch_id} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-900">
                            {r.course_name}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-[#8A064D]">
                            {r.batch_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-800">
                            {r.trainer_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-700 tabular-nums">
                            {r.trainer_contact}
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold text-gray-900 tabular-nums">
                            {r.total_registered_students}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-black text-xs tabular-nums inline-block">
                              {r.total_classes_held}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-3 py-1 rounded-xl text-xs font-black tabular-nums inline-block ${
                              r.total_absences > 0
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {r.total_absences}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-3 py-1 rounded-xl text-xs font-black tabular-nums inline-block ${
                              r.absence_percentage > 20
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold'
                                : r.absence_percentage > 10
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                            }`}>
                              {r.absence_percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* 2. FEES REPORT VIEW */}
          {/* ========================================================= */}
          {activeType === 'fees' && feesData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">Collected</div>
                  <div className="text-2xl md:text-3xl font-black text-emerald-700 mt-2 tabular-nums">
                    ₹{feesData.summary.totalCollected.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">Paid in range</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs">
                  <div className="text-xs font-black text-amber-800 uppercase tracking-wide">Outstanding</div>
                  <div className="text-2xl md:text-3xl font-black text-amber-700 mt-2 tabular-nums">
                    ₹{feesData.summary.totalOutstanding.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-600 mt-1">Pending clearance</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                  <div className="text-xs font-black text-[#8A064D] uppercase tracking-wide">Discounts</div>
                  <div className="text-2xl md:text-3xl font-black text-[#590231] mt-2 tabular-nums">
                    ₹{feesData.summary.totalDiscounts.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8C5E77] mt-1">Scholarships/offers</div>
                </div>

              </div>

              {/* Payment Status Breakdown Summary Bar */}
              <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#8A064D]" />
                    <span>Payment Status</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-gray-500">
                    Click any status card below to filter records
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* All Status */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('all')}
                    className={`p-4 rounded-2xl text-left transition cursor-pointer border ${
                      selectedStatus === 'all'
                        ? 'bg-[#590231] text-white border-[#590231] shadow-md ring-2 ring-[#8A064D]/20'
                        : 'bg-[#FFF9FB] hover:bg-[#FFF2F8] border-[#F0D5E4] text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-black uppercase tracking-wider ${selectedStatus === 'all' ? 'text-[#F9E33A]' : 'text-[#8A064D]'}`}>
                        All Status
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        selectedStatus === 'all' ? 'bg-white/20 text-white' : 'bg-[#FFF2F8] text-[#8A064D]'
                      }`}>
                        {feesData.records.length} records
                      </span>
                    </div>
                    <div className={`text-xl font-black mt-2 tabular-nums ${selectedStatus === 'all' ? 'text-white' : 'text-[#590231]'}`}>
                      ₹{feesData.summary.totalCollected.toLocaleString('en-IN')}
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${selectedStatus === 'all' ? 'text-rose-200' : 'text-gray-500'}`}>
                      Total collected across all paid students
                    </div>
                  </button>

                  {/* Partial (Orange Colour) */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('partial')}
                    className={`p-4 rounded-2xl text-left transition cursor-pointer border ${
                      selectedStatus === 'partial'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-amber-50/70 hover:bg-amber-100/60 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-black uppercase tracking-wider ${selectedStatus === 'partial' ? 'text-amber-100' : 'text-amber-800'}`}>
                        Partial
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        selectedStatus === 'partial' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {feesData.records.filter(r => r.status === 'partial').length} records
                      </span>
                    </div>
                    <div className={`text-xl font-black mt-2 tabular-nums ${selectedStatus === 'partial' ? 'text-white' : 'text-amber-800'}`}>
                      ₹{feesData.records
                        .filter(r => r.status === 'partial')
                        .reduce((sum, r) => sum + (Number(r.paid_amount) || 0), 0)
                        .toLocaleString('en-IN')}
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${selectedStatus === 'partial' ? 'text-amber-100' : 'text-amber-700'}`}>
                      Partially paid with balance remaining
                    </div>
                  </button>

                  {/* Paid [Green Colour] */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('paid')}
                    className={`p-4 rounded-2xl text-left transition cursor-pointer border ${
                      selectedStatus === 'paid'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-emerald-50/70 hover:bg-emerald-100/60 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-black uppercase tracking-wider ${selectedStatus === 'paid' ? 'text-emerald-100' : 'text-emerald-800'}`}>
                        Paid
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        selectedStatus === 'paid' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {feesData.records.filter(r => r.status === 'paid').length} records
                      </span>
                    </div>
                    <div className={`text-xl font-black mt-2 tabular-nums ${selectedStatus === 'paid' ? 'text-white' : 'text-emerald-800'}`}>
                      ₹{feesData.records
                        .filter(r => r.status === 'paid')
                        .reduce((sum, r) => sum + (Number(r.paid_amount) || 0), 0)
                        .toLocaleString('en-IN')}
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${selectedStatus === 'paid' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      Fully settled invoices
                    </div>
                  </button>
                </div>
              </div>

              {/* Detailed Fees Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Tuition Fee Invoices & Audit Records
                  </h3>
                  <span className="text-xs font-semibold text-[#6E3955] tabular-nums">
                    {feesData.records.length} records matching filters
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Invoice #</th>
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-5">Course</th>
                        <th className="py-3 px-5">Fee Period</th>
                        <th className="py-3 px-5">Due Date</th>
                        <th className="py-3 px-5 text-right">Billed</th>
                        <th className="py-3 px-5 text-right">Paid</th>
                        <th className="py-3 px-5 text-right">Balance</th>
                        <th className="py-3 px-5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {feesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-900 whitespace-nowrap tabular-nums">
                            {r.invoice_number}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-gray-900">
                            {r.student_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-700">
                            {r.course_title}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-[#6E3955]">
                            {r.fee_period}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-600 whitespace-nowrap tabular-nums">
                            {r.due_date || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-gray-700 tabular-nums">
                            ₹{Number(r.total_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-emerald-700 tabular-nums">
                            <div>₹{Number(r.paid_amount).toLocaleString('en-IN')}</div>
                            {Number(r.discount_amount) > 0 && (
                              <div className="text-[10px] font-semibold text-rose-600 mt-0.5 tabular-nums">
                                Disc: -₹{Number(r.discount_amount).toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-amber-700 tabular-nums">
                            ₹{Number(r.balance_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                              r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              r.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                              r.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* 3. SALARIES REPORT VIEW */}
          {/* ========================================================= */}
          {activeType === 'salaries' && salariesData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                  <div className="text-xs font-black text-[#6E3955] uppercase tracking-wide">Total Payable</div>
                  <div className="text-2xl md:text-3xl font-black text-[#590231] mt-2 tabular-nums">
                    ₹{salariesData.summary.totalPayable.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8C5E77] mt-1">Full payroll bill</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase tracking-wide">Total Paid</div>
                  <div className="text-2xl md:text-3xl font-black text-emerald-700 mt-2 tabular-nums">
                    ₹{salariesData.summary.totalPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">Disbursed successfully</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs">
                  <div className="text-xs font-black text-amber-800 uppercase tracking-wide">Pending</div>
                  <div className="text-2xl md:text-3xl font-black text-amber-700 mt-2 tabular-nums">
                    ₹{salariesData.summary.totalPending.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-600 mt-1">Awaiting release</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#FEF9C3] shadow-xs">
                  <div className="text-xs font-black text-[#854D0E] uppercase tracking-wide">Bonuses</div>
                  <div className="text-2xl md:text-3xl font-black text-[#854D0E] mt-2 tabular-nums">
                    ₹{salariesData.summary.totalBonuses.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8C5E77] mt-1">Performance rewards</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-red-200 shadow-xs">
                  <div className="text-xs font-black text-red-800 uppercase tracking-wide">Deductions</div>
                  <div className="text-2xl md:text-3xl font-black text-red-700 mt-2 tabular-nums">
                    ₹{salariesData.summary.totalDeductions.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-red-600 mt-1">Advances & leaves</div>
                </div>

              </div>

              {/* Detailed Salaries Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Guru Payroll & Salary Audit
                  </h3>
                  <span className="text-xs font-semibold text-[#6E3955] tabular-nums">
                    {salariesData.records.length} gurus on record
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Guru Name</th>
                        <th className="py-3 px-5">Title</th>
                        <th className="py-3 px-5">Month</th>
                        <th className="py-3 px-5 text-center">Classes</th>
                        <th className="py-3 px-5 text-right">Base</th>
                        <th className="py-3 px-5 text-right">Bonus</th>
                        <th className="py-3 px-5 text-right">Deductions</th>
                        <th className="py-3 px-5 text-right">Net Payable</th>
                        <th className="py-3 px-5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {salariesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-900">
                            {r.trainer_name}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-600">
                            {r.display_title}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-[#8A064D] tabular-nums">
                            {r.payroll_month}
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold text-gray-700 tabular-nums">
                            {r.classes_conducted}
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-gray-700 tabular-nums">
                            ₹{Number(r.base_salary).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-[#854D0E] tabular-nums">
                            +₹{Number(r.bonus_amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-red-600 tabular-nums">
                            -₹{(Number(r.deduction_amount) + Number(r.advance_deducted)).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-base text-[#590231] tabular-nums">
                            ₹{Number(r.net_salary).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                              r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* 4. INCOME VS EXPENSES REPORT VIEW */}
          {/* ========================================================= */}
          {activeType === 'income_expenses' && incomeExpensesData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-black text-emerald-800 uppercase flex items-center justify-between">
                    <span>Fee Revenue</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-emerald-700 mt-2 tabular-nums">
                    ₹{incomeExpensesData.summary.totalIncome.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1">Total tuition collections</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-rose-200 shadow-xs">
                  <div className="text-xs font-black text-[#8A064D] uppercase flex items-center justify-between">
                    <span>Guru Salaries</span>
                    <Banknote className="w-4 h-4 text-[#8A064D]" />
                  </div>
                  <div className="text-3xl font-black text-[#8A064D] mt-2 tabular-nums">
                    ₹{incomeExpensesData.summary.totalSalaries.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8C5E77] mt-1">Paid trainer disbursements</div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs">
                  <div className="text-xs font-black text-amber-800 uppercase flex items-center justify-between">
                    <span>Academy Expenses</span>
                    <Receipt className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-amber-800 mt-2 tabular-nums">
                    ₹{incomeExpensesData.summary.totalOtherExpenses.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 mt-1">From Expenses Page ledger</div>
                </div>

                <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-5 border border-[#F9E33A] shadow-xs">
                  <div className="text-xs font-black text-[#590231] uppercase flex items-center justify-between">
                    <span>Net Operating Surplus</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FEF9C3] text-[#854D0E]">
                      {incomeExpensesData.summary.status}
                    </span>
                  </div>
                  <div className={`text-3xl font-black mt-2 tabular-nums ${
                    incomeExpensesData.summary.netOperatingAmount >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    ₹{incomeExpensesData.summary.netOperatingAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8C5E77] mt-1">
                    Income - (Salaries + Expenses)
                  </div>
                </div>

              </div>

              {/* Simple Visual Comparison Bar Chart */}
              <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider">
                    Revenue vs Outflow Proportions
                  </h4>
                  <span className="text-xs font-bold text-[#6E3955] tabular-nums">
                    Total Outflow: ₹{incomeExpensesData.summary.totalExpenses.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Comparative Visual Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-700">Gross Income (Fee Collections)</span>
                      <span className="tabular-nums font-black text-gray-900">₹{incomeExpensesData.summary.totalIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-4 w-full rounded-xl bg-gray-100 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-xl" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-rose-700">Guru Payroll Outflow</span>
                      <span className="tabular-nums font-black text-gray-900">₹{incomeExpensesData.summary.totalSalaries.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-4 w-full rounded-xl bg-gray-100 overflow-hidden">
                      <div 
                        className="bg-[#8A064D] h-full rounded-xl" 
                        style={{ width: `${incomeExpensesData.summary.totalIncome > 0 ? (incomeExpensesData.summary.totalSalaries / incomeExpensesData.summary.totalIncome) * 100 : 0}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-700">General Academy Spending (Expenses Page)</span>
                      <span className="tabular-nums font-black text-gray-900">₹{incomeExpensesData.summary.totalOtherExpenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-4 w-full rounded-xl bg-gray-100 overflow-hidden">
                      <div 
                        className="bg-amber-600 h-full rounded-xl" 
                        style={{ width: `${incomeExpensesData.summary.totalIncome > 0 ? (incomeExpensesData.summary.totalOtherExpenses / incomeExpensesData.summary.totalIncome) * 100 : 0}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#F0D5E4] bg-[#FFF9FB] flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#590231] uppercase tracking-wider">
                    Detailed Financial Ledger & Transaction Flow
                  </h3>
                  <span className="text-xs font-semibold text-[#6E3955] tabular-nums">
                    {incomeExpensesData.records.length} items recorded
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5">Flow Type</th>
                        <th className="py-3 px-5">Category</th>
                        <th className="py-3 px-5">Description</th>
                        <th className="py-3 px-5">Method</th>
                        <th className="py-3 px-5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {incomeExpensesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          <td className="py-3.5 px-5 font-bold text-gray-700 whitespace-nowrap tabular-nums">
                            {r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                              r.type === 'Income' ? 'bg-emerald-100 text-emerald-800' :
                              r.type === 'Salary Expense' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {r.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-gray-800">
                            {r.category}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-600 max-w-xs truncate">
                            {r.description}
                          </td>
                          <td className="py-3.5 px-5 text-xs text-gray-500">
                            {r.payment_method}
                          </td>
                          <td className={`py-3.5 px-5 text-right font-black tabular-nums ${
                            r.type === 'Income' ? 'text-emerald-700' : 'text-[#8A064D]'
                          }`}>
                            {r.type === 'Income' ? '+' : '-'}₹{Number(r.amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
}

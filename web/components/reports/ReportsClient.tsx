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
  SlidersHorizontal,
  Printer,
  Sparkles,
  Check
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

interface ColumnDef {
  key: string;
  label: string;
}

const ATTENDANCE_COLUMNS: ColumnDef[] = [
  { key: 'session_date', label: 'Session Date' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'roll_number', label: 'Roll Number' },
  { key: 'course_title', label: 'Course' },
  { key: 'batch_name', label: 'Batch' },
  { key: 'status', label: 'Audit Status' },
  { key: 'remarks', label: 'Remarks' },
];

const BATCH_ATTENDANCE_COLUMNS: ColumnDef[] = [
  { key: 'course_name', label: 'Course Name' },
  { key: 'batch_name', label: 'Batch Name' },
  { key: 'trainer_name', label: 'Trainer Name' },
  { key: 'trainer_contact', label: 'Trainer Contact' },
  { key: 'total_registered_students', label: 'Registered Students' },
  { key: 'total_classes_held', label: 'Classes Held' },
  { key: 'total_absences', label: 'Total Absences' },
  { key: 'absence_percentage', label: 'Absence %' },
];

const ABSENCE_COLUMNS: ColumnDef[] = [
  { key: 'student_name', label: 'Student Name' },
  { key: 'roll_number', label: 'Roll Number' },
  { key: 'student_contact', label: 'Student Contact' },
  { key: 'parent_contact', label: 'Parent Contact' },
  { key: 'total_classes_held', label: 'Classes Held' },
  { key: 'total_absent_days', label: 'Absent Days' },
];

const FEES_COLUMNS: ColumnDef[] = [
  { key: 'invoice_number', label: 'Invoice #' },
  { key: 'student_name', label: 'Student' },
  { key: 'course_title', label: 'Course' },
  { key: 'fee_period', label: 'Fee Period' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'total_amount', label: 'Billed' },
  { key: 'discount_amount', label: 'Disc' },
  { key: 'paid_amount', label: 'Paid' },
  { key: 'balance_amount', label: 'Balance' },
  { key: 'status', label: 'Status' },
];

const SALARIES_COLUMNS: ColumnDef[] = [
  { key: 'invoice_number', label: 'Invoice #' },
  { key: 'invoice_date', label: 'Invoice Date' },
  { key: 'trainer_name', label: 'Guru Name' },
  { key: 'display_title', label: 'Title' },
  { key: 'payroll_month', label: 'Month' },
  { key: 'classes_conducted', label: 'Classes' },
  { key: 'base_salary', label: 'Base' },
  { key: 'bonus_amount', label: 'Bonus' },
  { key: 'deductions', label: 'Deductions' },
  { key: 'net_salary', label: 'Net Payable' },
  { key: 'status', label: 'Status' },
];

const INCOME_EXPENSES_COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Date' },
  { key: 'type', label: 'Flow Type' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'payment_method', label: 'Method' },
  { key: 'amount', label: 'Amount' },
];

interface Props {
  courses: Course[];
  batches: Batch[];
  students: Student[];
  trainers: Trainer[];
}

export default function ReportsClient({ courses, batches, students, trainers }: Props) {
  const [activeType, setActiveType] = useState<ReportType>('attendance');

  // View Mode: 'directory' (Hub with 4 main reports + All Available Reports list) or 'subpage'
  const [reportView, setReportView] = useState<'directory' | 'subpage'>('directory');

  // Modals for Filter Columns (F3) and Export Now (F4)
  const [isFilterColumnsOpen, setIsFilterColumnsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Column visibility map (column key -> boolean)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

  const isColVisible = (key: string): boolean => {
    return visibleColumns[key] !== false;
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  // Keyboard Shortcuts: F2 (View Report), F3 (Filter Columns), F4 (Export Now)
  useEffect(() => {
    if (reportView !== 'subpage') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setRefreshKey(k => k + 1);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsFilterColumnsOpen(prev => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsExportModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportView]);


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

  const getCurrentColumns = useCallback((): ColumnDef[] => {
    if (activeType === 'attendance') {
      if (attendanceSubView === 'batch') return BATCH_ATTENDANCE_COLUMNS;
      if (attendanceSubView === 'absence') return ABSENCE_COLUMNS;
      return ATTENDANCE_COLUMNS;
    }
    if (activeType === 'fees') return FEES_COLUMNS;
    if (activeType === 'salaries') return SALARIES_COLUMNS;
    return INCOME_EXPENSES_COLUMNS;
  }, [activeType, attendanceSubView]);

  const selectAllCurrentColumns = () => {
    const cols = getCurrentColumns();
    setVisibleColumns(prev => {
      const next = { ...prev };
      cols.forEach(c => { next[c.key] = true; });
      return next;
    });
  };

  const resetDefaultColumns = () => {
    const cols = getCurrentColumns();
    setVisibleColumns(prev => {
      const next = { ...prev };
      cols.forEach(c => { delete next[c.key]; });
      return next;
    });
  };

  const openReport = (type: ReportType, subView?: 'general' | 'absence' | 'batch') => {
    setActiveType(type);
    if (type === 'attendance' && subView) {
      setAttendanceSubView(subView);
    }
    setAbsenceSelectedStudent(null);
    setAbsenceSelectedBatch(null);
    setReportView('subpage');
  };

  const handleBackFromSubpage = () => {
    if (activeType === 'attendance' && attendanceSubView === 'absence') {
      if (absenceSelectedBatch) {
        setAbsenceSelectedBatch(null);
        return;
      }
      if (absenceSelectedStudent) {
        setAbsenceSelectedStudent(null);
        return;
      }
    }
    setReportView('directory');
  };

  const getReportTitle = () => {
    if (activeType === 'attendance') {
      return 'Attendance Report';
    }
    if (activeType === 'fees') {
      return 'Students Fee Report';
    }
    if (activeType === 'salaries') {
      return 'Guru Salaries Report';
    }
    return 'Income & Expenses Report';
  };

  const getReportSubtitle = () => {
    if (activeType === 'attendance') {
      if (attendanceSubView === 'general') return 'General Report';
      if (attendanceSubView === 'batch') return 'Batch Attendance Report';
      return 'Absence Report';
    }
    return 'General Report';
  };


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
      rows.push(['Invoice Number', 'Invoice Date', 'Trainer Name', 'Title', 'Payroll Month', 'Base Salary (Rs)', 'Classes Conducted', 'Bonus (Rs)', 'Deductions (Rs)', 'Advance Deducted (Rs)', 'Net Salary (Rs)', 'Status', 'Payment Date', 'Payment Method']);
      salariesData.records.forEach(r => {
        rows.push([r.invoice_number || 'N/A', r.invoice_date || 'N/A', r.trainer_name, r.display_title, r.payroll_month, String(r.base_salary), String(r.classes_conducted), String(r.bonus_amount), String(r.deduction_amount), String(r.advance_deducted), String(r.net_salary), r.status, r.payment_date || 'N/A', r.payment_method || 'N/A']);
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
      headers = ['Invoice Number', 'Student Name', 'Course', 'Period', 'Due Date', 'Billed (Rs)', 'Discount (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Status'];
      rows = feesData.records.map(r => [r.invoice_number, r.student_name, r.course_title, r.fee_period, r.due_date, String(r.total_amount), String(r.discount_amount), String(r.paid_amount), String(r.balance_amount), r.status]);
    } else if (activeType === 'salaries' && salariesData) {
      headers = ['Invoice Number', 'Invoice Date', 'Guru Name', 'Display Title', 'Month', 'Base (Rs)', 'Classes', 'Bonus (Rs)', 'Deductions (Rs)', 'Net (Rs)', 'Status'];
      rows = salariesData.records.map(r => [r.invoice_number || '—', r.invoice_date || '—', r.trainer_name, r.display_title, r.payroll_month, String(r.base_salary), String(r.classes_conducted), String(r.bonus_amount), String(Number(r.deduction_amount) + Number(r.advance_deducted)), String(r.net_salary), r.status]);
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
        doc.text('Invoice #', 14, y);
        doc.text('Student Name', 45, y);
        doc.text('Period', 90, y);
        doc.text('Disc (Rs)', 125, y);
        doc.text('Paid (Rs)', 150, y);
        doc.text('Balance (Rs)', 175, y);
        y += 6;
        feesData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.invoice_number), 14, y);
          doc.text(String(r.student_name).slice(0, 20), 45, y);
          doc.text(String(r.fee_period), 90, y);
          doc.text(String(r.discount_amount || 0), 125, y);
          doc.text(String(r.paid_amount), 150, y);
          doc.text(String(r.balance_amount), 175, y);
          y += 5.5;
        });
      } else if (activeType === 'salaries' && salariesData) {
        doc.text('Invoice #', 14, y);
        doc.text('Date', 38, y);
        doc.text('Guru Name', 62, y);
        doc.text('Month', 105, y);
        doc.text('Classes', 130, y);
        doc.text('Net (Rs)', 155, y);
        doc.text('Status', 180, y);
        y += 6;
        salariesData.records.slice(0, 30).forEach(r => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(String(r.invoice_number || '—').slice(0, 10), 14, y);
          doc.text(String(r.invoice_date || '—').slice(0, 10), 38, y);
          doc.text(String(r.trainer_name).slice(0, 20), 62, y);
          doc.text(String(r.payroll_month), 105, y);
          doc.text(String(r.classes_conducted), 130, y);
          doc.text(String(r.net_salary), 155, y);
          doc.text(String(r.status).toUpperCase(), 180, y);
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

  const allReportsList = [
    {
      id: 'attendance-general',
      name: 'General Attendance Report',
      category: 'Attendance & Audits',
      type: 'attendance' as ReportType,
      subView: 'general' as const,
      icon: <Users className="w-5 h-5" />,
      description: 'Detailed session-wise daily student check-ins, roll numbers, timestamps, presence status, and instructor remarks.'
    },
    {
      id: 'attendance-batch',
      name: 'Batch Attendance & Absence Analytics',
      category: 'Attendance & Audits',
      type: 'attendance' as ReportType,
      subView: 'batch' as const,
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Cohort-level aggregate attendance rates, total registered students, classes held, absence counts, and percentage analytics.'
    },
    {
      id: 'attendance-absence',
      name: 'Student Absence Audit Report',
      category: 'Attendance & Audits',
      type: 'attendance' as ReportType,
      subView: 'absence' as const,
      icon: <UserX className="w-5 h-5" />,
      description: 'Student-specific chronic absenteeism tracking, student & parent emergency contacts, course breakdowns, and missed session audit.'
    },
    {
      id: 'fees-tuition',
      name: 'Students Tuition Fee Report',
      category: 'Financial & Billing',
      type: 'fees' as ReportType,
      icon: <Receipt className="w-5 h-5" />,
      description: 'Complete fee collection audit, tuition invoices, discounts granted, paid amounts, balance dues, and payment methods.'
    },
    {
      id: 'salaries-payroll',
      name: 'Guru Salaries & Payroll Report',
      category: 'Faculty & Payroll',
      type: 'salaries' as ReportType,
      icon: <Banknote className="w-5 h-5" />,
      description: 'Faculty salary statements, invoice numbers, invoice dates, payroll months, classes conducted, bonuses, advance deductions, and net disbursements.'
    },
    {
      id: 'income-expenses',
      name: 'Income & Expenses Financial Ledger',
      category: 'Accounting & P&L',
      type: 'income_expenses' as ReportType,
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Institutional cash flow tracking fee collection income, guru salaries, academy operational expenses, categories, and net surplus.'
    }
  ];

  if (reportView === 'directory') {
    return (
      <div className="space-y-8 pb-12">
        {/* Top Banner */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D] shadow-xs">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#590231] tracking-tight">
                Academy Reports & Audits
              </h1>
              <p className="text-sm font-semibold text-gray-500 mt-1">
                Access comprehensive audits, attendance metrics, tuition billing, trainer payroll, and institutional financials.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Main Reports Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Attendance Report */}
          <button
            type="button"
            onClick={() => openReport('attendance', 'general')}
            className="group bg-white rounded-3xl p-6 border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-lg transition-all duration-300 text-left cursor-pointer flex flex-col justify-between h-full hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] group-hover:bg-[#590231] group-hover:text-[#F9E33A] text-[#8A064D] flex items-center justify-center transition-all duration-300 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#590231] group-hover:text-[#8A064D] transition">
                Attendance Report
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-2 leading-relaxed">
                Session check-ins, batch attendance ratios, and student absence audits
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#8A064D] group-hover:text-[#590231] pt-4 border-t border-[#F0D5E4]/60">
              <span>Open Report</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* Card 2: Students Fee Report */}
          <button
            type="button"
            onClick={() => openReport('fees')}
            className="group bg-white rounded-3xl p-6 border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-lg transition-all duration-300 text-left cursor-pointer flex flex-col justify-between h-full hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] group-hover:bg-[#590231] group-hover:text-[#F9E33A] text-[#8A064D] flex items-center justify-center transition-all duration-300 mb-4">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#590231] group-hover:text-[#8A064D] transition">
                Students Fee Report
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-2 leading-relaxed">
                Fee collection, invoice tracking, discounts granted, and pending balances
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#8A064D] group-hover:text-[#590231] pt-4 border-t border-[#F0D5E4]/60">
              <span>Open Report</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* Card 3: Guru Salaries Report */}
          <button
            type="button"
            onClick={() => openReport('salaries')}
            className="group bg-white rounded-3xl p-6 border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-lg transition-all duration-300 text-left cursor-pointer flex flex-col justify-between h-full hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] group-hover:bg-[#590231] group-hover:text-[#F9E33A] text-[#8A064D] flex items-center justify-center transition-all duration-300 mb-4">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#590231] group-hover:text-[#8A064D] transition">
                Guru Salaries Report
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-2 leading-relaxed">
                Faculty payroll statements, invoice numbers, dates, classes, and net pay
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#8A064D] group-hover:text-[#590231] pt-4 border-t border-[#F0D5E4]/60">
              <span>Open Report</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* Card 4: Income & Expenses Report */}
          <button
            type="button"
            onClick={() => openReport('income_expenses')}
            className="group bg-white rounded-3xl p-6 border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-lg transition-all duration-300 text-left cursor-pointer flex flex-col justify-between h-full hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] group-hover:bg-[#590231] group-hover:text-[#F9E33A] text-[#8A064D] flex items-center justify-center transition-all duration-300 mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#590231] group-hover:text-[#8A064D] transition">
                Income & Expenses Report
              </h3>
              <p className="text-xs font-semibold text-gray-500 mt-2 leading-relaxed">
                Financial P&L statements, tuition inflows, operational expenses & net margin
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#8A064D] group-hover:text-[#590231] pt-4 border-t border-[#F0D5E4]/60">
              <span>Open Report</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </button>
        </div>

        {/* All Available Reports Section */}
        <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
          <div className="px-6 md:px-8 py-5 bg-[#FFF9FB] border-b border-[#F0D5E4] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#590231]">All Available Reports</h2>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                Detailed breakdown and direct access to institutional records and audit statements
              </p>
            </div>
            <span className="text-xs font-black text-[#8A064D] bg-[#FFF2F8] px-3 py-1 rounded-xl border border-[#F0D5E4]">
              {allReportsList.length} Reports
            </span>
          </div>

          <div className="divide-y divide-[#F0D5E4]/60">
            {allReportsList.map((item) => (
              <div
                key={item.id}
                onClick={() => openReport(item.type, item.subView)}
                className="p-6 hover:bg-[#FFF9FB] transition flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start md:items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D] shrink-0 group-hover:scale-105 group-hover:bg-[#590231] group-hover:text-[#F9E33A] transition">
                    {item.icon}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
                    <div className="md:col-span-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#590231] group-hover:text-[#8A064D] transition">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]/60">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="md:col-span-8">
                      <p className="text-xs font-semibold text-gray-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <span className="text-xs font-black text-[#8A064D] group-hover:text-[#590231] transition">
                    View Report
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#8A064D] group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Subpage Top Header matching reference layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackFromSubpage}
            className="p-2.5 rounded-2xl bg-white border border-[#F0D5E4] text-[#590231] hover:bg-[#FFF2F8] hover:text-[#8A064D] transition cursor-pointer shadow-xs"
            title="Back to Reports Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#590231] tracking-tight">
                {getReportTitle()}
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#2563EB] tracking-wide mt-0.5">
              {getReportSubtitle()}
            </p>
          </div>
        </div>

        {/* 3 Permanent Top Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Report (F2) */}
          <button
            type="button"
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D041A] hover:bg-[#1E0211] text-white text-xs font-black shadow-md transition cursor-pointer active:scale-95"
            title="Collect and refresh report data (F2)"
          >
            <TrendingUp className="w-4 h-4 text-[#F9E33A]" />
            <span>View Report (F2)</span>
          </button>

          {/* Filter Columns (F3) */}
          <button
            type="button"
            onClick={() => setIsFilterColumnsOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#374151] hover:bg-[#1F2937] text-white text-xs font-black shadow-md transition cursor-pointer active:scale-95"
            title="Choose which columns appear in the report table (F3)"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-300" />
            <span>Filter Columns (F3)</span>
          </button>

          {/* Export Now (F4) */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#FFF2F8] border border-[#F0D5E4] text-[#590231] text-xs font-black shadow-xs transition cursor-pointer active:scale-95"
            title="Export filtered records in Excel, CSV, PDF, or Print (F4)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Now (F4)</span>
          </button>
        </div>
      </div>

      {/* Attendance Sub-view Switcher if viewing attendance report */}
      {activeType === 'attendance' && (
        <div className="flex items-center gap-2 bg-[#FFF2F8] p-1.5 rounded-2xl border border-[#F0D5E4] w-fit">
          <button
            type="button"
            onClick={() => {
              setAttendanceSubView('general');
              setAbsenceSelectedStudent(null);
              setAbsenceSelectedBatch(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              attendanceSubView === 'general'
                ? 'bg-[#590231] text-white shadow-xs'
                : 'text-gray-700 hover:text-[#8A064D]'
            }`}
          >
            General Report
          </button>
          <button
            type="button"
            onClick={() => {
              setAttendanceSubView('batch');
              setAbsenceSelectedStudent(null);
              setAbsenceSelectedBatch(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              attendanceSubView === 'batch'
                ? 'bg-[#590231] text-white shadow-xs'
                : 'text-gray-700 hover:text-[#8A064D]'
            }`}
          >
            Batch Attendance
          </button>
          <button
            type="button"
            onClick={() => {
              setAttendanceSubView('absence');
              setAbsenceSelectedStudent(null);
              setAbsenceSelectedBatch(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              attendanceSubView === 'absence'
                ? 'bg-[#590231] text-white shadow-xs'
                : 'text-gray-700 hover:text-[#8A064D]'
            }`}
          >
            Student Absence Audit
          </button>
        </div>
      )}

      {/* Stacked Horizontal Filters Section matching reference layout */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0D5E4] shadow-xs space-y-4">
        {/* Row 1: Date Range */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <label className="w-28 sm:w-32 text-sm font-bold text-gray-700 shrink-0">
            Date Range:
          </label>
          <div className="w-full sm:max-w-md">
            {activeType === 'attendance' && (attendanceSubView === 'absence' || attendanceSubView === 'batch') ? (
              <MonthYearRangeFilter
                startDate={startDate}
                endDate={endDate}
                align="left"
                onApply={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                className="w-full"
              />
            ) : (
              <DateRangeQuickFilter
                startDate={startDate}
                endDate={endDate}
                align="left"
                onApply={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                placeholder="Select Date Range"
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Row 2: Course (for Attendance General/Batch & Fees) */}
        {(activeType === 'fees' || (activeType === 'attendance' && attendanceSubView !== 'absence')) && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 sm:w-32 text-sm font-bold text-gray-700 shrink-0">
              Course:
            </label>
            <div className="w-full sm:max-w-md">
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
                placeholder="+ Select Course"
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Row 3: Batch (for Attendance General/Batch & Fees) */}
        {(activeType === 'fees' || (activeType === 'attendance' && attendanceSubView !== 'absence')) && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 sm:w-32 text-sm font-bold text-gray-700 shrink-0">
              Batch:
            </label>
            <div className="w-full sm:max-w-md">
              <BatchMultiSearchSelect
                batches={availableBatchOptions}
                selectedIds={selectedBatchIds}
                onChange={(ids) => setSelectedBatchIds(ids)}
                placeholder="+ Select Batch"
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Student Filter */}
        {activeType === 'attendance' && attendanceSubView === 'general' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 sm:w-32 text-sm font-bold text-gray-700 shrink-0">
              Student:
            </label>
            <div className="w-full sm:max-w-md">
              <StudentSearchSelect
                students={studentOptions}
                value={selectedStudentId === 'all' ? '' : selectedStudentId}
                onChange={(id) => setSelectedStudentId(id || 'all')}
                placeholder="+ Select Student"
                className="w-full"
              />
            </div>
          </div>
        )}

        {activeType === 'attendance' && attendanceSubView === 'absence' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 sm:w-32 text-sm font-bold text-gray-700 shrink-0">
              Student:
            </label>
            <div className="w-full sm:max-w-md">
              <StudentMultiSearchSelect
                students={studentOptions}
                selectedIds={absenceSelectedStudentIds}
                onChange={(ids) => setAbsenceSelectedStudentIds(ids)}
                placeholder="+ Select Student"
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Guru / Faculty Filter (Salaries) */}
        {activeType === 'salaries' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 sm:w-32 text-sm font-bold text-gray-700 shrink-0">
              Guru / Faculty:
            </label>
            <div className="w-full sm:max-w-md">
              <TrainerSearchSelect
                trainers={trainerOptions}
                value={selectedTrainerId === 'all' ? '' : selectedTrainerId}
                onChange={(id) => setSelectedTrainerId(id || 'all')}
                placeholder="+ Select Guru"
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Status Filter (Attendance General, Fees, Salaries) */}
        {(activeType === 'fees' || activeType === 'salaries') && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 sm:w-32 text-sm font-bold text-gray-700 shrink-0">
              Status:
            </label>
            <div className="w-full sm:max-w-md">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
              >
                <option value="all">All Statuses</option>
                {activeType === 'fees' ? (
                  <>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                  </>
                ) : (
                  <>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </>
                )}
              </select>
            </div>
          </div>
        )}

        {/* Sort Filter (Attendance Batch & Absence) */}
        {activeType === 'attendance' && (attendanceSubView === 'batch' || attendanceSubView === 'absence') && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 sm:w-32 text-sm font-bold text-gray-700 shrink-0">
              Sort By:
            </label>
            <div className="w-full sm:max-w-md">
              <select
                value={attendanceSubView === 'batch' ? batchAttendanceSort : absenceSort}
                onChange={(e) => {
                  const val = e.target.value as 'high_absence' | 'low_absence';
                  if (attendanceSubView === 'batch') {
                    setBatchAttendanceSort(val);
                  } else {
                    setAbsenceSort(val);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
              >
                <option value="high_absence">High Absence (Default)</option>
                <option value="low_absence">Low Absence</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Row: Clear Filters and Live Timestamp */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F0D5E4]/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Generated: {currentGeneratedAt ? new Date(currentGeneratedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#8A064D] text-xs font-bold cursor-pointer transition border border-rose-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
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
                        {isColVisible('session_date') && <th className="py-3 px-5">Session Date</th>}
                        {isColVisible('student_name') && <th className="py-3 px-5">Student</th>}
                        {isColVisible('roll_number') && <th className="py-3 px-5">Roll No</th>}
                        {isColVisible('course_title') && <th className="py-3 px-5">Course</th>}
                        {isColVisible('batch_name') && <th className="py-3 px-5">Batch</th>}
                        {isColVisible('status') && <th className="py-3 px-5 text-center">Audit Status</th>}
                        {isColVisible('remarks') && <th className="py-3 px-5">Remarks</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {attendanceData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          {isColVisible('session_date') && (
                            <td className="py-3.5 px-5 font-bold text-gray-700 whitespace-nowrap tabular-nums">
                              {r.session_date ? new Date(r.session_date).toLocaleDateString('en-GB') : '—'}
                            </td>
                          )}
                          {isColVisible('student_name') && (
                            <td className="py-3.5 px-5 font-bold text-gray-900">
                              {r.student_name}
                            </td>
                          )}
                          {isColVisible('roll_number') && (
                            <td className="py-3.5 px-5 font-semibold text-[#6E3955] tabular-nums">
                              {r.roll_number}
                            </td>
                          )}
                          {isColVisible('course_title') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-800">
                              {r.course_title}
                            </td>
                          )}
                          {isColVisible('batch_name') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-600">
                              {r.batch_name}
                            </td>
                          )}
                          {isColVisible('status') && (
                            <td className="py-3.5 px-5 text-center">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                                r.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {r.status.toUpperCase()}
                              </span>
                            </td>
                          )}
                          {isColVisible('remarks') && (
                            <td className="py-3.5 px-5 text-xs text-gray-500">
                              {r.remarks || '—'}
                            </td>
                          )}
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
                        {isColVisible('course_name') && <th className="py-3 px-5">Course Name</th>}
                        {isColVisible('batch_name') && <th className="py-3 px-5">Batch Name</th>}
                        {isColVisible('trainer_name') && <th className="py-3 px-5">Trainer Name</th>}
                        {isColVisible('trainer_contact') && <th className="py-3 px-5">Trainer Contact Number</th>}
                        {isColVisible('total_registered_students') && <th className="py-3 px-5 text-center">Total Registered Students</th>}
                        {isColVisible('total_classes_held') && <th className="py-3 px-5 text-center">Total Classes Held</th>}
                        {isColVisible('total_absences') && <th className="py-3 px-5 text-center">Total Absences</th>}
                        {isColVisible('absence_percentage') && <th className="py-3 px-5 text-center">Absence Percentage (%)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {batchAttendanceData.records.map((r) => (
                        <tr key={r.batch_id} className="hover:bg-[#FFF9FB] transition">
                          {isColVisible('course_name') && (
                            <td className="py-3.5 px-5 font-bold text-gray-900">
                              {r.course_name}
                            </td>
                          )}
                          {isColVisible('batch_name') && (
                            <td className="py-3.5 px-5 font-bold text-[#8A064D]">
                              {r.batch_name}
                            </td>
                          )}
                          {isColVisible('trainer_name') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-800">
                              {r.trainer_name}
                            </td>
                          )}
                          {isColVisible('trainer_contact') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-700 tabular-nums">
                              {r.trainer_contact}
                            </td>
                          )}
                          {isColVisible('total_registered_students') && (
                            <td className="py-3.5 px-5 text-center font-bold text-gray-900 tabular-nums">
                              {r.total_registered_students}
                            </td>
                          )}
                          {isColVisible('total_classes_held') && (
                            <td className="py-3.5 px-5 text-center">
                              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-black text-xs tabular-nums inline-block">
                                {r.total_classes_held}
                              </span>
                            </td>
                          )}
                          {isColVisible('total_absences') && (
                            <td className="py-3.5 px-5 text-center">
                              <span className={`px-3 py-1 rounded-xl text-xs font-black tabular-nums inline-block ${
                                r.total_absences > 0
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {r.total_absences}
                              </span>
                            </td>
                          )}
                          {isColVisible('absence_percentage') && (
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
                          )}
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
                        {isColVisible('invoice_number') && <th className="py-3 px-5">Invoice #</th>}
                        {isColVisible('student_name') && <th className="py-3 px-5">Student</th>}
                        {isColVisible('course_title') && <th className="py-3 px-5">Course</th>}
                        {isColVisible('fee_period') && <th className="py-3 px-5">Fee Period</th>}
                        {isColVisible('due_date') && <th className="py-3 px-5">Due Date</th>}
                        {isColVisible('total_amount') && <th className="py-3 px-5 text-right">Billed</th>}
                        {isColVisible('discount_amount') && <th className="py-3 px-5 text-right">Disc</th>}
                        {isColVisible('paid_amount') && <th className="py-3 px-5 text-right">Paid</th>}
                        {isColVisible('balance_amount') && <th className="py-3 px-5 text-right">Balance</th>}
                        {isColVisible('status') && <th className="py-3 px-5 text-center">Status</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {feesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          {isColVisible('invoice_number') && (
                            <td className="py-3.5 px-5 font-bold text-gray-900 whitespace-nowrap tabular-nums">
                              {r.invoice_number}
                            </td>
                          )}
                          {isColVisible('student_name') && (
                            <td className="py-3.5 px-5 font-bold text-gray-900">
                              {r.student_name}
                            </td>
                          )}
                          {isColVisible('course_title') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-700">
                              {r.course_title}
                            </td>
                          )}
                          {isColVisible('fee_period') && (
                            <td className="py-3.5 px-5 font-semibold text-[#6E3955]">
                              {r.fee_period}
                            </td>
                          )}
                          {isColVisible('due_date') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-600 whitespace-nowrap tabular-nums">
                              {r.due_date || '—'}
                            </td>
                          )}
                          {isColVisible('total_amount') && (
                            <td className="py-3.5 px-5 text-right font-semibold text-gray-700 tabular-nums">
                              ₹{Number(r.total_amount).toLocaleString('en-IN')}
                            </td>
                          )}
                          {isColVisible('discount_amount') && (
                            <td className="py-3.5 px-5 text-right font-bold text-rose-600 tabular-nums">
                              {Number(r.discount_amount) > 0 ? `₹${Number(r.discount_amount).toLocaleString('en-IN')}` : '—'}
                            </td>
                          )}
                          {isColVisible('paid_amount') && (
                            <td className="py-3.5 px-5 text-right font-black text-emerald-700 tabular-nums">
                              ₹{Number(r.paid_amount).toLocaleString('en-IN')}
                            </td>
                          )}
                          {isColVisible('balance_amount') && (
                            <td className="py-3.5 px-5 text-right font-black text-amber-700 tabular-nums">
                              ₹{Number(r.balance_amount).toLocaleString('en-IN')}
                            </td>
                          )}
                          {isColVisible('status') && (
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
                          )}
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
                        {isColVisible('invoice_number') && <th className="py-3 px-5">Invoice #</th>}
                        {isColVisible('invoice_date') && <th className="py-3 px-5">Invoice Date</th>}
                        {isColVisible('trainer_name') && <th className="py-3 px-5">Guru Name</th>}
                        {isColVisible('display_title') && <th className="py-3 px-5">Title</th>}
                        {isColVisible('payroll_month') && <th className="py-3 px-5">Month</th>}
                        {isColVisible('classes_conducted') && <th className="py-3 px-5 text-center">Classes</th>}
                        {isColVisible('base_salary') && <th className="py-3 px-5 text-right">Base</th>}
                        {isColVisible('bonus_amount') && <th className="py-3 px-5 text-right">Bonus</th>}
                        {isColVisible('deductions') && <th className="py-3 px-5 text-right">Deductions</th>}
                        {isColVisible('net_salary') && <th className="py-3 px-5 text-right">Net Payable</th>}
                        {isColVisible('status') && <th className="py-3 px-5 text-center">Status</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {salariesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          {isColVisible('invoice_number') && (
                            <td className="py-3.5 px-5 font-bold text-gray-900 whitespace-nowrap tabular-nums">
                              {r.invoice_number || '—'}
                            </td>
                          )}
                          {isColVisible('invoice_date') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-600 whitespace-nowrap tabular-nums">
                              {r.invoice_date || '—'}
                            </td>
                          )}
                          {isColVisible('trainer_name') && (
                            <td className="py-3.5 px-5 font-bold text-gray-900">
                              {r.trainer_name}
                            </td>
                          )}
                          {isColVisible('display_title') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-600">
                              {r.display_title}
                            </td>
                          )}
                          {isColVisible('payroll_month') && (
                            <td className="py-3.5 px-5 font-bold text-[#8A064D] tabular-nums">
                              {r.payroll_month}
                            </td>
                          )}
                          {isColVisible('classes_conducted') && (
                            <td className="py-3.5 px-5 text-center font-bold text-gray-700 tabular-nums">
                              {r.classes_conducted}
                            </td>
                          )}
                          {isColVisible('base_salary') && (
                            <td className="py-3.5 px-5 text-right font-semibold text-gray-700 tabular-nums">
                              ₹{Number(r.base_salary).toLocaleString('en-IN')}
                            </td>
                          )}
                          {isColVisible('bonus_amount') && (
                            <td className="py-3.5 px-5 text-right font-semibold text-[#854D0E] tabular-nums">
                              +₹{Number(r.bonus_amount).toLocaleString('en-IN')}
                            </td>
                          )}
                          {isColVisible('deductions') && (
                            <td className="py-3.5 px-5 text-right font-semibold text-red-600 tabular-nums">
                              -₹{(Number(r.deduction_amount) + Number(r.advance_deducted)).toLocaleString('en-IN')}
                            </td>
                          )}
                          {isColVisible('net_salary') && (
                            <td className="py-3.5 px-5 text-right font-black text-base text-[#590231] tabular-nums">
                              ₹{Number(r.net_salary).toLocaleString('en-IN')}
                            </td>
                          )}
                          {isColVisible('status') && (
                            <td className="py-3.5 px-5 text-center">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                                r.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {r.status.toUpperCase()}
                              </span>
                            </td>
                          )}
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
                        {isColVisible('date') && <th className="py-3 px-5">Date</th>}
                        {isColVisible('type') && <th className="py-3 px-5">Flow Type</th>}
                        {isColVisible('category') && <th className="py-3 px-5">Category</th>}
                        {isColVisible('description') && <th className="py-3 px-5">Description</th>}
                        {isColVisible('payment_method') && <th className="py-3 px-5">Method</th>}
                        {isColVisible('amount') && <th className="py-3 px-5 text-right">Amount</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5E4]/60">
                      {incomeExpensesData.records.map((r, i) => (
                        <tr key={i} className="hover:bg-[#FFF9FB] transition">
                          {isColVisible('date') && (
                            <td className="py-3.5 px-5 font-bold text-gray-700 whitespace-nowrap tabular-nums">
                              {r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'}
                            </td>
                          )}
                          {isColVisible('type') && (
                            <td className="py-3.5 px-5">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                                r.type === 'Income' ? 'bg-emerald-100 text-emerald-800' :
                                r.type === 'Salary Expense' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {r.type}
                              </span>
                            </td>
                          )}
                          {isColVisible('category') && (
                            <td className="py-3.5 px-5 font-bold text-gray-800">
                              {r.category}
                            </td>
                          )}
                          {isColVisible('description') && (
                            <td className="py-3.5 px-5 font-semibold text-gray-600 max-w-xs truncate">
                              {r.description}
                            </td>
                          )}
                          {isColVisible('payment_method') && (
                            <td className="py-3.5 px-5 text-xs text-gray-500">
                              {r.payment_method}
                            </td>
                          )}
                          {isColVisible('amount') && (
                            <td className={`py-3.5 px-5 text-right font-black tabular-nums ${
                              r.type === 'Income' ? 'text-emerald-700' : 'text-[#8A064D]'
                            }`}>
                              {r.type === 'Income' ? '+' : '-'}₹{Number(r.amount).toLocaleString('en-IN')}
                            </td>
                          )}
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

      {/* ========================================================= */}
      {/* FILTER COLUMNS MODAL (F3) */}
      {/* ========================================================= */}
      {isFilterColumnsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#F0D5E4] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 bg-[#FFF2F8] border-b border-[#F0D5E4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#590231] text-white flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-[#F9E33A]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#590231]">Filter Table Columns</h3>
                  <p className="text-xs font-bold text-[#8A064D]">Choose which columns appear in the active report</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterColumnsOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs font-bold">
                <span className="text-gray-500">Visible in report table</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllCurrentColumns}
                    className="text-[#8A064D] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={resetDefaultColumns}
                    className="text-gray-600 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {getCurrentColumns().map(col => {
                  const isVisible = visibleColumns[col.key] !== false;
                  return (
                    <label
                      key={col.key}
                      className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:border-[#F0D5E4] hover:bg-[#FFF9FB] transition cursor-pointer"
                    >
                      <span className="text-sm font-bold text-gray-800">{col.label}</span>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumn(col.key)}
                        className="w-5 h-5 rounded-lg text-[#8A064D] focus:ring-[#8A064D] accent-[#8A064D] cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFilterColumnsOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#590231] text-white text-xs font-black shadow-md hover:bg-[#430124] transition cursor-pointer"
              >
                Apply Columns (F3)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EXPORT OPTIONS MODAL (F4) */}
      {/* ========================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#F0D5E4] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 bg-[#FFF2F8] border-b border-[#F0D5E4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#590231] text-white flex items-center justify-center">
                  <Download className="w-5 h-5 text-[#F9E33A]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#590231]">Export Report Data</h3>
                  <p className="text-xs font-bold text-[#8A064D]">{currentRecordCount} records available for export</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {/* Excel */}
              <button
                type="button"
                onClick={() => {
                  exportExcel();
                  setIsExportModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#F0D5E4] hover:bg-[#FFF9FB] hover:border-[#8A064D] transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900 group-hover:text-[#8A064D]">Excel Spreadsheet (.xls)</div>
                    <div className="text-xs font-semibold text-gray-500">Formatted workbook with headers & totals</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#8A064D] transition" />
              </button>

              {/* CSV */}
              <button
                type="button"
                onClick={() => {
                  exportCSV();
                  setIsExportModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#F0D5E4] hover:bg-[#FFF9FB] hover:border-[#8A064D] transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:scale-105 transition">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900 group-hover:text-[#8A064D]">CSV File (.csv)</div>
                    <div className="text-xs font-semibold text-gray-500">Universal comma-separated tabular data</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#8A064D] transition" />
              </button>

              {/* PDF */}
              <button
                type="button"
                onClick={() => {
                  exportPDF();
                  setIsExportModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#F0D5E4] hover:bg-[#FFF9FB] hover:border-[#8A064D] transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#8A064D] group-hover:scale-105 transition">
                    <FileDown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900 group-hover:text-[#8A064D]">Official PDF Document (.pdf)</div>
                    <div className="text-xs font-semibold text-gray-500">Printable document with institutional branding</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#8A064D] transition" />
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  window.print();
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#F0D5E4] hover:bg-[#FFF9FB] hover:border-[#8A064D] transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 group-hover:scale-105 transition">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900 group-hover:text-[#8A064D]">Print View / Save as PDF</div>
                    <div className="text-xs font-semibold text-gray-500">Browser native print dialog</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#8A064D] transition" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Course, Batch, AttendanceAuditRecord, Student, GuruAttendanceAuditRecord, Trainer } from '@/lib/academy';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';
import StudentSearchSelect, { StudentOption } from '@/components/common/StudentSearchSelect';
import CourseMultiSearchSelect, { CourseOption } from '@/components/common/CourseMultiSearchSelect';
import BatchMultiSearchSelect, { BatchOption } from '@/components/common/BatchMultiSearchSelect';
import GuruAttendanceTab from './GuruAttendanceTab';
import { 
  ClipboardCheck, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon,
  Check, 
  User, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Sparkles, 
  Filter, 
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  MapPin,
  ChevronRight,
  Award,
  Eye,
  CheckCircle
} from 'lucide-react';

interface Props {
  initialAuditRecords: AttendanceAuditRecord[];
  initialGuruAuditRecords?: GuruAttendanceAuditRecord[];
  courses: Course[];
  batches: Batch[];
  students?: Student[];
  trainers?: Trainer[];
}

const COURSE_GURUS_MAP: Record<string, string> = {
  'Bharathanatyam': 'Smt. Anusha Sumesh (Founder & Guru)',
  'Kuchupudi': 'Guru Pramod T. Peethambaran',
  'Mohiniyatam': 'Guru Sruthy Ramesh',
  'Semi Classical': 'Guru Nandhana (Nandana Krishna)',
  'Western Dance': 'Guru Karthik R (Dhee / DKD)',
  'Zumba': 'Guru Ranjith Kumar S J',
  'Gymnastic': 'Guru Ranjith Kumar S J',
  'Carnatic Music': 'Shri H. Manikandan (Sangeetha Acharya)',
  'Violin': 'Guru Amos P Ovung (Director)',
  'Keyboard': 'Guru Shahil Patro (Trinity / RSL)',
  'Guitar': 'Guru Amos P Ovung (Director)',
  'Ukulele': 'Guru Shahil Patro',
  'Drawing': 'Guru Dipayan Sarkar (MFA Santiniketan)',
  'Art and Craft': 'Guru Dipayan Sarkar',
  'Kalari': 'Guru Vrushabh Prakash Owhal',
  'Karatte': 'Sensei Vijay Kumar Olekar (2nd Dan)',
  'Yoga': 'Acharya Sathish Kale (Yoga Acharya)',
  'Chess': 'Coach Sai Krishna (State Medalist)',
};

export default function AttendanceListClient({ 
  initialAuditRecords, 
  initialGuruAuditRecords = [], 
  courses, 
  batches, 
  students = [], 
  trainers = [] 
}: Props) {
  // -------------------------------------------------------------
  // TOP NAVIGATION TABS: Tab 1 = Course-Wise, Tab 2 = Complete, Tab 3 = Guru Attendance
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'course_wise' | 'complete' | 'guru_attendance'>('course_wise');

  // Base Records from database with Live Realtime Sync
  const [allRecords, setAllRecords] = useState<AttendanceAuditRecord[]>(initialAuditRecords);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);

  const fetchLatestAuditRecords = useCallback(async () => {
    try {
      setIsLiveSyncing(true);
      const res = await fetch('/api/attendance');
      if (res.ok) {
        const fresh = await res.json();
        if (Array.isArray(fresh)) {
          setAllRecords(fresh);
        }
      }
    } catch (err) {
      console.warn('Realtime sync notice:', err);
    } finally {
      setIsLiveSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Sync every 4 seconds so Admin dashboard immediately reflects roll-calls marked by Gurus
    const timer = setInterval(fetchLatestAuditRecords, 4000);
    return () => clearInterval(timer);
  }, [fetchLatestAuditRecords]);

  // -------------------------------------------------------------
  // TAB 3: GURU ATTENDANCE STATE & SYNC
  // -------------------------------------------------------------
  const [guruRecords, setGuruRecords] = useState<GuruAttendanceAuditRecord[]>(initialGuruAuditRecords);
  const [isGuruSyncing, setIsGuruSyncing] = useState<boolean>(false);

  const fetchLatestGuruAuditRecords = useCallback(async () => {
    try {
      setIsGuruSyncing(true);
      const res = await fetch('/api/attendance?guruAudit=true');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.records)) {
          setGuruRecords(json.records);
        }
      }
    } catch (err) {
      console.warn('Guru attendance sync notice:', err);
    } finally {
      setIsGuruSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'guru_attendance') {
      fetchLatestGuruAuditRecords();
      const guruTimer = setInterval(fetchLatestGuruAuditRecords, 5000);
      return () => clearInterval(guruTimer);
    }
  }, [activeTab, fetchLatestGuruAuditRecords]);

  // -------------------------------------------------------------
  // TAB 1: COURSE-WISE DRILL-DOWN STATE
  // -------------------------------------------------------------
  // TAB 1: COURSE-WISE DRILL-DOWN STATE
  // -------------------------------------------------------------
  // selectedCourseId: null means grid of courses is displayed
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Multi-selection state for courses and batches
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  // Active courses: either from multi-select or single selected course
  const activeCourseIds = useMemo(() => {
    if (selectedCourseIds.length > 0) return selectedCourseIds;
    return selectedCourseId ? [selectedCourseId] : [];
  }, [selectedCourseIds, selectedCourseId]);

  // Searchable course options for dropdown
  const courseSelectOptions: CourseOption[] = useMemo(() => {
    return courses.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category
    }));
  }, [courses]);

  // Searchable batch options for dropdown (filtered by active courses if any)
  const batchSelectOptions: BatchOption[] = useMemo(() => {
    const list = activeCourseIds.length > 0
      ? batches.filter(b => activeCourseIds.includes(b.course_id))
      : batches;
    return list.map(b => {
      const parentCourse = courses.find(c => c.id === b.course_id);
      return {
        id: b.id,
        name: b.name,
        course_id: b.course_id,
        course_title: parentCourse?.title || ''
      };
    });
  }, [batches, courses, activeCourseIds]);

  // Course Grid Filters
  const [gridSearchQuery, setGridSearchQuery] = useState('');
  const [gridSelectedCategory, setGridSelectedCategory] = useState('All');

  // Dates dynamically default to current month / today
  const now = new Date();
  const TODAY_STR = now.toISOString().split('T')[0];
  const FIRST_DAY_OF_MONTH = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  // Batch Attendance Sheet Filters
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [batchStartDate, setBatchStartDate] = useState<string>(FIRST_DAY_OF_MONTH);
  const [batchEndDate, setBatchEndDate] = useState<string>(TODAY_STR);
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('All');
  const [batchPreset, setBatchPreset] = useState<string>('This Month');

  // -------------------------------------------------------------
  // TAB 2: COMPLETE ATTENDANCE STATE (Default to today)
  // -------------------------------------------------------------
  const [completeStartDate, setCompleteStartDate] = useState<string>(TODAY_STR);
  const [completeEndDate, setCompleteEndDate] = useState<string>(TODAY_STR);
  const [completeSearchQuery, setCompleteSearchQuery] = useState<string>('');
  const [completeStatusFilter, setCompleteStatusFilter] = useState<string>('All');
  const [completeStudentId, setCompleteStudentId] = useState<string>('');
  const [completePreset, setCompletePreset] = useState<string>('Today');

  // Searchable student options for Tab 2
  const studentOptions: StudentOption[] = useMemo(() => {
    if (students && students.length > 0) {
      return students.map(s => ({
        id: s.id,
        full_name: s.full_name,
        roll_number: s.roll_number
      })).sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    const map = new Map<string, StudentOption>();
    for (const r of allRecords) {
      if (r.student_id && !map.has(r.student_id)) {
        map.set(r.student_id, {
          id: r.student_id,
          full_name: r.student_name,
          roll_number: r.roll_number
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [students, allRecords]);

  // Dynamic Categories for Course Grid
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  }, [courses]);

  // Filtered Courses for Grid
  const filteredGridCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesCat = gridSelectedCategory === 'All' || c.category === gridSelectedCategory;
      const q = gridSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        c.title.toLowerCase().includes(q) || 
        c.code.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [courses, gridSelectedCategory, gridSearchQuery]);

  // Current selected course object
  const currentCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Available batches for current selected course(s)
  const currentCourseBatches = useMemo(() => {
    if (activeCourseIds.length === 0) return [];
    return batches.filter(b => activeCourseIds.includes(b.course_id));
  }, [batches, activeCourseIds]);

  // Current selected batch object
  const currentBatch = useMemo(() => {
    if (!selectedBatchId) return currentCourseBatches[0] || null;
    return currentCourseBatches.find(b => b.id === selectedBatchId) || currentCourseBatches[0] || null;
  }, [currentCourseBatches, selectedBatchId]);

  // Handler when clicking a course in Grid View
  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseIds([courseId]);
    // Find batches for this course and select the first batch automatically
    const courseBatches = batches.filter(b => b.course_id === courseId);
    if (courseBatches.length > 0) {
      setSelectedBatchId(courseBatches[0].id);
      setSelectedBatchIds([courseBatches[0].id]);
    } else {
      setSelectedBatchId(null);
      setSelectedBatchIds([]);
    }
    // Reset filters
    setBatchSearchQuery('');
    setBatchStartDate('2026-09-01');
    setBatchEndDate('2026-09-30');
    setBatchStatusFilter('All');
    setBatchPreset('Last 30 Days');
  };

  // Multi-select Course change handler
  const handleCourseMultiChange = (newIds: string[]) => {
    if (newIds.length === 0) {
      setSelectedCourseId(null);
      setSelectedCourseIds([]);
      setSelectedBatchId(null);
      setSelectedBatchIds([]);
      return;
    }
    setSelectedCourseIds(newIds);
    if (!newIds.includes(selectedCourseId || '')) {
      setSelectedCourseId(newIds[0]);
    }
    const validBatches = batches.filter(b => newIds.includes(b.course_id));
    const newBatchIds = selectedBatchIds.filter(id => validBatches.some(b => b.id === id));
    if (newBatchIds.length === 0 && validBatches.length > 0) {
      setSelectedBatchIds([validBatches[0].id]);
      setSelectedBatchId(validBatches[0].id);
    } else {
      setSelectedBatchIds(newBatchIds);
      if (newBatchIds.length > 0) setSelectedBatchId(newBatchIds[0]);
    }
  };

  // Multi-select Batch change handler
  const handleBatchMultiChange = (newBatchIds: string[]) => {
    setSelectedBatchIds(newBatchIds);
    if (newBatchIds.length > 0) {
      setSelectedBatchId(newBatchIds[0]);
    } else {
      setSelectedBatchId(null);
    }
  };

  // Return to all courses grid
  const handleBackToCourses = () => {
    setSelectedCourseId(null);
    setSelectedCourseIds([]);
    setSelectedBatchId(null);
    setSelectedBatchIds([]);
  };

  // Quick preset helper
  const applyPreset = (preset: string, mode: 'batch' | 'complete') => {
    let start = '';
    let end = TODAY_STR;

    if (preset === 'Today') {
      start = TODAY_STR;
      end = TODAY_STR;
    } else if (preset === 'Yesterday') {
      start = '2026-09-29';
      end = '2026-09-29';
    } else if (preset === 'Last 7 Days') {
      start = '2026-09-23';
      end = TODAY_STR;
    } else if (preset === 'Last 30 Days') {
      start = '2026-09-01';
      end = TODAY_STR;
    } else if (preset === 'All Time') {
      start = '';
      end = '';
    }

    if (mode === 'batch') {
      setBatchPreset(preset);
      setBatchStartDate(start);
      setBatchEndDate(end);
    } else {
      setCompletePreset(preset);
      setCompleteStartDate(start);
      setCompleteEndDate(end);
    }
  };

  // -------------------------------------------------------------
  // TAB 1 BATCH FILTERED ATTENDANCE RECORDS
  // -------------------------------------------------------------
  const filteredBatchRecords = useMemo(() => {
    if (activeCourseIds.length === 0 && !selectedCourseId) return [];

    return allRecords.filter((r) => {
      // Match course
      if (activeCourseIds.length > 0 && !activeCourseIds.includes(r.course_id)) {
        return false;
      }

      // Match batch
      if (selectedBatchIds.length > 0) {
        const matchesBatchId = selectedBatchIds.includes(r.batch_id);
        const matchesBatchName = currentBatch 
          ? (r.batch_name.toLowerCase() === currentBatch.name.toLowerCase() && activeCourseIds.includes(r.course_id))
          : false;
        if (!matchesBatchId && !matchesBatchName) return false;
      } else if (currentBatch) {
        const matchesBatch = (r.batch_id === currentBatch.id || 
           (r.batch_name.toLowerCase() === currentBatch.name.toLowerCase() && activeCourseIds.includes(r.course_id)));
        if (!matchesBatch) return false;
      }

      // Date range filter
      if (batchStartDate && r.session_date < batchStartDate) return false;
      if (batchEndDate && r.session_date > batchEndDate) return false;

      // Status filter
      if (batchStatusFilter !== 'All' && r.status !== batchStatusFilter) return false;

      // Search student
      if (batchSearchQuery.trim()) {
        const q = batchSearchQuery.toLowerCase();
        const matchesName = r.student_name.toLowerCase().includes(q);
        const matchesRoll = r.roll_number.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll) return false;
      }

      return true;
    });
  }, [allRecords, currentBatch, activeCourseIds, selectedBatchIds, selectedCourseId, batchStartDate, batchEndDate, batchStatusFilter, batchSearchQuery]);

  // -------------------------------------------------------------
  // TAB 2 FILTERED RECORDS
  // -------------------------------------------------------------
  const filteredCompleteRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // Filter by Student
      if (completeStudentId && r.student_id !== completeStudentId) return false;
      // Filter by Date Range
      if (completeStartDate && r.session_date < completeStartDate) return false;
      if (completeEndDate && r.session_date > completeEndDate) return false;
      // Filter by Attendance Status
      if (completeStatusFilter !== 'All' && r.status !== completeStatusFilter) return false;
      // Free Text Search
      if (completeSearchQuery.trim()) {
        const q = completeSearchQuery.toLowerCase();
        const matchesName = r.student_name.toLowerCase().includes(q);
        const matchesRoll = r.roll_number.toLowerCase().includes(q);
        const matchesCourse = r.course_title.toLowerCase().includes(q);
        const matchesBatch = r.batch_name.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesCourse && !matchesBatch) return false;
      }
      return true;
    });
  }, [allRecords, completeStudentId, completeStartDate, completeEndDate, completeStatusFilter, completeSearchQuery]);

  // Stats calculation
  const getStats = (records: AttendanceAuditRecord[]) => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, rate };
  };

  const batchStats = useMemo(() => getStats(filteredBatchRecords), [filteredBatchRecords]);
  const completeStats = useMemo(() => getStats(filteredCompleteRecords), [filteredCompleteRecords]);

  // CSV Exporter
  const handleExportCSV = (records: AttendanceAuditRecord[], filenamePrefix: string) => {
    const headers = [
      'Student Name',
      'Roll Number',
      'Course Title',
      'Course Code',
      'Batch Name',
      'Guru / Faculty',
      'Attendance Date',
      'Status',
      'Check-in Method',
      'Remarks'
    ];

    const rows = records.map(r => [
      `"${r.student_name.replace(/"/g, '""')}"`,
      `"${r.roll_number}"`,
      `"${r.course_title.replace(/"/g, '""')}"`,
      `"${r.course_code}"`,
      `"${r.batch_name.replace(/"/g, '""')}"`,
      `"${r.trainer_name.replace(/"/g, '""')}"`,
      `"${r.session_date}"`,
      `"${r.status.toUpperCase()}"`,
      `"${r.check_in_method || 'N/A'}"`,
      `"${r.remarks || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* =================================================================== */}
      {/* 1. PAGE HEADER */}
      {/* =================================================================== */}
      <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#590231] text-[#F9E33A] shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-[#2D041A]">Attendance Audit</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Audit verified attendance logs, check-in methods, and presence across all academy courses and batches.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab !== 'guru_attendance' ? (
            <button
              onClick={() => handleExportCSV(
                activeTab === 'course_wise' ? filteredBatchRecords : filteredCompleteRecords,
                activeTab === 'course_wise' 
                  ? `batch_audit_${currentBatch?.name || currentCourse?.title || 'records'}`
                  : 'academy_complete_audit'
              )}
              className="bg-[#590231] hover:bg-[#780442] text-white border border-[#EBB128] px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#F9E33A]" />
              <span>Download CSV Audit</span>
            </button>
          ) : (
            <button
              onClick={fetchLatestGuruAuditRecords}
              disabled={isGuruSyncing}
              className="bg-[#590231] hover:bg-[#780442] text-white border border-[#EBB128] px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 text-[#F9E33A] ${isGuruSyncing ? 'animate-spin' : ''}`} />
              <span>{isGuruSyncing ? 'Refreshing...' : 'Live Sync'}</span>
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. TOP TABS SWITCHER: EQUAL SIZED 3 COLUMNS */}
      {/* =================================================================== */}
      <div className="bg-white p-2 rounded-2xl border border-[#F0D5E4] shadow-xs grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <button
          onClick={() => setActiveTab('course_wise')}
          className={`w-full min-h-[58px] py-2.5 px-3 rounded-xl transition flex flex-col items-center justify-center text-center cursor-pointer ${
            activeTab === 'course_wise'
              ? 'bg-[#8A064D] text-white shadow-md'
              : 'text-gray-600 hover:text-[#8A064D] hover:bg-[#FFF2F8]/60 border border-transparent hover:border-pink-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Course-Wise</span>
          </div>
          <span className={`text-[11px] font-medium mt-0.5 ${
            activeTab === 'course_wise' ? 'text-pink-100' : 'text-gray-500'
          }`}>
            [Students attendance course-wise]
          </span>
        </button>

        <button
          onClick={() => setActiveTab('complete')}
          className={`w-full min-h-[58px] py-2.5 px-3 rounded-xl transition flex flex-col items-center justify-center text-center cursor-pointer ${
            activeTab === 'complete'
              ? 'bg-[#8A064D] text-white shadow-md'
              : 'text-gray-600 hover:text-[#8A064D] hover:bg-[#FFF2F8]/60 border border-transparent hover:border-pink-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <Layers className="w-4 h-4 shrink-0" />
            <span>Complete Audit</span>
          </div>
          <span className={`text-[11px] font-medium mt-0.5 ${
            activeTab === 'complete' ? 'text-pink-100' : 'text-gray-500'
          }`}>
            [For all students only]
          </span>
        </button>

        <button
          onClick={() => setActiveTab('guru_attendance')}
          className={`w-full min-h-[58px] py-2.5 px-3 rounded-xl transition flex flex-col items-center justify-center text-center cursor-pointer ${
            activeTab === 'guru_attendance'
              ? 'bg-[#8A064D] text-white shadow-md'
              : 'text-gray-600 hover:text-[#8A064D] hover:bg-[#FFF2F8]/60 border border-transparent hover:border-pink-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>Guru Attendance</span>
          </div>
          <span className={`text-[11px] font-medium mt-0.5 ${
            activeTab === 'guru_attendance' ? 'text-pink-100' : 'text-gray-500'
          }`}>
            [Only for gurus]
          </span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: TAB 1 — COURSE-WISE ATTENDANCE */}
      {/* =================================================================== */}
      {activeTab === 'course_wise' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* LEVEL 1: COURSE GRID VIEW (Shown when no course is selected) */}
          {!selectedCourseId ? (
            <div className="space-y-5">
              
              {/* Grid Header & Filters */}
              <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#2D041A] flex items-center gap-2.5">
                    <span>Academy Courses</span>
                    <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-rose-100 px-3 py-1 rounded-full font-bold">
                      {courses.length} Disciplines
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Click any course card below to view its available batches, timings, and live student attendance sheets.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={gridSearchQuery}
                      onChange={(e) => setGridSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm w-64 focus:ring-2 focus:ring-[#8A064D] focus:bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGridSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      gridSelectedCategory === cat
                        ? 'bg-[#8A064D] text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-[#F0D5E4] hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredGridCourses.map((crs) => {
                  const courseBatchesCount = batches.filter(b => b.course_id === crs.id).length;
                  const guruName = COURSE_GURUS_MAP[crs.title] || 'Senior Faculty Guru';

                  return (
                    <div
                      key={crs.id}
                      onClick={() => handleSelectCourse(crs.id)}
                      className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs hover:shadow-md hover:border-[#8A064D] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-xs font-mono font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-3 py-1 rounded-xl shadow-2xs">
                            {crs.code}
                          </span>
                          <span className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full">
                            {crs.category}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-[#2D041A] group-hover:text-[#8A064D] transition">
                          {crs.title}
                        </h3>

                        {/* Guru Name */}
                        <div className="mt-2.5 py-2 px-3.5 rounded-xl bg-[#FFF9FB] border border-rose-100 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-[#8A064D]">Assigned Guru</span>
                          <span className="text-sm font-bold text-gray-800 truncate ml-2">
                            {guruName}
                          </span>
                        </div>

                        {/* Monthly Fee */}
                        <div className="mt-3.5 flex items-center justify-between text-xs text-gray-600">
                          <span>Monthly Tuition: <strong className="text-[#8A064D] text-sm tabular-nums font-black">₹{Number(crs.monthly_fee).toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {courseBatchesCount} Batch{courseBatchesCount !== 1 ? 'es' : ''} Available
                        </span>

                        <span className="text-sm font-bold text-[#8A064D] group-hover:text-[#590231] flex items-center gap-1.5">
                          <span>View Batches & Attendance</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* LEVEL 2 & 3: COURSE SELECTED -> AVAILABLE BATCHES ON TOP + BATCH ATTENDANCE SHEET */
            <div className="space-y-4">
              
              {/* Course Top Navigation & Multi-Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToCourses}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-[#8A064D] hover:text-white rounded-xl text-gray-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
                    title="Return to Course Grid"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Courses</span>
                  </button>

                  <div className="h-6 w-px bg-gray-200 hidden sm:block" />

                  <div>
                    <div className="flex items-center gap-2">
                      {activeCourseIds.length <= 1 && currentCourse?.code && (
                        <span className="text-[10px] font-mono font-bold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-md">
                          {currentCourse.code}
                        </span>
                      )}
                      <h2 className="text-base font-bold text-[#2D041A]">
                        {activeCourseIds.length > 1 
                          ? `${activeCourseIds.length} Courses Selected`
                          : (currentCourse?.title || 'Selected Course')}
                      </h2>
                      {activeCourseIds.length <= 1 && currentCourse?.category && (
                        <span className="text-xs text-gray-500 font-medium hidden sm:inline-block">
                          ({currentCourse.category})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multi-Selection Searchable Course & Batch Filters (replaces single switch course dropdown) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="w-full sm:w-64">
                    <CourseMultiSearchSelect
                      courses={courseSelectOptions}
                      selectedIds={activeCourseIds}
                      onChange={handleCourseMultiChange}
                      placeholder="Filter / Select Courses"
                    />
                  </div>
                  <div className="w-full sm:w-64">
                    <BatchMultiSearchSelect
                      batches={batchSelectOptions}
                      selectedIds={selectedBatchIds}
                      onChange={handleBatchMultiChange}
                      placeholder="Filter / Select Batches"
                    />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* AVAILABLE BATCHES OF THAT COURSE DISPLAYED ON TOP */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>
                      Available Batches ({currentCourseBatches.length})
                    </span>
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Click any batch card to toggle or view its live attendance sheet
                  </span>
                </div>

                {currentCourseBatches.length === 0 ? (
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 text-center text-gray-500 text-xs">
                    No batches currently assigned to the selected course(s).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentCourseBatches.map((b) => {
                      const isSelected = selectedBatchIds.length > 0
                        ? selectedBatchIds.includes(b.id)
                        : (currentBatch?.id === b.id);
                      const parentCourse = courses.find(c => c.id === b.course_id);
                      const guruDisplay = b.trainer_name || (parentCourse ? COURSE_GURUS_MAP[parentCourse.title] : 'Faculty Guru');
                      const timings = `${b.start_time?.substring(0, 5)} - ${b.end_time?.substring(0, 5)}`;
                      const daysText = (b.days_of_week && b.days_of_week.length > 0) ? b.days_of_week.join(', ') : 'Recurring';

                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            if (selectedBatchIds.includes(b.id)) {
                              if (selectedBatchIds.length > 1) {
                                setSelectedBatchIds(selectedBatchIds.filter(id => id !== b.id));
                              } else {
                                setSelectedBatchIds([]);
                                setSelectedBatchId(null);
                              }
                            } else {
                              setSelectedBatchIds([b.id]);
                              setSelectedBatchId(b.id);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#FFF9FB] border-[#8A064D] shadow-sm ring-2 ring-[#8A064D]/20'
                              : 'bg-white border-[#F0D5E4] hover:border-[#8A064D]/50 hover:shadow-2xs'
                          }`}
                        >
                          <div>
                            {/* Batch Header */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isSelected 
                                  ? 'bg-[#8A064D] text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isSelected ? '✓ Selected' : 'Batch Slot'}
                              </span>

                              <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                <MapPin className="w-3 h-3 text-[#8A064D]" />
                                <span className="truncate">{b.room_or_hall || 'Main Hall'}</span>
                              </div>
                            </div>

                            {/* Batch Name */}
                            <h4 className={`font-bold text-sm leading-snug ${
                              isSelected ? 'text-[#8A064D]' : 'text-[#2D041A]'
                            }`}>
                              {b.name}
                            </h4>
                            {parentCourse && activeCourseIds.length > 1 && (
                              <div className="text-[10px] text-[#8A064D] font-bold mt-0.5">
                                {parentCourse.title}
                              </div>
                            )}

                            {/* Guru Name */}
                            <div className="mt-1.5 text-xs flex items-center gap-1.5 text-gray-700">
                              <User className="w-3.5 h-3.5 text-[#8A064D]" />
                              <span>Guru: <strong className="text-gray-900">{guruDisplay}</strong></span>
                            </div>

                            {/* Timings & Days */}
                            <div className="mt-1 text-xs flex items-center gap-1.5 text-gray-700">
                              <Clock className="w-3.5 h-3.5 text-[#8A064D]" />
                              <span>Timings: <strong className="text-gray-900">{timings}</strong></span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-gray-500">
                              Schedule: {daysText}
                            </div>
                          </div>

                          {/* Enrollment Bottom */}
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">
                              Enrolled: <strong className="text-gray-900">{b.enrolled_count || 0} / {b.max_capacity}</strong>
                            </span>
                            <span className={`text-xs font-bold ${
                              isSelected ? 'text-[#8A064D]' : 'text-gray-400'
                            }`}>
                              {isSelected ? '✓ Viewing Sheet' : 'Click to View →'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* BATCH ATTENDANCE SHEET (Displays when a batch is active) */}
              {/* ------------------------------------------------------------- */}
              {(currentBatch || selectedBatchIds.length > 0) && (
                <div className="space-y-4 pt-1">
                  
                  {/* Filter Controls: Date Range, Presets, Search, Status */}
                  <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs space-y-3">
                    
                    {/* Header line for batch sheet */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-[#2D041A] flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-[#8A064D]" />
                          <span>
                            Attendance Sheet: {' '}
                            <span className="text-[#8A064D]">
                              {selectedBatchIds.length > 1
                                ? `${selectedBatchIds.length} Batches Selected`
                                : (currentBatch?.name || 'All Batches')}
                            </span>
                          </span>
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {selectedBatchIds.length <= 1 && currentBatch?.trainer_name && (
                            <>Assigned Guru: <strong className="text-gray-800">{currentBatch.trainer_name}</strong> • </>
                          )}
                          Showing verified student roll-call records
                        </p>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-500 mr-1">Presets:</span>
                        {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'All Time'].map((p) => (
                          <button
                            key={p}
                            onClick={() => applyPreset(p, 'batch')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              batchPreset === p
                                ? 'bg-[#8A064D] text-white shadow-2xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter Inputs Grid */}
                    <div className="pt-2.5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">From Date</label>
                        <input
                          type="date"
                          value={batchStartDate}
                          onChange={(e) => {
                            setBatchStartDate(e.target.value);
                            setBatchPreset('Custom');
                          }}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">To Date</label>
                        <input
                          type="date"
                          value={batchEndDate}
                          onChange={(e) => {
                            setBatchEndDate(e.target.value);
                            setBatchPreset('Custom');
                          }}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status Filter</label>
                        <select
                          value={batchStatusFilter}
                          onChange={(e) => setBatchStatusFilter(e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                        >
                          <option value="All">All Statuses</option>
                          <option value="present">Present Only</option>
                          <option value="absent">Absent Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Search Student</label>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Student name, roll #..."
                            value={batchSearchQuery}
                            onChange={(e) => setBatchSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Summary Details for this Batch */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="bg-white p-3.5 rounded-2xl border border-[#F0D5E4] shadow-xs">
                      <span className="text-[11px] font-bold text-[#6E3955] uppercase tracking-wider block">Audited Records</span>
                      <span className="text-xl font-black text-[#2D041A] mt-0.5 block tabular-nums">{batchStats.total}</span>
                      <span className="text-[11px] text-[#8C5E77]">In selected date range</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Present</span>
                      <span className="text-xl font-black text-emerald-700 mt-0.5 block tabular-nums">{batchStats.present}</span>
                      <span className="text-[11px] text-emerald-600">Marked present</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-xs">
                      <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">Absent</span>
                      <span className="text-xl font-black text-red-700 mt-0.5 block tabular-nums">{batchStats.absent}</span>
                      <span className="text-[11px] text-red-600">Unexcused / absent</span>
                    </div>

                    <div className="bg-gradient-to-br from-white to-[#FFF9FB] p-3.5 rounded-2xl border border-[#F9E33A] shadow-xs">
                      <span className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Batch Rate</span>
                      <span className="text-xl font-black text-[#590231] mt-0.5 block tabular-nums">{batchStats.rate}%</span>
                      <span className="text-[11px] text-emerald-700 font-bold">Effective attendance</span>
                    </div>
                  </div>

                  {/* Attendance Sheet Table for this Batch */}
                  <div className="bg-white rounded-2xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                    <div className="p-3.5 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-[#8A064D]" />
                        <h4 className="font-bold text-xs text-[#2D041A]">
                          Attendance Records ({filteredBatchRecords.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Date Range: {batchStartDate || 'Start'} to {batchEndDate || 'End'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-100 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-3.5">Student Name & Roll</th>
                            <th className="py-2.5 px-3.5">Course</th>
                            <th className="py-2.5 px-3.5">Batch Name</th>
                            <th className="py-2.5 px-3.5">Assigned Guru</th>
                            <th className="py-2.5 px-3.5">Attendance Date</th>
                            <th className="py-2.5 px-3.5">Status</th>
                            <th className="py-2.5 px-3.5">Verification</th>
                            <th className="py-2.5 px-3.5">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredBatchRecords.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-10 text-center text-gray-400">
                                <AlertTriangle className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                                <p className="font-semibold text-xs">No attendance records found for this batch in the selected date range.</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">Try expanding the date filter or clearing search.</p>
                              </td>
                            </tr>
                          ) : (
                            filteredBatchRecords.map((r) => (
                              <tr key={r.id} className="hover:bg-[#FFFDFC] transition">
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-gray-900">{r.student_name}</div>
                                  <div className="text-[10px] font-mono text-gray-400">{r.roll_number}</div>
                                </td>
                                <td className="py-3 px-3.5">
                                  <span className="font-medium text-[#8A064D]">{r.course_title}</span>
                                </td>
                                <td className="py-3 px-3.5">
                                  <span className="font-medium text-gray-800">{r.batch_name}</span>
                                </td>
                                <td className="py-3 px-3.5 text-gray-700">
                                  {r.trainer_name}
                                </td>
                                <td className="py-3 px-3.5 font-medium text-gray-900 whitespace-nowrap">
                                  {r.session_date}
                                </td>
                                <td className="py-3 px-3.5">
                                  {r.status !== 'absent' ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Present</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                      <XCircle className="w-3 h-3" />
                                      <span>Absent</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5">
                                  <div className="text-gray-700 font-medium text-[11px]">
                                    {r.check_in_method === 'trainer_manual' ? 'Guru Verified' :
                                     r.check_in_method === 'student_code' ? 'PIN Check-in' :
                                     r.check_in_method === 'student_qr' ? 'QR Scanner' :
                                     r.check_in_method || 'Verified'}
                                  </div>
                                </td>
                                <td className="py-3 px-3.5 text-gray-500 text-[11px]">
                                  {r.remarks || '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 2: TAB 2 — COMPLETE ATTENDANCE (Across entire academy) */}
      {/* =================================================================== */}
      {activeTab === 'complete' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Complete Attendance Controls */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
            
            {/* Header info & Date Range Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-[#2D041A] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#8A064D]" />
                  <span>Complete Academy Attendance Logs</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Combined audit records for all students across all 18 disciplines and batches. By default shows today's attendance.
                </p>
              </div>

              {/* Date Range Quick Filter (Reference Image 2) */}
              <div className="flex items-center gap-2">
                <DateRangeQuickFilter
                  startDate={completeStartDate}
                  endDate={completeEndDate}
                  align="right"
                  onApply={({ startDate, endDate, presetLabel }) => {
                    setCompleteStartDate(startDate);
                    setCompleteEndDate(endDate);
                    setCompletePreset(presetLabel || 'Custom');
                  }}
                  placeholder="Select Date Range"
                />
              </div>
            </div>

            {/* Filter Bar: Student Search Dropdown, Status Filter, Search */}
            <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row items-stretch md:items-end gap-3">
              {/* Student Searchable Dropdown */}
              <div className="min-w-[240px] flex-1">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Filter by Student</label>
                <StudentSearchSelect
                  students={studentOptions}
                  value={completeStudentId}
                  onChange={(studentId) => setCompleteStudentId(studentId)}
                  placeholder="All Students (Filter by Student)"
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div className="min-w-[150px]">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status Filter</label>
                <select
                  value={completeStatusFilter}
                  onChange={(e) => setCompleteStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D]"
                >
                  <option value="All">All Statuses</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                </select>
              </div>

              {/* Search Course / Batch */}
              <div className="min-w-[220px] flex-1">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Search Details</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by roll, course, batch..."
                    value={completeSearchQuery}
                    onChange={(e) => setCompleteSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Reset Button */}
              {(completeStudentId || completeStatusFilter !== 'All' || completeSearchQuery) && (
                <div className="pb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCompleteStudentId('');
                      setCompleteStatusFilter('All');
                      setCompleteSearchQuery('');
                    }}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Complete Academy Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-xs font-bold text-[#6E3955] uppercase tracking-wider block">Total Logs Audited</span>
              <span className="text-2xl font-black text-[#2D041A] mt-1 block tabular-nums">{completeStats.total}</span>
              <span className="text-[11px] text-[#8C5E77]">
                {completePreset === 'Today' ? "Today's logs" : 'Across filtered dates'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Present</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block tabular-nums">{completeStats.present}</span>
              <span className="text-[11px] text-emerald-600">Students attended</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs">
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">Absent</span>
              <span className="text-2xl font-black text-red-700 mt-1 block tabular-nums">{completeStats.absent}</span>
              <span className="text-[11px] text-red-600">Absent count</span>
            </div>

            <div className="bg-gradient-to-br from-white to-[#FFF9FB] p-4 rounded-2xl border border-[#F9E33A] shadow-xs">
              <span className="text-xs font-bold text-[#8A064D] uppercase tracking-wider block">Overall Rate</span>
              <span className="text-2xl font-black text-[#590231] mt-1 block tabular-nums">{completeStats.rate}%</span>
              <span className="text-[11px] text-emerald-700 font-bold">Academy average</span>
            </div>
          </div>

          {/* Unified Table of All Student Attendance */}
          <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8A064D]" />
                <h3 className="font-bold text-xs text-[#2D041A]">
                  Academy-Wide Attendance Roster
                </h3>
                <span className="text-[11px] font-semibold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-full">
                  {filteredCompleteRecords.length} Entries
                </span>
                {completePreset === 'Today' && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Today
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                Range: {completeStartDate || 'All'} to {completeEndDate || 'All'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FFF9FB] text-[#590231] border-b border-[#F0D5E4] font-bold uppercase tracking-wider text-xs">
                    <th className="py-4 px-5">Student Name</th>
                    <th className="py-4 px-5">Course</th>
                    <th className="py-4 px-5">Batch</th>
                    <th className="py-4 px-5">Attendance Date</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Verification Method</th>
                    <th className="py-4 px-5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredCompleteRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-600">No attendance records found for the selected date range.</p>
                        <p className="text-xs text-gray-400 mt-1">Try selecting "Last 30 Days" or "All Time" to view past records.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCompleteRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FFFDFC] transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-gray-900 text-sm">{r.student_name}</div>
                          <div className="text-xs font-mono text-gray-500 mt-0.5">{r.roll_number}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-[#8A064D] text-sm">{r.course_title}</span>
                          <span className="block text-xs text-gray-400 font-mono mt-0.5">{r.course_code}</span>
                        </td>
                        <td className="py-4 px-5 font-medium text-gray-800 text-sm">
                          {r.batch_name}
                        </td>
                        <td className="py-4 px-5 font-medium text-gray-900 text-sm whitespace-nowrap">
                          {r.session_date}
                        </td>
                        <td className="py-4 px-5">
                          {r.status !== 'absent' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full shadow-2xs">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Absent</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-gray-800 font-medium text-xs">
                            {r.check_in_method === 'trainer_manual' ? 'Guru Verified' :
                             r.check_in_method === 'student_code' ? 'PIN Check-in' :
                             r.check_in_method === 'student_qr' ? 'QR Scanner' :
                             r.check_in_method || 'Verified'}
                          </div>
                          {r.check_in_time && (
                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                              {r.check_in_time.substring(11, 16)} IST
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5 text-gray-500 text-xs">
                          {r.remarks || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 3: TAB 3 — GURU ATTENDANCE AUDIT */}
      {/* =================================================================== */}
      {activeTab === 'guru_attendance' && (
        <GuruAttendanceTab
          initialRecords={guruRecords}
          trainers={trainers}
          courses={courses}
          isLiveSyncing={isGuruSyncing}
          onRefresh={fetchLatestGuruAuditRecords}
        />
      )}

    </div>
  );
}

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Course, Batch, AttendanceAuditRecord, Student, GuruAttendanceAuditRecord, Trainer } from '@/lib/academy';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';
import MonthPicker from '@/components/common/MonthPicker';
import StudentSearchSelect, { StudentOption } from '@/components/common/StudentSearchSelect';
import StudentMultiSearchSelect from '@/components/common/StudentMultiSearchSelect';
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
Filter, 
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
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

const DEFAULT_COURSE_IMAGES: Record<string, string> = {
  'Bharathanatyam': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
  'Kuchupudi': 'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?auto=format&fit=crop&w=800&q=80',
  'Mohiniyatam': 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
  'Semi Classical': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'Western Dance': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80',
  'Zumba': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  'Gymnastic': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
  'Carnatic Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'Violin': 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=800&q=80',
  'Keyboard': 'https://images.unsplash.com/photo-1520523839898-50712140e698?auto=format&fit=crop&w=800&q=80',
  'Guitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  'Ukulele': 'https://images.unsplash.com/photo-1568219656418-15c329312bf1?auto=format&fit=crop&w=800&q=80',
  'Drawing': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'Art and Craft': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
  'Kalari': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  'Karatte': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
  'Yoga': 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
  'Chess': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
};

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'Classical Dance': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
  'Modern Dance & Fitness': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80',
  'Vocal & Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'Musical Instruments': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  'Martial Arts': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
  'Fine Arts': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'Mind Sports': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
};

function getAttendanceCourseImage(course: Course): string {
  if (course.image_url && course.image_url.trim()) {
    return course.image_url.trim();
  }
  if (DEFAULT_COURSE_IMAGES[course.title]) {
    return DEFAULT_COURSE_IMAGES[course.title];
  }
  if (course.category && CATEGORY_DEFAULT_IMAGES[course.category]) {
    return CATEGORY_DEFAULT_IMAGES[course.category];
  }
  return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';
}

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

  // Base Records from database
  const [allRecords, setAllRecords] = useState<AttendanceAuditRecord[]>(initialAuditRecords);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchLatestAuditRecords = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/attendance');
      if (res.ok) {
        const fresh = await res.json();
        if (Array.isArray(fresh)) {
          setAllRecords(fresh);
        }
      }
    } catch (err) {
      console.warn('Attendance refresh notice:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // -------------------------------------------------------------
  // TAB 3: GURU ATTENDANCE STATE
  // -------------------------------------------------------------
  const [guruRecords, setGuruRecords] = useState<GuruAttendanceAuditRecord[]>(initialGuruAuditRecords);
  const [isGuruRefreshing, setIsGuruRefreshing] = useState<boolean>(false);

  const fetchLatestGuruAuditRecords = useCallback(async () => {
    try {
      setIsGuruRefreshing(true);
      const res = await fetch('/api/attendance?guruAudit=true');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.records)) {
          setGuruRecords(json.records);
        }
      }
    } catch (err) {
      console.warn('Guru attendance refresh notice:', err);
    } finally {
      setIsGuruRefreshing(false);
    }
  }, []);

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
  const [batchMonthLabel, setBatchMonthLabel] = useState<string>(() => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [batchYearMonth, setBatchYearMonth] = useState<string>(() => {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [batchSelectedStudentIds, setBatchSelectedStudentIds] = useState<string[]>([]);

  // -------------------------------------------------------------
  // TAB 2: COMPLETE ATTENDANCE STATE
  // -------------------------------------------------------------
  const [completeMonthLabel, setCompleteMonthLabel] = useState<string>(() => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [completeYearMonth, setCompleteYearMonth] = useState<string>(() => {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [completeStartDate, setCompleteStartDate] = useState<string>(FIRST_DAY_OF_MONTH);
  const [completeEndDate, setCompleteEndDate] = useState<string>(TODAY_STR);
  const [completeSearchQuery, setCompleteSearchQuery] = useState<string>('');
  const [completeStatusFilter, setCompleteStatusFilter] = useState<string>('All');
  const [completeSelectedStudentIds, setCompleteSelectedStudentIds] = useState<string[]>([]);
  const [completePreset, setCompletePreset] = useState<string>('This Month');

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

  // Students options for the selected course
  const courseStudentOptions: StudentOption[] = useMemo(() => {
    if (selectedCourseId) {
      const relevant = students.filter(s => 
        s.enrolled_batches?.some(eb => eb.course_id === selectedCourseId)
      );
      if (relevant.length > 0) {
        return relevant.map(s => ({
          id: s.id,
          full_name: s.full_name,
          roll_number: s.roll_number || 'N/A'
        })).sort((a, b) => a.full_name.localeCompare(b.full_name));
      }
    }
    return studentOptions;
  }, [selectedCourseId, students, studentOptions]);

  // Handler when clicking a course in Grid View
  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseIds([courseId]);
    setSelectedBatchFilter('all');
    setSelectedBatchId(null);
    setSelectedBatchIds([]);
    setBatchSelectedStudentIds([]);
    setBatchSearchQuery('');
    setBatchStatusFilter('All');
  };

  // Multi-select Course change handler
  const handleCourseMultiChange = (newIds: string[]) => {
    if (newIds.length === 0) {
      setSelectedCourseId(null);
      setSelectedCourseIds([]);
      setSelectedBatchId(null);
      setSelectedBatchIds([]);
      setSelectedBatchFilter('all');
      setBatchSelectedStudentIds([]);
      return;
    }
    setSelectedCourseIds(newIds);
    if (!newIds.includes(selectedCourseId || '')) {
      setSelectedCourseId(newIds[0]);
    }
    setSelectedBatchFilter('all');
    setBatchSelectedStudentIds([]);
  };

  // Multi-select Batch change handler
  const handleBatchMultiChange = (newBatchIds: string[]) => {
    setSelectedBatchIds(newBatchIds);
    if (newBatchIds.length > 0) {
      setSelectedBatchId(newBatchIds[0]);
      setSelectedBatchFilter(newBatchIds[0]);
    } else {
      setSelectedBatchId(null);
      setSelectedBatchFilter('all');
    }
  };

  // Return to all courses grid
  const handleBackToCourses = () => {
    setSelectedCourseId(null);
    setSelectedCourseIds([]);
    setSelectedBatchId(null);
    setSelectedBatchIds([]);
    setSelectedBatchFilter('all');
    setBatchSelectedStudentIds([]);
    setBatchSearchQuery('');
    setBatchStatusFilter('All');
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

    if (mode === 'complete') {
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
      // 1. Match course
      if (activeCourseIds.length > 0 && !activeCourseIds.includes(r.course_id)) {
        return false;
      }

      // 2. Match batch (multi-selection)
      if (selectedBatchIds.length > 0 && !selectedBatchIds.includes(r.batch_id)) {
        return false;
      } else if (selectedBatchIds.length === 0 && selectedBatchFilter !== 'all' && r.batch_id !== selectedBatchFilter) {
        return false;
      }

      // 3. Month & Year filter (via MonthPicker)
      if (batchYearMonth && r.session_date) {
        if (!r.session_date.startsWith(batchYearMonth)) return false;
      }

      // 4. Status filter
      if (batchStatusFilter !== 'All' && r.status !== batchStatusFilter) return false;

      // 5. Multi-selection student filter
      if (batchSelectedStudentIds.length > 0 && !batchSelectedStudentIds.includes(r.student_id)) {
        return false;
      }

      // 6. Free text search
      if (batchSearchQuery.trim()) {
        const q = batchSearchQuery.toLowerCase();
        const matchesName = r.student_name.toLowerCase().includes(q);
        const matchesRoll = r.roll_number.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll) return false;
      }

      return true;
    });
  }, [allRecords, activeCourseIds, selectedCourseId, selectedBatchIds, selectedBatchFilter, batchYearMonth, batchStatusFilter, batchSelectedStudentIds, batchSearchQuery]);

  // -------------------------------------------------------------
  // TAB 2 FILTERED RECORDS
  // -------------------------------------------------------------
  const filteredCompleteRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // Filter by Student (Multi-select)
      if (completeSelectedStudentIds.length > 0 && !completeSelectedStudentIds.includes(r.student_id)) return false;
      // Filter by Month & Year (MonthPicker)
      if (completeYearMonth && r.session_date) {
        if (!r.session_date.startsWith(completeYearMonth)) return false;
      } else {
        if (completeStartDate && r.session_date < completeStartDate) return false;
        if (completeEndDate && r.session_date > completeEndDate) return false;
      }
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
  }, [allRecords, completeSelectedStudentIds, completeYearMonth, completeStartDate, completeEndDate, completeStatusFilter, completeSearchQuery]);

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
      <div className="bg-[#F4EAEF] p-6 rounded-3xl border border-[#D4BAC7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          {activeTab !== 'guru_attendance' && (
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
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. TOP TABS SWITCHER: EQUAL SIZED 3 COLUMNS */}
      {/* =================================================================== */}
      <div className="bg-[#F4EAEF] p-2 rounded-2xl border border-[#D4BAC7] shadow-xs grid grid-cols-1 md:grid-cols-3 gap-2.5">
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
              <div className="bg-[#F4EAEF] p-5 rounded-3xl border border-[#D4BAC7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#1A010F] flex items-center gap-2.5">
                    <span>Academy Courses</span>
                    <span className="text-xs bg-[#590231] text-[#F9E33A] border border-[#F9E33A]/40 px-3 py-1 rounded-full font-black">
                      {courses.length} Disciplines
                    </span>
                  </h2>
                  <p className="text-xs font-semibold text-gray-600 mt-1">
                    Select a course to view batch attendance and student roll-calls.
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
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                      gridSelectedCategory === cat
                        ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#8A064D]/20'
                        : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100'
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

                  const isDance = crs.category?.toLowerCase().includes('dance') || crs.category?.toLowerCase().includes('bharat') || crs.category?.toLowerCase().includes('kuchipudi');
                  const isMusic = crs.category?.toLowerCase().includes('music') || crs.category?.toLowerCase().includes('instrument');
                  const categoryBadgeColor = isDance
                    ? 'bg-rose-100/90 text-[#8A064D] border-rose-200'
                    : isMusic
                      ? 'bg-amber-100/90 text-amber-900 border-amber-300'
                      : 'bg-teal-100/90 text-teal-900 border-teal-300';

                  return (
                    <div
                      key={crs.id}
                      onClick={() => handleSelectCourse(crs.id)}
                      className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-[#8A064D] transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono font-black text-[#590231] bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                            {crs.code}
                          </span>
                          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border ${categoryBadgeColor}`}>
                            {crs.category}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-black text-gray-900 group-hover:text-[#8A064D] transition-colors leading-snug">
                          {crs.title}
                        </h3>

                        {/* Course Image Preview */}
                        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 aspect-[16/10] relative shadow-xs">
                          <img
                            src={getAttendanceCourseImage(crs)}
                            alt={crs.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-black text-gray-800 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                          {courseBatchesCount} Batch{courseBatchesCount !== 1 ? 'es' : ''}
                        </span>

                        <span className="text-xs font-black text-[#8A064D] group-hover:text-[#590231] flex items-center gap-1 group-hover:underline">
                          <span>View Attendance</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* LEVEL 2: COURSE SELECTED -> BIG COURSE HEADER + FILTERS BAR (BATCH, MONTH/YEAR, STATUS, STUDENT MULTI) + ATTENDANCE SHEET */
            <div className="space-y-4">
              
              {/* Course Top Navigation & Big Course Title Header */}
              <div className="bg-[#F4EAEF] p-5 rounded-3xl border border-[#D4BAC7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    onClick={handleBackToCourses}
                    className="self-start px-3.5 py-2 bg-gray-100 hover:bg-[#8A064D] hover:text-white rounded-xl text-gray-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs shrink-0"
                    title="Return to Course Grid"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Courses</span>
                  </button>

                  <div className="h-8 w-px bg-gray-200 hidden sm:block" />

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {currentCourse?.code && (
                        <span className="text-xs font-mono font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-xl shadow-2xs">
                          {currentCourse.code}
                        </span>
                      )}
                      <h2 className="text-2xl sm:text-3xl font-black text-[#2D041A] tracking-tight">
                        {currentCourse?.title || 'Selected Course'}
                      </h2>
                      {currentCourse?.category && (
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                          {currentCourse.category}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-medium mt-1.5 flex flex-wrap items-center gap-2">
                      <span>Assigned Guru: <strong className="text-gray-900">{currentCourse ? COURSE_GURUS_MAP[currentCourse.title] || 'Senior Faculty Guru' : 'Faculty Guru'}</strong></span>
                      <span>•</span>
                      <span>{currentCourseBatches.length} Available Batches</span>
                    </div>
                  </div>
                </div>

                {/* Export CSV button */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCSV(filteredBatchRecords, `${currentCourse?.title || 'Course'}_Attendance`)}
                    className="px-4 py-2 bg-[#8A064D] hover:bg-[#590231] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Comprehensive Filter Toolbar Bar */}
              <div className="bg-[#F4EAEF] p-5 rounded-3xl border border-[#D4BAC7] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-sm text-[#2D041A] flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#8A064D]" />
                    <span>Filter Course Attendance Records</span>
                  </h4>
                  {(selectedBatchFilter !== 'all' || batchMonthLabel || batchStatusFilter !== 'All' || batchSelectedStudentIds.length > 0 || batchSearchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBatchFilter('all');
                        setBatchMonthLabel('');
                        setBatchYearMonth('');
                        setBatchStatusFilter('All');
                        setBatchSelectedStudentIds([]);
                        setBatchSearchQuery('');
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Batch Filter (Searchable Multi-selection, No Time) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Batch Filter (Multi)
                    </label>
                    <BatchMultiSearchSelect
                      batches={currentCourseBatches.map(b => ({
                        id: b.id,
                        name: b.name,
                        course_id: b.course_id,
                        course_title: currentCourse?.title || ''
                      }))}
                      selectedIds={selectedBatchIds}
                      onChange={setSelectedBatchIds}
                      placeholder="All Batches (Multi-select)"
                      className="w-full"
                    />
                  </div>

                  {/* 2. Month & Year Filter (MonthPicker) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Month & Year
                    </label>
                    <MonthPicker
                      value={batchMonthLabel}
                      onChange={(label, ym) => {
                        setBatchMonthLabel(label);
                        setBatchYearMonth(ym);
                      }}
                      align="left"
                      className="w-full"
                      triggerClassName="w-full justify-between"
                      placeholder="All Months & Years"
                    />
                  </div>

                  {/* 3. Status Filter */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Attendance Status
                    </label>
                    <select
                      value={batchStatusFilter}
                      onChange={(e) => setBatchStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#8A064D] focus:bg-white cursor-pointer transition shadow-2xs"
                    >
                      <option value="All">All Statuses</option>
                      <option value="present">Present Only</option>
                      <option value="absent">Absent Only</option>
                    </select>
                  </div>

                  {/* 4. Student Filter (Multi-selection, Searchable) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Filter Students (Multi)
                    </label>
                    <StudentMultiSearchSelect
                      students={courseStudentOptions}
                      selectedIds={batchSelectedStudentIds}
                      onChange={setBatchSelectedStudentIds}
                      placeholder="All Students (Multi-select)"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Free Text Quick Search */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Quick search student name, roll number..."
                      value={batchSearchQuery}
                      onChange={(e) => setBatchSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Showing <strong className="text-[#8A064D] font-bold">{filteredBatchRecords.length}</strong> records
                  </div>
                </div>
              </div>

              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#F4EAEF] p-4 rounded-2xl border border-[#D4BAC7] shadow-xs">
                  <span className="text-[11px] font-bold text-[#6E3955] uppercase tracking-wider block">Audited Records</span>
                  <span className="text-2xl font-black text-[#2D041A] mt-0.5 block tabular-nums">{batchStats.total}</span>
                  <span className="text-[11px] text-[#8C5E77]">{batchMonthLabel || 'All time'}</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Present</span>
                  <span className="text-2xl font-black text-emerald-700 mt-0.5 block tabular-nums">{batchStats.present}</span>
                  <span className="text-[11px] text-emerald-600">Marked present</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs">
                  <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">Absent</span>
                  <span className="text-2xl font-black text-red-700 mt-0.5 block tabular-nums">{batchStats.absent}</span>
                  <span className="text-[11px] text-red-600">Unexcused / absent</span>
                </div>

                <div className="bg-gradient-to-br from-white to-[#FFF9FB] p-4 rounded-2xl border border-[#F9E33A] shadow-xs">
                  <span className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Attendance Rate</span>
                  <span className="text-2xl font-black text-[#590231] mt-0.5 block tabular-nums">{batchStats.rate}%</span>
                  <span className="text-[11px] text-emerald-700 font-bold">Effective discipline rate</span>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-[#F4EAEF] rounded-3xl border border-[#D4BAC7] shadow-xs overflow-hidden">
                <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-[#8A064D]" />
                    <h4 className="font-bold text-sm text-[#2D041A]">
                      Attendance Sheet ({filteredBatchRecords.length} records)
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    {batchMonthLabel || 'All Periods'}
                  </span>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-100/90 text-gray-700 border-b-2 border-gray-200 font-extrabold uppercase tracking-wider text-xs sm:text-sm">
                        <th className="py-3.5 px-4 font-black">Roll Number</th>
                        <th className="py-3.5 px-4 font-black">Student Name</th>
                        <th className="py-3.5 px-4 font-black">Course</th>
                        <th className="py-3.5 px-4 font-black">Batch</th>
                        <th className="py-3.5 px-4 font-black">Assigned Guru</th>
                        <th className="py-3.5 px-4 font-black">Date</th>
                        <th className="py-3.5 px-4 font-black">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {filteredBatchRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-400">
                            <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="font-bold text-gray-700 text-base">No attendance records found matching filters.</p>
                            <p className="text-sm text-gray-500 mt-1">Try selecting "All Batches" or clearing student and month filters.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredBatchRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-white transition">
                            <td className="py-4 px-4 font-mono font-bold text-gray-800 text-sm">
                              {r.roll_number || '—'}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-extrabold text-gray-900 text-base">{r.student_name}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-[#8A064D] text-sm">{r.course_title}</span>
                            </td>
                            <td className="py-4 px-4 font-bold text-gray-800 text-sm">
                              {r.batch_name}
                            </td>
                            <td className="py-4 px-4 text-gray-800 font-medium text-sm">
                              {r.trainer_name}
                            </td>
                            <td className="py-4 px-4 font-bold text-gray-900 whitespace-nowrap text-sm">
                              {r.session_date}
                            </td>
                            <td className="py-4 px-4">
                              {r.status !== 'absent' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3.5 py-1.5 rounded-full shadow-2xs">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Present</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-rose-800 bg-rose-100/90 border border-rose-300 px-3.5 py-1.5 rounded-full shadow-2xs">
                                  <XCircle className="w-4 h-4 text-rose-600" />
                                  <span>Absent</span>
                                </span>
                              )}
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

      {/* =================================================================== */}
      {/* SECTION 2: TAB 2 — COMPLETE ATTENDANCE (Across entire academy) */}
      {/* =================================================================== */}
      {activeTab === 'complete' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Complete Attendance Controls */}
          <div className="bg-[#F4EAEF] p-5 rounded-3xl border border-[#D4BAC7] shadow-xs space-y-4">
            
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

              {/* Month & Year Filter using MonthPicker */}
              <div className="flex items-center gap-2">
                <MonthPicker
                  value={completeMonthLabel}
                  onChange={(label, ym, start, end) => {
                    setCompleteMonthLabel(label);
                    setCompleteYearMonth(ym);
                    setCompleteStartDate(start);
                    setCompleteEndDate(end);
                  }}
                  align="right"
                  placeholder="Select Month & Year"
                />
              </div>
            </div>

            {/* Filter Bar: Student Search Dropdown, Status Filter, Search */}
            <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row items-stretch md:items-end gap-3">
              {/* Student Searchable Dropdown (Multi-select) */}
              <div className="min-w-[240px] flex-1">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Filter by Student (Multi)</label>
                <StudentMultiSearchSelect
                  students={studentOptions}
                  selectedIds={completeSelectedStudentIds}
                  onChange={setCompleteSelectedStudentIds}
                  placeholder="All Students (Multi-select)"
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
              {(completeSelectedStudentIds.length > 0 || completeStatusFilter !== 'All' || completeSearchQuery || completeMonthLabel) && (
                <div className="pb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCompleteSelectedStudentIds([]);
                      setCompleteStatusFilter('All');
                      setCompleteSearchQuery('');
                      setCompleteMonthLabel('');
                      setCompleteYearMonth('');
                      setCompleteStartDate('');
                      setCompleteEndDate('');
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
            <div className="bg-[#F4EAEF] p-4 rounded-2xl border border-[#D4BAC7] shadow-xs">
              <span className="text-xs font-bold text-[#6E3955] uppercase tracking-wider block">Total Logs Audited</span>
              <span className="text-2xl font-black text-[#2D041A] mt-1 block tabular-nums">{completeStats.total}</span>
              <span className="text-[11px] text-[#8C5E77]">
                {completeMonthLabel || 'All Periods'}
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
          <div className="bg-[#F4EAEF] rounded-3xl border border-[#D4BAC7] shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8A064D]" />
                <h3 className="font-bold text-xs text-[#2D041A]">
                  Academy-Wide Attendance Roster
                </h3>
                <span className="text-[11px] font-semibold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-full">
                  {filteredCompleteRecords.length} Entries
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Period: {completeMonthLabel || 'All Periods'}
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FFF9FB] text-[#590231] border-b border-[#F0D5E4] font-bold uppercase tracking-wider text-xs">
                    <th className="py-4 px-5">Roll Number</th>
                    <th className="py-4 px-5">Student Name</th>
                    <th className="py-4 px-5">Course</th>
                    <th className="py-4 px-5">Batch</th>
                    <th className="py-4 px-5">Attendance Date</th>
                    <th className="py-4 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredCompleteRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-600">No attendance records found for the selected period.</p>
                        <p className="text-xs text-gray-400 mt-1">Try selecting a different month or clearing filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCompleteRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FFFDFC] transition">
                        <td className="py-4 px-5 font-mono font-bold text-gray-700 text-xs">
                          {r.roll_number || '—'}
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-gray-900 text-sm">{r.student_name}</div>
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
          isLiveSyncing={isGuruRefreshing}
          onRefresh={fetchLatestGuruAuditRecords}
        />
      )}

    </div>
  );
}

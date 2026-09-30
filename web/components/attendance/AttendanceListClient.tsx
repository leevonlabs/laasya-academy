'use client';

import React, { useState, useMemo } from 'react';
import { Course, Batch, AttendanceAuditRecord } from '@/lib/academy';
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
  ChevronRight
} from 'lucide-react';

interface Props {
  initialAuditRecords: AttendanceAuditRecord[];
  courses: Course[];
  batches: Batch[];
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

export default function AttendanceListClient({ initialAuditRecords, courses, batches }: Props) {
  // -------------------------------------------------------------
  // TOP NAVIGATION TABS: Tab 1 = Course-Wise, Tab 2 = Complete
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'course_wise' | 'complete'>('course_wise');

  // Base Records from database
  const [allRecords] = useState<AttendanceAuditRecord[]>(initialAuditRecords);

  // -------------------------------------------------------------
  // TAB 1: COURSE-WISE DRILL-DOWN STATE
  // -------------------------------------------------------------
  // selectedCourseId: null means grid of courses is displayed
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Course Grid Filters
  const [gridSearchQuery, setGridSearchQuery] = useState('');
  const [gridSelectedCategory, setGridSelectedCategory] = useState('All');

  // Batch Attendance Sheet Filters
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [batchStartDate, setBatchStartDate] = useState<string>('2026-09-01');
  const [batchEndDate, setBatchEndDate] = useState<string>('2026-09-30');
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('All');
  const [batchPreset, setBatchPreset] = useState<string>('Last 30 Days');

  // -------------------------------------------------------------
  // TAB 2: COMPLETE ATTENDANCE STATE (Default to today '2026-09-30')
  // -------------------------------------------------------------
  const TODAY_STR = '2026-09-30';
  const [completeStartDate, setCompleteStartDate] = useState<string>(TODAY_STR);
  const [completeEndDate, setCompleteEndDate] = useState<string>(TODAY_STR);
  const [completeSearchQuery, setCompleteSearchQuery] = useState<string>('');
  const [completeStatusFilter, setCompleteStatusFilter] = useState<string>('All');
  const [completePreset, setCompletePreset] = useState<string>('Today');

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

  // Available batches for current selected course
  const currentCourseBatches = useMemo(() => {
    if (!selectedCourseId) return [];
    return batches.filter(b => b.course_id === selectedCourseId);
  }, [batches, selectedCourseId]);

  // Current selected batch object
  const currentBatch = useMemo(() => {
    if (!selectedBatchId) return currentCourseBatches[0] || null;
    return currentCourseBatches.find(b => b.id === selectedBatchId) || currentCourseBatches[0] || null;
  }, [currentCourseBatches, selectedBatchId]);

  // Handler when clicking a course in Grid View
  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    // Find batches for this course and select the first batch automatically
    const courseBatches = batches.filter(b => b.course_id === courseId);
    if (courseBatches.length > 0) {
      setSelectedBatchId(courseBatches[0].id);
    } else {
      setSelectedBatchId(null);
    }
    // Reset filters
    setBatchSearchQuery('');
    setBatchStartDate('2026-09-01');
    setBatchEndDate('2026-09-30');
    setBatchStatusFilter('All');
    setBatchPreset('Last 30 Days');
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
    if (!currentBatch && !selectedCourseId) return [];

    return allRecords.filter((r) => {
      // Match batch (by id or by batch name + course)
      const matchesBatch = currentBatch 
        ? (r.batch_id === currentBatch.id || 
           (r.batch_name.toLowerCase() === currentBatch.name.toLowerCase() && r.course_id === selectedCourseId))
        : (r.course_id === selectedCourseId);

      if (!matchesBatch) return false;

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
  }, [allRecords, currentBatch, selectedCourseId, batchStartDate, batchEndDate, batchStatusFilter, batchSearchQuery]);

  // -------------------------------------------------------------
  // TAB 2 FILTERED RECORDS
  // -------------------------------------------------------------
  const filteredCompleteRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (completeStartDate && r.session_date < completeStartDate) return false;
      if (completeEndDate && r.session_date > completeEndDate) return false;
      if (completeStatusFilter !== 'All' && r.status !== completeStatusFilter) return false;
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
  }, [allRecords, completeStartDate, completeEndDate, completeStatusFilter, completeSearchQuery]);

  // Stats calculation
  const getStats = (records: AttendanceAuditRecord[]) => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, rate };
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
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. TOP TABS SWITCHER */}
      {/* =================================================================== */}
      <div className="bg-white p-2 rounded-2xl border border-[#F0D5E4] shadow-xs flex items-center gap-2">
        <button
          onClick={() => setActiveTab('course_wise')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'course_wise'
              ? 'bg-[#8A064D] text-white shadow-md'
              : 'text-gray-600 hover:text-[#8A064D] hover:bg-gray-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Tab 1: Course-Wise Attendance</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            activeTab === 'course_wise' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            Course & Batch Drill-down
          </span>
        </button>

        <button
          onClick={() => setActiveTab('complete')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'complete'
              ? 'bg-[#8A064D] text-white shadow-md'
              : 'text-gray-600 hover:text-[#8A064D] hover:bg-gray-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tab 2: Complete Attendance</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            activeTab === 'complete' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            All Students Across Academy
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
                  <h2 className="text-base font-bold text-[#2D041A] flex items-center gap-2">
                    <span>Academy Courses</span>
                    <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-rose-100 px-2.5 py-0.5 rounded-full font-semibold">
                      {courses.length} Disciplines
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click any course card below to view its available batches, timings, and live student attendance sheets.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={gridSearchQuery}
                      onChange={(e) => setGridSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs w-64 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
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
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-mono font-bold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-0.5 rounded-lg">
                            {crs.code}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full">
                            {crs.category}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-[#2D041A] group-hover:text-[#8A064D] transition">
                          {crs.title}
                        </h3>

                        {/* Guru Name */}
                        <div className="mt-2.5 py-1.5 px-3 rounded-xl bg-[#FFF9FB] border border-rose-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-[#8A064D]">Assigned Guru</span>
                          <span className="text-xs font-bold text-gray-800 truncate ml-2">
                            {guruName}
                          </span>
                        </div>

                        {/* Fee & Duration */}
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                          <span>Monthly Fee: <strong className="text-[#8A064D]">₹{Number(crs.monthly_fee).toLocaleString('en-IN')}</strong></span>
                          <span>{crs.duration_months} Months</span>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {courseBatchesCount} Batch{courseBatchesCount !== 1 ? 'es' : ''} Available
                        </span>

                        <span className="text-xs font-bold text-[#8A064D] group-hover:text-[#590231] flex items-center gap-1">
                          <span>View Batches & Attendance</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* LEVEL 2 & 3: COURSE SELECTED -> AVAILABLE BATCHES ON TOP + BATCH ATTENDANCE SHEET */
            <div className="space-y-6">
              
              {/* Course Top Navigation & Breadcrumb */}
              <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedCourseId(null);
                      setSelectedBatchId(null);
                    }}
                    className="p-2.5 bg-gray-100 hover:bg-[#8A064D] hover:text-white rounded-2xl text-gray-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    title="Return to Course Grid"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Courses</span>
                  </button>

                  <div className="h-6 w-px bg-gray-200" />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-md">
                        {currentCourse?.code}
                      </span>
                      <h2 className="text-lg font-bold text-[#2D041A]">
                        {currentCourse?.title}
                      </h2>
                      <span className="text-xs text-gray-500 font-medium">
                        ({currentCourse?.category})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Course Switcher Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-semibold">Switch Course:</span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleSelectCourse(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* AVAILABLE BATCHES OF THAT COURSE DISPLAYED ON TOP */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Available Batches for {currentCourse?.title} ({currentCourseBatches.length})</span>
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Click any batch to view its live attendance sheet
                  </span>
                </div>

                {currentCourseBatches.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center text-gray-500 text-xs">
                    No batches currently assigned to this course.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCourseBatches.map((b) => {
                      const isSelected = (currentBatch?.id === b.id);
                      const guruDisplay = b.trainer_name || (currentCourse ? COURSE_GURUS_MAP[currentCourse.title] : 'Faculty Guru');
                      const timings = `${b.start_time?.substring(0, 5)} - ${b.end_time?.substring(0, 5)}`;
                      const daysText = (b.days_of_week && b.days_of_week.length > 0) ? b.days_of_week.join(', ') : 'Recurring';

                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBatchId(b.id)}
                          className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#FFF9FB] border-[#8A064D] shadow-md ring-2 ring-[#8A064D]/30'
                              : 'bg-white border-[#F0D5E4] hover:border-[#8A064D]/50 hover:shadow-xs'
                          }`}
                        >
                          <div>
                            {/* Batch Header */}
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isSelected 
                                  ? 'bg-[#8A064D] text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isSelected ? 'Selected Batch' : 'Batch Slot'}
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

                            {/* Guru Name */}
                            <div className="mt-2 text-xs flex items-center gap-1.5 text-gray-700">
                              <User className="w-3.5 h-3.5 text-[#8A064D]" />
                              <span>Guru: <strong className="text-gray-900">{guruDisplay}</strong></span>
                            </div>

                            {/* Timings & Days */}
                            <div className="mt-1 text-xs flex items-center gap-1.5 text-gray-700">
                              <Clock className="w-3.5 h-3.5 text-[#8A064D]" />
                              <span>Timings: <strong className="text-gray-900">{timings}</strong></span>
                            </div>
                            <div className="mt-1 text-[11px] text-gray-500">
                              Schedule: {daysText}
                            </div>
                          </div>

                          {/* Enrollment Bottom */}
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
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
              {currentBatch && (
                <div className="space-y-5 pt-2">
                  
                  {/* Filter Controls: Date Range, Presets, Search, Status */}
                  <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
                    
                    {/* Header line for batch sheet */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-[#2D041A] flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-[#8A064D]" />
                          <span>Attendance Sheet: <span className="text-[#8A064D]">{currentBatch.name}</span></span>
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Assigned Guru: <strong className="text-gray-800">{currentBatch.trainer_name}</strong> • Timings: {currentBatch.start_time?.substring(0, 5)} - {currentBatch.end_time?.substring(0, 5)}
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
                    <div className="pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3">
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
                          <option value="late">Late Only</option>
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Audited Records</span>
                      <span className="text-xl font-bold text-[#2D041A] mt-1 block">{batchStats.total}</span>
                      <span className="text-[10px] text-gray-500">In selected date range</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present</span>
                      <span className="text-xl font-bold text-emerald-700 mt-1 block">{batchStats.present}</span>
                      <span className="text-[10px] text-gray-500">Marked present</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Absent</span>
                      <span className="text-xl font-bold text-rose-700 mt-1 block">{batchStats.absent}</span>
                      <span className="text-[10px] text-gray-500">Unexcused / absent</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Late Arrivals</span>
                      <span className="text-xl font-bold text-amber-700 mt-1 block">{batchStats.late}</span>
                      <span className="text-[10px] text-gray-500">Delayed check-in</span>
                    </div>

                    <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-rose-100 shadow-xs">
                      <span className="text-[10px] font-bold text-[#8A064D] uppercase tracking-wider block">Batch Rate</span>
                      <span className="text-xl font-bold text-[#8A064D] mt-1 block">{batchStats.rate}%</span>
                      <span className="text-[10px] text-[#8A064D]/80">Effective attendance</span>
                    </div>
                  </div>

                  {/* Attendance Sheet Table for this Batch */}
                  <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
                    <div className="p-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-[#8A064D]" />
                        <h4 className="font-bold text-xs text-[#2D041A]">
                          Attendance Records for {currentBatch.name}
                        </h4>
                        <span className="text-[11px] font-semibold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-full">
                          {filteredBatchRecords.length} Entries
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Date Range: {batchStartDate || 'Start'} to {batchEndDate || 'End'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-100 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4">Student Name & Roll</th>
                            <th className="py-3 px-4">Batch Name</th>
                            <th className="py-3 px-4">Assigned Guru</th>
                            <th className="py-3 px-4">Attendance Date</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Check-in Verification</th>
                            <th className="py-3 px-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredBatchRecords.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-gray-400">
                                <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="font-semibold">No attendance records found for this batch in the selected date range.</p>
                                <p className="text-[11px] text-gray-400 mt-1">Try expanding the date filter or clearing search.</p>
                              </td>
                            </tr>
                          ) : (
                            filteredBatchRecords.map((r) => (
                              <tr key={r.id} className="hover:bg-[#FFFDFC] transition">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-gray-900">{r.student_name}</div>
                                  <div className="text-[10px] font-mono text-gray-400">{r.roll_number}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-medium text-gray-800">{r.batch_name}</span>
                                </td>
                                <td className="py-3.5 px-4 text-gray-700">
                                  {r.trainer_name}
                                </td>
                                <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                                  {r.session_date}
                                </td>
                                <td className="py-3.5 px-4">
                                  {r.status === 'present' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Present</span>
                                    </span>
                                  )}
                                  {r.status === 'absent' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Absent</span>
                                    </span>
                                  )}
                                  {r.status === 'late' && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Late</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="text-gray-700 font-medium text-[11px]">
                                    {r.check_in_method === 'trainer_manual' ? 'Guru Verified' :
                                     r.check_in_method === 'student_code' ? 'PIN Check-in' :
                                     r.check_in_method === 'student_qr' ? 'QR Scanner' :
                                     r.check_in_method || 'Verified'}
                                  </div>
                                  {r.check_in_time && (
                                    <div className="text-[10px] text-gray-400 font-mono">
                                      {r.check_in_time.substring(11, 16)} IST
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-gray-500 text-[11px]">
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
            
            {/* Header info & Presets */}
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

              {/* Date Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500 mr-1">Presets:</span>
                {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'All Time'].map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p, 'complete')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      completePreset === p
                        ? 'bg-[#8A064D] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar: From Date, To Date, Search, Status */}
            <div className="pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={completeStartDate}
                  onChange={(e) => {
                    setCompleteStartDate(e.target.value);
                    setCompletePreset('Custom');
                  }}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={completeEndDate}
                  onChange={(e) => {
                    setCompleteEndDate(e.target.value);
                    setCompletePreset('Custom');
                  }}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status Filter</label>
                <select
                  value={completeStatusFilter}
                  onChange={(e) => setCompleteStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                >
                  <option value="All">All Statuses</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                  <option value="late">Late Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Search Student / Course</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by student, roll, course..."
                    value={completeSearchQuery}
                    onChange={(e) => setCompleteSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Complete Academy Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Logs Audited</span>
              <span className="text-xl font-bold text-[#2D041A] mt-1 block">{completeStats.total}</span>
              <span className="text-[10px] text-gray-500">
                {completePreset === 'Today' ? "Today's logs" : 'Across filtered dates'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">{completeStats.present}</span>
              <span className="text-[10px] text-gray-500">Students attended</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Absent</span>
              <span className="text-xl font-bold text-rose-700 mt-1 block">{completeStats.absent}</span>
              <span className="text-[10px] text-gray-500">Absent count</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Late Arrivals</span>
              <span className="text-xl font-bold text-amber-700 mt-1 block">{completeStats.late}</span>
              <span className="text-[10px] text-gray-500">Delayed arrivals</span>
            </div>

            <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-rose-100 shadow-xs">
              <span className="text-[10px] font-bold text-[#8A064D] uppercase tracking-wider block">Overall Rate</span>
              <span className="text-xl font-bold text-[#8A064D] mt-1 block">{completeStats.rate}%</span>
              <span className="text-[10px] text-[#8A064D]/80">Academy average</span>
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
                  <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-100 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Attendance Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Verification Method</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCompleteRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold">No attendance records found for the selected date range.</p>
                        <p className="text-[11px] text-gray-400 mt-1">Try selecting "Last 30 Days" or "All Time" to view past records.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCompleteRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FFFDFC] transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{r.student_name}</div>
                          <div className="text-[10px] font-mono text-gray-400">{r.roll_number}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#8A064D]">{r.course_title}</span>
                          <span className="block text-[10px] text-gray-400 font-mono">{r.course_code}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {r.batch_name}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {r.session_date}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.status === 'present' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </span>
                          )}
                          {r.status === 'absent' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Absent</span>
                            </span>
                          )}
                          {r.status === 'late' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Late</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-gray-700 font-medium text-[11px]">
                            {r.check_in_method === 'trainer_manual' ? 'Guru Verified' :
                             r.check_in_method === 'student_code' ? 'PIN Check-in' :
                             r.check_in_method === 'student_qr' ? 'QR Scanner' :
                             r.check_in_method || 'Verified'}
                          </div>
                          {r.check_in_time && (
                            <div className="text-[10px] text-gray-400 font-mono">
                              {r.check_in_time.substring(11, 16)} IST
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
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
  );
}

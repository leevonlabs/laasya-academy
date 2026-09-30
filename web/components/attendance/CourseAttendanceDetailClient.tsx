'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Search,
  User,
  GraduationCap,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  Check,
  RefreshCw,
  Building,
  DollarSign,
  Sparkles,
  Award
} from 'lucide-react';
import { Course, AttendanceRecord } from '@/lib/academy';

interface Props {
  course: {
    id: string;
    title: string;
    category: string;
    code?: string;
    trainer: string;
    batch: string;
    timings?: string;
    room?: string;
    fee?: string;
    duration?: string;
    enrolled: number;
    sessions: number;
    rate: number;
    description?: string;
  };
  initialRecords: AttendanceRecord[];
}

export default function CourseAttendanceDetailClient({ course, initialRecords }: Props) {
  const [records] = useState<AttendanceRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'present' | 'absent' | 'late'>('All');

  // ---------------------------------------------------------------------------
  // Date Range Popover State (Matching Reference Image 1)
  // ---------------------------------------------------------------------------
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [quickSelect, setQuickSelect] = useState<string>('Last 30 Days');
  const [pickerYear, setPickerYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('Sep');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsDatePopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active date boundaries
  const activeDateRange = useMemo(() => {
    const todayStr = '2026-09-30';
    const yesterdayStr = '2026-09-29';

    if (quickSelect === 'Today') {
      return { start: todayStr, end: todayStr, label: 'Today (30 Sep 2026)' };
    }
    if (quickSelect === 'Yesterday') {
      return { start: yesterdayStr, end: yesterdayStr, label: 'Yesterday (29 Sep 2026)' };
    }
    if (quickSelect === 'Last 7 Days') {
      return { start: '2026-09-23', end: todayStr, label: 'Last 7 Days (23 - 30 Sep)' };
    }
    if (quickSelect === 'Last 30 Days') {
      return { start: '2026-09-01', end: todayStr, label: 'Last 30 Days (Sep 2026)' };
    }
    if (quickSelect === 'This Month') {
      return { start: '2026-09-01', end: '2026-09-30', label: 'This Month (September 2026)' };
    }
    if (quickSelect === 'Last Month') {
      return { start: '2026-08-01', end: '2026-08-31', label: 'Last Month (August 2026)' };
    }
    if (quickSelect === 'This FY') {
      return { start: '2026-04-01', end: '2027-03-31', label: 'Financial Year 2026-27' };
    }
    if (quickSelect === 'MonthGrid') {
      const monthMap: Record<string, string> = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const mNum = monthMap[selectedMonth] || '09';
      return {
        start: `${pickerYear}-${mNum}-01`,
        end: `${pickerYear}-${mNum}-31`,
        label: `${selectedMonth} ${pickerYear}`
      };
    }
    return { start: '2020-01-01', end: '2030-12-31', label: 'All Records' };
  }, [quickSelect, pickerYear, selectedMonth]);

  // Filter attendance records for this course
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Student Filter
      if (selectedStudent !== 'All' && r.student_name !== selectedStudent && r.roll_number !== selectedStudent) {
        return false;
      }
      // 2. Status Filter
      if (statusFilter !== 'All' && r.status !== statusFilter) {
        return false;
      }
      // 3. Date Range Filter
      if (activeDateRange.start && activeDateRange.end) {
        if (r.session_date < activeDateRange.start || r.session_date > activeDateRange.end) {
          return false;
        }
      }
      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.student_name.toLowerCase().includes(q);
        const matchesRoll = r.roll_number.toLowerCase().includes(q);
        const matchesBatch = r.batch_name.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesBatch) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedStudent, statusFilter, activeDateRange, searchQuery]);

  // List of unique students in this course
  const enrolledStudents = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      map.set(r.student_name, r.roll_number);
    });
    return Array.from(map.entries()).map(([name, roll]) => ({ name, roll }));
  }, [records]);

  // Statistics for this course
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const absent = filteredRecords.filter((r) => r.status === 'absent').length;
    const late = filteredRecords.filter((r) => r.status === 'late').length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, rate };
  }, [filteredRecords]);

  // CSV Export handler
  const exportCSV = () => {
    const headers = [
      'Student Name',
      'Roll Number',
      'Course',
      'Batch',
      'Attendance Date',
      'Status',
      'Check-in Time',
      'Verification Method',
      'Remarks'
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.student_name.replace(/"/g, '""')}"`,
      `"${r.roll_number}"`,
      `"${r.course_title.replace(/"/g, '""')}"`,
      `"${r.batch_name.replace(/"/g, '""')}"`,
      `"${r.session_date}"`,
      `"${r.status.toUpperCase()}"`,
      `"${r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}"`,
      `"${r.check_in_method}"`,
      `"${r.remarks || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeCourse = course.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `laasya_${safeCourse}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* =================================================================== */}
      {/* 1. NAVIGATION & COURSE HEADER */}
      {/* =================================================================== */}
      <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/attendance"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8A064D] hover:text-[#590231] hover:underline transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Courses Attendance Audit</span>
          </Link>
        </div>

        {/* Course Details Main Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#590231] to-[#8A064D] text-[#F9E33A] flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#FFF2F8] text-[#8A064D] border border-rose-100">
                  {course.category}
                </span>
                {course.code && (
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                    {course.code}
                  </span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Course
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#2D041A] mt-1.5">
                {course.title}
              </h1>

              <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-semibold text-gray-700">
                  <User className="w-3.5 h-3.5 text-[#8A064D]" />
                  {course.trainer}
                </span>
                <span>•</span>
                <span>Batch: <strong className="text-gray-700">{course.batch}</strong></span>
                {course.room && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-gray-400" />
                      {course.room}
                    </span>
                  </>
                )}
                {course.timings && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {course.timings}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Button: Download CSV */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={exportCSV}
              className="bg-[#590231] hover:bg-[#780442] text-white border border-[#EBB128] px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#F9E33A]" />
              <span>Download Course CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Mini Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100 text-center">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Enrolled</span>
            <p className="text-xl font-bold text-[#590231] mt-0.5">{enrolledStudents.length}</p>
            <span className="text-[10px] text-gray-500">Active Students</span>
          </div>

          <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100 text-center">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Total Records</span>
            <p className="text-xl font-bold text-gray-800 mt-0.5">{stats.total}</p>
            <span className="text-[10px] text-gray-500">In Selected Range</span>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Present</span>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.present}</p>
            <span className="text-[10px] text-emerald-600">On Time Sessions</span>
          </div>

          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100 text-center">
            <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Late</span>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.late}</p>
            <span className="text-[10px] text-amber-600">Delayed Check-ins</span>
          </div>

          <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100 text-center">
            <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">Absent</span>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{stats.absent}</p>
            <span className="text-[10px] text-rose-600">Missed Sessions</span>
          </div>

          <div className="bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] p-3.5 rounded-2xl border border-[#EBB128] text-center">
            <span className="text-[10px] font-bold uppercase text-[#8A064D] tracking-wider">Attendance %</span>
            <p className="text-xl font-extrabold text-[#8A064D] mt-0.5">{stats.rate}%</p>
            <span className="text-[10px] text-[#250216] font-semibold">Verified Rate</span>
          </div>
        </div>

      </div>

      {/* =================================================================== */}
      {/* 2. CONTROLS BAR: DATE RANGE, STUDENT FILTER, SEARCH, STATUS */}
      {/* =================================================================== */}
      <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left search & student filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 hover:bg-white focus:bg-white border border-[#F0D5E4] rounded-xl text-xs w-60 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
              />
            </div>

            {/* Filter by Student Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="py-1.5 px-3 bg-white border border-[#F0D5E4] rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8A064D] cursor-pointer"
              >
                <option value="All">Filter by Student: All Enrolled ({enrolledStudents.length})</option>
                {enrolledStudents.map((st) => (
                  <option key={st.roll} value={st.name}>
                    {st.name} ({st.roll})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right date range popover & resets */}
          <div className="flex items-center gap-2.5">

            {/* ============================================================= */}
            {/* DATE RANGE FILTER POPOVER (Exact Match to Reference Image 1) */}
            {/* ============================================================= */}
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setIsDatePopoverOpen(!isDatePopoverOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#EBB128] rounded-xl text-xs font-bold text-[#590231] hover:bg-[#FFF9FB] shadow-xs cursor-pointer transition"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#8A064D]" />
                <span>{activeDateRange.label}</span>
                <span className="text-[10px] text-gray-400">▼</span>
              </button>

              {/* Popover Card */}
              {isDatePopoverOpen && (
                <div className="absolute right-0 top-10 mt-1 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 flex p-3 w-[460px] animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* LEFT COLUMN: QUICK SELECT */}
                  <div className="w-44 pr-3 border-r border-gray-100 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold tracking-wider text-gray-400 uppercase pb-2 px-2">
                        QUICK SELECT
                      </div>
                      <div className="space-y-1">
                        {[
                          'Today',
                          'Yesterday',
                          'Last 7 Days',
                          'Last 30 Days',
                          'This Month',
                          'Last Month',
                          'This FY',
                        ].map((opt) => {
                          const isActive = quickSelect === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                setQuickSelect(opt);
                                setIsDatePopoverOpen(false);
                              }}
                              className={`w-full text-left text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                                isActive
                                  ? 'bg-pink-50 text-pink-600 font-bold'
                                  : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50/50'
                              }`}
                            >
                              <span>{opt}</span>
                              {isActive && <Check className="w-3.5 h-3.5 text-pink-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setQuickSelect('All Time');
                        setIsDatePopoverOpen(false);
                      }}
                      className="text-left text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-2 mt-2 pt-2 border-t border-gray-100 transition cursor-pointer"
                    >
                      All Time / Clear
                    </button>
                  </div>

                  {/* RIGHT COLUMN: YEAR & 12-MONTH GRID */}
                  <div className="flex-1 pl-3">
                    <div className="flex items-center justify-between px-2 py-1 mb-2">
                      <button
                        onClick={() => setPickerYear(pickerYear - 1)}
                        className="text-gray-400 hover:text-gray-700 text-sm font-bold px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                        title="Previous Year"
                      >
                        <ChevronsLeft className="w-4 h-4 inline" />
                      </button>

                      <div className="flex items-center gap-1 text-sm font-bold text-gray-800">
                        <span>{pickerYear}</span>
                        <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                      </div>

                      <button
                        onClick={() => setPickerYear(pickerYear + 1)}
                        className="text-gray-400 hover:text-gray-700 text-sm font-bold px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                        title="Next Year"
                      >
                        <ChevronsRight className="w-4 h-4 inline" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['Jan', 'Feb', 'Mar'],
                        ['Apr', 'May', 'Jun'],
                        ['Jul', 'Aug', 'Sep'],
                        ['Oct', 'Nov', 'Dec'],
                      ].flat().map((month) => {
                        const isSelected = quickSelect === 'MonthGrid' && selectedMonth === month && pickerYear === 2026;
                        return (
                          <button
                            key={month}
                            onClick={() => {
                              setSelectedMonth(month);
                              setQuickSelect('MonthGrid');
                              setIsDatePopoverOpen(false);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold transition text-center cursor-pointer ${
                              isSelected
                                ? 'bg-[#E11D48] text-white font-bold shadow-md shadow-pink-500/30'
                                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                            }`}
                          >
                            {month}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Reset Filters */}
            {(selectedStudent !== 'All' || statusFilter !== 'All' || searchQuery !== '' || quickSelect !== 'Last 30 Days') && (
              <button
                onClick={() => {
                  setSelectedStudent('All');
                  setStatusFilter('All');
                  setSearchQuery('');
                  setQuickSelect('Last 30 Days');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
                title="Reset Filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            {[
              { key: 'All', label: `All (${stats.total})` },
              { key: 'present', label: `Present (${stats.present})` },
              { key: 'absent', label: `Absent (${stats.absent})` },
              { key: 'late', label: `Late (${stats.late})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[#590231] text-[#F9E33A] shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500">
            Showing <strong>{filteredRecords.length}</strong> attendance entries for <strong>{course.title}</strong>
          </div>
        </div>

      </div>

      {/* =================================================================== */}
      {/* 3. ENROLLED STUDENTS ATTENDANCE TABLE */}
      {/* =================================================================== */}
      <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[11px] font-bold uppercase tracking-wider text-[#8A064D]">
                <th className="py-4 px-6">Student & Roll No</th>
                <th className="py-4 px-6">Session Date</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6">Check-in Time</th>
                <th className="py-4 px-6">Verification Method</th>
                <th className="py-4 px-6">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="font-semibold text-gray-600">No attendance entries match your filters</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try selecting a different date range or resetting student filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const checkInFormatted = r.check_in_time 
                    ? new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                    : '—';

                  const dateObj = new Date(r.session_date);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <tr key={r.id} className="hover:bg-[#FFFDFC] transition">
                      
                      {/* Student & Roll No */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#590231] text-[#F9E33A] flex items-center justify-center font-bold text-xs shrink-0">
                            {r.student_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{r.student_name}</div>
                            <span className="font-mono text-[10px] font-semibold text-[#8A064D] bg-[#FFF2F8] px-1.5 py-0.5 rounded border border-rose-100">
                              {r.roll_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="font-medium text-gray-800">{r.session_date}</div>
                        <div className="text-[10px] text-gray-400">{dayName}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        {r.status === 'present' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </span>
                        )}
                        {r.status === 'absent' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Absent
                          </span>
                        )}
                        {r.status === 'late' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Late
                          </span>
                        )}
                      </td>

                      {/* Check-in Time */}
                      <td className="py-3.5 px-6 font-mono font-medium text-gray-700 whitespace-nowrap">
                        {checkInFormatted}
                      </td>

                      {/* Verification Method */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                          {r.check_in_method}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3.5 px-6 text-gray-500 text-[11px]">
                        {r.remarks || '—'}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-[#FFF9FB] border-t border-[#F0D5E4] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <span>Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> attendance entries for {course.title}</span>
          <button
            onClick={exportCSV}
            className="text-[#8A064D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export current view as CSV</span>
          </button>
        </div>
      </div>

    </div>
  );
}

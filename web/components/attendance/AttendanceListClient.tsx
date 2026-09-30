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
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface Props {
  initialAuditRecords: AttendanceAuditRecord[];
  courses: Course[];
  batches: Batch[];
}

export default function AttendanceListClient({ initialAuditRecords, courses, batches }: Props) {
  // -------------------------------------------------------------
  // TOP NAVIGATION TABS: Tab 1 = Course-Wise, Tab 2 = Complete
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'course_wise' | 'complete'>('course_wise');

  // Base Records from database
  const [allRecords] = useState<AttendanceAuditRecord[]>(initialAuditRecords);

  // -------------------------------------------------------------
  // TAB 1: COURSE-WISE ATTENDANCE STATE
  // -------------------------------------------------------------
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('');
  const [courseStartDate, setCourseStartDate] = useState<string>('2026-09-01');
  const [courseEndDate, setCourseEndDate] = useState<string>('2026-09-30');
  const [courseStatusFilter, setCourseStatusFilter] = useState<string>('All');
  const [coursePreset, setCoursePreset] = useState<string>('Last 30 Days');

  // -------------------------------------------------------------
  // TAB 2: COMPLETE ATTENDANCE STATE (Default to today '2026-09-30')
  // -------------------------------------------------------------
  const TODAY_STR = '2026-09-30';
  const [completeStartDate, setCompleteStartDate] = useState<string>(TODAY_STR);
  const [completeEndDate, setCompleteEndDate] = useState<string>(TODAY_STR);
  const [completeSearchQuery, setCompleteSearchQuery] = useState<string>('');
  const [completeStatusFilter, setCompleteStatusFilter] = useState<string>('All');
  const [completePreset, setCompletePreset] = useState<string>('Today');

  // Quick preset helper
  const applyPreset = (preset: string, mode: 'course' | 'complete') => {
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

    if (mode === 'course') {
      setCoursePreset(preset);
      setCourseStartDate(start);
      setCourseEndDate(end);
    } else {
      setCompletePreset(preset);
      setCompleteStartDate(start);
      setCompleteEndDate(end);
    }
  };

  // -------------------------------------------------------------
  // TAB 1 FILTERED RECORDS
  // -------------------------------------------------------------
  const filteredCourseRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // 1. Course match
      if (selectedCourseId && r.course_id !== selectedCourseId) {
        return false;
      }
      // 2. Date range
      if (courseStartDate && r.session_date < courseStartDate) {
        return false;
      }
      if (courseEndDate && r.session_date > courseEndDate) {
        return false;
      }
      // 3. Status filter
      if (courseStatusFilter !== 'All' && r.status !== courseStatusFilter) {
        return false;
      }
      // 4. Search query
      if (courseSearchQuery.trim()) {
        const q = courseSearchQuery.toLowerCase();
        const matchesName = r.student_name.toLowerCase().includes(q);
        const matchesRoll = r.roll_number.toLowerCase().includes(q);
        const matchesBatch = r.batch_name.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesBatch) {
          return false;
        }
      }
      return true;
    });
  }, [allRecords, selectedCourseId, courseStartDate, courseEndDate, courseStatusFilter, courseSearchQuery]);

  // -------------------------------------------------------------
  // TAB 2 FILTERED RECORDS
  // -------------------------------------------------------------
  const filteredCompleteRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // 1. Date range
      if (completeStartDate && r.session_date < completeStartDate) {
        return false;
      }
      if (completeEndDate && r.session_date > completeEndDate) {
        return false;
      }
      // 2. Status filter
      if (completeStatusFilter !== 'All' && r.status !== completeStatusFilter) {
        return false;
      }
      // 3. Search query
      if (completeSearchQuery.trim()) {
        const q = completeSearchQuery.toLowerCase();
        const matchesName = r.student_name.toLowerCase().includes(q);
        const matchesRoll = r.roll_number.toLowerCase().includes(q);
        const matchesCourse = r.course_title.toLowerCase().includes(q);
        const matchesBatch = r.batch_name.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesCourse && !matchesBatch) {
          return false;
        }
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

  const courseStats = useMemo(() => getStats(filteredCourseRecords), [filteredCourseRecords]);
  const completeStats = useMemo(() => getStats(filteredCompleteRecords), [filteredCompleteRecords]);

  // CSV Exporter
  const handleExportCSV = (records: AttendanceAuditRecord[], filenamePrefix: string) => {
    const headers = [
      'Student Name',
      'Roll Number',
      'Course Title',
      'Course Code',
      'Batch Name',
      'Guru / Instructor',
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

  const currentCourse = courses.find(c => c.id === selectedCourseId);

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
              activeTab === 'course_wise' ? filteredCourseRecords : filteredCompleteRecords,
              activeTab === 'course_wise' ? `course_audit_${currentCourse?.title || 'records'}` : 'academy_complete_audit'
            )}
            className="bg-[#590231] hover:bg-[#780442] text-white border border-[#EBB128] px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#F9E33A]" />
            <span>Download CSV Audit</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. TOP TABS SWITCHER (Prominently displayed at top) */}
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
            Organized by Course
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
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Course Selector & Filter Controls */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
            
            {/* Top row: Course Dropdown + Presets */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Select Course to View Attendance:</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                >
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>
                      {crs.title} ({crs.code}) — {crs.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Quick Date Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'All Time'].map((p) => (
                    <button
                      key={p}
                      onClick={() => applyPreset(p, 'course')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        coursePreset === p
                          ? 'bg-[#8A064D] text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom row: Custom Date Range Filter + Search + Status */}
            <div className="pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={courseStartDate}
                  onChange={(e) => {
                    setCourseStartDate(e.target.value);
                    setCoursePreset('Custom');
                  }}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={courseEndDate}
                  onChange={(e) => {
                    setCourseEndDate(e.target.value);
                    setCoursePreset('Custom');
                  }}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status Filter</label>
                <select
                  value={courseStatusFilter}
                  onChange={(e) => setCourseStatusFilter(e.target.value)}
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
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Course Summary Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Audited Records</span>
              <span className="text-xl font-bold text-[#2D041A] mt-1 block">{courseStats.total}</span>
              <span className="text-[10px] text-gray-500">In selected date range</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">{courseStats.present}</span>
              <span className="text-[10px] text-gray-500">Marked present</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Absent</span>
              <span className="text-xl font-bold text-rose-700 mt-1 block">{courseStats.absent}</span>
              <span className="text-[10px] text-gray-500">Unexcused / informed</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Late Arrivals</span>
              <span className="text-xl font-bold text-amber-700 mt-1 block">{courseStats.late}</span>
              <span className="text-[10px] text-gray-500">10-15m delayed</span>
            </div>

            <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-rose-100 shadow-xs">
              <span className="text-[10px] font-bold text-[#8A064D] uppercase tracking-wider block">Attendance Rate</span>
              <span className="text-xl font-bold text-[#8A064D] mt-1 block">{courseStats.rate}%</span>
              <span className="text-[10px] text-[#8A064D]/80">Effective attendance</span>
            </div>
          </div>

          {/* Table of Course Attendance Records */}
          <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8A064D]" />
                <h3 className="font-bold text-xs text-[#2D041A]">
                  Attendance Records for {currentCourse?.title || 'Selected Course'}
                </h3>
                <span className="text-[11px] font-semibold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-full">
                  {filteredCourseRecords.length} Records
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Range: {courseStartDate || 'Start'} to {courseEndDate || 'End'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-100 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student Name & Roll</th>
                    <th className="py-3 px-4">Batch Details</th>
                    <th className="py-3 px-4">Faculty Guru</th>
                    <th className="py-3 px-4">Attendance Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Check-in Verification</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCourseRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold">No attendance records found for this course and date range.</p>
                        <p className="text-[11px] text-gray-400 mt-1">Try expanding the date filter or clearing search.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCourseRecords.map((r) => (
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

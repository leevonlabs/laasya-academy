'use client';

import React, { useState, useMemo } from 'react';
import { GuruAttendanceAuditRecord, Course, Trainer } from '@/lib/academy';
import { 
  GraduationCap, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon,
  Filter, 
  User, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Check, 
  AlertTriangle,
  Award,
  ChevronRight,
  BookOpen,
  MapPin,
  Eye,
  X
} from 'lucide-react';

interface Props {
  initialRecords: GuruAttendanceAuditRecord[];
  courses: Course[];
  trainers: Trainer[];
  isLiveSyncing: boolean;
  onRefresh: () => void;
}

export default function GuruAttendanceTab({
  initialRecords,
  courses,
  trainers,
  isLiveSyncing,
  onRefresh,
}: Props) {
  const [records, setRecords] = useState<GuruAttendanceAuditRecord[]>(initialRecords);

  // Sync internal state if initialRecords changes from parent
  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'present' | 'absent' | 'upcoming'>('all');
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Modal State for individual Guru breakdown
  const [selectedGuruForModal, setSelectedGuruForModal] = useState<GuruAttendanceAuditRecord | null>(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    return records.filter(r => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (r.trainer_name || '').toLowerCase().includes(q);
        const matchesTitle = (r.trainer_title || '').toLowerCase().includes(q);
        const matchesCourse = (r.course_title || '').toLowerCase().includes(q);
        const matchesBatch = (r.batch_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesCourse && !matchesBatch) return false;
      }

      // 2. Trainer Filter
      if (selectedTrainerId !== 'all' && r.trainer_id !== selectedTrainerId) {
        return false;
      }

      // 3. Course Filter
      if (selectedCourseId !== 'all' && r.course_id !== selectedCourseId) {
        return false;
      }

      // 4. Status Filter
      if (selectedStatus !== 'all' && r.guru_status !== selectedStatus) {
        return false;
      }

      // 5. Date Filter Preset
      if (dateFilterPreset === 'today' && r.session_date !== todayStr) {
        return false;
      }
      if (dateFilterPreset === 'week' && r.session_date < weekStr) {
        return false;
      }
      if (dateFilterPreset === 'month' && r.session_date < firstDayOfMonth) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedTrainerId, selectedCourseId, selectedStatus, dateFilterPreset]);

  // Aggregate Statistics
  const stats = useMemo(() => {
    const totalSessions = filteredRecords.length;
    const presentSessions = filteredRecords.filter(r => r.guru_status === 'present').length;
    const absentSessions = filteredRecords.filter(r => r.guru_status === 'absent').length;
    const upcomingSessions = filteredRecords.filter(r => r.guru_status === 'upcoming').length;
    const pastSessions = presentSessions + absentSessions;
    const attendanceRate = pastSessions > 0 ? Math.round((presentSessions / pastSessions) * 100) : 100;

    const uniqueGurus = new Set(filteredRecords.map(r => r.trainer_id).filter(Boolean)).size;

    return {
      totalSessions,
      presentSessions,
      absentSessions,
      upcomingSessions,
      attendanceRate,
      uniqueGurus: uniqueGurus || trainers.length,
    };
  }, [filteredRecords, trainers.length]);

  // CSV Export for Guru Attendance
  const downloadGuruCsv = () => {
    const headers = [
      'Session Date',
      'Start Time',
      'End Time',
      'Guru Name',
      'Guru Title',
      'Course',
      'Batch',
      'Room',
      'Marked Students',
      'Present Students',
      'Absent Students',
      'Enrolled Students',
      'Session Status',
      'Guru Verdict'
    ];

    const rows = filteredRecords.map(r => [
      `"${r.session_date}"`,
      `"${r.start_time}"`,
      `"${r.end_time}"`,
      `"${r.trainer_name}"`,
      `"${r.trainer_title}"`,
      `"${r.course_title}"`,
      `"${r.batch_name}"`,
      `"${r.room_or_hall}"`,
      r.marked_students_count,
      r.present_students_count,
      r.absent_students_count,
      r.total_enrolled,
      `"${r.session_status}"`,
      `"${r.guru_status.toUpperCase()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guru_attendance_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Banner & Actions */}
      <div className="bg-gradient-to-r from-[#590231] via-[#740340] to-[#8A064D] text-white p-6 rounded-3xl shadow-md border border-[#D4AF37]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-white/10 text-[#F9E33A] font-bold text-xs border border-white/20 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Faculty Accountability Protocol</span>
            </span>
            {isLiveSyncing && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Live Sync
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight">
            Guru Attendance & Class Conduct Audit
          </h2>
          <p className="text-xs sm:text-sm text-rose-100/90 max-w-2xl mt-1 leading-relaxed">
            Attendance is strictly verified: A Guru is verified <strong>Present</strong> only when they take student roll-call and close the class session in their login. If roll-call is not recorded or the session is left open, the Guru is marked <strong>Absent</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Refresh Guru Attendance"
          >
            <RefreshCw className={`w-4 h-4 ${isLiveSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={downloadGuruCsv}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F9E33A] hover:brightness-105 text-[#2D041A] px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#2D041A]" />
            <span>Download Guru CSV Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-[#F0D5E4] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Faculty Gurus</p>
            <p className="text-2xl font-black text-[#2D041A] mt-1">{stats.uniqueGurus}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Scheduled</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalSessions}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Conducted (Present)</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats.presentSessions}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Missed (Absent)</p>
            <p className="text-2xl font-black text-rose-700 mt-1">{stats.absentSessions}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{stats.attendanceRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search and Multi-filter Control Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Guru, title, course..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-semibold text-gray-800"
            />
          </div>

          {/* Guru Faculty Filter */}
          <div>
            <select
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
            >
              <option value="all">All Faculty Gurus ({trainers.length})</option>
              {trainers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.full_name} {t.display_title ? `(${t.display_title})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Discipline / Course Filter */}
          <div>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
            >
              <option value="all">All Disciplines ({courses.length})</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present (Conducted & Closed)</option>
              <option value="absent">Absent (Incomplete / Unmarked)</option>
              <option value="upcoming">Scheduled / Upcoming</option>
            </select>
          </div>

          {/* Date Filter Preset */}
          <div className="flex items-center gap-2">
            <select
              value={dateFilterPreset}
              onChange={(e) => setDateFilterPreset(e.target.value as any)}
              className="flex-1 px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
            >
              <option value="all">All Time History</option>
              <option value="today">Today Only</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Current Month</option>
            </select>

            {(searchQuery || selectedTrainerId !== 'all' || selectedCourseId !== 'all' || selectedStatus !== 'all' || dateFilterPreset !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTrainerId('all');
                  setSelectedCourseId('all');
                  setSelectedStatus('all');
                  setDateFilterPreset('all');
                }}
                className="p-2.5 rounded-2xl border border-gray-300 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Guru Attendance Records Table */}
      <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#8A064D]" />
            <h3 className="font-bold text-base text-[#2D041A]">
              Faculty Session Logs & Accountability Ledger
            </h3>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] px-2.5 py-0.5 rounded-full font-black border border-rose-100">
              {filteredRecords.length} Classes
            </span>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing verified session checkpoints
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-gray-800">No Guru Attendance Records Found</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No class sessions match your selected filter criteria. Try adjusting the date range or faculty filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF9FB] text-gray-600 font-bold border-b border-[#F0D5E4]/60 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Session Date & Time</th>
                  <th className="py-3.5 px-5">Faculty Guru</th>
                  <th className="py-3.5 px-5">Discipline & Batch</th>
                  <th className="py-3.5 px-5">Student Roll-Call</th>
                  <th className="py-3.5 px-5">Class Session State</th>
                  <th className="py-3.5 px-5 text-center">Guru Verdict</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((r) => {
                  const isPresent = r.guru_status === 'present';
                  const isAbsent = r.guru_status === 'absent';
                  const isUpcoming = r.guru_status === 'upcoming';

                  return (
                    <tr key={r.session_id} className="hover:bg-[#FFF9FB]/60 transition">
                      {/* 1. Date & Time */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#8A064D]" />
                          <span>{r.session_date}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{r.start_time?.substring(0, 5)} - {r.end_time?.substring(0, 5)}</span>
                        </div>
                      </td>

                      {/* 2. Faculty Guru */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#590231] text-[#F9E33A] font-bold flex items-center justify-center shrink-0 shadow-2xs text-xs">
                            {r.trainer_name?.charAt(0) || 'G'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs">
                              {r.trainer_name}
                            </div>
                            <div className="text-[10px] text-[#8A064D] font-semibold bg-[#FFF2F8] px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                              {r.trainer_title || 'Faculty Guru'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Discipline & Batch */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-800 text-xs">
                          {r.course_title}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <span className="font-medium text-gray-700">{r.batch_name}</span>
                          <span>•</span>
                          <span className="text-gray-400 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {r.room_or_hall || 'Mandapam'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Student Roll-Call */}
                      <td className="py-4 px-5">
                        {r.marked_students_count > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{r.present_students_count} Present • {r.absent_students_count} Absent</span>
                            </span>
                            <div className="text-[10px] text-gray-400">
                              {r.marked_students_count} of {r.total_enrolled || r.marked_students_count} students marked
                            </div>
                          </div>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>Roll-call Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>No Attendance Taken</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Class Session State */}
                      <td className="py-4 px-5">
                        {r.session_status === 'completed' || isPresent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Closed & Alert Sent</span>
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Upcoming Session</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Left Open / Incomplete</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Guru Verdict */}
                      <td className="py-4 px-5 text-center">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>PRESENT</span>
                          </span>
                        ) : isAbsent ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 font-black text-xs shadow-2xs">
                            <XCircle className="w-4 h-4 text-rose-700" />
                            <span>ABSENT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>SCHEDULED</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Action Button */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedGuruForModal(r)}
                          className="px-3 py-1.5 rounded-xl bg-[#FFF2F8] hover:bg-[#FCE7F3] text-[#8A064D] font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer border border-[#F0D5E4]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal: Detailed Session Checkpoint Breakdown */}
      {selectedGuruForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#F0D5E4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#8A064D] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#F9E33A] font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Faculty Attendance Verification</h3>
                  <p className="text-xs text-white/80">Class Checkpoint & Roll-call Verification</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGuruForModal(null)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">Faculty Guru</span>
                  <span className="text-xs font-black text-[#8A064D]">{selectedGuruForModal.trainer_title}</span>
                </div>
                <p className="text-base font-bold text-gray-900">{selectedGuruForModal.trainer_name}</p>
                <p className="text-xs text-gray-600">
                  {selectedGuruForModal.course_title} • {selectedGuruForModal.batch_name} ({selectedGuruForModal.room_or_hall})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-gray-500 font-semibold text-[11px]">Session Date</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedGuruForModal.session_date}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-gray-500 font-semibold text-[11px]">Batch Timings</p>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedGuruForModal.start_time?.substring(0, 5)} - {selectedGuruForModal.end_time?.substring(0, 5)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Accountability Verification</h4>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <span className="text-gray-700 font-medium">1. Students Roll-call Taken:</span>
                  <span className={`font-bold ${selectedGuruForModal.marked_students_count > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedGuruForModal.marked_students_count > 0 
                      ? `Yes (${selectedGuruForModal.marked_students_count} marked)` 
                      : 'No (0 marked)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <span className="text-gray-700 font-medium">2. Class Closed in Guru Login:</span>
                  <span className={`font-bold ${selectedGuruForModal.session_status === 'completed' || selectedGuruForModal.guru_status === 'present' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedGuruForModal.session_status === 'completed' || selectedGuruForModal.guru_status === 'present'
                      ? 'Yes (Class Closed)'
                      : 'No (Incomplete / Open)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <span className="text-gray-700 font-medium">3. Final Guru Attendance:</span>
                  <span className={`font-black uppercase ${
                    selectedGuruForModal.guru_status === 'present' ? 'text-emerald-700' :
                    selectedGuruForModal.guru_status === 'absent' ? 'text-rose-700' : 'text-blue-700'
                  }`}>
                    {selectedGuruForModal.guru_status}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedGuruForModal(null)}
                  className="w-full py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Close Verification Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

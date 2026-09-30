'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon,
  ChevronsLeft,
  ChevronsRight,
  Check,
  User,
  GraduationCap,
  BookOpen,
  Filter,
  Sparkles,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { Course, AttendanceRecord } from '@/lib/academy';

interface Props {
  initialRecords: AttendanceRecord[];
  initialCourses: Course[];
}

// ---------------------------------------------------------------------------
// Realistic Mock Database Seed for rich demonstration across all 18 courses
// ---------------------------------------------------------------------------
const MOCK_COURSES = [
  { id: 'c-1', title: 'Bharathanatyam', category: 'Classical Dance', trainer: 'Guru Smt. Radhika Sharma', batch: 'Batch A (Evening)', enrolled: 42, sessions: 24, rate: 94 },
  { id: 'c-2', title: 'Kuchupudi', category: 'Classical Dance', trainer: 'Guru Smt. Radhika Sharma', batch: 'Weekend Masterclass', enrolled: 28, sessions: 20, rate: 91 },
  { id: 'c-3', title: 'Carnatic Music', category: 'Vocal & Music', trainer: 'Vidwan Sri K. Venkatesh', batch: 'Morning Ragas', enrolled: 35, sessions: 26, rate: 89 },
  { id: 'c-4', title: 'Karatte', category: 'Martial Arts', trainer: 'Sensei Rajesh Varma', batch: 'Dojo Belt Batch', enrolled: 48, sessions: 30, rate: 95 },
  { id: 'c-5', title: 'Violin', category: 'Musical Instruments', trainer: 'Vidwan Sri K. Venkatesh', batch: 'Strings Foundation', enrolled: 22, sessions: 18, rate: 88 },
  { id: 'c-6', title: 'Keyboard', category: 'Musical Instruments', trainer: 'Master Anthony David', batch: 'Western Notation', enrolled: 38, sessions: 22, rate: 92 },
  { id: 'c-7', title: 'Guitar', category: 'Musical Instruments', trainer: 'Master Anthony David', batch: 'Acoustic Fingerstyle', enrolled: 30, sessions: 20, rate: 90 },
  { id: 'c-8', title: 'Yoga', category: 'Modern Dance & Fitness', trainer: 'Acharya Ramanathan', batch: 'Sunrise Asanas', enrolled: 40, sessions: 28, rate: 96 },
  { id: 'c-9', title: 'Drawing', category: 'Fine Arts', trainer: 'Smt. Lakshmi Devi', batch: 'Pencil & Acrylics', enrolled: 32, sessions: 16, rate: 93 },
  { id: 'c-10', title: 'Chess', category: 'Mind Sports', trainer: 'Coach Anand V.', batch: 'Grandmaster Tactics', enrolled: 25, sessions: 22, rate: 92 },
  { id: 'c-11', title: 'Western Dance', category: 'Modern Dance & Fitness', trainer: 'Master Kevin', batch: 'Hip-Hop Juniors', enrolled: 36, sessions: 24, rate: 94 },
  { id: 'c-12', title: 'Zumba', category: 'Modern Dance & Fitness', trainer: 'Master Kevin', batch: 'Cardio Rhythm', enrolled: 34, sessions: 20, rate: 91 },
  { id: 'c-13', title: 'Mohiniyatam', category: 'Classical Dance', trainer: 'Guru Smt. Radhika Sharma', batch: 'Lasya Grace', enrolled: 18, sessions: 16, rate: 89 },
  { id: 'c-14', title: 'Semi Classical', category: 'Classical Dance', trainer: 'Guru Smt. Radhika Sharma', batch: 'Fusion Choreography', enrolled: 26, sessions: 18, rate: 92 },
  { id: 'c-15', title: 'Kalari', category: 'Martial Arts', trainer: 'Sensei Rajesh Varma', batch: 'Meipayattu Flow', enrolled: 20, sessions: 18, rate: 95 },
  { id: 'c-16', title: 'Gymnastic', category: 'Modern Dance & Fitness', trainer: 'Master Kevin', batch: 'Acrobatics Floor', enrolled: 24, sessions: 20, rate: 90 },
  { id: 'c-17', title: 'Art and Craft', category: 'Fine Arts', trainer: 'Smt. Lakshmi Devi', batch: 'Creative Clay & DIY', enrolled: 28, sessions: 16, rate: 94 },
  { id: 'c-18', title: 'Ukulele', category: 'Musical Instruments', trainer: 'Master Anthony David', batch: 'Hawaiian Strumming', enrolled: 16, sessions: 14, rate: 87 }
];

const SEED_STUDENTS = [
  { name: 'Ananya Rao', roll: 'LCA-10021' },
  { name: 'Sneha Reddy', roll: 'LCA-10022' },
  { name: 'Meera Nambiar', roll: 'LCA-10023' },
  { name: 'Kiran Kumar', roll: 'LCA-10024' },
  { name: 'Vikram Sharma', roll: 'LCA-10025' },
  { name: 'Pooja Hegde', roll: 'LCA-10026' },
  { name: 'Rahul Varma', roll: 'LCA-10027' },
  { name: 'Divya Menon', roll: 'LCA-10028' },
  { name: 'Aditya Prasad', roll: 'LCA-10029' },
  { name: 'Kavya Madhavan', roll: 'LCA-10030' },
  { name: 'Rohit Balaji', roll: 'LCA-10031' },
  { name: 'Srinidhi Iyer', roll: 'LCA-10032' },
];

function generateRealisticAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const dates = [
    '2026-09-30', '2026-09-29', '2026-09-28', '2026-09-26', '2026-09-25',
    '2026-09-23', '2026-09-21', '2026-09-18', '2026-09-15', '2026-09-12',
    '2026-09-08', '2026-09-05', '2026-09-01', '2026-08-28', '2026-08-25',
    '2026-08-20', '2026-08-15', '2026-08-10', '2026-07-28', '2026-07-15'
  ];

  let idCounter = 1000;

  MOCK_COURSES.forEach((c) => {
    // Generate records for each student in this course
    SEED_STUDENTS.slice(0, 8).forEach((st, sIndex) => {
      dates.forEach((d, dIndex) => {
        const rand = (sIndex * 7 + dIndex * 13) % 100;
        let status: 'present' | 'absent' | 'late' = 'present';
        let method = 'PIN Check-in (Mobile)';
        let checkInTime = `${d}T17:${(10 + (rand % 15)).toString().padStart(2, '0')}:00Z`;

        if (rand > 88) {
          status = 'absent';
          checkInTime = '';
          method = 'Not Verified';
        } else if (rand > 75) {
          status = 'late';
          checkInTime = `${d}T17:${(25 + (rand % 12)).toString().padStart(2, '0')}:00Z`;
          method = 'Trainer Verified';
        } else if (rand % 3 === 0) {
          method = 'Trainer Verified (Live Roster)';
        }

        records.push({
          id: `rec-${idCounter++}`,
          session_id: `ses-${c.id}-${d}`,
          session_date: d,
          batch_name: c.batch,
          course_title: c.title,
          student_id: `st-${st.roll}`,
          student_name: st.name,
          roll_number: st.roll,
          status: status,
          check_in_time: checkInTime || null,
          check_in_method: method,
          remarks: status === 'present' ? 'Attended full session' : status === 'late' ? 'Late arrival (15m)' : 'Informed absence',
        });
      });
    });
  });

  return records;
}

export default function AttendanceListClient({ initialRecords, initialCourses }: Props) {
  // Merge initial records with seed to ensure complete coverage for all courses
  const allRecords = useMemo(() => {
    const generated = generateRealisticAttendance();
    const existingIds = new Set(initialRecords.map((r) => r.id));
    const combined = [...initialRecords, ...generated.filter((g) => !existingIds.has(g.id))];
    return combined;
  }, [initialRecords]);

  // Merge courses
  const courses = useMemo(() => {
    if (initialCourses && initialCourses.length > 0) {
      return MOCK_COURSES.map(mock => {
        const match = initialCourses.find(c => c.title.toLowerCase() === mock.title.toLowerCase());
        return match ? { ...mock, id: match.id, title: match.title, category: match.category } : mock;
      });
    }
    return MOCK_COURSES;
  }, [initialCourses]);

  // Selected states
  const [selectedCourse, setSelectedCourse] = useState<string>('Bharathanatyam');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'present' | 'absent' | 'late'>('All');

  // ---------------------------------------------------------------------------
  // Date Range Popover State (Matching Reference Image 1)
  // ---------------------------------------------------------------------------
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [quickSelect, setQuickSelect] = useState<string>('Last 30 Days');
  const [pickerYear, setPickerYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('Sep'); // Month abbreviation
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsDatePopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active date boundaries based on quickSelect or selectedMonth
  const activeDateRange = useMemo(() => {
    const now = new Date(2026, 8, 30); // 30 Sep 2026 reference date
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
    // All Time
    return { start: '2020-01-01', end: '2030-12-31', label: 'All Records' };
  }, [quickSelect, pickerYear, selectedMonth]);

  // Filter records based on selected course, student, status, search query, and date range
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // 1. Course Filter
      if (selectedCourse !== 'ALL' && r.course_title.toLowerCase() !== selectedCourse.toLowerCase()) {
        return false;
      }
      // 2. Student Filter
      if (selectedStudent !== 'All' && r.student_name !== selectedStudent && r.roll_number !== selectedStudent) {
        return false;
      }
      // 3. Status Filter
      if (statusFilter !== 'All' && r.status !== statusFilter) {
        return false;
      }
      // 4. Date Range Filter
      if (activeDateRange.start && activeDateRange.end) {
        if (r.session_date < activeDateRange.start || r.session_date > activeDateRange.end) {
          return false;
        }
      }
      // 5. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = r.student_name.toLowerCase().includes(query);
        const matchesRoll = r.roll_number.toLowerCase().includes(query);
        const matchesBatch = r.batch_name.toLowerCase().includes(query);
        const matchesCourse = r.course_title.toLowerCase().includes(query);
        if (!matchesName && !matchesRoll && !matchesBatch && !matchesCourse) {
          return false;
        }
      }
      return true;
    });
  }, [allRecords, selectedCourse, selectedStudent, statusFilter, activeDateRange, searchQuery]);

  // Compute available students for the selected course
  const courseStudents = useMemo(() => {
    const studentMap = new Map<string, string>();
    allRecords
      .filter((r) => selectedCourse === 'ALL' || r.course_title.toLowerCase() === selectedCourse.toLowerCase())
      .forEach((r) => {
        studentMap.set(r.student_name, r.roll_number);
      });
    return Array.from(studentMap.entries()).map(([name, roll]) => ({ name, roll }));
  }, [allRecords, selectedCourse]);

  // Statistics for currently viewed records
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

    // UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeCourse = selectedCourse.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `laasya_attendance_audit_${safeCourse}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentCourseObj = courses.find(c => c.title.toLowerCase() === selectedCourse.toLowerCase());

  return (
    <div className="space-y-6">

      {/* =================================================================== */}
      {/* 1. PAGE HEADER */}
      {/* =================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#590231] text-[#F9E33A]">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-[#2D041A]">Attendance Audit</h1>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-3 py-1 rounded-full font-bold">
              {courses.length} Academy Courses
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Audit and verify live student attendance, check-in methods, and presence logs across all academy courses.
          </p>
        </div>

        {/* Global Action / Export CSV */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="bg-[#590231] hover:bg-[#780442] text-white border border-[#EBB128] px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#F9E33A]" />
            <span>Download CSV Audit</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. AVAILABLE COURSES AS CARDS (Selectable) */}
      {/* =================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8A064D]" />
            <h2 className="text-sm font-bold text-[#2D041A] uppercase tracking-wider">
              Select Course to Audit Records
            </h2>
            <span className="text-[11px] text-gray-400">
              (Click a card to filter students & records)
            </span>
          </div>
          <button
            onClick={() => setSelectedCourse('ALL')}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              selectedCourse === 'ALL'
                ? 'bg-[#8A064D] text-white'
                : 'text-gray-500 hover:text-[#8A064D] hover:bg-gray-100'
            }`}
          >
            View All Courses
          </button>
        </div>

        {/* Horizontal Scrollable Course Cards Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {courses.map((course) => {
            const isSelected = selectedCourse.toLowerCase() === course.title.toLowerCase();
            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course.title)}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#FFF5F9] via-white to-[#FFF0F5] border-[#EBB128] ring-2 ring-[#EBB128] shadow-md scale-[1.01]'
                    : 'bg-white border-[#F0D5E4] hover:border-[#8A064D]/50 hover:shadow-xs hover:bg-[#FFFDFC]'
                }`}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <span className="absolute top-3 right-3 bg-[#EBB128] text-[#250216] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Check className="w-3 h-3" />
                    Selected
                  </span>
                )}

                <div>
                  {/* Category Pill */}
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FFF2F8] text-[#8A064D] border border-rose-100 mb-2">
                    {course.category}
                  </span>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-[#2D041A] leading-snug line-clamp-1">
                    {course.title}
                  </h3>

                  {/* Trainer */}
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-[#8A064D]" />
                    <span className="truncate">{course.trainer}</span>
                  </p>
                </div>

                {/* Metrics Bar */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-600 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                    <span>{course.enrolled} Students</span>
                  </div>

                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded-md ${
                    course.rate >= 90
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {course.rate}% Attendance
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. AUDIT CONTROLS & FILTER BAR */}
      {/* =================================================================== */}
      <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
        
        {/* Top Control Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Active Course Banner */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#590231] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {selectedCourse === 'ALL' ? 'ALL' : selectedCourse.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#2D041A]">
                  {selectedCourse === 'ALL' ? 'All Academy Courses' : selectedCourse}
                </h3>
                {currentCourseObj && (
                  <span className="text-[11px] bg-rose-50 text-[#8A064D] px-2 py-0.5 rounded-md font-semibold border border-rose-100">
                    {currentCourseObj.batch}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {currentCourseObj ? `Guru: ${currentCourseObj.trainer} · ${courseStudents.length} Students Enrolled` : 'All Batches Combined'}
              </p>
            </div>
          </div>

          {/* Filter Inputs Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 hover:bg-white focus:bg-white border border-[#F0D5E4] rounded-xl text-xs w-48 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
              />
            </div>

            {/* Filter by Student Selector */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="py-1.5 px-3 bg-white border border-[#F0D5E4] rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8A064D] cursor-pointer"
              >
                <option value="All">All Students ({courseStudents.length})</option>
                {courseStudents.map((st) => (
                  <option key={st.roll} value={st.name}>
                    {st.name} ({st.roll})
                  </option>
                ))}
              </select>
            </div>

            {/* ============================================================= */}
            {/* DATE RANGE FILTER POPOVER (Reference Image 1 Replica) */}
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

              {/* Popover Dropdown matching Reference Image 1 */}
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

                    {/* All Time / Clear Button */}
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
                    {/* Year Header with << and >> navigation */}
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

                    {/* 3x4 Month Grid */}
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

            {/* Reset Filters Button */}
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

        {/* Status Filter Tabs & Summary Counter */}
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

          {/* Quick Attendance Score */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-600">Present: <strong className="text-gray-800">{stats.present}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-gray-600">Late: <strong className="text-gray-800">{stats.late}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-gray-600">Absent: <strong className="text-gray-800">{stats.absent}</strong></span>
            </div>
            <div className="pl-2 border-l border-gray-200">
              <span className="text-[#8A064D] font-bold">{stats.rate}% Verified</span>
            </div>
          </div>

        </div>

      </div>

      {/* =================================================================== */}
      {/* 4. ATTENDANCE RECORDS TABLE */}
      {/* =================================================================== */}
      <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[11px] font-bold uppercase tracking-wider text-[#8A064D]">
                <th className="py-4 px-6">Student & Roll No</th>
                <th className="py-4 px-6">Course & Batch</th>
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
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <ClipboardCheck className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="font-semibold text-gray-600">No attendance records match this criteria</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try choosing a different date range, course, or clearing the student filter.</p>
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

                      {/* Course & Batch */}
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-gray-800">{r.course_title}</div>
                        <div className="text-[11px] text-gray-500">{r.batch_name}</div>
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
          <span>Showing <strong>{filteredRecords.length}</strong> of <strong>{allRecords.length}</strong> total attendance entries</span>
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

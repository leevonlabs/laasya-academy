'use client';

import React, { useState, useMemo } from 'react';
import { GuruAttendanceAuditRecord, Course, Trainer } from '@/lib/academy';
import CourseMultiSearchSelect, { CourseOption } from '@/components/common/CourseMultiSearchSelect';
import BatchMultiSearchSelect, { BatchOption } from '@/components/common/BatchMultiSearchSelect';
import TrainerMultiSearchSelect, { TrainerOption } from '@/components/common/TrainerMultiSearchSelect';
import MonthPicker from '@/components/common/MonthPicker';
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
Check, 
  AlertTriangle,
  Award,
  ChevronRight,
  BookOpen,
  MapPin,
  Eye,
  X,
  ArrowLeft,
  Layers,
  RotateCcw,
  CheckCircle,
  Phone,
  Mail
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

  // Fetch tally classes for rescheduled / extra classes count
  const [tallyClasses, setTallyClasses] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/tally-classes')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.classes)) {
          setTallyClasses(data.classes);
        }
      })
      .catch(err => console.warn('Could not fetch tally classes for guru attendance stats:', err));
  }, []);

  // LEVEL 1 vs LEVEL 2 Navigation State
  // selectedGuruId: null = Guru Grid View (Level 1)
  // selectedGuruId: string = Dedicated Guru Attendance Detail View (Level 2)
  const [selectedGuruId, setSelectedGuruId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // LEVEL 1: GRID FILTERS STATE (Searchable Multi-Select Course, Batch, Guru)
  // ---------------------------------------------------------------------------
  const [gridSearchQuery, setGridSearchQuery] = useState('');
  const [gridSelectedGuruIds, setGridSelectedGuruIds] = useState<string[]>([]);
  const [gridSelectedCourseIds, setGridSelectedCourseIds] = useState<string[]>([]);
  const [gridSelectedBatchIds, setGridSelectedBatchIds] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // LEVEL 2: DEDICATED GURU VIEW FILTERS STATE
  // ---------------------------------------------------------------------------
  const [detailSelectedCourseIds, setDetailSelectedCourseIds] = useState<string[]>([]);
  const [detailSelectedBatchIds, setDetailSelectedBatchIds] = useState<string[]>([]);
  const [detailStatusFilter, setDetailStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [detailDatePreset, setDetailDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [detailMonthLabel, setDetailMonthLabel] = useState('');
  const [detailYearMonth, setDetailYearMonth] = useState('');
  const [detailStartDate, setDetailStartDate] = useState('');
  const [detailEndDate, setDetailEndDate] = useState('');
  const [detailSearchQuery, setDetailSearchQuery] = useState('');

  // Modal State for session verification checkpoint
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<GuruAttendanceAuditRecord | null>(null);

  // ---------------------------------------------------------------------------
  // GURU TO RECORDS MAP & HELPER FUNCTIONS
  // ---------------------------------------------------------------------------
  const recordsByTrainerId = useMemo(() => {
    const map = new Map<string, GuruAttendanceAuditRecord[]>();
    for (const r of records) {
      if (!r.trainer_id) continue;
      const list = map.get(r.trainer_id) || [];
      list.push(r);
      map.set(r.trainer_id, list);
    }
    return map;
  }, [records]);

  const getTrainerRecords = (trainer: Trainer): GuruAttendanceAuditRecord[] => {
    const list = recordsByTrainerId.get(trainer.id);
    if (list && list.length > 0) return list;
    // Fallback: match by lower-cased name
    const qName = trainer.full_name?.toLowerCase().trim();
    if (!qName) return [];
    return records.filter(r => r.trainer_name?.toLowerCase().trim() === qName);
  };

  const getTrainerCourses = (trainer: Trainer, trainerRecs: GuruAttendanceAuditRecord[]): string[] => {
    const courseTitles = new Set<string>();
    // From records
    for (const r of trainerRecs) {
      if (r.course_title) courseTitles.add(r.course_title);
    }
    // From assigned batches
    if (trainer.assigned_batches && Array.isArray(trainer.assigned_batches)) {
      for (const b of trainer.assigned_batches) {
        if (b.course_title) courseTitles.add(b.course_title);
      }
    }
    // From specializations
    if (trainer.specializations && Array.isArray(trainer.specializations)) {
      for (const s of trainer.specializations) {
        if (s && s.trim()) courseTitles.add(s.trim());
      }
    }
    return Array.from(courseTitles);
  };

  // ---------------------------------------------------------------------------
  // GLOBAL KPIS ACROSS ALL GURUS
  // ---------------------------------------------------------------------------
  const globalStats = useMemo(() => {
    const totalSessions = records.length;
    const presentSessions = records.filter(r => r.guru_status === 'present').length;
    const absentSessions = records.filter(r => r.guru_status === 'absent').length;
    const pastSessions = presentSessions + absentSessions;
    const complianceRate = pastSessions > 0 ? Math.round((presentSessions / pastSessions) * 100) : 100;

    return {
      totalGurus: trainers.length,
      totalSessions,
      presentSessions,
      absentSessions,
      complianceRate,
    };
  }, [records, trainers.length]);

  // ---------------------------------------------------------------------------
  // LEVEL 1: FILTER OPTIONS (COURSES, BATCHES, GURUS)
  // ---------------------------------------------------------------------------
  const level1CourseOptions: CourseOption[] = useMemo(() => {
    return courses.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category
    }));
  }, [courses]);

  const level1BatchOptions: BatchOption[] = useMemo(() => {
    const batchMap = new Map<string, BatchOption>();
    for (const r of records) {
      if (r.batch_id && r.batch_name) {
        batchMap.set(r.batch_id, {
          id: r.batch_id,
          name: r.batch_name,
          course_id: r.course_id,
          course_title: r.course_title
        });
      }
    }
    for (const t of trainers) {
      if (t.assigned_batches && Array.isArray(t.assigned_batches)) {
        for (const b of t.assigned_batches) {
          if (b.id && b.name) {
            batchMap.set(b.id, {
              id: b.id,
              name: b.name,
              course_id: b.course_id,
              course_title: b.course_title
            });
          }
        }
      }
    }
    return Array.from(batchMap.values());
  }, [records, trainers]);

  const level1TrainerOptions: TrainerOption[] = useMemo(() => {
    return trainers.map(t => ({
      id: t.id,
      full_name: t.full_name,
      display_title: t.display_title,
      specialization: (t.specializations || []).join(', ')
    }));
  }, [trainers]);

  // ---------------------------------------------------------------------------
  // FILTERED GURUS FOR LEVEL 1 GRID
  // ---------------------------------------------------------------------------
  const filteredGurus = useMemo(() => {
    return trainers.filter(trainer => {
      const trainerRecs = getTrainerRecords(trainer);
      const coursesTaught = getTrainerCourses(trainer, trainerRecs);

      // 1. Guru Filter (Multi-select)
      if (gridSelectedGuruIds.length > 0 && !gridSelectedGuruIds.includes(trainer.id)) {
        return false;
      }

      // 2. Course Filter (Multi-select)
      if (gridSelectedCourseIds.length > 0) {
        const selectedCourses = courses.filter(c => gridSelectedCourseIds.includes(c.id));
        const teachesAny = selectedCourses.some(sc =>
          coursesTaught.some(ct => ct.toLowerCase().includes(sc.title.toLowerCase()) || sc.title.toLowerCase().includes(ct.toLowerCase())) ||
          trainerRecs.some(r => gridSelectedCourseIds.includes(r.course_id))
        );
        if (!teachesAny) return false;
      }

      // 3. Batch Filter (Multi-select)
      if (gridSelectedBatchIds.length > 0) {
        const teachesBatch =
          (trainer.assigned_batches && trainer.assigned_batches.some(b => gridSelectedBatchIds.includes(b.id))) ||
          trainerRecs.some(r => gridSelectedBatchIds.includes(r.batch_id));
        if (!teachesBatch) return false;
      }

      // 4. Text Search
      if (gridSearchQuery.trim()) {
        const q = gridSearchQuery.toLowerCase();
        const matchesName = (trainer.full_name || '').toLowerCase().includes(q);
        const matchesTitle = (trainer.display_title || '').toLowerCase().includes(q);
        const matchesCourse = coursesTaught.some(c => c.toLowerCase().includes(q));
        if (!matchesName && !matchesTitle && !matchesCourse) return false;
      }

      return true;
    });
  }, [trainers, gridSelectedGuruIds, gridSelectedCourseIds, gridSelectedBatchIds, gridSearchQuery, courses, recordsByTrainerId]);

  // ---------------------------------------------------------------------------
  // LEVEL 2: CURRENT GURU & FILTERED DATE-WISE RECORDS
  // ---------------------------------------------------------------------------
  const currentGuru = useMemo(() => {
    if (!selectedGuruId) return null;
    return trainers.find(t => t.id === selectedGuruId) || null;
  }, [selectedGuruId, trainers]);

  const currentGuruAllRecords = useMemo(() => {
    if (!currentGuru) return [];
    return getTrainerRecords(currentGuru);
  }, [currentGuru, recordsByTrainerId]);

  // Course Options for this Guru
  const guruCourseOptions: CourseOption[] = useMemo(() => {
    if (!currentGuru) return [];
    const courseMap = new Map<string, { id: string; title: string; category?: string }>();
    
    // Check records
    for (const r of currentGuruAllRecords) {
      if (r.course_id && r.course_title) {
        courseMap.set(r.course_id, { id: r.course_id, title: r.course_title });
      }
    }
    // Check academy courses matching specializations
    for (const c of courses) {
      const match = currentGuru.specializations?.some(s => s.toLowerCase() === c.title.toLowerCase());
      if (match) {
        courseMap.set(c.id, { id: c.id, title: c.title, category: c.category });
      }
    }
    // If empty fallback to all academy courses
    if (courseMap.size === 0) {
      courses.forEach(c => courseMap.set(c.id, { id: c.id, title: c.title, category: c.category }));
    }

    return Array.from(courseMap.values());
  }, [currentGuru, currentGuruAllRecords, courses]);

  // Batch Options for this Guru
  const guruBatchOptions: BatchOption[] = useMemo(() => {
    if (!currentGuru) return [];
    const batchMap = new Map<string, BatchOption>();
    
    for (const r of currentGuruAllRecords) {
      if (r.batch_id && r.batch_name) {
        batchMap.set(r.batch_id, {
          id: r.batch_id,
          name: r.batch_name,
          course_id: r.course_id,
          course_title: r.course_title
        });
      }
    }

    // Also check assigned batches in trainer object
    if (currentGuru.assigned_batches && Array.isArray(currentGuru.assigned_batches)) {
      for (const b of currentGuru.assigned_batches) {
        if (b.id && b.name) {
          batchMap.set(b.id, {
            id: b.id,
            name: b.name,
            course_id: b.course_id,
            course_title: b.course_title
          });
        }
      }
    }

    return Array.from(batchMap.values());
  }, [currentGuru, currentGuruAllRecords]);

  // Date Presets Handler
  const applyDatePreset = (preset: 'all' | 'today' | 'yesterday' | 'week' | 'month') => {
    setDetailDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setDetailStartDate('');
      setDetailEndDate('');
    } else if (preset === 'today') {
      setDetailStartDate(todayStr);
      setDetailEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setDetailStartDate(yestStr);
      setDetailEndDate(yestStr);
    } else if (preset === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setDetailStartDate(weekAgo.toISOString().split('T')[0]);
      setDetailEndDate(todayStr);
    } else if (preset === 'month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setDetailStartDate(firstOfMonth.toISOString().split('T')[0]);
      setDetailEndDate(todayStr);
    }
  };

  // Filtered Records for Level 2 (Dedicated Guru View)
  const currentGuruFilteredRecords = useMemo(() => {
    return currentGuruAllRecords.filter(r => {
      // 1. Course Filter (Multi-select)
      if (detailSelectedCourseIds.length > 0) {
        if (!detailSelectedCourseIds.includes(r.course_id)) return false;
      }

      // 2. Batch Filter (Multi-select)
      if (detailSelectedBatchIds.length > 0) {
        if (!detailSelectedBatchIds.includes(r.batch_id)) return false;
      }

      // 3. Status Filter
      if (detailStatusFilter !== 'all') {
        if (r.guru_status !== detailStatusFilter) return false;
      }

      // 4. Date Range Filter (via MonthPicker)
      if (detailYearMonth && r.session_date) {
        if (!r.session_date.startsWith(detailYearMonth)) return false;
      } else {
        if (detailStartDate && r.session_date < detailStartDate) return false;
        if (detailEndDate && r.session_date > detailEndDate) return false;
      }

      // 5. Search Text
      if (detailSearchQuery.trim()) {
        const q = detailSearchQuery.toLowerCase();
        const mBatch = (r.batch_name || '').toLowerCase().includes(q);
        const mCourse = (r.course_title || '').toLowerCase().includes(q);
        const mRoom = (r.room_or_hall || '').toLowerCase().includes(q);
        if (!mBatch && !mCourse && !mRoom) return false;
      }

      return true;
    }).sort((a, b) => b.session_date.localeCompare(a.session_date));
  }, [
    currentGuruAllRecords,
    detailSelectedCourseIds,
    detailSelectedBatchIds,
    detailStatusFilter,
    detailYearMonth,
    detailStartDate,
    detailEndDate,
    detailSearchQuery
  ]);

  // KPIs for the selected Guru
  const currentGuruStats = useMemo(() => {
    const present = currentGuruFilteredRecords.filter(r => r.guru_status === 'present').length;
    // missed is total absent classes [only guru absent not academy holidays]
    const absent = currentGuruFilteredRecords.filter(r => r.guru_status === 'absent').length;
    const extra = tallyClasses.filter(tc => 
      (currentGuru?.id && tc.trainer_id === currentGuru.id) ||
      (currentGuru?.full_name && tc.trainer_name && tc.trainer_name.toLowerCase().trim() === currentGuru.full_name.toLowerCase().trim())
    ).length;
    // conducted is total classes held in that month [including extra(reschedule class)]
    const conducted = present + extra;
    const total = conducted + absent;
    const past = present + absent;
    const complianceRate = past > 0 ? Math.round((present / past) * 100) : 100;
    const totalStudentsRollCall = currentGuruFilteredRecords.reduce((acc, r) => acc + (r.marked_students_count || 0), 0);

    return {
      total,
      present,
      conducted,
      absent,
      extra,
      complianceRate,
      totalStudentsRollCall
    };
  }, [currentGuruFilteredRecords, currentGuru, tallyClasses]);

  // CSV Export for Single Guru
  const downloadSingleGuruCsv = () => {
    if (!currentGuru) return;
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Course',
      'Batch',
      'Room/Hall',
      'Roll-Call Count',
      'Present Students',
      'Absent Students',
      'Total Enrolled',
      'Guru Verdict'
    ];

    const rows = currentGuruFilteredRecords.map(r => [
      `"${r.session_date}"`,
      `"${r.start_time}"`,
      `"${r.end_time}"`,
      `"${r.course_title}"`,
      `"${r.batch_name}"`,
      `"${r.room_or_hall}"`,
      r.marked_students_count,
      r.present_students_count,
      r.absent_students_count,
      r.total_enrolled,
      `"${r.guru_status.toUpperCase()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guru_audit_${currentGuru.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset detail filters
  const resetDetailFilters = () => {
    setDetailSelectedCourseIds([]);
    setDetailSelectedBatchIds([]);
    setDetailStatusFilter('all');
    setDetailDatePreset('all');
    setDetailMonthLabel('');
    setDetailYearMonth('');
    setDetailStartDate('');
    setDetailEndDate('');
    setDetailSearchQuery('');
  };

  // ---------------------------------------------------------------------------
  // RENDER LEVEL 2: DEDICATED GURU ATTENDANCE DETAILS VIEW
  // ---------------------------------------------------------------------------
  if (selectedGuruId && currentGuru) {
    const guruCourses = getTrainerCourses(currentGuru, currentGuruAllRecords);
    const avatar = currentGuru.avatar_url;

    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        
        {/* 1. Header Navigation & Guru Identity Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedGuruId(null);
                resetDetailFilters();
              }}
              className="px-3.5 py-2 bg-gray-100 hover:bg-[#8A064D] hover:text-white rounded-xl text-gray-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Return to Guru Roster Grid"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Gurus</span>
            </button>

            <div className="h-6 w-px bg-gray-200" />

            {/* Guru Avatar & Profile */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-rose-100 shrink-0">
                {avatar && avatar.trim().length > 0 ? (
                  <img
                    src={avatar}
                    alt={currentGuru.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#590231] text-[#F9E33A] flex items-center justify-center font-bold text-sm">
                    {currentGuru.full_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#2D041A]">
                    {currentGuru.full_name}
                  </h2>
                  <span className="text-[10px] bg-[#FFF2F8] text-[#8A064D] border border-rose-100 px-2 py-0.5 rounded-md font-bold">
                    {currentGuru.display_title || 'Faculty Guru'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-[11px] text-gray-500 font-semibold mr-1">Disciplines:</span>
                  {guruCourses.map(c => (
                    <span key={c} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 transition cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={downloadSingleGuruCsv}
              className="bg-[#590231] hover:bg-[#780442] text-white border border-[#EBB128] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F9E33A]" />
              <span>Export Guru Audit CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Guru Individual KPIs: Conducted, Missed, Extra Only */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Conducted (Held)</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{currentGuruStats.conducted}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Classes held this month (incl. extra)</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Missed (Absent)</p>
            <p className="text-2xl font-black text-rose-700 mt-0.5">{currentGuruStats.absent}</p>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Guru absence only (excl. holidays)</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Extra (Rescheduled)</p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{currentGuruStats.extra}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Rescheduled extra classes</p>
          </div>
        </div>

        {/* 3. Comprehensive Filter Toolbar */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
          
          {/* Top Line: Title & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <h4 className="font-bold text-sm text-[#2D041A] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#8A064D]" />
              <span>Filter Faculty Attendance Records</span>
            </h4>

            {(detailSelectedCourseIds.length > 0 || detailSelectedBatchIds.length > 0 || detailStatusFilter !== 'all' || detailMonthLabel || detailSearchQuery) && (
              <button
                onClick={resetDetailFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Multi-selection Searchable Course Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Course Filter (Multi)
              </label>
              <CourseMultiSearchSelect
                courses={guruCourseOptions}
                selectedIds={detailSelectedCourseIds}
                onChange={setDetailSelectedCourseIds}
                placeholder="All Courses (Multi)"
              />
            </div>

            {/* 2. Multi-selection Searchable Batch Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Batch Filter (Multi)
              </label>
              <BatchMultiSearchSelect
                batches={guruBatchOptions}
                selectedIds={detailSelectedBatchIds}
                onChange={setDetailSelectedBatchIds}
                placeholder="All Batches (Multi)"
              />
            </div>

            {/* 3. Month & Year Filter (MonthPicker from Reference Image 2) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Month & Year
              </label>
              <MonthPicker
                value={detailMonthLabel}
                onChange={(label, ym, start, end) => {
                  setDetailMonthLabel(label);
                  setDetailYearMonth(ym);
                  setDetailStartDate(start);
                  setDetailEndDate(end);
                }}
                align="left"
                className="w-full"
                triggerClassName="w-full justify-between"
                placeholder="All Months & Years"
              />
            </div>

            {/* 4. Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={detailStatusFilter}
                onChange={(e) => setDetailStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#8A064D] focus:bg-white cursor-pointer transition shadow-2xs"
              >
                <option value="all">All Verdicts</option>
                <option value="present">Present (Conducted & Closed)</option>
                <option value="absent">Absent (Missed Roll-call)</option>
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Quick search batch name, course title, hall or room..."
                value={detailSearchQuery}
                onChange={(e) => setDetailSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] font-medium"
              />
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Showing <strong className="text-[#8A064D] font-bold">{currentGuruFilteredRecords.length}</strong> sessions
            </div>
          </div>

        </div>

        {/* 4. Date-wise Attendance Table */}
        <div className="bg-white rounded-2xl border border-[#F0D5E4] shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-[#2D041A] flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[#8A064D]" />
              <span>Date-Wise Attendance History ({currentGuruFilteredRecords.length} Sessions)</span>
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">
              Verified Present = Roll-call marked & closed in Guru login
            </span>
          </div>

          {currentGuruFilteredRecords.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-xs space-y-2">
              <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700">No attendance sessions match the current filters.</p>
              <button
                onClick={resetDetailFilters}
                className="text-xs text-[#8A064D] font-bold hover:underline cursor-pointer"
              >
                Reset filters to view all sessions
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Timings & Hall</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Student Roll-Call</th>
                    <th className="py-3 px-4">Guru Attendance</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentGuruFilteredRecords.map((r) => {
                    const isPresent = r.guru_status === 'present';
                    const isAbsent = r.guru_status === 'absent';

                    return (
                      <tr key={r.session_id} className="hover:bg-rose-50/30 transition-colors">
                        {/* 1. Date */}
                        <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                          {r.session_date}
                        </td>

                        {/* 2. Timings & Hall */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-800">
                            {r.start_time?.substring(0, 5)} - {r.end_time?.substring(0, 5)}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-[#8A064D]" />
                            <span>{r.room_or_hall || 'Natya Mandapam'}</span>
                          </div>
                        </td>

                        {/* 3. Course */}
                        <td className="py-3 px-4 font-bold text-[#8A064D]">
                          {r.course_title}
                        </td>

                        {/* 4. Batch */}
                        <td className="py-3 px-4 font-semibold text-gray-700">
                          {r.batch_name}
                        </td>

                        {/* 5. Student Roll-Call */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-md font-bold text-xs bg-gray-50 text-gray-800 border border-gray-200 tabular-nums">
                              <span className="text-[#8A064D] font-extrabold">{r.total_enrolled}</span> Total / <span className="text-rose-600 font-extrabold">{r.absent_students_count}</span> Absent
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {r.present_students_count} Present • {r.absent_students_count} Absent
                          </div>
                        </td>

                        {/* 6. Guru Attendance Status */}
                        <td className="py-3 px-4">
                          {isPresent && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Present</span>
                            </span>
                          )}
                          {isAbsent && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3.5 h-3.5 text-rose-700" />
                              <span>Absent</span>
                            </span>
                          )}
                          {r.guru_status === 'holiday' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
                              <span>🎉</span>
                              <span>Admin Holiday (Excused)</span>
                            </span>
                          )}
                        </td>

                        {/* 8. Action Checkpoint */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedSessionForModal(r)}
                            className="px-2.5 py-1 rounded-lg bg-[#FFF2F8] hover:bg-[#FCE7F3] text-[#8A064D] font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer border border-[#F0D5E4]"
                            title="View Audit Checkpoint Details"
                          >
                            <Eye className="w-3 h-3" />
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

        {/* Modal: Checkpoint Details */}
        {selectedSessionForModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-[#F0D5E4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#8A064D] text-white p-4.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#F9E33A] font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Class Verification Checkpoint</h3>
                    <p className="text-[11px] text-white/80">Accountability Roll-Call Audit</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSessionForModal(null)}
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="bg-[#FFF9FB] p-3.5 rounded-xl border border-[#F0D5E4] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Faculty Guru</span>
                    <span className="text-xs font-black text-[#8A064D]">{selectedSessionForModal.trainer_title}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedSessionForModal.trainer_name}</p>
                  <p className="text-xs text-gray-600">
                    {selectedSessionForModal.course_title} • {selectedSessionForModal.batch_name} ({selectedSessionForModal.room_or_hall})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-gray-500 text-[10px] font-bold uppercase">Session Date</p>
                    <p className="font-bold text-gray-900 mt-0.5">{selectedSessionForModal.session_date}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-gray-500 text-[10px] font-bold uppercase">Batch Timings</p>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {selectedSessionForModal.start_time?.substring(0, 5)} - {selectedSessionForModal.end_time?.substring(0, 5)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Accountability Verdict Rules</h4>
                  
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-gray-700 font-medium">1. Students Roll-call Marked:</span>
                    <span className={`font-bold ${selectedSessionForModal.marked_students_count > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedSessionForModal.marked_students_count > 0 
                        ? `Yes (${selectedSessionForModal.marked_students_count} marked)` 
                        : 'No (0 marked)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-gray-700 font-medium">2. Class Closed in Login:</span>
                    <span className={`font-bold ${selectedSessionForModal.session_status === 'completed' || selectedSessionForModal.guru_status === 'present' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedSessionForModal.session_status === 'completed' || selectedSessionForModal.guru_status === 'present'
                        ? 'Yes (Class Closed)'
                        : 'No (Incomplete / Open)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-gray-700 font-medium">3. Final Guru Attendance:</span>
                    <span className={`font-black uppercase ${
                      selectedSessionForModal.guru_status === 'present' ? 'text-emerald-700' :
                      selectedSessionForModal.guru_status === 'absent' ? 'text-rose-700' : 'text-blue-700'
                    }`}>
                      {selectedSessionForModal.guru_status}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedSessionForModal(null)}
                    className="w-full py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER LEVEL 1: GURU GRID VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#590231] via-[#740340] to-[#8A064D] text-white p-5 rounded-2xl shadow-xs border border-[#D4AF37]/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#F9E33A] font-bold text-[10px] border border-white/20 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Guru Roster & Accountability Protocol</span>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Faculty Guru Attendance & Class Roll-Call Audit
          </h2>
          <p className="text-xs text-rose-100/90 max-w-2xl mt-0.5 leading-relaxed">
            Faculty attendance is recorded based on current class session statuses and student roll-calls. Click <strong>View Attendance Details</strong> on any Guru card to view their complete session audit.
          </p>
        </div>

      </div>

      {/* 2. Global KPIs Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#F4EAEF] p-3.5 rounded-2xl border border-[#D4BAC7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#6E3955] uppercase tracking-wider">Faculty Gurus</p>
            <p className="text-xl font-black text-[#2D041A] mt-0.5">{globalStats.totalGurus}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#EBD4E0] text-[#8A064D] flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#F4EAEF] p-3.5 rounded-2xl border border-[#D4BAC7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#6E3955] uppercase tracking-wider">Total Classes</p>
            <p className="text-xl font-black text-[#2D041A] mt-0.5">{globalStats.totalSessions}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#EBD4E0] text-[#590231] flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#F4EAEF] p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Conducted (Present)</p>
            <p className="text-xl font-black text-emerald-800 mt-0.5">{globalStats.presentSessions}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#F4EAEF] p-3.5 rounded-2xl border border-rose-300 bg-rose-50/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Missed (Absent)</p>
            <p className="text-xl font-black text-rose-800 mt-0.5">{globalStats.absentSessions}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Searchable Multi-Selection Filter Toolbar (Unified Pill Container matching reference) */}
      <div className="bg-[#F4EAEF] p-4 rounded-3xl border border-[#D4BAC7] shadow-xs space-y-3">
        {/* Row 1: Search on left, Filter Pills on right */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by guru name, title or discipline"
              value={gridSearchQuery}
              onChange={(e) => setGridSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#EFE2EA] border border-[#D4BAC7] rounded-xl text-xs text-[#3D102A] placeholder-[#8A5B75] focus:outline-none focus:ring-2 focus:ring-[#8A064D] font-medium"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Gurus Pill */}
            <TrainerMultiSearchSelect
              trainers={level1TrainerOptions}
              selectedIds={gridSelectedGuruIds}
              onChange={setGridSelectedGuruIds}
              pillMode={true}
              buttonLabel="Gurus"
            />

            {/* Courses Pill */}
            <CourseMultiSearchSelect
              courses={level1CourseOptions}
              selectedIds={gridSelectedCourseIds}
              onChange={setGridSelectedCourseIds}
              pillMode={true}
              buttonLabel="Courses"
            />

            {/* Batches Pill */}
            <BatchMultiSearchSelect
              batches={level1BatchOptions}
              selectedIds={gridSelectedBatchIds}
              onChange={setGridSelectedBatchIds}
              pillMode={true}
              buttonLabel="Batches"
            />
          </div>
        </div>

        {/* Row 2: Active Filter Chips & Clear All */}
        {(gridSelectedGuruIds.length > 0 || gridSelectedCourseIds.length > 0 || gridSelectedBatchIds.length > 0 || gridSearchQuery.trim()) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#D4BAC7]/40">
            {/* Selected Courses Chips */}
            {gridSelectedCourseIds.map(cId => {
              const c = courses.find(item => item.id === cId);
              if (!c) return null;
              return (
                <span
                  key={cId}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E2CBD7] text-[#590231] rounded-full text-xs font-bold"
                >
                  <span>{c.title}</span>
                  <button
                    type="button"
                    onClick={() => setGridSelectedCourseIds(gridSelectedCourseIds.filter(id => id !== cId))}
                    className="hover:text-rose-800 transition cursor-pointer"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              );
            })}

            {/* Selected Gurus Chips */}
            {gridSelectedGuruIds.map(gId => {
              const g = trainers.find(item => item.id === gId);
              if (!g) return null;
              return (
                <span
                  key={gId}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E2CBD7] text-[#590231] rounded-full text-xs font-bold"
                >
                  <span>{g.full_name}</span>
                  <button
                    type="button"
                    onClick={() => setGridSelectedGuruIds(gridSelectedGuruIds.filter(id => id !== gId))}
                    className="hover:text-rose-800 transition cursor-pointer"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              );
            })}

            {/* Selected Batches Chips */}
            {gridSelectedBatchIds.map(bId => {
              const b = level1BatchOptions.find(item => item.id === bId);
              if (!b) return null;
              return (
                <span
                  key={bId}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E2CBD7] text-[#590231] rounded-full text-xs font-bold"
                >
                  <span>{b.name}</span>
                  <button
                    type="button"
                    onClick={() => setGridSelectedBatchIds(gridSelectedBatchIds.filter(id => id !== bId))}
                    className="hover:text-rose-800 transition cursor-pointer"
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              );
            })}

            {/* Search Query Chip */}
            {gridSearchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E2CBD7] text-[#590231] rounded-full text-xs font-bold">
                <span>&quot;{gridSearchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setGridSearchQuery('')}
                  className="hover:text-rose-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Clear All Filters link */}
            <button
              type="button"
              onClick={() => {
                setGridSelectedGuruIds([]);
                setGridSelectedCourseIds([]);
                setGridSelectedBatchIds([]);
                setGridSearchQuery('');
              }}
              className="text-xs text-[#590231] underline font-bold hover:text-[#8A064D] ml-1 cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* 4. Guru Cards Grid (Wrapper with min-h-[550px] to preserve space and prevent scroll jumps) */}
      <div className="min-h-[550px]">
        {filteredGurus.length === 0 ? (
          <div className="bg-[#F4EAEF] min-h-[400px] flex flex-col items-center justify-center p-12 rounded-3xl border border-[#D4BAC7] text-center text-gray-500 text-xs space-y-3">
            <User className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="font-bold text-gray-700 text-sm">No Gurus match the selected criteria.</p>
            <p className="text-[11px] text-[#6E3955]">Try clearing or adjusting your course, guru, or batch filters.</p>
            <button
              onClick={() => {
                setGridSelectedGuruIds([]);
                setGridSelectedCourseIds([]);
                setGridSelectedBatchIds([]);
                setGridSearchQuery('');
              }}
              className="text-xs text-[#8A064D] font-black underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGurus.map((guru) => {
              const trainerRecs = getTrainerRecords(guru);
              const coursesTaught = getTrainerCourses(guru, trainerRecs);
              const present = trainerRecs.filter(r => r.guru_status === 'present').length;
              const absent = trainerRecs.filter(r => r.guru_status === 'absent').length;
              const extra = tallyClasses.filter(tc => 
                (tc.trainer_id && tc.trainer_id === guru.id) ||
                (tc.trainer_name && guru.full_name && tc.trainer_name.toLowerCase().trim() === guru.full_name.toLowerCase().trim())
              ).length;
              const conducted = present + extra; // Total classes held in that month (including extra/rescheduled)
              const total = conducted + absent;
              const avatar = guru.avatar_url;

              return (
                <div
                  key={guru.id}
                  className="bg-[#F4EAEF] rounded-2xl p-4 border border-[#D4BAC7] shadow-xs hover:shadow-md hover:border-[#8A064D] transition-all flex flex-col justify-between group"
                >
                <div>
                  {/* Top Bar: Avatar & Active Status Indicator (No Compliance %) */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="relative">
                      <div className="w-13 h-13 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-rose-100 shadow-2xs">
                        {avatar && avatar.trim().length > 0 ? (
                          <img
                            src={avatar}
                            alt={guru.full_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#590231] text-[#F9E33A] flex items-center justify-center font-bold text-sm">
                            {guru.full_name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" title="Active Faculty" />
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200">
                      Faculty Member
                    </span>
                  </div>

                  {/* Guru Name & Title */}
                  <h3 className="font-bold text-sm text-[#2D041A] leading-snug group-hover:text-[#8A064D] transition-colors">
                    {guru.full_name}
                  </h3>
                  <p className="text-[11px] font-semibold text-[#8A064D] mt-0.5 line-clamp-1">
                    {guru.display_title || 'Faculty Guru & Mentor'}
                  </p>

                  {/* Courses Taught Badges */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {coursesTaught.length > 0 ? (
                      coursesTaught.slice(0, 3).map((crs) => (
                        <span
                          key={crs}
                          className="px-2 py-0.5 bg-[#FFF2F8] text-[#8A064D] border border-rose-100 rounded-md text-[10px] font-bold truncate max-w-[130px]"
                        >
                          {crs}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400">Classical Arts</span>
                    )}
                    {coursesTaught.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
                        +{coursesTaught.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Quick Attendance Stats: Only Conducted, Missed, Extra */}
                  <div className="mt-3.5 pt-3 border-t border-gray-100 grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200">
                      <p className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-tight">Conducted</p>
                      <p className="text-sm font-black text-emerald-900 mt-0.5">{conducted}</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-50/80 border border-rose-200">
                      <p className="text-[9.5px] font-bold text-rose-800 uppercase tracking-tight">Missed</p>
                      <p className="text-sm font-black text-rose-900 mt-0.5">{absent}</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-50/80 border border-amber-200" title="Rescheduled Extra Classes">
                      <p className="text-[9.5px] font-bold text-amber-800 uppercase tracking-tight">Extra</p>
                      <p className="text-sm font-black text-amber-900 mt-0.5">{extra}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Details Action Button */}
                <div className="mt-3.5 pt-2.5">
                  <button
                    onClick={() => {
                      setSelectedGuruId(guru.id);
                      resetDetailFilters();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#590231] hover:bg-[#780442] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer group-hover:bg-[#8A064D]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                    <span>View Attendance Details</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#F9E33A] ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

    </div>
  );
}

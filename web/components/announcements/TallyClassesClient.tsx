'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CalendarCheck, 
  CalendarX2, 
  DoorOpen, 
  Clock, 
  Users, 
AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  Layers, 
  BookOpen, 
  Calendar, 
  Filter, 
  RotateCcw, 
  Tag, 
  ShieldCheck, 
  Send, 
  X, 
  Check, 
  Info,
  UserX,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Edit,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import { TallyClass, HolidayAlert, GuruAbsence } from '@/lib/holidayTally';
import { Batch, Course, Trainer, Student, Room, GuruAttendanceAuditRecord } from '@/lib/academy';
import VacantRoomsView from '@/components/batches/VacantRoomsView';
import TimetableView from '@/components/batches/TimetableView';
import AiEnhanceButton from '@/components/common/AiEnhanceButton';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';

interface Props {
  initialTallyClasses: TallyClass[];
  holidayAlerts: HolidayAlert[];
  initialGuruAbsences?: GuruAbsence[];
  guruMissedSessions?: GuruAttendanceAuditRecord[];
  courses: Course[];
  batches: Batch[];
  trainers: Trainer[];
  students: Student[];
  rooms: Room[];
}

// Unified Cancelled Class Item for the Table
interface CancelledClassItem {
  id: string; // unique item id
  sourceType: 'holiday' | 'guru_absence' | 'general';
  cause: 'Holiday' | 'Guru Leave';
  date: string; // YYYY-MM-DD
  dayName: string;
  courseId: string;
  courseTitle: string;
  courseCode?: string;
  batchId: string;
  batchName: string;
  batchCode?: string;
  trainerId: string;
  trainerName: string;
  trainerCode?: string;
  trainerPhone?: string;
  trainerEmail?: string;
  classTimings: string;
  roomOrHall: string;
  holidayTitle?: string;
  reason: string;
  status: 'Pending' | 'Success';
  tallyClass?: TallyClass | null;
  holidayAlertId?: string | null;
  guruAbsenceId?: string | null;
}

// Time overlap helper function: [startA, endA) overlaps [startB, endB)
function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  const toMin = (t: string) => {
    const clean = t.substring(0, 5);
    const [h, m] = clean.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const sA = toMin(startA);
  const eA = toMin(endA);
  const sB = toMin(startB);
  const eB = toMin(endB);
  return sA < eB && eA > sB;
}

function formatTime12(t: string): string {
  if (!t) return '--';
  const clean = t.substring(0, 5);
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return clean;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function getDayNameFromDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { weekday: 'long' });
  } catch {
    return '';
  }
}

// Reusable Multi-Select Searchable Dropdown
interface MultiSearchItem {
  id: string;
  label: string;
  sublabel?: string;
}

function MultiSearchDropdown({
  title,
  placeholder,
  items,
  selectedIds,
  onChange,
  icon: Icon,
  align = 'left'
}: {
  title: string;
  placeholder: string;
  items: MultiSearchItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  icon?: any;
  align?: 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(it => it.label.toLowerCase().includes(q) || (it.sublabel && it.sublabel.toLowerCase().includes(q)));
  }, [items, search]);

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onChange(items.map(x => x.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
          selectedIds.length > 0
            ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D] ring-1 ring-[#8A064D]/20'
            : 'bg-white border-gray-300 text-gray-800 hover:border-[#075E54] hover:bg-gray-50'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 opacity-70 text-[#8A064D]" />}
        <span>{title}</span>
        {selectedIds.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#8A064D] text-white text-[10px] font-bold flex items-center justify-center">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-1.5 ${align === 'right' ? 'right-0' : 'left-0'} w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2.5 animate-in fade-in slide-in-from-top-1 duration-150`}>
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-gray-100 text-[11px]">
            <button
              type="button"
              onClick={selectAll}
              className="text-[#8A064D] hover:underline font-bold cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-gray-400 hover:text-gray-600 font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 mt-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-3 text-xs text-gray-400">No matches found</div>
            ) : (
              filteredItems.map(item => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-2 py-1.5 rounded-lg text-left text-xs hover:bg-[#FFF9FB] flex items-center gap-2 transition cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-[#8A064D] border-[#8A064D] text-white' : 'border-gray-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="font-semibold text-gray-800 truncate">{item.label}</div>
                      {item.sublabel && (
                        <div className="text-[10px] text-gray-400 font-mono truncate">{item.sublabel}</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TallyClassesClient({
  initialTallyClasses,
  holidayAlerts,
  initialGuruAbsences = [],
  guruMissedSessions = [],
  courses,
  batches,
  trainers,
  students,
  rooms
}: Props) {
  const searchParams = useSearchParams();
  const preselectedHolidayId = searchParams.get('holiday_id');
  const preselectedHolidayDate = searchParams.get('holiday_date');
  const preselectedFrom = searchParams.get('from') || preselectedHolidayDate || '';
  const preselectedTo = searchParams.get('to') || preselectedHolidayDate || '';

  // Main state
  const [tallyClasses, setTallyClasses] = useState<TallyClass[]>(initialTallyClasses);
  const [guruAbsences, setGuruAbsences] = useState<GuruAbsence[]>(initialGuruAbsences);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Full Page View State ('none' | 'vacancy' | 'create')
  const [fullPageView, setFullPageView] = useState<'none' | 'vacancy' | 'create'>('none');

  // Date restriction: min date is strictly after current date (tomorrow onwards)
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Table Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success'>('all');
  const [causeFilter, setCauseFilter] = useState<'all' | 'holiday' | 'guru_leave'>('all');
  const [startDate, setStartDate] = useState<string>(preselectedFrom);
  const [endDate, setEndDate] = useState<string>(preselectedTo);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<string[]>([]);

  // Modals for Master Timetable
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);

  // "Create" Reschedule Full-Page State
  const [selectedCancelledItemForCreate, setSelectedCancelledItemForCreate] = useState<CancelledClassItem | null>(null);
  const [createRescheduledDate, setCreateRescheduledDate] = useState<string>(tomorrowStr);
  const [createSelectedRoom, setCreateSelectedRoom] = useState<string>('');
  const [showRoomAvailability, setShowRoomAvailability] = useState<boolean>(false);
  const [createStartTime, setCreateStartTime] = useState<string>('10:00');
  const [createEndTime, setCreateEndTime] = useState<string>('11:00');
  const [createReason, setCreateReason] = useState<string>('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [showEnrolledStudentsInCreate, setShowEnrolledStudentsInCreate] = useState(false);

  // Clash Error Popup State
  const [clashErrorPopup, setClashErrorPopup] = useState<{
    isOpen: boolean;
    guruClashes: Array<{ guruName: string; conflictingBatch: string; timing: string; room?: string }>;
    studentClashes: Array<{ studentName: string; rollNumber: string; conflictingBatch: string; conflictingCourse: string; timing: string; room?: string }>;
    roomClashes: Array<{ room: string; conflictingBatch: string; timing: string }>;
  } | null>(null);
  const [isStudentClashDetailsOpen, setIsStudentClashDetailsOpen] = useState(false);

  // "Details" / Edit Modal State (for Success rows)
  const [detailsModalItem, setDetailsModalItem] = useState<CancelledClassItem | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editRescheduledDate, setEditRescheduledDate] = useState<string>('');
  const [editSelectedRoom, setEditSelectedRoom] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeletingTally, setIsDeletingTally] = useState(false);

  // Show Toast
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // BUILD UNIFIED CANCELLED CLASSES LIST
  // -------------------------------------------------------------
  const allCancelledClasses = useMemo(() => {
    const list: CancelledClassItem[] = [];

    // 1. Classes cancelled due to Admin Declared Holidays
    holidayAlerts.forEach(ha => {
      (ha.target_batch_ids || []).forEach((bId, idx) => {
        const b = batches.find(x => x.id === bId);
        const crs = courses.find(c => c.id === b?.course_id);
        const tr = trainers.find(t => 
          t.id === b?.trainer_id || 
          (t.full_name && ha.affected_guru_names && ha.affected_guru_names[idx] && t.full_name.toLowerCase() === ha.affected_guru_names[idx].toLowerCase())
        );

        // Check if an active tally class exists for this holiday & batch
        const matchedTally = tallyClasses.find(
          tc => tc.batch_id === bId &&
          (tc.holiday_alert_id === ha.id || tc.original_date === ha.holiday_date) &&
          tc.status === 'Scheduled'
        );

        const isSuccess = !!matchedTally;
        const bName = b?.name || (ha.target_batch_names && ha.target_batch_names[idx]) || 'Batch';
        const bCode = b?.code;
        const cTitle = b?.course_title || (ha.target_course_titles && ha.target_course_titles[0]) || crs?.title || 'Classical Arts';
        const cCode = crs?.code || b?.course_code;
        const guru = (ha.affected_guru_names && ha.affected_guru_names[idx]) || b?.trainer_name || tr?.full_name || 'Assigned Guru';
        const guruCode = tr?.guru_id || tr?.code || (tr?.id ? `GURU-${tr.id.slice(0, 4).toUpperCase()}` : undefined);
        const timingStr = b ? `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}` : 'Regular Slot';
        const roomStr = b?.room_or_hall || 'Academy Mandapam';

        list.push({
          id: `hol-${ha.id}-${bId}`,
          sourceType: 'holiday',
          cause: 'Holiday',
          date: ha.holiday_date,
          dayName: getDayNameFromDate(ha.holiday_date),
          courseId: b?.course_id || crs?.id || '',
          courseTitle: cTitle,
          courseCode: cCode,
          batchId: bId,
          batchName: bName,
          batchCode: bCode,
          trainerId: b?.trainer_id || tr?.id || '',
          trainerName: guru,
          trainerCode: guruCode,
          trainerPhone: tr?.phone,
          trainerEmail: tr?.email,
          classTimings: timingStr,
          roomOrHall: roomStr,
          holidayTitle: ha.title,
          reason: ha.reason || ha.title,
          status: isSuccess ? 'Success' : 'Pending',
          tallyClass: matchedTally || null,
          holidayAlertId: ha.id,
          guruAbsenceId: null
        });
      });
    });

    // 2. Classes cancelled due to Guru Absence
    // Requirement: When guru missed taking attendance when there is an admin holiday declared, it is NOT considered as guru absent
    guruAbsences.forEach(ga => {
      const hasHolidayDeclared = holidayAlerts.some(ha => 
        ha.holiday_date === ga.absence_date &&
        (ha.target_batch_ids || []).includes(ga.batch_id)
      );
      if (hasHolidayDeclared) {
        return; // Exclude: Covered under Admin Declared Holiday
      }

      const b = batches.find(x => x.id === ga.batch_id);
      const crs = courses.find(c => c.id === ga.course_id || c.id === b?.course_id);
      const tr = trainers.find(t => t.id === ga.trainer_id || t.id === b?.trainer_id);

      // Check if an active tally class exists for this guru absence
      const matchedTally = tallyClasses.find(
        tc => (ga.tally_class_id && tc.id === ga.tally_class_id) ||
        (tc.batch_id === ga.batch_id && tc.original_date === ga.absence_date && tc.status === 'Scheduled')
      );

      const isSuccess = ga.status === 'Rescheduled' || !!matchedTally;
      const bName = ga.batch_name || b?.name || 'Batch';
      const bCode = b?.code;
      const cTitle = ga.course_title || b?.course_title || crs?.title || 'Classical Arts';
      const cCode = crs?.code || b?.course_code;
      const guru = ga.trainer_name || b?.trainer_name || tr?.full_name || 'Assigned Guru';
      const guruCode = tr?.guru_id || tr?.code || (tr?.id ? `GURU-${tr.id.slice(0, 4).toUpperCase()}` : undefined);
      const timingStr = b ? `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}` : 'Regular Slot';
      const roomStr = b?.room_or_hall || 'Academy Mandapam';

      list.push({
        id: `ga-${ga.id}`,
        sourceType: 'guru_absence',
        cause: 'Guru Leave',
        date: ga.absence_date,
        dayName: getDayNameFromDate(ga.absence_date),
        courseId: ga.course_id || b?.course_id || '',
        courseTitle: cTitle,
        courseCode: cCode,
        batchId: ga.batch_id,
        batchName: bName,
        batchCode: bCode,
        trainerId: ga.trainer_id,
        trainerName: guru,
        trainerCode: guruCode,
        trainerPhone: tr?.phone,
        trainerEmail: tr?.email,
        classTimings: timingStr,
        roomOrHall: roomStr,
        holidayTitle: undefined,
        reason: ga.reason || 'Faculty leave / Missed attendance slot',
        status: isSuccess ? 'Success' : 'Pending',
        tallyClass: matchedTally || null,
        holidayAlertId: null,
        guruAbsenceId: ga.id
      });
    });

    // 2b. Auto-detected classes where Guru failed to take attendance on class day
    (guruMissedSessions || []).forEach(gms => {
      // Exclude if an Admin Declared Holiday covers this batch/course on that date
      const hasHoliday = holidayAlerts.some(ha =>
        ha.holiday_date === gms.session_date &&
        ((ha.target_batch_ids || []).includes(gms.batch_id) || (ha.target_course_ids || []).includes(gms.course_id))
      );
      if (hasHoliday) return;

      // Exclude if already added via guruAbsences or another record
      const alreadyInList = list.some(
        it => it.batchId === gms.batch_id && it.date === gms.session_date
      );
      if (alreadyInList) return;

      const b = batches.find(x => x.id === gms.batch_id);
      const crs = courses.find(c => c.id === gms.course_id || c.id === b?.course_id);
      const tr = trainers.find(t => t.id === gms.trainer_id || t.id === b?.trainer_id);

      const matchedTally = tallyClasses.find(
        tc => tc.batch_id === gms.batch_id && tc.original_date === gms.session_date && tc.status === 'Scheduled'
      );
      const isSuccess = !!matchedTally;

      list.push({
        id: `gms-${gms.session_id}`,
        sourceType: 'guru_absence',
        cause: 'Guru Leave',
        date: gms.session_date,
        dayName: getDayNameFromDate(gms.session_date),
        courseId: gms.course_id,
        courseTitle: gms.course_title,
        courseCode: crs?.code || b?.course_code,
        batchId: gms.batch_id,
        batchName: gms.batch_name,
        batchCode: b?.code,
        trainerId: gms.trainer_id,
        trainerName: gms.trainer_name,
        trainerCode: tr?.guru_id || tr?.code,
        trainerPhone: tr?.phone,
        trainerEmail: tr?.email,
        classTimings: `${formatTime12(gms.start_time)} - ${formatTime12(gms.end_time)}`,
        roomOrHall: gms.room_or_hall,
        holidayTitle: undefined,
        reason: 'Faculty absent (Missed attendance)',
        status: isSuccess ? 'Success' : 'Pending',
        tallyClass: matchedTally || null,
        holidayAlertId: null,
        guruAbsenceId: null
      });
    });

    // 3. Any additional direct tally classes not linked to prior alert/absence
    tallyClasses.forEach(tc => {
      const alreadyIncluded = list.some(item => item.tallyClass?.id === tc.id);
      if (!alreadyIncluded) {
        const b = batches.find(x => x.id === tc.batch_id);
        const crs = courses.find(c => c.id === tc.course_id || c.id === b?.course_id);
        const tr = trainers.find(t => t.id === tc.trainer_id || t.id === b?.trainer_id);
        const ha = tc.holiday_alert_id ? holidayAlerts.find(h => h.id === tc.holiday_alert_id) : undefined;

        list.push({
          id: `tc-${tc.id}`,
          sourceType: tc.cancellation_type || 'general',
          cause: tc.cancellation_type === 'guru_absence' ? 'Guru Leave' : 'Holiday',
          date: tc.original_date || tc.rescheduled_date,
          dayName: getDayNameFromDate(tc.original_date || tc.rescheduled_date),
          courseId: tc.course_id,
          courseTitle: tc.course_title,
          courseCode: tc.course_code || crs?.code,
          batchId: tc.batch_id,
          batchName: tc.batch_name,
          batchCode: tc.batch_code || b?.code,
          trainerId: tc.trainer_id,
          trainerName: tc.trainer_name,
          trainerCode: tr?.guru_id || tr?.code,
          trainerPhone: tr?.phone,
          trainerEmail: tr?.email,
          classTimings: b ? `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}` : `${formatTime12(tc.start_time)} - ${formatTime12(tc.end_time)}`,
          roomOrHall: b?.room_or_hall || tc.room_or_hall,
          holidayTitle: ha?.title,
          reason: tc.reason || 'Make-up Session',
          status: 'Success',
          tallyClass: tc,
          holidayAlertId: tc.holiday_alert_id,
          guruAbsenceId: null
        });
      }
    });

    // Sort by date descending
    return list.sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [holidayAlerts, guruAbsences, guruMissedSessions, tallyClasses, batches, courses, trainers]);

  // Filtered List
  const filteredCancelledClasses = useMemo(() => {
    return allCancelledClasses.filter(item => {
      // Date Range Filter
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      // Status Filter
      if (statusFilter === 'pending' && item.status !== 'Pending') return false;
      if (statusFilter === 'success' && item.status !== 'Success') return false;

      // Cause Filter
      if (causeFilter === 'holiday' && item.cause !== 'Holiday') return false;
      if (causeFilter === 'guru_leave' && item.cause !== 'Guru Leave') return false;

      // Multi-select Course Filter
      if (selectedCourseIds.length > 0 && !selectedCourseIds.includes(item.courseId)) {
        return false;
      }

      // Multi-select Batch Filter
      if (selectedBatchIds.length > 0 && !selectedBatchIds.includes(item.batchId)) {
        return false;
      }

      // Multi-select Trainer Filter
      if (selectedTrainerIds.length > 0 && !selectedTrainerIds.includes(item.trainerId)) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchBatch = item.batchName.toLowerCase().includes(q) || (item.batchCode && item.batchCode.toLowerCase().includes(q));
        const matchCourse = item.courseTitle.toLowerCase().includes(q) || (item.courseCode && item.courseCode.toLowerCase().includes(q));
        const matchGuru = item.trainerName.toLowerCase().includes(q) || (item.trainerCode && item.trainerCode.toLowerCase().includes(q));
        const matchRoom = item.roomOrHall.toLowerCase().includes(q);
        const matchDate = item.date.includes(q) || item.dayName.toLowerCase().includes(q);
        const matchReason = item.reason.toLowerCase().includes(q);
        const matchHolidayTitle = item.holidayTitle ? item.holidayTitle.toLowerCase().includes(q) : false;
        if (!matchBatch && !matchCourse && !matchGuru && !matchRoom && !matchDate && !matchReason && !matchHolidayTitle) {
          return false;
        }
      }

      return true;
    });
  }, [allCancelledClasses, statusFilter, causeFilter, startDate, endDate, selectedCourseIds, selectedBatchIds, selectedTrainerIds, searchQuery]);

  const pendingCount = useMemo(() => allCancelledClasses.filter(c => c.status === 'Pending').length, [allCancelledClasses]);
  const successCount = useMemo(() => allCancelledClasses.filter(c => c.status === 'Success').length, [allCancelledClasses]);

  // Dropdown items for MultiSearchDropdown
  const courseDropdownItems: MultiSearchItem[] = useMemo(() => {
    return courses.map(c => ({
      id: c.id,
      label: c.title,
      sublabel: c.code || 'Course'
    }));
  }, [courses]);

  const batchDropdownItems: MultiSearchItem[] = useMemo(() => {
    return batches.map(b => ({
      id: b.id,
      label: b.name,
      sublabel: `${b.course_title || 'Course'}${b.code ? ` • ${b.code}` : ''}`
    }));
  }, [batches]);

  const trainerDropdownItems: MultiSearchItem[] = useMemo(() => {
    return trainers.map(t => ({
      id: t.id,
      label: t.full_name,
      sublabel: t.guru_id || t.code || t.email
    }));
  }, [trainers]);

  // -------------------------------------------------------------
  // OPEN CREATE RESCHEDULE FULL-PAGE VIEW
  // -------------------------------------------------------------
  const handleOpenCreateReschedule = (item: CancelledClassItem) => {
    setSelectedCancelledItemForCreate(item);

    // Compute next Sunday or default upcoming date strictly after today
    const d = new Date();
    const day = d.getDay();
    const diff = (7 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    const candidateDate = d.toISOString().split('T')[0];
    const initialDate = candidateDate >= tomorrowStr ? candidateDate : tomorrowStr;

    setCreateRescheduledDate(initialDate);
    const batchObj = batches.find(b => b.id === item.batchId);
    setCreateSelectedRoom(batchObj?.room_or_hall || rooms[0]?.name || 'Natya Mandapam (Room 101)');
    setCreateStartTime(batchObj?.start_time ? batchObj.start_time.substring(0, 5) : '10:00');
    setCreateEndTime(batchObj?.end_time ? batchObj.end_time.substring(0, 5) : '11:00');
    setCreateReason(`Compensation class for ${item.cause === 'Holiday' ? 'Admin Declared Holiday' : 'Guru Absence'}: ${item.holidayTitle || item.reason} on ${item.date}`);
    setShowRoomAvailability(false);
    setShowEnrolledStudentsInCreate(false);
    setFullPageView('create');
  };

  // Derive target day of week for Create Flow
  const createTargetDayOfWeek = useMemo(() => {
    return getDayNameFromDate(createRescheduledDate);
  }, [createRescheduledDate]);

  // -------------------------------------------------------------
  // ROOM VACANCY SLOTS ON SELECTED DATE & ROOM (FOR CREATE FLOW)
  // -------------------------------------------------------------
  const roomVacancyOnSelectedDateAndRoom = useMemo(() => {
    if (!createRescheduledDate || !createSelectedRoom) {
      return { occupiedIntervals: [], vacantIntervals: [] };
    }

    const targetDay = createTargetDayOfWeek.toLowerCase();
    const occupied: Array<{ start: string; end: string; label: string }> = [];

    // Regular batches in this room on this day of week
    batches.forEach(b => {
      if (selectedCancelledItemForCreate && b.id === selectedCancelledItemForCreate.batchId) return;

      const days = (b.days_of_week || []).map(d => d.toLowerCase());
      if (days.includes(targetDay)) {
        const rMatch = (b.room_or_hall || '').trim().toLowerCase() === createSelectedRoom.trim().toLowerCase();
        if (rMatch && b.start_time && b.end_time) {
          occupied.push({
            start: b.start_time.substring(0, 5),
            end: b.end_time.substring(0, 5),
            label: `${b.name} (${formatTime12(b.start_time)} - ${formatTime12(b.end_time)})`
          });
        }
      }
    });

    // Other scheduled tally classes in this room on this exact date
    tallyClasses.forEach(tc => {
      if (selectedCancelledItemForCreate && tc.batch_id === selectedCancelledItemForCreate.batchId) return;
      if (tc.rescheduled_date === createRescheduledDate && tc.status === 'Scheduled') {
        const rMatch = (tc.room_or_hall || '').trim().toLowerCase() === createSelectedRoom.trim().toLowerCase();
        if (rMatch && tc.start_time && tc.end_time) {
          occupied.push({
            start: tc.start_time.substring(0, 5),
            end: tc.end_time.substring(0, 5),
            label: `★ ${tc.batch_name} (${formatTime12(tc.start_time)} - ${formatTime12(tc.end_time)})`
          });
        }
      }
    });

    // Standard academy operating slots
    const standardSlots = [
      { start: '06:00', end: '07:00' },
      { start: '07:00', end: '08:00' },
      { start: '08:00', end: '09:00' },
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' },
      { start: '17:00', end: '18:00' },
      { start: '18:00', end: '19:00' },
      { start: '19:00', end: '20:00' },
      { start: '20:00', end: '21:00' }
    ];

    const vacantIntervals = standardSlots.filter(slot => {
      return !occupied.some(occ => timesOverlap(slot.start, slot.end, occ.start, occ.end));
    });

    return { occupiedIntervals: occupied, vacantIntervals };
  }, [createRescheduledDate, createSelectedRoom, createTargetDayOfWeek, batches, tallyClasses, selectedCancelledItemForCreate]);

  // Enrolled students in the currently selected cancelled batch
  const enrolledStudentsInCreateBatch = useMemo(() => {
    if (!selectedCancelledItemForCreate) return [];
    return students.filter(s =>
      (s.enrolled_batches || []).some(eb => eb.batch_id === selectedCancelledItemForCreate.batchId)
    );
  }, [selectedCancelledItemForCreate, students]);

  // -------------------------------------------------------------
  // CLASH VERIFICATION FUNCTION
  // -------------------------------------------------------------
  const checkClashes = (
    batchId: string,
    targetDate: string,
    dayOfWeek: string,
    proposedStart: string,
    proposedEnd: string,
    roomName: string,
    excludeTallyClassId?: string
  ) => {
    const pStart = proposedStart.substring(0, 5);
    const pEnd = proposedEnd.substring(0, 5);
    const batchObj = batches.find(b => b.id === batchId);
    const trainerId = batchObj?.trainer_id || selectedCancelledItemForCreate?.trainerId;
    const guruName = batchObj?.trainer_name || selectedCancelledItemForCreate?.trainerName || 'Assigned Guru';
    const enrolled = students.filter(s =>
      (s.enrolled_batches || []).some(eb => eb.batch_id === batchId)
    );

    // 1. Room Clash
    const roomClashes: Array<{ room: string; conflictingBatch: string; timing: string }> = [];
    if (roomName) {
      batches.forEach(b => {
        if (b.id === batchId) return;
        const days = b.days_of_week || [];
        if (days.includes(dayOfWeek)) {
          const roomMatch = (b.room_or_hall || '').toLowerCase().trim() === roomName.toLowerCase().trim();
          if (roomMatch && timesOverlap(pStart, pEnd, b.start_time, b.end_time)) {
            roomClashes.push({
              room: roomName,
              conflictingBatch: `${b.course_title} - ${b.name}`,
              timing: `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}`
            });
          }
        }
      });

      tallyClasses.forEach(tc => {
        if (excludeTallyClassId && tc.id === excludeTallyClassId) return;
        if (tc.batch_id !== batchId && tc.rescheduled_date === targetDate && tc.status === 'Scheduled') {
          const roomMatch = (tc.room_or_hall || '').toLowerCase().trim() === roomName.toLowerCase().trim();
          if (roomMatch && timesOverlap(pStart, pEnd, tc.start_time, tc.end_time)) {
            roomClashes.push({
              room: roomName,
              conflictingBatch: `★ ${tc.batch_name} (Tally Class)`,
              timing: `${formatTime12(tc.start_time)} - ${formatTime12(tc.end_time)}`
            });
          }
        }
      });
    }

    // 2. Guru Clash
    const guruClashes: Array<{ guruName: string; conflictingBatch: string; timing: string; room?: string }> = [];
    if (trainerId) {
      batches.forEach(b => {
        if (b.id === batchId) return;
        if (b.trainer_id === trainerId) {
          const days = b.days_of_week || [];
          if (days.includes(dayOfWeek)) {
            if (timesOverlap(pStart, pEnd, b.start_time, b.end_time)) {
              guruClashes.push({
                guruName,
                conflictingBatch: `${b.course_title} - ${b.name}`,
                timing: `${formatTime12(b.start_time)} - ${formatTime12(b.end_time)}`,
                room: b.room_or_hall
              });
            }
          }
        }
      });

      tallyClasses.forEach(tc => {
        if (excludeTallyClassId && tc.id === excludeTallyClassId) return;
        if (tc.batch_id !== batchId && tc.trainer_id === trainerId && tc.rescheduled_date === targetDate && tc.status === 'Scheduled') {
          if (timesOverlap(pStart, pEnd, tc.start_time, tc.end_time)) {
            guruClashes.push({
              guruName,
              conflictingBatch: `★ ${tc.course_title} - ${tc.batch_name} (Tally Class)`,
              timing: `${formatTime12(tc.start_time)} - ${formatTime12(tc.end_time)}`,
              room: tc.room_or_hall
            });
          }
        }
      });
    }

    // 3. Student Clash
    const studentClashes: Array<{
      studentName: string;
      rollNumber: string;
      conflictingBatch: string;
      conflictingCourse: string;
      timing: string;
      room?: string;
    }> = [];

    enrolled.forEach(student => {
      const otherBatches = (student.enrolled_batches || []).filter(eb => eb.batch_id !== batchId);
      otherBatches.forEach(otherEb => {
        const days = otherEb.days_of_week || [];
        if (days.includes(dayOfWeek)) {
          if (timesOverlap(pStart, pEnd, otherEb.start_time, otherEb.end_time)) {
            const bDetail = batches.find(x => x.id === otherEb.batch_id);
            studentClashes.push({
              studentName: student.full_name,
              rollNumber: student.roll_number || 'ID',
              conflictingBatch: otherEb.batch_name,
              conflictingCourse: otherEb.course_title,
              timing: `${formatTime12(otherEb.start_time)} - ${formatTime12(otherEb.end_time)}`,
              room: bDetail?.room_or_hall
            });
          }
        }
      });

      tallyClasses.forEach(tc => {
        if (excludeTallyClassId && tc.id === excludeTallyClassId) return;
        if (tc.rescheduled_date === targetDate && tc.status === 'Scheduled' && tc.batch_id !== batchId) {
          const studentInOtherTally = students
            .find(s => s.id === student.id)
            ?.enrolled_batches?.some(eb => eb.batch_id === tc.batch_id);
          if (studentInOtherTally && timesOverlap(pStart, pEnd, tc.start_time, tc.end_time)) {
            studentClashes.push({
              studentName: student.full_name,
              rollNumber: student.roll_number || 'ID',
              conflictingBatch: `★ ${tc.batch_name} (Tally Class)`,
              conflictingCourse: tc.course_title,
              timing: `${formatTime12(tc.start_time)} - ${formatTime12(tc.end_time)}`,
              room: tc.room_or_hall
            });
          }
        }
      });
    });

    const hasClashes = studentClashes.length > 0 || guruClashes.length > 0 || roomClashes.length > 0;

    return {
      hasClashes,
      studentClashes,
      guruClashes,
      roomClashes
    };
  };

  // -------------------------------------------------------------
  // SUBMIT CREATE RESCHEDULE
  // -------------------------------------------------------------
  const handleProceedCreateReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCancelledItemForCreate) return;

    if (!createRescheduledDate) {
      showToast('Please select a reschedule date from the calendar', 'error');
      return;
    }
    if (createRescheduledDate < tomorrowStr) {
      showToast('Reschedule date must be strictly after the current date', 'error');
      return;
    }
    if (!createSelectedRoom) {
      showToast('Please select a studio room', 'error');
      return;
    }
    if (!createStartTime || !createEndTime) {
      showToast('Please specify valid start and end timings', 'error');
      return;
    }

    // Run verification
    const analysis = checkClashes(
      selectedCancelledItemForCreate.batchId,
      createRescheduledDate,
      createTargetDayOfWeek,
      createStartTime,
      createEndTime,
      createSelectedRoom
    );

    if (analysis.hasClashes) {
      // Trigger error popup with details
      setClashErrorPopup({
        isOpen: true,
        guruClashes: analysis.guruClashes,
        studentClashes: analysis.studentClashes,
        roomClashes: analysis.roomClashes
      });
      return;
    }

    const currentBatch = batches.find(b => b.id === selectedCancelledItemForCreate.batchId);
    const crs = courses.find(c => c.id === currentBatch?.course_id);

    setIsSubmittingCreate(true);
    try {
      const payload = {
        holiday_alert_id: selectedCancelledItemForCreate.holidayAlertId || null,
        cancellation_type: selectedCancelledItemForCreate.sourceType,
        absent_guru_name: selectedCancelledItemForCreate.cause === 'Guru Leave' ? selectedCancelledItemForCreate.trainerName : null,
        guru_absence_id: selectedCancelledItemForCreate.guruAbsenceId || null,
        batch_id: selectedCancelledItemForCreate.batchId,
        batch_name: currentBatch?.name || selectedCancelledItemForCreate.batchName,
        batch_code: currentBatch?.code || selectedCancelledItemForCreate.batchCode,
        course_id: currentBatch?.course_id || selectedCancelledItemForCreate.courseId,
        course_title: currentBatch?.course_title || crs?.title || selectedCancelledItemForCreate.courseTitle,
        course_code: crs?.code || currentBatch?.course_code || selectedCancelledItemForCreate.courseCode,
        trainer_id: currentBatch?.trainer_id || selectedCancelledItemForCreate.trainerId,
        trainer_name: currentBatch?.trainer_name || selectedCancelledItemForCreate.trainerName,
        original_date: selectedCancelledItemForCreate.date,
        rescheduled_date: createRescheduledDate,
        start_time: `${createStartTime}:00`,
        end_time: `${createEndTime}:00`,
        room_or_hall: createSelectedRoom,
        reason: createReason.trim(),
        students_count: enrolledStudentsInCreateBatch.length
      };

      const res = await fetch('/api/tally-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule tally class');
      }

      setTallyClasses(prev => [data.tallyClass, ...prev]);

      // If tied to guru absence, update its status
      if (selectedCancelledItemForCreate.guruAbsenceId) {
        setGuruAbsences(prev =>
          prev.map(ga =>
            ga.id === selectedCancelledItemForCreate.guruAbsenceId
              ? { ...ga, status: 'Rescheduled' as const, tally_class_id: data.tallyClass.id }
              : ga
          )
        );
      }

      showToast(`Tally class scheduled for ${createRescheduledDate}! Notification broadcast to all ${enrolledStudentsInCreateBatch.length} disciples and ${payload.trainer_name}.`);
      setSelectedCancelledItemForCreate(null);
      setFullPageView('none');
    } catch (err: any) {
      showToast(err.message || 'Error scheduling tally class', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // -------------------------------------------------------------
  // OPEN DETAILS MODAL (FOR SUCCESS ROWS)
  // -------------------------------------------------------------
  const handleOpenDetailsModal = (item: CancelledClassItem) => {
    setDetailsModalItem(item);
    setIsEditingDetails(false);
    if (item.tallyClass) {
      setEditRescheduledDate(item.tallyClass.rescheduled_date);
      setEditSelectedRoom(item.tallyClass.room_or_hall);
      setEditStartTime(item.tallyClass.start_time.substring(0, 5));
      setEditEndTime(item.tallyClass.end_time.substring(0, 5));
      setEditReason(item.tallyClass.reason || '');
    }
  };

  // -------------------------------------------------------------
  // SAVE EDIT RESCHEDULE (IN DETAILS MODAL)
  // -------------------------------------------------------------
  const handleSaveEditSchedule = async () => {
    if (!detailsModalItem || !detailsModalItem.tallyClass) return;

    const analysis = checkClashes(
      detailsModalItem.batchId,
      editRescheduledDate,
      getDayNameFromDate(editRescheduledDate),
      editStartTime,
      editEndTime,
      editSelectedRoom,
      detailsModalItem.tallyClass.id
    );

    if (analysis.hasClashes) {
      setClashErrorPopup({
        isOpen: true,
        guruClashes: analysis.guruClashes,
        studentClashes: analysis.studentClashes,
        roomClashes: analysis.roomClashes
      });
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/tally-classes/${detailsModalItem.tallyClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rescheduled_date: editRescheduledDate,
          start_time: `${editStartTime}:00`,
          end_time: `${editEndTime}:00`,
          room_or_hall: editSelectedRoom,
          reason: editReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update reschedule');

      setTallyClasses(prev => prev.map(tc => (tc.id === data.tallyClass.id ? data.tallyClass : tc)));
      showToast('Rescheduled session details updated successfully');
      setIsEditingDetails(false);
      setDetailsModalItem(prev => (prev ? { ...prev, tallyClass: data.tallyClass } : null));
    } catch (err: any) {
      showToast(err.message || 'Error updating reschedule', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // -------------------------------------------------------------
  // CANCEL / DELETE RESCHEDULE (REVERT TO PENDING)
  // -------------------------------------------------------------
  const handleCancelReschedule = async () => {
    if (!detailsModalItem || !detailsModalItem.tallyClass) return;
    if (!confirm('Are you sure you want to cancel this reschedule? The class will revert to Pending status.')) {
      return;
    }

    setIsDeletingTally(true);
    try {
      const res = await fetch(`/api/tally-classes/${detailsModalItem.tallyClass.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to cancel reschedule');

      const removedId = detailsModalItem.tallyClass.id;
      setTallyClasses(prev => prev.filter(tc => tc.id !== removedId));

      if (detailsModalItem.guruAbsenceId) {
        setGuruAbsences(prev =>
          prev.map(ga =>
            ga.id === detailsModalItem.guruAbsenceId
              ? { ...ga, status: 'Pending Reschedule' as const, tally_class_id: null }
              : ga
          )
        );
      }

      showToast('Reschedule cancelled. Class reverted to Pending status.');
      setDetailsModalItem(null);
    } catch (err: any) {
      showToast(err.message || 'Error cancelling reschedule', 'error');
    } finally {
      setIsDeletingTally(false);
    }
  };

  // =====================================================================
  // VIEW MODE 1: FULL-PAGE "ROOM VACANCIES & AVAILABILITY" VIEW
  // =====================================================================
  if (fullPageView === 'vacancy') {
    return (
      <div className="w-full space-y-6 pb-16">
        {/* Top Header Bar */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFullPageView('none')}
                className="px-3.5 py-2 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 hover:text-[#075E54] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 text-[#075E54]" />
                <span>Back to Reschedule Engine</span>
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-[#075E54]" />
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Room Vacancies &amp; Availability
                </h1>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#075E54] text-xs font-black self-start sm:self-auto">
              Live Mandapam &amp; Studio Grid
            </span>
          </div>
        </div>

        {/* Full Page Vacant Rooms Matrix */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-5 sm:p-7">
          <VacantRoomsView
            batches={batches}
            rooms={rooms}
            onBack={() => setFullPageView('none')}
          />
        </div>
      </div>
    );
  }

  // =====================================================================
  // VIEW MODE 2: FULL-PAGE "CREATE RESCHEDULE CLASS"
  // =====================================================================
  if (fullPageView === 'create' && selectedCancelledItemForCreate) {
    const item = selectedCancelledItemForCreate;
    const isHoliday = item.cause === 'Holiday';

    return (
      <div className="w-full space-y-6 pb-20">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${
              toastMessage.type === 'success' ? 'bg-[#075E54]' : 'bg-rose-600'
            }`}>
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F0D5E4] shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCancelledItemForCreate(null);
                  setFullPageView('none');
                }}
                className="px-3.5 py-2 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 hover:text-[#8A064D] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 text-[#8A064D]" />
                <span>Back to Reschedule Engine</span>
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-[#075E54]" />
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Create Reschedule Class
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#075E54] text-xs font-black">
                Zero Clash Guarantee
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FFF2F8] border border-[#F0D5E4] text-[#8A064D] text-xs font-black">
                Batch Isolated Messages
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Full Page Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Clear Details of the Holiday / Cancelled Schedule */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl border border-[#F0D5E4] p-6 shadow-2xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-black uppercase tracking-wider text-[#8A064D] flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  <span>Cancelled Session Summary</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  isHoliday ? 'bg-rose-100 text-[#8A064D]' : 'bg-amber-100 text-amber-900'
                }`}>
                  {isHoliday ? 'Admin Declared Holiday' : 'Guru Leave'}
                </span>
              </div>

              {/* Cancelled Date & Day */}
              <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
                    Original Cancelled Date
                  </span>
                  <div className="font-mono font-black text-xl text-gray-900 mt-0.5">
                    {item.date}
                  </div>
                  <div className="text-xs font-bold text-[#8A064D] uppercase tracking-wide mt-0.5">
                    {item.dayName}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#F0D5E4] flex items-center justify-center text-[#8A064D] shadow-2xs">
                  <CalendarX2 className="w-6 h-6" />
                </div>
              </div>

              {/* Holiday Title / Leave Cause */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
                  {isHoliday ? 'Holiday Title & Cause' : 'Absence Reason'}
                </span>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 leading-snug">
                  {item.holidayTitle ? (
                    <div>
                      <span className="text-[#8A064D] font-extrabold">{item.holidayTitle}</span>
                      <p className="text-gray-600 font-normal mt-1">{item.reason}</p>
                    </div>
                  ) : (
                    <span>{item.reason}</span>
                  )}
                </div>
              </div>

              {/* Course & Batch Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Course</span>
                  <div className="font-black text-gray-900 leading-snug">{item.courseTitle}</div>
                  <div className="text-[10px] font-mono text-gray-500 mt-1">
                    {item.courseCode || `ID: ${item.courseId.slice(0, 8)}`}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] text-[#8A064D] font-bold uppercase block mb-1">Batch</span>
                  <div className="font-black text-[#590231] leading-snug">{item.batchName}</div>
                  <div className="text-[10px] font-mono text-[#8A064D] mt-1 font-bold">
                    {item.batchCode || `ID: ${item.batchId.slice(0, 8)}`}
                  </div>
                </div>
              </div>

              {/* Assigned Guru & Direct Contact Details */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Assigned Guru &amp; Contact
                </span>
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-gray-900">{item.trainerName}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 font-bold">
                    {item.trainerCode || 'Faculty'}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-gray-600">
                  {item.trainerPhone ? (
                    <a href={`tel:${item.trainerPhone}`} className="flex items-center gap-1.5 hover:text-[#075E54] font-semibold">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.trainerPhone}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">No phone logged</span>
                  )}
                  {item.trainerEmail ? (
                    <a href={`mailto:${item.trainerEmail}`} className="flex items-center gap-1.5 hover:text-[#8A064D] truncate max-w-[200px]" title={item.trainerEmail}>
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{item.trainerEmail}</span>
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Original Schedule Timings & Room */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Original Slot</span>
                  <div className="font-mono font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{item.classTimings}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Room / Hall</span>
                  <div className="font-bold text-gray-800 flex items-center gap-1.5 mt-0.5 justify-end">
                    <DoorOpen className="w-3.5 h-3.5 text-[#075E54]" />
                    <span>{item.roomOrHall}</span>
                  </div>
                </div>
              </div>

              {/* Enrolled Disciples Accordion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrolledStudentsInCreate(!showEnrolledStudentsInCreate)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-[#075E54] text-xs font-bold transition flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>Enrolled Batch Disciples ({enrolledStudentsInCreateBatch.length})</span>
                  </span>
                  {showEnrolledStudentsInCreate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showEnrolledStudentsInCreate && (
                  <div className="mt-2.5 max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 divide-y divide-gray-100 text-xs">
                    {enrolledStudentsInCreateBatch.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">No students currently enrolled in this batch</div>
                    ) : (
                      enrolledStudentsInCreateBatch.map(st => (
                        <div key={st.id} className="py-2 px-2 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900">{st.full_name}</div>
                            <div className="text-[10px] font-mono text-gray-500">Roll: {st.roll_number || 'LCA'}</div>
                          </div>
                          {st.phone && (
                            <span className="text-[11px] font-mono text-gray-600">{st.phone}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Steps to Reschedule */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-2xs">
              <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-black text-lg text-gray-900">
                    Reschedule Steps &amp; Allocation
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Select a future date, studio room, check availability, and set notification remarks
                  </p>
                </div>
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-[#075E54] flex items-center justify-center font-bold text-xs">
                  5 Steps
                </span>
              </div>

              <form onSubmit={handleProceedCreateReschedule} className="mt-6 space-y-6">
                
                {/* STEP 1: SELECT RESCHEDULE DATE FROM CALENDAR */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                      Step 1: Reschedule Date <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-bold text-[#075E54]">
                      Day: {createTargetDayOfWeek || '—'}
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    min={tomorrowStr}
                    value={createRescheduledDate}
                    onChange={(e) => setCreateRescheduledDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-500">
                    Date selection is strictly restricted to dates <strong>after the current date</strong>. Past dates and today are disabled.
                  </p>
                </div>

                {/* STEP 2: SELECT STUDIO ROOM */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                    Step 2: Studio Room / Mandapam <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={createSelectedRoom}
                    onChange={(e) => setCreateSelectedRoom(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white shadow-2xs"
                  >
                    <option value="">— Select Studio Room —</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.name}>{r.name} (Capacity: {r.capacity})</option>
                    ))}
                    {rooms.length === 0 && (
                      <>
                        <option value="Natya Mandapam (Room 101)">Natya Mandapam (Room 101)</option>
                        <option value="Sangeetha Shala (Room 102)">Sangeetha Shala (Room 102)</option>
                        <option value="Chitra Kuteera (Room 103)">Chitra Kuteera (Room 103)</option>
                        <option value="Yogasana Shala (Room 104)">Yogasana Shala (Room 104)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* STEP 3: ROOM AVAILABILITY AS A BUTTON */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                      Step 3: Room Availability Inspection
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">Selected Room Only</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRoomAvailability(!showRoomAvailability)}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                  >
                    <span className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-emerald-700" />
                      <span>
                        View Vacant &amp; Occupied Slots for &quot;{createSelectedRoom || 'Selected Room'}&quot; on {createRescheduledDate}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                        {roomVacancyOnSelectedDateAndRoom.vacantIntervals.length} Vacant
                      </span>
                      {showRoomAvailability ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Dropdown panel displaying vacant and occupied list of the selected room */}
                  {showRoomAvailability && (
                    <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-4 animate-in fade-in duration-200">
                      
                      {/* Vacant Quick Pick Pills */}
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block mb-2">
                          Vacant Intervals in &quot;{createSelectedRoom}&quot; (Click any slot to auto-fill Start &amp; End):
                        </span>
                        {roomVacancyOnSelectedDateAndRoom.vacantIntervals.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {roomVacancyOnSelectedDateAndRoom.vacantIntervals.map(slot => {
                              const isSelected = createStartTime === slot.start && createEndTime === slot.end;
                              return (
                                <button
                                  key={slot.start}
                                  type="button"
                                  onClick={() => {
                                    setCreateStartTime(slot.start);
                                    setCreateEndTime(slot.end);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                    isSelected
                                      ? 'bg-[#075E54] text-white border-[#075E54] shadow-xs'
                                      : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  <Check className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                  <span>{formatTime12(slot.start)} – {formatTime12(slot.end)}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                            No vacant standard slots left in this room on {createRescheduledDate}. Please pick another room or enter custom timing below.
                          </div>
                        )}
                      </div>

                      {/* Occupied List in Selected Room */}
                      <div className="pt-3 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-700 block mb-1.5">
                          Occupied Slots in &quot;{createSelectedRoom}&quot; on {createRescheduledDate}:
                        </span>
                        {roomVacancyOnSelectedDateAndRoom.occupiedIntervals.length > 0 ? (
                          <div className="space-y-1">
                            {roomVacancyOnSelectedDateAndRoom.occupiedIntervals.map((occ, idx) => (
                              <div key={idx} className="text-xs text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 flex items-center justify-between">
                                <span className="font-semibold">{occ.label}</span>
                                <span className="font-mono text-gray-500 font-bold">{formatTime12(occ.start)} - {formatTime12(occ.end)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-700 font-medium bg-emerald-50/50 p-2 rounded-xl">
                            Room is completely unoccupied throughout this entire day!
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* STEP 4: STARTING TIME AND ENDING TIME */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                      Step 4: Starting Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={createStartTime}
                      onChange={(e) => setCreateStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white shadow-2xs"
                    />
                    <span className="text-[11px] text-gray-500 font-mono mt-1 block">
                      {formatTime12(createStartTime)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                      Step 4: Ending Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={createEndTime}
                      onChange={(e) => setCreateEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white shadow-2xs"
                    />
                    <span className="text-[11px] text-gray-500 font-mono mt-1 block">
                      {formatTime12(createEndTime)}
                    </span>
                  </div>
                </div>

                {/* STEP 5: INCREASED SIZE OF NOTICE BOX WITH AI ENHANCE */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                      Step 5: Notice Message for Batch Students &amp; Guru <span className="text-rose-500">*</span>
                    </label>
                    <AiEnhanceButton
                      value={createReason}
                      onEnhance={(v) => setCreateReason(v)}
                      context="Reschedule tally announcement remarks"
                    />
                  </div>
                  <textarea
                    required
                    rows={5}
                    value={createReason}
                    onChange={(e) => setCreateReason(e.target.value)}
                    placeholder="Enter formal compensation notice remarks, instructions, or agenda..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white shadow-2xs min-h-[140px] leading-relaxed"
                  />
                  <p className="text-[11px] text-gray-500">
                    This notice will be broadcast instantly to the Messages screen of the <strong>{enrolledStudentsInCreateBatch.length} students</strong> enrolled in this batch and their assigned Guru.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCancelledItemForCreate(null);
                      setFullPageView('none');
                    }}
                    className="px-5 py-3 rounded-2xl text-gray-600 hover:bg-gray-100 text-xs font-bold cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCreate}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#075E54] to-[#128C7E] hover:from-[#054c43] hover:to-[#0f776a] active:scale-95 text-white font-black text-xs transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingCreate ? (
                      <span>Verifying Clashes &amp; Scheduling...</span>
                    ) : (
                      <>
                        <CalendarCheck className="w-4 h-4 text-[#F9E33A]" />
                        <span>Confirm &amp; Broadcast Reschedule</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>

        {/* POPUP: CLASH ERROR POPUP (WITH "DETAILS" BUTTON FOR STUDENTS) */}
        {clashErrorPopup && clashErrorPopup.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full border-2 border-rose-400 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              <div className="p-5 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-base sm:text-lg text-rose-950">
                      Schedule Conflict Detected!
                    </h3>
                    <p className="text-xs text-rose-700 font-medium">
                      Cannot allocate on this slot due to conflicting commitments
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setClashErrorPopup(null);
                    setIsStudentClashDetailsOpen(false);
                  }}
                  className="p-1.5 rounded-xl text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 text-xs">
                {/* Guru Clash */}
                {clashErrorPopup.guruClashes.length > 0 && (
                  <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-1.5">
                    <div className="font-bold text-rose-950 flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-rose-600" />
                      <span>Guru Assignment Clash:</span>
                    </div>
                    {clashErrorPopup.guruClashes.map((gc, i) => (
                      <div key={i} className="text-gray-800 bg-white p-2.5 rounded-xl border border-rose-100">
                        Guru <strong className="text-rose-950">{gc.guruName}</strong> is already teaching:
                        <div className="text-rose-800 font-bold mt-0.5">
                          {gc.conflictingBatch} ({gc.timing}) {gc.room ? `in ${gc.room}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Room Clash */}
                {clashErrorPopup.roomClashes.length > 0 && (
                  <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-1.5">
                    <div className="font-bold text-rose-950 flex items-center gap-1.5">
                      <DoorOpen className="w-4 h-4 text-rose-600" />
                      <span>Room Conflict:</span>
                    </div>
                    {clashErrorPopup.roomClashes.map((rc, i) => (
                      <div key={i} className="text-gray-800 bg-white p-2.5 rounded-xl border border-rose-100">
                        Studio <strong className="text-rose-950">{rc.room}</strong> is already occupied by:
                        <div className="text-rose-800 font-bold mt-0.5">
                          {rc.conflictingBatch} ({rc.timing})
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Student Clashes with Details Button */}
                {clashErrorPopup.studentClashes.length > 0 && (
                  <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-700" />
                        <span>
                          Student Conflict ({clashErrorPopup.studentClashes.length} Student{clashErrorPopup.studentClashes.length > 1 ? 's' : ''}):
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsStudentClashDetailsOpen(!isStudentClashDetailsOpen)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3 h-3 text-[#F9E33A]" />
                        <span>{isStudentClashDetailsOpen ? 'Hide Details' : 'Details'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-amber-800">
                      Disciples in this batch are already enrolled in other classes during this time slot.
                    </p>

                    {isStudentClashDetailsOpen && (
                      <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                        {clashErrorPopup.studentClashes.map((sc, i) => (
                          <div key={i} className="p-2.5 bg-white rounded-xl border border-amber-200 text-gray-800">
                            <div className="flex items-center justify-between font-bold text-amber-950">
                              <span>{sc.studentName}</span>
                              <span className="text-[10px] font-mono text-gray-500">Roll: {sc.rollNumber}</span>
                            </div>
                            <div className="text-[11px] text-gray-600 mt-0.5">
                              Has class: <strong className="text-gray-900">{sc.conflictingCourse} - {sc.conflictingBatch}</strong> ({sc.timing}) {sc.room ? `in ${sc.room}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setClashErrorPopup(null);
                    setIsStudentClashDetailsOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs cursor-pointer"
                >
                  Change Date / Slot
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // =====================================================================
  // MAIN VIEW: RESCHEDULE ENGINE DASHBOARD & CANCELLED CLASSES TABLE
  // =====================================================================
  return (
    <div className="w-full space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${
            toastMessage.type === 'success' ? 'bg-[#075E54]' : 'bg-rose-600'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER BANNER WITH ACTION BUTTONS (COMPACT) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#075E54] border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  Reschedule Engine
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#075E54] text-[11px] font-black">
                  Zero Clash Guarantee
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-black flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  <span>Starred Tally Classes</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5 max-w-xl line-clamp-1 sm:line-clamp-none">
                Primary engine to manage and tally classes cancelled due to <strong>Admin Declared Holidays</strong> or <strong>Guru Leave</strong>.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons (Compact) */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center shrink-0">
            {/* Room Vacancy Grid Button */}
            <button
              type="button"
              onClick={() => setFullPageView('vacancy')}
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 hover:border-[#075E54] text-gray-800 hover:text-[#075E54] font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <DoorOpen className="w-3.5 h-3.5 text-[#075E54]" />
              <span>Room Vacancy Grid</span>
            </button>

            {/* Master Timetable Button */}
            <button
              type="button"
              onClick={() => setIsTimetableModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 hover:border-[#8A064D] text-gray-800 hover:text-[#8A064D] font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 text-[#8A064D]" />
              <span>Master Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* CANCELLED CLASSES TABLE SECTION */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs relative">
        
        {/* Table Toolbar: Search, Date Range Filter, Multi-selects, Status and Cause */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 flex flex-col gap-3 bg-gray-50/50 rounded-t-3xl relative z-20">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center shrink-0">
                <CalendarX2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-black text-base text-gray-900 flex items-center gap-2">
                  <span>Cancelled Classes Overview</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                    {filteredCancelledClasses.length} Total
                  </span>
                </h2>
                <p className="text-[11px] text-gray-500 font-medium">
                  Classes cancelled via Holiday Alerts or Guru Leave awaiting or completed for tally rescheduling
                </p>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-gray-200/70 text-xs font-bold self-start md:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({allCancelledClasses.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-white text-rose-700 shadow-2xs' : 'text-gray-600 hover:text-rose-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Pending ({pendingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('success')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'success' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600 hover:text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Success ({successCount})</span>
              </button>
            </div>
          </div>

          {/* Filter Controls Row: Extended across row without empty space, highlighted filter buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-gray-200/60 w-full">
            
            {/* Search Box - Extended to fill available space */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search date, course, batch, guru, room, cause..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#075E54]/30 focus:border-[#075E54] bg-white shadow-xs"
              />
            </div>

            {/* Standard Date Range Filter: Highlighted Single Button Popover */}
            <div className="shrink-0">
              <DateRangeQuickFilter
                startDate={startDate}
                endDate={endDate}
                align="left"
                onApply={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                placeholder="Select Date Range"
              />
            </div>

            {/* Multi-Select Searchable Filter: Course */}
            <MultiSearchDropdown
              title="Course"
              placeholder="Search course..."
              items={courseDropdownItems}
              selectedIds={selectedCourseIds}
              onChange={setSelectedCourseIds}
              icon={BookOpen}
            />

            {/* Multi-Select Searchable Filter: Batch */}
            <MultiSearchDropdown
              title="Batch"
              placeholder="Search batch..."
              items={batchDropdownItems}
              selectedIds={selectedBatchIds}
              onChange={setSelectedBatchIds}
              icon={Layers}
            />

            {/* Multi-Select Searchable Filter: Guru */}
            <MultiSearchDropdown
              title="Guru"
              placeholder="Search guru..."
              items={trainerDropdownItems}
              selectedIds={selectedTrainerIds}
              onChange={setSelectedTrainerIds}
              icon={User}
              align="right"
            />

            {/* Cause Filter Dropdown - Highlighted */}
            <select
              value={causeFilter}
              onChange={(e) => setCauseFilter(e.target.value as any)}
              className="h-9 px-3.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white hover:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 shadow-xs cursor-pointer"
            >
              <option value="all">All Causes</option>
              <option value="holiday">Holiday Only</option>
              <option value="guru_leave">Guru Leave Only</option>
            </select>

            {/* Clear All Filters Button */}
            {(searchQuery || startDate || endDate || selectedCourseIds.length > 0 || selectedBatchIds.length > 0 || selectedTrainerIds.length > 0 || causeFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStartDate('');
                  setEndDate('');
                  setSelectedCourseIds([]);
                  setSelectedBatchIds([]);
                  setSelectedTrainerIds([]);
                  setCauseFilter('all');
                  setStatusFilter('all');
                }}
                className="h-9 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-gray-200 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>Reset</span>
              </button>
            )}

          </div>
        </div>

        {/* The 9-Column Cancelled Classes Table */}
        <div className="overflow-x-auto rounded-b-3xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-600">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Course</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Trainer</th>
                <th className="py-3.5 px-4">Guru Contact</th>
                <th className="py-3.5 px-4">Class Timings &amp; Room</th>
                <th className="py-3.5 px-4">Cause</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredCancelledClasses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-gray-800 text-sm">No Cancelled Classes Found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {statusFilter === 'pending'
                        ? 'All cancelled sessions have been successfully rescheduled!'
                        : 'No cancellation records match the current filter selection.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCancelledClasses.map(item => {
                  const isSuccess = item.status === 'Success';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSuccess ? 'bg-white' : 'bg-[#FFFDFE]'
                      }`}
                    >
                      {/* Column 1: Date [mention day below it] */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-gray-900">
                          {item.date}
                        </div>
                        <div className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wide">
                          {item.dayName || '—'}
                        </div>
                      </td>

                      {/* Column 2: Course [mention id below it] */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-gray-900 leading-tight">
                          {item.courseTitle}
                        </div>
                        <div className="text-[10px] font-mono font-semibold text-gray-500 mt-0.5">
                          {item.courseCode ? item.courseCode : `ID: ${item.courseId.slice(0, 8)}`}
                        </div>
                      </td>

                      {/* Column 3: Batch [mention id below it] */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-extrabold text-[#590231] leading-tight">
                          {item.batchName}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-[#8A064D] bg-[#FFF2F8] px-1.5 py-0.2 rounded border border-[#F0D5E4] inline-block mt-0.5">
                          {item.batchCode ? item.batchCode : `ID: ${item.batchId.slice(0, 8)}`}
                        </div>
                      </td>

                      {/* Column 4: Trainer [mention id below it] */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-gray-800 leading-tight">
                          {item.trainerName}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                          {item.trainerCode ? item.trainerCode : (item.trainerId ? `ID: ${item.trainerId.slice(0, 8)}` : 'Faculty')}
                        </div>
                      </td>

                      {/* Column 5: Guru Contact (Phone & Email) */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {item.trainerPhone ? (
                          <a
                            href={`tel:${item.trainerPhone}`}
                            className="text-xs font-semibold text-gray-800 hover:text-[#075E54] flex items-center gap-1.5 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item.trainerPhone}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs italic">—</span>
                        )}
                        {item.trainerEmail ? (
                          <a
                            href={`mailto:${item.trainerEmail}`}
                            className="text-[11px] text-gray-500 hover:text-[#8A064D] flex items-center gap-1.5 mt-0.5 max-w-[170px] truncate transition"
                            title={item.trainerEmail}
                          >
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{item.trainerEmail}</span>
                          </a>
                        ) : null}
                      </td>

                      {/* Column 6: Class Timings & Room */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-semibold text-gray-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{item.classTimings}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <DoorOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[170px]">{item.roomOrHall}</span>
                        </div>
                      </td>

                      {/* Column 7: Cause [Holiday or Guru Leave, with Holiday Title below cause] */}
                      <td className="py-3.5 px-4 align-top">
                        {item.cause === 'Holiday' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-[#8A064D] border border-rose-200 shadow-2xs">
                              <CalendarX2 className="w-3 h-3 text-[#8A064D]" />
                              <span>Holiday</span>
                            </span>
                            <div className="font-bold text-[11px] text-gray-900 mt-1 leading-snug">
                              {item.holidayTitle || item.reason}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                              <UserX className="w-3 h-3 text-amber-700" />
                              <span>Guru Leave</span>
                            </span>
                            <div className="text-[11px] text-gray-700 font-medium mt-1 leading-snug">
                              {item.reason}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 8: Status [Pending or Success - Static solid dot, blinking animation removed] */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {isSuccess ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span>Success</span>
                            </span>
                            {item.tallyClass && (
                              <div className="text-[10px] text-emerald-700 font-bold block">
                                On: {item.tallyClass.rescheduled_date}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-rose-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Column 9: Action BUTTON [Create for pending, Details for success] */}
                      <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                        {isSuccess ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDetailsModal(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mx-auto border border-gray-200"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#075E54]" />
                            <span>Details</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenCreateReschedule(item)}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#075E54] to-[#128C7E] hover:from-[#054c43] hover:to-[#0f776a] active:scale-95 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mx-auto"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#F9E33A]" />
                            <span>Create</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: DETAILS / EDIT FOR SUCCESS ROWS                                */}
      {/* ===================================================================== */}
      {detailsModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#E8F8F0] to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-gray-900">
                    Rescheduled Class Details
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Scheduled tally session replacement
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalItem(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs max-h-[75vh]">
              
              {/* SECTION 1: CANCELLED SESSION SUMMARY */}
              <div className="rounded-2xl border border-rose-200 bg-[#FFF9FB] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
                  <span className="font-serif font-black text-xs sm:text-sm text-[#590231] flex items-center gap-2">
                    <CalendarX2 className="w-4 h-4 text-[#8A064D]" />
                    <span>Cancelled Session Summary</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    detailsModalItem.cause === 'Holiday'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}>
                    Cause: {detailsModalItem.cause}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Original Date &amp; Day</span>
                    <div className="font-extrabold text-gray-900 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      <span>{detailsModalItem.date} ({detailsModalItem.dayName || getDayNameFromDate(detailsModalItem.date)})</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Original Slot &amp; Studio</span>
                    <div className="font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{detailsModalItem.classTimings}</span>
                      <span className="text-gray-300">•</span>
                      <DoorOpen className="w-3.5 h-3.5 text-[#075E54]" />
                      <span>{detailsModalItem.roomOrHall}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Course &amp; Batch</span>
                    <div className="font-black text-gray-900 mt-0.5">{detailsModalItem.courseTitle}</div>
                    <div className="text-[11px] font-bold text-[#8A064D]">{detailsModalItem.batchName}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Assigned Guru &amp; Contact</span>
                    <div className="font-bold text-gray-900 mt-0.5">{detailsModalItem.trainerName}</div>
                    <div className="text-[11px] font-mono text-gray-500">{detailsModalItem.trainerPhone || 'Faculty Contact'}</div>
                  </div>
                </div>

                {/* Holiday Title / Detailed Cancellation Reason */}
                <div className="pt-2 border-t border-rose-100 text-xs">
                  <div className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">
                    {detailsModalItem.cause === 'Holiday' ? 'Holiday Title & Remarks' : 'Absence Reason & Remarks'}
                  </div>
                  {detailsModalItem.holidayTitle && (
                    <div className="font-black text-[#590231] text-xs mb-0.5">
                      {detailsModalItem.holidayTitle}
                    </div>
                  )}
                  <p className="text-gray-700 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-rose-100/80">
                    {detailsModalItem.reason || 'No cancellation remarks recorded.'}
                  </p>
                </div>
              </div>

              {/* SECTION 2: RESCHEDULE SUMMARY */}
              {detailsModalItem.tallyClass && !isEditingDetails && (
                <div className="rounded-2xl border border-emerald-200 bg-[#E8F8F0]/80 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                    <span className="font-serif font-black text-xs sm:text-sm text-[#075E54] flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-[#075E54]" />
                      <span>Reschedule Summary</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Status: Rescheduled (Success)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Rescheduled Date &amp; Day</span>
                      <div className="font-mono font-extrabold text-[#075E54] text-sm mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#075E54]" />
                        <span>{detailsModalItem.tallyClass.rescheduled_date}</span>
                      </div>
                      <span className="text-[11px] text-gray-600 font-medium">
                        {getDayNameFromDate(detailsModalItem.tallyClass.rescheduled_date)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Rescheduled Timings</span>
                      <div className="font-mono font-black text-gray-900 text-sm mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#075E54]" />
                        <span>
                          {formatTime12(detailsModalItem.tallyClass.start_time)} – {formatTime12(detailsModalItem.tallyClass.end_time)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Allocated Studio</span>
                      <div className="font-bold text-gray-900 text-sm mt-0.5 flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-[#075E54]" />
                        <span>{detailsModalItem.tallyClass.room_or_hall}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compensation Notice Remarks */}
                  <div className="pt-2 border-t border-emerald-200/60 text-xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                      Compensation Notice Remarks (Broadcast Message)
                    </span>
                    <p className="text-gray-800 font-medium leading-relaxed bg-white/90 p-2.5 rounded-xl border border-emerald-200/80">
                      &quot;{detailsModalItem.tallyClass.reason}&quot;
                    </p>
                    <div className="text-[11px] text-[#075E54] font-bold mt-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Notice verified &amp; broadcast to enrolled batch disciples and assigned Guru.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Editing Form in Details Modal */}
              {isEditingDetails && detailsModalItem.tallyClass ? (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="font-black text-amber-950 text-xs uppercase tracking-wide">
                    Edit Rescheduled Timing &amp; Studio Room
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Rescheduled Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={tomorrowStr}
                        value={editRescheduledDate}
                        onChange={(e) => setEditRescheduledDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Studio Room <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={editSelectedRoom}
                        onChange={(e) => setEditSelectedRoom(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                      >
                        {rooms.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Start Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        End Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Reason / Notice Remarks
                    </label>
                    <input
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(false)}
                      className="px-3 py-1.5 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-bold cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingEdit}
                      onClick={handleSaveEditSchedule}
                      className="px-4 py-1.5 rounded-xl bg-[#075E54] hover:bg-[#054c43] text-white text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingEdit ? 'Saving...' : 'Save Updated Schedule'}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons in Details Modal */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isDeletingTally}
                  onClick={handleCancelReschedule}
                  className="px-4 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cancel Reschedule (Revert to Pending)</span>
                </button>

                <div className="flex items-center gap-2">
                  {!isEditingDetails && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(true)}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Schedule</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailsModalItem(null)}
                    className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: MASTER TIMETABLE MODAL DIALOG                                  */}
      {/* ===================================================================== */}
      {isTimetableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-200 shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#8A064D]" />
                <h3 className="font-serif font-black text-lg text-gray-900">
                  Master Academy Timetable
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTimetableModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <TimetableView
                batches={batches}
                onBack={() => setIsTimetableModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Batch, Course, Trainer, Room } from '@/lib/academy';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  X,
  Search,
  Check,
  Edit3,
  Trash2,
  Eye,
  AlertCircle,
  GraduationCap,
  Layers,
  DoorOpen,
  ChevronDown,
  Loader2,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  RotateCcw,
  IndianRupee,
  Tag
} from 'lucide-react';
import AiEnhanceButton from '@/components/common/AiEnhanceButton';
import SearchableCombobox, { ComboboxOption } from '@/components/common/SearchableCombobox';
import SearchableRoomSelect from './SearchableRoomSelect';
import VacantRoomsView from './VacantRoomsView';
import TimetableView from './TimetableView';

interface Props {
  initialBatches: Batch[];
  courses: Course[];
  trainers: Trainer[];
  initialRooms?: Room[];
}

interface ScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function BatchesListClient({ initialBatches, courses, trainers, initialRooms = [] }: Props) {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVacantRooms, setShowVacantRooms] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  
  // Searchable Multi-Select Course Filter State
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseFilterSearch, setCourseFilterSearch] = useState('');
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Rooms Top Header Dropdown State
  const [isRoomsDropdownOpen, setIsRoomsDropdownOpen] = useState(false);
  const [roomHeaderSearch, setRoomHeaderSearch] = useState('');
  const [isHeaderCreatingRoom, setIsHeaderCreatingRoom] = useState(false);
  const [headerNewRoomName, setHeaderNewRoomName] = useState('');
  const [headerNewRoomCapacity, setHeaderNewRoomCapacity] = useState(25);
  const [headerRoomSaving, setHeaderRoomSaving] = useState(false);
  const roomsDropdownRef = useRef<HTMLDivElement>(null);

  // Edit Room Modal State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomCapacity, setEditRoomCapacity] = useState(25);
  const [editingRoomSaving, setEditingRoomSaving] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);

  // Status/feedback
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Close top header rooms dropdown and course filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roomsDropdownRef.current && !roomsDropdownRef.current.contains(event.target as Node)) {
        setIsRoomsDropdownOpen(false);
        setIsHeaderCreatingRoom(false);
      }
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setIsCourseDropdownOpen(false);
      }
    }
    if (isRoomsDropdownOpen || isCourseDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoomsDropdownOpen, isCourseDropdownOpen]);

  const toggleCourseFilter = (crsId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(crsId) ? prev.filter(id => id !== crsId) : [...prev, crsId]
    );
  };

  const selectAllCoursesFilter = () => {
    setSelectedCourseIds(courses.map(c => c.id));
  };

  const clearCoursesFilter = () => {
    setSelectedCourseIds([]);
  };

  const removeSingleCourseFilter = (crsId: string) => {
    setSelectedCourseIds(prev => prev.filter(id => id !== crsId));
  };

  const handleHeaderCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = headerNewRoomName.trim();
    if (!trimmed) {
      showFeedback('error', 'Please enter a valid room name');
      return;
    }
    setHeaderRoomSaving(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, capacity: Number(headerNewRoomCapacity) || 25 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      setRooms(prev => [...prev.filter(r => r.id !== data.room.id), data.room].sort((a, b) => a.name.localeCompare(b.name)));
      setHeaderNewRoomName('');
      setIsHeaderCreatingRoom(false);
      showFeedback('success', `Room "${data.room.name}" created successfully!`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Error creating room');
    } finally {
      setHeaderRoomSaving(false);
    }
  };

  const handleHeaderDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete room "${roomName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/rooms?id=${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete room');
      setRooms(prev => prev.filter(r => r.id !== roomId));
      showFeedback('success', `Room "${roomName}" deleted successfully!`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting room');
    }
  };

  const handleHeaderEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    const trimmed = editRoomName.trim();
    if (!trimmed) {
      showFeedback('error', 'Please enter a valid room name');
      return;
    }
    setEditingRoomSaving(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRoom.id,
          name: trimmed,
          capacity: Number(editRoomCapacity) || 25
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update room');
      setRooms(prev => prev.map(r => r.id === editingRoom.id ? data.room : r).sort((a, b) => a.name.localeCompare(b.name)));
      setBatches(prev => prev.map(b => (b.room === editingRoom.name || b.room_or_hall === editingRoom.name) ? { ...b, room: trimmed, room_or_hall: trimmed } : b));
      setEditingRoom(null);
      showFeedback('success', `Room "${trimmed}" updated successfully!`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Error updating room');
    } finally {
      setEditingRoomSaving(false);
    }
  };

  // -------------------------------------------------------------
  // HELPER: Filter Gurus by Course
  // -------------------------------------------------------------
  const getGurusForCourse = (courseId: string) => {
    const crs = courses.find(c => c.id === courseId);
    if (!crs) return trainers;

    const crsTitle = crs.title.toLowerCase();
    const crsCat = crs.category.toLowerCase();

    // Check specializations
    const matched = trainers.filter(t => {
      const specs = (t.specializations || []).map(s => s.toLowerCase());
      return specs.some(s => 
        s.includes(crsTitle) || 
        crsTitle.includes(s) || 
        s.includes(crsCat) ||
        crsCat.includes(s)
      );
    });

    return matched.length > 0 ? matched : trainers;
  };

  // -------------------------------------------------------------
  // HELPER: Auto-generate sequential batch name for course
  // -------------------------------------------------------------
  const getNextSequentialBatchName = (crsId: string, currentBatches: Batch[]) => {
    const crs = courses.find(c => c.id === crsId);
    const crsBatches = currentBatches.filter(b => b.course_id === crsId);
    
    let maxNum = 0;
    crsBatches.forEach(b => {
      const match = b.name.match(/Batch\s*(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const nextNum = Math.max(maxNum + 1, crsBatches.length + 1);
    const prefix = crs ? `${crs.title} - ` : '';
    return `${prefix}Batch ${nextNum}`;
  };

  // -------------------------------------------------------------
  // HELPER: Auto-generate sequential batch code derived from course (e.g. bhar-1)
  // -------------------------------------------------------------
  const getNextSequentialBatchCode = (crsId: string, currentBatches: Batch[]) => {
    const crs = courses.find(c => c.id === crsId);
    const crsCode = (crs?.code || 'crs').toLowerCase();
    const crsBatches = currentBatches.filter(b => b.course_id === crsId);
    
    let maxNum = 0;
    crsBatches.forEach(b => {
      if (b.code) {
        const match = b.code.match(/-(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
    });

    const nextNum = Math.max(maxNum + 1, crsBatches.length + 1);
    return `${crsCode}-${nextNum}`;
  };

  // -------------------------------------------------------------
  // STATUS FILTER (All / Active / Inactive)
  // -------------------------------------------------------------
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // -------------------------------------------------------------
  // CREATE BATCH FORM STATE (No drafted autofill)
  // -------------------------------------------------------------
  const [addCourseSearch, setAddCourseSearch] = useState('');
  const [addCourseId, setAddCourseId] = useState('');
  const [addTrainerSearch, setAddTrainerSearch] = useState('');
  const [addTrainerId, setAddTrainerId] = useState('');
  const [addBatchName, setAddBatchName] = useState('');
  const [addBatchCode, setAddBatchCode] = useState('');
  const [addMonthlyFee, setAddMonthlyFee] = useState<string>('');
  const [addDescription, setAddDescription] = useState('');
  const [addRoom, setAddRoom] = useState('Natya Mandapam (Room 101)');
  const [addCapacity, setAddCapacity] = useState(25);
  const [addIsActive, setAddIsActive] = useState(true);
  const [addSchedules, setAddSchedules] = useState<ScheduleEntry[]>([
    { day: 'Monday', startTime: '09:00', endTime: '10:00', room: 'Natya Mandapam (Room 101)' }
  ]);

  // When opening Add Modal - clean blank state with no drafted autofill
  const openAddModal = () => {
    setAddCourseId('');
    setAddCourseSearch('');
    setAddTrainerId('');
    setAddTrainerSearch('');
    setAddBatchName('');
    setAddBatchCode('');
    setAddMonthlyFee('');
    setAddDescription('');
    setAddRoom(rooms[0]?.name || 'Natya Mandapam (Room 101)');
    setAddCapacity(25);
    setAddIsActive(true);
    setAddSchedules([
      { day: 'Monday', startTime: '09:00', endTime: '10:00', room: rooms[0]?.name || 'Natya Mandapam (Room 101)' }
    ]);
    setIsAddOpen(true);
  };

  // When selected course changes in Add Modal
  const handleAddCourseChange = (newCrsId: string) => {
    setAddCourseId(newCrsId);
    const matchingGurus = getGurusForCourse(newCrsId);
    setAddTrainerId(matchingGurus[0]?.id || trainers[0]?.id || '');
    if (newCrsId) {
      setAddBatchName(getNextSequentialBatchName(newCrsId, batches));
      setAddBatchCode(getNextSequentialBatchCode(newCrsId, batches));
    } else {
      setAddBatchCode('');
    }
  };

  // -------------------------------------------------------------
  // EDIT BATCH FORM STATE
  // -------------------------------------------------------------
  const [editCourseSearch, setEditCourseSearch] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [editTrainerSearch, setEditTrainerSearch] = useState('');
  const [editTrainerId, setEditTrainerId] = useState('');
  const [editBatchName, setEditBatchName] = useState('');
  const [editBatchCode, setEditBatchCode] = useState('');
  const [editMonthlyFee, setEditMonthlyFee] = useState<string>('0');
  const [editDescription, setEditDescription] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editCapacity, setEditCapacity] = useState(25);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSchedules, setEditSchedules] = useState<ScheduleEntry[]>([]);

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setEditCourseId(batch.course_id);
    setEditCourseSearch('');
    setEditTrainerId(batch.trainer_id);
    setEditTrainerSearch('');
    setEditBatchName(batch.name);
    setEditBatchCode(batch.code || getNextSequentialBatchCode(batch.course_id, batches));
    setEditMonthlyFee(batch.monthly_fee !== undefined ? String(batch.monthly_fee) : '0');
    setEditDescription(batch.description || '');
    setEditRoom(batch.room_or_hall || 'Natya Mandapam (Room 101)');
    setEditCapacity(batch.max_capacity || 25);
    setEditIsActive(batch.is_active ?? true);

    if (batch.schedules && batch.schedules.length > 0) {
      setEditSchedules(batch.schedules.map(s => ({
        day: s.day,
        startTime: s.startTime ? s.startTime.substring(0, 5) : '09:00',
        endTime: s.endTime ? s.endTime.substring(0, 5) : '10:00',
        room: s.room || batch.room_or_hall || (rooms[0]?.name || 'Natya Mandapam (Room 101)')
      })));
    } else {
      const sTime = batch.start_time ? batch.start_time.substring(0, 5) : '09:00';
      const eTime = batch.end_time ? batch.end_time.substring(0, 5) : '10:00';
      const days = (batch.days_of_week && batch.days_of_week.length > 0) 
        ? batch.days_of_week 
        : ['Monday', 'Wednesday'];

      setEditSchedules(days.map(d => ({
        day: d,
        startTime: sTime,
        endTime: eTime,
        room: batch.room_or_hall || (rooms[0]?.name || 'Natya Mandapam (Room 101)')
      })));
    }
  };

  // Schedule array handlers
  const addScheduleRow = (mode: 'add' | 'edit') => {
    const newEntry: ScheduleEntry = {
      day: 'Friday',
      startTime: '14:00',
      endTime: '15:00',
      room: rooms[0]?.name || 'Natya Mandapam (Room 101)'
    };
    if (mode === 'add') {
      setAddSchedules(prev => [...prev, newEntry]);
    } else {
      setEditSchedules(prev => [...prev, newEntry]);
    }
  };

  const removeScheduleRow = (index: number, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      if (addSchedules.length <= 1) return;
      setAddSchedules(prev => prev.filter((_, i) => i !== index));
    } else {
      if (editSchedules.length <= 1) return;
      setEditSchedules(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateScheduleRow = (index: number, field: keyof ScheduleEntry, value: string, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      setAddSchedules(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    } else {
      setEditSchedules(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    }
  };

  // Filtered Batches based on multi-select courses, status filter, and search query
  const filteredBatches = batches.filter(b => {
    if (statusFilter === 'active' && b.is_active === false) return false;
    if (statusFilter === 'inactive' && b.is_active !== false) return false;
    const matchesCourse = selectedCourseIds.length === 0 || selectedCourseIds.includes(b.course_id);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      b.name.toLowerCase().includes(q) ||
      (b.code && b.code.toLowerCase().includes(q)) ||
      b.course_title.toLowerCase().includes(q) ||
      b.trainer_name.toLowerCase().includes(q) ||
      (b.room_or_hall || '').toLowerCase().includes(q);
    return matchesCourse && matchesSearch;
  });

  // Filter courses for multi-select dropdown search
  const filteredCoursesForFilter = useMemo(() => {
    if (!courseFilterSearch.trim()) return courses;
    const q = courseFilterSearch.toLowerCase();
    return courses.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.code.toLowerCase().includes(q) || 
      c.category.toLowerCase().includes(q)
    );
  }, [courses, courseFilterSearch]);

  // Academy summary stats
  const totalEnrolled = useMemo(() => batches.reduce((sum, b) => sum + (b.enrolled_count || 0), 0), [batches]);
  const totalCapacity = useMemo(() => batches.reduce((sum, b) => sum + (b.max_capacity || 25), 0), [batches]);
  const activeBatchesCount = useMemo(() => batches.filter(b => b.is_active !== false).length, [batches]);
  const fillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Available gurus for current Add Course selection (with search)
  const addMatchingGurus = useMemo(() => {
    const gurus = addCourseId ? getGurusForCourse(addCourseId) : trainers;
    if (!addTrainerSearch.trim()) return gurus;
    const q = addTrainerSearch.toLowerCase();
    return gurus.filter(t => t.full_name.toLowerCase().includes(q) || (t.display_title || '').toLowerCase().includes(q));
  }, [addCourseId, courses, trainers, addTrainerSearch]);

  // Available gurus for current Edit Course selection (with search)
  const editMatchingGurus = useMemo(() => {
    const gurus = editCourseId ? getGurusForCourse(editCourseId) : trainers;
    if (!editTrainerSearch.trim()) return gurus;
    const q = editTrainerSearch.toLowerCase();
    return gurus.filter(t => t.full_name.toLowerCase().includes(q) || (t.display_title || '').toLowerCase().includes(q));
  }, [editCourseId, courses, trainers, editTrainerSearch]);

  // Courses filtered by search input inside Add Modal
  const addFilteredCourses = useMemo(() => {
    if (!addCourseSearch.trim()) return courses;
    const q = addCourseSearch.toLowerCase();
    return courses.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [courses, addCourseSearch]);

  // Courses filtered by search input inside Edit Modal
  const editFilteredCourses = useMemo(() => {
    if (!editCourseSearch.trim()) return courses;
    const q = editCourseSearch.toLowerCase();
    return courses.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [courses, editCourseSearch]);

  // Combobox options for courses
  const courseComboboxOptions = useMemo<ComboboxOption[]>(() => {
    return courses.map(c => ({
      id: c.id,
      label: c.title,
      subtitle: `${c.code} • ${c.category || 'General'}`,
      badge: c.category
    }));
  }, [courses]);

  // Helper to build guru options for a course
  const getGuruComboboxOptions = (courseId?: string): ComboboxOption[] => {
    const matching = getGurusForCourse(courseId || '');
    const otherGurus = trainers.filter(t => !matching.some(m => m.id === t.id));
    return [...matching, ...otherGurus].map(t => ({
      id: t.id,
      label: t.full_name,
      subtitle: t.specializations?.join(', ') || t.display_title || 'Faculty Guru',
      badge: matching.some(m => m.id === t.id) ? 'Assigned Guru' : undefined
    }));
  };

  const toMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };

  const checkScheduleConflict = (
    schedules: ScheduleEntry[],
    currentBatchId?: string
  ): { hasConflict: boolean; message?: string } => {
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      if (!s.room || !s.day || !s.startTime || !s.endTime) continue;
      const sStart = toMinutes(s.startTime);
      const sEnd = toMinutes(s.endTime);
      if (sEnd <= sStart) {
        return {
          hasConflict: true,
          message: `Invalid slot on ${s.day}: End time (${s.endTime}) must be later than start time (${s.startTime}).`
        };
      }

      // Intra-batch overlap check
      for (let j = i + 1; j < schedules.length; j++) {
        const other = schedules[j];
        if (
          other.day.toLowerCase() === s.day.toLowerCase() &&
          other.room.trim().toLowerCase() === s.room.trim().toLowerCase()
        ) {
          const oStart = toMinutes(other.startTime);
          const oEnd = toMinutes(other.endTime);
          if (sStart < oEnd && sEnd > oStart) {
            return {
              hasConflict: true,
              message: `Schedule conflict within batch: ${s.room} has overlapping slots on ${s.day}!`
            };
          }
        }
      }

      // Check against all active batches
      for (const b of batches) {
        if (currentBatchId && b.id === currentBatchId) continue;
        if (b.is_active === false) continue;

        if (b.schedules && b.schedules.length > 0) {
          for (const slot of b.schedules) {
            const slotRoom = slot.room || b.room_or_hall || '';
            if (
              slot.day.toLowerCase() === s.day.toLowerCase() &&
              slotRoom.trim().toLowerCase() === s.room.trim().toLowerCase()
            ) {
              const bStart = toMinutes(slot.startTime);
              const bEnd = toMinutes(slot.endTime);
              if (sStart < bEnd && sEnd > bStart) {
                return {
                  hasConflict: true,
                  message: `Time slot conflict: Room "${s.room}" is already occupied on ${s.day} (${slot.startTime.substring(0, 5)} - ${slot.endTime.substring(0, 5)}) by batch "${b.name}" (${b.course_title}).`
                };
              }
            }
          }
        } else {
          const bDays = b.days_of_week || [];
          const bRoom = b.room_or_hall || '';
          if (
            bDays.some(d => d.toLowerCase() === s.day.toLowerCase()) &&
            bRoom.trim().toLowerCase() === s.room.trim().toLowerCase()
          ) {
            const bStart = toMinutes(b.start_time);
            const bEnd = toMinutes(b.end_time);
            if (sStart < bEnd && sEnd > bStart) {
              return {
                hasConflict: true,
                message: `Time slot conflict: Room "${s.room}" is already occupied on ${s.day} (${b.start_time.substring(0, 5)} - ${b.end_time.substring(0, 5)}) by batch "${b.name}" (${b.course_title}).`
              };
            }
          }
        }
      }
    }
    return { hasConflict: false };
  };

  const addConflict = useMemo(() => checkScheduleConflict(addSchedules), [addSchedules, batches]);
  const editConflict = useMemo(() => checkScheduleConflict(editSchedules, editingBatch?.id), [editSchedules, editingBatch, batches]);

  // Quick toggle batch status directly from card
  const handleToggleBatchStatus = async (batch: Batch, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = batch.is_active === false ? true : false;
    try {
      const res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: batch.id, is_active: nextStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, is_active: nextStatus } : b));
      showFeedback('success', `Batch "${batch.name}" marked as ${nextStatus ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Error updating batch status');
    }
  };

  // -------------------------------------------------------------
  // SUBMIT HANDLERS
  // -------------------------------------------------------------
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBatchName.trim()) {
      showFeedback('error', 'Please enter a batch name');
      return;
    }
    if (!addCourseId) {
      showFeedback('error', 'Please select a course for this batch');
      return;
    }
    if (!addTrainerId) {
      showFeedback('error', 'Please assign a Guru to this batch');
      return;
    }

    const conflict = checkScheduleConflict(addSchedules);
    if (conflict.hasConflict) {
      showFeedback('error', conflict.message || 'Room and time conflict detected!');
      return;
    }

    setSaving(true);

    try {
      const distinctDays = Array.from(new Set(addSchedules.map(s => s.day)));
      const primaryStart = addSchedules[0]?.startTime ? `${addSchedules[0].startTime}:00` : '09:00:00';
      const primaryEnd = addSchedules[0]?.endTime ? `${addSchedules[0].endTime}:00` : '10:00:00';
      const primaryRoom = addSchedules[0]?.room || addRoom.trim() || 'Natya Mandapam (Room 101)';

      const finalBatchCode = (addBatchCode.trim() || getNextSequentialBatchCode(addCourseId, batches)).toLowerCase();
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addBatchName.trim(),
          code: finalBatchCode,
          course_id: addCourseId,
          trainer_id: addTrainerId,
          days_of_week: distinctDays,
          start_time: primaryStart,
          end_time: primaryEnd,
          room_or_hall: primaryRoom,
          max_capacity: Number(addCapacity),
          monthly_fee: Number(addMonthlyFee || 0),
          description: addDescription.trim(),
          is_active: addIsActive,
          schedules: addSchedules
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create batch');
      }

      const added = await res.json();
      const crs = courses.find(c => c.id === addCourseId);
      const trn = trainers.find(t => t.id === addTrainerId);

      const completeBatch: Batch = {
        ...added,
        code: finalBatchCode,
        course_title: crs?.title || 'Course',
        course_category: crs?.category || 'Category',
        trainer_name: trn?.full_name || 'Guru',
        monthly_fee: Number(addMonthlyFee || 0),
        description: addDescription.trim(),
        is_active: addIsActive,
        enrolled_count: 0,
        schedules: addSchedules
      };

      setBatches(prev => [...prev, completeBatch]);
      setIsAddOpen(false);
      showFeedback('success', `Batch "${completeBatch.name}" (${finalBatchCode}) created successfully!`);
    } catch (e: any) {
      showFeedback('error', e.message || 'Error creating batch');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    const conflict = checkScheduleConflict(editSchedules, editingBatch.id);
    if (conflict.hasConflict) {
      showFeedback('error', conflict.message || 'Room and time conflict detected!');
      return;
    }

    setSaving(true);

    try {
      const distinctDays = Array.from(new Set(editSchedules.map(s => s.day)));
      const primaryStart = editSchedules[0]?.startTime ? `${editSchedules[0].startTime}:00` : '09:00:00';
      const primaryEnd = editSchedules[0]?.endTime ? `${editSchedules[0].endTime}:00` : '10:00:00';
      const primaryRoom = editSchedules[0]?.room || editRoom.trim() || 'Natya Mandapam (Room 101)';
      const finalEditCode = editBatchCode.trim().toLowerCase();

      const res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBatch.id,
          name: editBatchName.trim(),
          code: finalEditCode,
          course_id: editCourseId,
          trainer_id: editTrainerId,
          days_of_week: distinctDays,
          start_time: primaryStart,
          end_time: primaryEnd,
          room_or_hall: primaryRoom,
          max_capacity: Number(editCapacity),
          monthly_fee: Number(editMonthlyFee || 0),
          description: editDescription.trim(),
          is_active: editIsActive,
          schedules: editSchedules
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update batch');
      }

      const crs = courses.find(c => c.id === editCourseId);
      const trn = trainers.find(t => t.id === editTrainerId);

      setBatches(prev =>
        prev.map(b =>
          b.id === editingBatch.id
            ? {
                ...b,
                name: editBatchName.trim(),
                code: finalEditCode,
                course_id: editCourseId,
                course_title: crs?.title || b.course_title,
                course_category: crs?.category || b.course_category,
                trainer_id: editTrainerId,
                trainer_name: trn?.full_name || b.trainer_name,
                days_of_week: distinctDays,
                start_time: primaryStart,
                end_time: primaryEnd,
                room_or_hall: primaryRoom,
                max_capacity: Number(editCapacity),
                monthly_fee: Number(editMonthlyFee || 0),
                description: editDescription.trim(),
                is_active: editIsActive,
                schedules: editSchedules
              }
            : b
        )
      );

      if (viewingBatch && viewingBatch.id === editingBatch.id) {
        setViewingBatch({
          ...viewingBatch,
          name: editBatchName.trim(),
          code: finalEditCode,
          course_id: editCourseId,
          course_title: crs?.title || viewingBatch.course_title,
          course_category: crs?.category || viewingBatch.course_category,
          trainer_id: editTrainerId,
          trainer_name: trn?.full_name || viewingBatch.trainer_name,
          days_of_week: distinctDays,
          start_time: primaryStart,
          end_time: primaryEnd,
          room_or_hall: editRoom.trim(),
          max_capacity: Number(editCapacity),
          monthly_fee: Number(editMonthlyFee || 0),
          description: editDescription.trim(),
          is_active: editIsActive,
          schedules: editSchedules
        });
      }

      setEditingBatch(null);
      showFeedback('success', `Batch "${editBatchName}" updated successfully!`);
    } catch (e: any) {
      showFeedback('error', e.message || 'Error updating batch');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deletingBatch) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/batches?id=${deletingBatch.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete batch');
      }

      setBatches(prev => prev.filter(b => b.id !== deletingBatch.id));
      if (viewingBatch && viewingBatch.id === deletingBatch.id) {
        setViewingBatch(null);
      }
      showFeedback('success', `Batch "${deletingBatch.name}" deleted successfully.`);
      setDeletingBatch(null);
    } catch (e: any) {
      showFeedback('error', e.message || 'Error deleting batch');
    } finally {
      setSaving(false);
    }
  };

  if (showTimetable) {
    return (
      <div className="space-y-6">
        <TimetableView onBack={() => setShowTimetable(false)} batches={batches} />
      </div>
    );
  }

  if (showVacantRooms) {
    return (
      <div className="space-y-6">
        {/* Toast Feedback Notification */}
        {feedbackMsg && (
          <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {feedbackMsg.type === 'success' ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
              <span className="text-xs font-semibold">{feedbackMsg.text}</span>
            </div>
            <button 
              onClick={() => setFeedbackMsg(null)}
              className="p-1 hover:bg-black/5 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <VacantRoomsView
          batches={batches}
          rooms={rooms}
          onBack={() => setShowVacantRooms(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border transition-all animate-in fade-in slide-in-from-top-4 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-xs font-semibold">{feedbackMsg.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2.5">
            <span>Class Batches & Schedules</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-3 py-0.5 rounded-full font-bold shadow-2xs">
              {batches.length} Batches
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure weekly recurring class schedules, assigned hall rooms, seating capacity, and faculty Gurus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Timetable Trigger Button */}
          <button
            type="button"
            onClick={() => setShowTimetable(true)}
            className="bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xs transition flex items-center gap-2 cursor-pointer hover:border-[#8A064D]/50 active:scale-95"
            title="View Weekly Master Timetable"
          >
            <Calendar className="w-4 h-4 text-[#8A064D]" />
            <span>View Timetable</span>
            <span className="text-[10px] bg-[#8A064D] text-white font-extrabold px-2 py-0.5 rounded-full">
              Weekly
            </span>
          </button>

          {/* Vacant Rooms Trigger Button */}
          <button
            type="button"
            onClick={() => setShowVacantRooms(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xs transition flex items-center gap-2 cursor-pointer hover:border-emerald-400 active:scale-95"
          >
            <DoorOpen className="w-4 h-4 text-emerald-600" />
            <span>Vacant Rooms</span>
            <span className="text-[10px] bg-emerald-200/70 text-emerald-950 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
              Live Matrix
            </span>
          </button>

          {/* Rooms Option Dropdown */}
          <div className="relative" ref={roomsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsRoomsDropdownOpen(!isRoomsDropdownOpen);
                setIsHeaderCreatingRoom(false);
              }}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-[#F0D5E4] px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xs transition flex items-center gap-2 cursor-pointer hover:border-[#8A064D]/30"
            >
              <DoorOpen className="w-4 h-4 text-[#8A064D]" />
              <span>Rooms</span>
              <span className="text-[10px] bg-[#FFF2F8] text-[#8A064D] font-bold px-2 py-0.5 rounded-full border border-[#F0D5E4]">
                {rooms.length}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isRoomsDropdownOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
            </button>

            {isRoomsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Top Section: Header & Create Room button */}
                <div className="pb-2.5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D041A] flex items-center gap-1.5">
                      <DoorOpen className="w-3.5 h-3.5 text-[#8A064D]" />
                      Available Academy Rooms
                    </span>
                    {!isHeaderCreatingRoom && (
                      <button
                        type="button"
                        onClick={() => setIsHeaderCreatingRoom(true)}
                        className="text-[11px] font-bold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] hover:bg-[#FFE5F0] border border-[#F0D5E4] px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Create Room</span>
                      </button>
                    )}
                  </div>

                  {/* Top: Create Room Form */}
                  {isHeaderCreatingRoom && (
                    <form onSubmit={handleHeaderCreateRoom} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#8A064D] uppercase tracking-wider">New Room Setup</span>
                        <button
                          type="button"
                          onClick={() => { setIsHeaderCreatingRoom(false); setHeaderNewRoomName(''); }}
                          className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        autoFocus
                        required
                        placeholder="Enter room / hall name..."
                        value={headerNewRoomName}
                        onChange={(e) => setHeaderNewRoomName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#8A064D]"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          placeholder="Capacity"
                          value={headerNewRoomCapacity}
                          onChange={(e) => setHeaderNewRoomCapacity(Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                          title="Class capacity"
                        />
                        <button
                          type="submit"
                          disabled={headerRoomSaving}
                          className="flex-1 bg-[#8A064D] hover:bg-[#70043E] text-white py-1 px-3 rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {headerRoomSaving ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Save Room</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Filter Search */}
                <div className="py-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter available rooms..."
                      value={roomHeaderSearch}
                      onChange={(e) => setRoomHeaderSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Rooms List */}
                <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
                  {rooms
                    .filter(r => r.name.toLowerCase().includes(roomHeaderSearch.toLowerCase()))
                    .map((r) => {
                      const roomBatches = batches.filter(b => b.room_or_hall?.toLowerCase().trim() === r.name.toLowerCase().trim());
                      return (
                        <div
                          key={r.id}
                          className="p-2 hover:bg-[#FFF9FB] rounded-xl flex items-center justify-between transition border border-transparent hover:border-[#F0D5E4] group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-[#2D041A] truncate">{r.name}</p>
                            <p className="text-[10px] text-gray-400">Capacity: {r.capacity || 25} seats</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                              {roomBatches.length} {roomBatches.length === 1 ? 'batch' : 'batches'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRoom(r);
                                setEditRoomName(r.name);
                                setEditRoomCapacity(r.capacity || 25);
                              }}
                              title={`Edit ${r.name}`}
                              className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHeaderDeleteRoom(r.id, r.name);
                              }}
                              title={`Delete ${r.name}`}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {rooms.filter(r => r.name.toLowerCase().includes(roomHeaderSearch.toLowerCase())).length === 0 && (
                    <div className="py-3 text-center text-xs text-gray-400">
                      No rooms found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Create Batch Trigger */}
          <button
            onClick={openAddModal}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-[#8A064D]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Batches</p>
            <p className="text-xl font-extrabold text-[#2D041A] leading-tight">{batches.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Slots</p>
            <p className="text-xl font-extrabold text-emerald-700 leading-tight">{activeBatchesCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Enrolled Students</p>
            <p className="text-xl font-extrabold text-amber-700 leading-tight">{totalEnrolled}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <DoorOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hall Utilization</p>
            <p className="text-xl font-extrabold text-purple-800 leading-tight">{fillRate}% <span className="text-xs font-semibold text-gray-400">({totalEnrolled}/{totalCapacity})</span></p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Search Batches + Searchable Multi-Select Course Dropdown */}
      <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Left Group: Search Input + Course Filter Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by batch, guru, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-[#F0D5E4] rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Course Filter: Searchable Multi-Select Dropdown */}
            <div className="relative sm:w-80" ref={courseDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                className={`w-full px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between border transition cursor-pointer ${
                  selectedCourseIds.length > 0
                    ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D] shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100/70 border-[#F0D5E4] text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <BookOpen className={`w-4 h-4 shrink-0 ${selectedCourseIds.length > 0 ? 'text-[#8A064D]' : 'text-gray-400'}`} />
                  <span className="truncate">
                    {selectedCourseIds.length === 0
                      ? `All Courses (${courses.length})`
                      : selectedCourseIds.length === 1
                      ? courses.find(c => c.id === selectedCourseIds[0])?.title || '1 Course Selected'
                      : `${selectedCourseIds.length} Courses Selected`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedCourseIds.length > 0 && (
                    <span className="bg-[#8A064D] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {selectedCourseIds.length}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isCourseDropdownOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
                </div>
              </button>

              {/* Course Multi-Select Popover Menu */}
              {isCourseDropdownOpen && (
                <div className="absolute left-0 mt-2 w-88 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#F0D5E4] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* Search inside course filter */}
                  <div className="relative mb-2.5">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search courses by title, category, code..."
                      value={courseFilterSearch}
                      onChange={(e) => setCourseFilterSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
                    />
                    {courseFilterSearch && (
                      <button
                        type="button"
                        onClick={() => setCourseFilterSearch('')}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Actions Bar: Select All / Clear All */}
                  <div className="flex items-center justify-between px-1 py-1.5 border-b border-gray-100 text-xs">
                    <span className="text-gray-400 text-[11px] font-medium">
                      {selectedCourseIds.length === 0
                        ? 'All courses showing'
                        : `${selectedCourseIds.length} of ${courses.length} selected`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllCoursesFilter}
                        className="text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={clearCoursesFilter}
                        className="text-[11px] font-semibold text-gray-500 hover:text-rose-600 hover:underline cursor-pointer"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>

                  {/* Course Checkbox Items List */}
                  <div className="max-h-64 overflow-y-auto space-y-1 py-2 scrollbar-thin">
                    {filteredCoursesForFilter.map((crs) => {
                      const isSelected = selectedCourseIds.includes(crs.id);
                      const crsBatchesCount = batches.filter(b => b.course_id === crs.id).length;
                      return (
                        <div
                          key={crs.id}
                          onClick={() => toggleCourseFilter(crs.id)}
                          className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer select-none border ${
                            isSelected
                              ? 'bg-[#FFF2F8] border-[#F0D5E4]'
                              : 'hover:bg-gray-50 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition ${
                              isSelected 
                                ? 'bg-[#8A064D] border-[#8A064D] text-white' 
                                : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs truncate ${isSelected ? 'font-bold text-[#8A064D]' : 'font-medium text-gray-800'}`}>
                                {crs.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded font-mono">
                                  {crs.code}
                                </span>
                                <span className="text-[10px] text-[#8A064D] bg-[#FFF2F8] px-1.5 py-0.2 rounded">
                                  {crs.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            crsBatchesCount > 0 ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'
                          }`}>
                            {crsBatchesCount} {crsBatchesCount === 1 ? 'batch' : 'batches'}
                          </span>
                        </div>
                      );
                    })}

                    {filteredCoursesForFilter.length === 0 && (
                      <div className="py-6 text-center text-xs text-gray-400">
                        No courses found matching &quot;{courseFilterSearch}&quot;
                      </div>
                    )}
                  </div>

                  {/* Dropdown footer button */}
                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCourseDropdownOpen(false)}
                      className="bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold px-4 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              )}
            </div>

              {/* Status Filter Dropdown beside Course Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-2xl border border-[#F0D5E4]">
                <span className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wider">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-[#2D041A] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Batches ({batches.length})</option>
                  <option value="active">Active Batches ({batches.filter(b => b.is_active !== false).length})</option>
                  <option value="inactive">Inactive Batches ({batches.filter(b => b.is_active === false).length})</option>
                </select>
              </div>

            </div>

          {/* Right Group: Results counter & Reset button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
            <span className="text-xs font-semibold text-gray-500">
              Showing <strong className="text-[#8A064D]">{filteredBatches.length}</strong> of {batches.length} batches
            </span>
            {(selectedCourseIds.length > 0 || searchQuery.trim() !== '' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseIds([]);
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

        {/* Selected Course Chips */}
        {selectedCourseIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#8A064D]" />
              Active Filters:
            </span>
            {selectedCourseIds.map(crsId => {
              const c = courses.find(item => item.id === crsId);
              if (!c) return null;
              return (
                <span 
                  key={crsId}
                  className="inline-flex items-center gap-1.5 bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs animate-in fade-in"
                >
                  <span>{c.title}</span>
                  <button 
                    type="button" 
                    onClick={() => removeSingleCourseFilter(crsId)}
                    className="hover:text-rose-700 hover:bg-[#FFE5F0] rounded-full p-0.5 cursor-pointer transition"
                    title={`Remove ${c.title} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={clearCoursesFilter}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 hover:underline cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((b) => {
          const fillPercentage = Math.round(((b.enrolled_count || 0) / (b.max_capacity || 25)) * 100);
          return (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs hover:shadow-xl hover:border-[#8A064D]/40 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Header: Course Category & Active/Inactive Toggle Badge */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8A064D] bg-[#FFF2F8] border border-[#F0D5E4] px-3.5 py-1 rounded-full shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>{b.course_category}</span>
                  </span>
                  
                  {/* Status Indicator (No editing button) */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                    b.is_active !== false 
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${b.is_active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{b.is_active !== false ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>

                {/* Batch Name, Code & Course */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xl text-[#2D041A] leading-tight group-hover:text-[#8A064D] transition">
                    {b.name}
                  </h3>
                  {b.code && (
                    <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-lg border border-[#F0D5E4] shrink-0">
                      {b.code}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#8A064D] mt-1.5">
                  <BookOpen className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="truncate">{b.course_title}</span>
                </div>

                {/* Main Card Body: Guru Assigned & Monthly Price Only (No Timings) */}
                <div className="mt-4 space-y-2.5 text-sm text-gray-800 bg-gray-50/90 p-4 rounded-2xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2 font-medium">
                      <Users className="w-4 h-4 text-[#8A064D]" />
                      <span>Guru Assigned</span>
                    </span>
                    <strong className="text-gray-900 font-bold">{b.trainer_name}</strong>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-200/60">
                    <span className="text-gray-600 flex items-center gap-2 font-medium">
                      <IndianRupee className="w-4 h-4 text-[#8A064D]" />
                      <span>Monthly Fee</span>
                    </span>
                    <strong className="text-emerald-700 font-extrabold text-base tabular-nums">
                      ₹{Number(b.monthly_fee || 0).toLocaleString('en-IN')}<span className="text-xs font-normal text-gray-500"> / mo</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Capacity Progress Bar & Action Buttons */}
              <div className="mt-6 pt-4.5 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-[#6E3955] font-semibold">Batch Enrollment</span>
                  <span className="font-extrabold text-[#8A064D] tabular-nums">
                    {b.enrolled_count || 0} / {b.max_capacity} Seats ({fillPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-5 p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      fillPercentage >= 90 ? 'bg-rose-500' :
                      fillPercentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  />
                </div>

                {/* Actions: View Details, Edit, Delete (All 3 buttons preserved) */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setViewingBatch(b)}
                    className="px-4 py-2 rounded-xl bg-[#2D041A] hover:bg-[#48082B] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs border border-[#48082B]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                    <span>View Details</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(b)}
                      title="Edit Batch"
                      className="p-2 rounded-xl bg-[#FFF5F9] border border-[#E8BFD5] hover:bg-[#FCE7F3] text-[#8A064D] transition cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingBatch(b)}
                      title="Delete Batch"
                      className="p-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredBatches.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl p-12 border border-[#F0D5E4] text-center shadow-xs">
            <div className="w-14 h-14 bg-[#FFF2F8] text-[#8A064D] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#F0D5E4]">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#2D041A]">No Batches Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No class batches match your selected course or search query. Try choosing different courses or resetting the filter.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseIds([]);
                  setSearchQuery('');
                }}
                className="bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 1. VIEW DETAILS MODAL */}
      {/* ================================================================= */}
      {viewingBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-md border border-rose-100">
                    {viewingBatch.course_category}
                  </span>
                  {viewingBatch.code && (
                    <span className="text-xs font-mono font-black text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-md border border-[#F0D5E4]">
                      ID: {viewingBatch.code}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-[#2D041A] mt-1">{viewingBatch.name}</h3>
                <span className="text-xs text-[#8A064D] font-semibold">{viewingBatch.course_title}</span>
              </div>
              <button
                onClick={() => setViewingBatch(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Highlight Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Assigned Guru</span>
                  <span className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#8A064D]" />
                    <span className="truncate">{viewingBatch.trainer_name}</span>
                  </span>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Monthly Fee</span>
                  <span className="text-sm font-extrabold text-emerald-700 mt-1 flex items-center gap-1 tabular-nums">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span>₹{Number(viewingBatch.monthly_fee || 0).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-gray-500"> / mo</span></span>
                  </span>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Room / Hall</span>
                  <span className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#8A064D]" />
                    <span className="truncate">{viewingBatch.room_or_hall || 'Main Hall'}</span>
                  </span>
                </div>
              </div>

              {/* Batch Description if present */}
              {viewingBatch.description && (
                <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100/80">
                  <span className="text-[10px] font-bold text-[#8A064D] uppercase tracking-wider block mb-1">
                    Batch Description &amp; Syllabus
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    {viewingBatch.description}
                  </p>
                </div>
              )}

              {/* Schedule Details */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-[#8A064D]" />
                    <span>Weekly Class Schedule</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {viewingBatch.schedules?.length || viewingBatch.days_of_week?.length || 0} Slots / week
                  </span>
                </div>
                <div className="space-y-1.5">
                  {viewingBatch.schedules && viewingBatch.schedules.length > 0 ? (
                    viewingBatch.schedules.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#8A064D] bg-[#FFF2F8] px-2 py-0.5 rounded-md border border-[#F0D5E4]">
                            {slot.day}
                          </span>
                          <span className="font-mono text-gray-700 font-medium">
                            {slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)}
                          </span>
                        </div>
                        <span className="text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{slot.room}</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    (viewingBatch.days_of_week || []).map((day, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-gray-200">
                        <span className="font-semibold text-gray-800">{day}</span>
                        <span className="font-mono text-gray-600 font-medium">
                          {viewingBatch.start_time?.substring(0, 5)} - {viewingBatch.end_time?.substring(0, 5)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Capacity Status */}
              <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Current Enrollment</span>
                  <span className="text-base font-bold text-[#8A064D]">
                    {viewingBatch.enrolled_count || 0} Students Enrolled
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Hall Capacity</span>
                  <span className="text-sm font-bold text-gray-800">
                    {viewingBatch.max_capacity} Seats
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const b = viewingBatch;
                    setViewingBatch(null);
                    setDeletingBatch(b);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Batch</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingBatch(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const b = viewingBatch;
                      setViewingBatch(null);
                      openEditModal(b);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Batch Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. CREATE BATCH MODAL */}
      {/* ================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Create New Recurring Batch</h3>
                <p className="text-xs text-gray-500">Configure course, Guru, multi-day schedule, room, and capacity.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              
              {/* 1. Searchable Course Dropdown (Type directly to filter) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Course <span className="text-rose-500">*</span> <span className="text-[10px] text-gray-400 font-normal">(Type directly to search)</span>
                </label>
                <SearchableCombobox
                  options={courseComboboxOptions}
                  value={addCourseId}
                  onChange={(id) => handleAddCourseChange(id)}
                  placeholder="Type course name (e.g. Bharatanatyam, Kuchipudi, Carnatic)..."
                  required
                />
              </div>

              {/* 2. Assign Guru / Faculty (Searchable Combobox) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Guru / Faculty <span className="text-rose-500">*</span> <span className="text-[10px] text-gray-400 font-normal">(Type directly to search)</span>
                </label>
                <SearchableCombobox
                  options={getGuruComboboxOptions(addCourseId)}
                  value={addTrainerId}
                  onChange={(id) => setAddTrainerId(id)}
                  placeholder="Type Guru name (e.g. Sri Guru, Smt...)..."
                  required
                />
              </div>

              {/* 3. Batch Name & Batch Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Batch Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bharatanatyam - Batch 1"
                    value={addBatchName}
                    onChange={(e) => setAddBatchName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Batch Code *</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Auto-Derived</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bhar-1"
                    value={addBatchCode}
                    onChange={(e) => setAddBatchCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Depends on course code (e.g. 'bhar-1')</p>
                </div>
              </div>

              {/* 4. Monthly Fee & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monthly Fee (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      required
                      min={0}
                      step={50}
                      placeholder="e.g. 2500"
                      value={addMonthlyFee}
                      onChange={(e) => setAddMonthlyFee(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Class Capacity (Max)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={addCapacity}
                    onChange={(e) => setAddCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* 5. Batch Description with AI Enhance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Batch Description / Notes</label>
                  <AiEnhanceButton
                    value={addDescription}
                    context={`Batch Name: ${addBatchName || 'Batch'}, Course: ${courses.find(c => c.id === addCourseId)?.title || 'Course'}`}
                    onEnhance={(enhanced: string) => setAddDescription(enhanced)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Enter batch focus, curriculum details, or notes..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] resize-none"
                />
              </div>

              {/* Conflict Alert Banner if occupied */}
              {addConflict.hasConflict && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{addConflict.message}</span>
                </div>
              )}

              {/* 6. Weekly Class Schedule Builder (Multi-day) */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Weekly Class Schedule Timings</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addScheduleRow('add')}
                    className="text-xs font-semibold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add schedule slot</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {addSchedules.map((entry, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
                      {/* Day select */}
                      <div className="w-full sm:w-32">
                        <label className="text-[10px] font-bold text-gray-500 uppercase sm:hidden mb-1 block">Day</label>
                        <select
                          value={entry.day}
                          onChange={(e) => updateScheduleRow(idx, 'day', e.target.value, 'add')}
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-[#8A064D]"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* Time range */}
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateScheduleRow(idx, 'startTime', e.target.value, 'add')}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        />
                        <span className="text-xs text-gray-400 font-semibold px-0.5">to</span>
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateScheduleRow(idx, 'endTime', e.target.value, 'add')}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      {/* Room select */}
                      <div className="w-full sm:w-48">
                        <select
                          value={entry.room}
                          onChange={(e) => updateScheduleRow(idx, 'room', e.target.value, 'add')}
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800"
                        >
                          {rooms.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Remove Button */}
                      {addSchedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleRow(idx, 'add')}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition self-end sm:self-center cursor-pointer"
                          title="Remove this slot"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Room Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Hall Selection</label>
                <SearchableRoomSelect
                  value={addRoom}
                  onChange={(rName, rCap) => {
                    setAddRoom(rName);
                    if (rCap) setAddCapacity(rCap);
                  }}
                  rooms={rooms}
                  onRoomCreated={(newRoom) => {
                    setRooms(prev => [...prev.filter(r => r.id !== newRoom.id), newRoom].sort((a, b) => a.name.localeCompare(b.name)));
                    setAddRoom(newRoom.name);
                    if (newRoom.capacity) setAddCapacity(newRoom.capacity);
                    showFeedback('success', `Room "${newRoom.name}" created and selected!`);
                  }}
                  onRoomDeleted={(roomId) => {
                    setRooms(prev => prev.filter(r => r.id !== roomId));
                    showFeedback('success', 'Room deleted');
                  }}
                />
              </div>

              {/* 8. Active / Inactive Status Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-700 block">Batch Active Status</span>
                  <span className="text-[10px] text-gray-400">When inactive, batch is omitted from timetable & today schedule</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addIsActive}
                    onChange={(e) => setAddIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8A064D]"></div>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Save & Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. EDIT BATCH MODAL (Allows editing ALL batch details) */}
      {/* ================================================================= */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Edit Batch: {editingBatch.name}</h3>
                <p className="text-xs text-gray-500">Edit course, Guru, schedule entries, room, monthly fee, and capacity.</p>
              </div>
              <button
                onClick={() => setEditingBatch(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* 1. Searchable Course Selector (Type directly to search) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Course <span className="text-rose-500">*</span> <span className="text-[10px] text-gray-400 font-normal">(Type directly to search)</span>
                </label>
                <SearchableCombobox
                  options={courseComboboxOptions}
                  value={editCourseId}
                  onChange={(id) => {
                    setEditCourseId(id);
                    const matched = getGurusForCourse(id);
                    setEditTrainerId(matched[0]?.id || trainers[0]?.id || '');
                  }}
                  placeholder="Type course name..."
                  required
                />
              </div>

              {/* 2. Searchable Assigned Guru */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assigned Guru <span className="text-rose-500">*</span> <span className="text-[10px] text-gray-400 font-normal">(Type directly to search)</span>
                </label>
                <SearchableCombobox
                  options={getGuruComboboxOptions(editCourseId)}
                  value={editTrainerId}
                  onChange={(id) => setEditTrainerId(id)}
                  placeholder="Type Guru name..."
                  required
                />
              </div>

              {/* 3. Batch Name & Batch Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editBatchName}
                    onChange={(e) => setEditBatchName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Batch Code *</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      <span>Unique ID</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editBatchCode}
                    onChange={(e) => setEditBatchCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Depends on course code (e.g. 'bhar-1')</p>
                </div>
              </div>

              {/* 4. Monthly Fee & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monthly Fee (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      required
                      min={0}
                      step={50}
                      value={editMonthlyFee}
                      onChange={(e) => setEditMonthlyFee(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Class Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* 5. Batch Description with AI Enhance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Batch Description / Notes</label>
                  <AiEnhanceButton
                    value={editDescription}
                    context={`Batch Name: ${editBatchName}, Course: ${courses.find(c => c.id === editCourseId)?.title || 'Course'}`}
                    onEnhance={(enhanced: string) => setEditDescription(enhanced)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter batch focus, curriculum details, or notes..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] resize-none"
                />
              </div>

              {/* Conflict Alert Banner if occupied */}
              {editConflict.hasConflict && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{editConflict.message}</span>
                </div>
              )}

              {/* 6. Multi-Schedule Builder */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Weekly Class Schedule Timings</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addScheduleRow('edit')}
                    className="text-xs font-semibold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add schedule slot</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editSchedules.map((entry, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
                      {/* Day select */}
                      <div className="w-full sm:w-32">
                        <label className="text-[10px] font-bold text-gray-500 uppercase sm:hidden mb-1 block">Day</label>
                        <select
                          value={entry.day}
                          onChange={(e) => updateScheduleRow(idx, 'day', e.target.value, 'edit')}
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-[#8A064D]"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* Time range */}
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateScheduleRow(idx, 'startTime', e.target.value, 'edit')}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        />
                        <span className="text-xs text-gray-400 font-semibold px-0.5">to</span>
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateScheduleRow(idx, 'endTime', e.target.value, 'edit')}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      {/* Room select */}
                      <div className="w-full sm:w-48">
                        <select
                          value={entry.room}
                          onChange={(e) => updateScheduleRow(idx, 'room', e.target.value, 'edit')}
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800"
                        >
                          {rooms.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Remove Button */}
                      {editSchedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleRow(idx, 'edit')}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition self-end sm:self-center cursor-pointer"
                          title="Remove this slot"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Room Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Hall Selection</label>
                <SearchableRoomSelect
                  value={editRoom}
                  onChange={(rName, rCap) => {
                    setEditRoom(rName);
                    if (rCap) setEditCapacity(rCap);
                  }}
                  rooms={rooms}
                  onRoomCreated={(newRoom) => {
                    setRooms(prev => [...prev.filter(r => r.id !== newRoom.id), newRoom].sort((a, b) => a.name.localeCompare(b.name)));
                    setEditRoom(newRoom.name);
                    if (newRoom.capacity) setEditCapacity(newRoom.capacity);
                    showFeedback('success', `Room "${newRoom.name}" created and selected!`);
                  }}
                  onRoomDeleted={(roomId) => {
                    setRooms(prev => prev.filter(r => r.id !== roomId));
                    showFeedback('success', 'Room deleted');
                  }}
                />
              </div>

              {/* 8. Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-700 block">Batch Active Status</span>
                  <span className="text-[10px] text-gray-400">When inactive, batch is omitted from timetable & today schedule</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8A064D]"></div>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL */}
      {/* ================================================================= */}
      {deletingBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#2D041A]">Confirm Batch Deletion</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">{deletingBatch.name}</strong> ({deletingBatch.course_title})? 
              This will remove enrollments and upcoming class sessions associated with this batch.
            </p>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingBatch(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteBatch}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting...' : 'Yes, Delete Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2D041A]">Edit Room Name</h3>
                  <p className="text-xs text-gray-500">Update classroom / hall name and capacity</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHeaderEditRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  placeholder="e.g. Natya Shala 1"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={editRoomCapacity}
                  onChange={(e) => setEditRoomCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-900">
                💡 Changing the room name will automatically update all existing batches assigned to this room.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingRoomSaving || !editRoomName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {editingRoomSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

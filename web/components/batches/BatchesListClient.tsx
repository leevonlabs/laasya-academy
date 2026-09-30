'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Batch, Course, Trainer } from '@/lib/academy';
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
  Layers
} from 'lucide-react';

interface Props {
  initialBatches: Batch[];
  courses: Course[];
  trainers: Trainer[];
}

interface ScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function BatchesListClient({ initialBatches, courses, trainers }: Props) {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');

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
  // CREATE BATCH FORM STATE
  // -------------------------------------------------------------
  const [addCourseSearch, setAddCourseSearch] = useState('');
  const [addCourseId, setAddCourseId] = useState(courses[0]?.id || '');
  const [addTrainerId, setAddTrainerId] = useState('');
  const [addBatchName, setAddBatchName] = useState('');
  const [addRoom, setAddRoom] = useState('Natya Mandapam (Room 101)');
  const [addCapacity, setAddCapacity] = useState(25);
  const [addSchedules, setAddSchedules] = useState<ScheduleEntry[]>([
    { day: 'Monday', startTime: '09:00', endTime: '11:00' },
    { day: 'Wednesday', startTime: '10:00', endTime: '12:00' }
  ]);

  // When opening Add Modal
  const openAddModal = () => {
    const defaultCourseId = courses[0]?.id || '';
    setAddCourseId(defaultCourseId);
    setAddCourseSearch('');
    const matchingGurus = getGurusForCourse(defaultCourseId);
    setAddTrainerId(matchingGurus[0]?.id || trainers[0]?.id || '');
    setAddBatchName(getNextSequentialBatchName(defaultCourseId, batches));
    setAddRoom('Natya Mandapam (Room 101)');
    setAddCapacity(25);
    setAddSchedules([
      { day: 'Monday', startTime: '09:00', endTime: '11:00' },
      { day: 'Wednesday', startTime: '10:00', endTime: '12:00' }
    ]);
    setIsAddOpen(true);
  };

  // When selected course changes in Add Modal
  const handleAddCourseChange = (newCrsId: string) => {
    setAddCourseId(newCrsId);
    const matchingGurus = getGurusForCourse(newCrsId);
    setAddTrainerId(matchingGurus[0]?.id || trainers[0]?.id || '');
    setAddBatchName(getNextSequentialBatchName(newCrsId, batches));
  };

  // -------------------------------------------------------------
  // EDIT BATCH FORM STATE
  // -------------------------------------------------------------
  const [editCourseId, setEditCourseId] = useState('');
  const [editTrainerId, setEditTrainerId] = useState('');
  const [editBatchName, setEditBatchName] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editCapacity, setEditCapacity] = useState(25);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSchedules, setEditSchedules] = useState<ScheduleEntry[]>([]);

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setEditCourseId(batch.course_id);
    setEditTrainerId(batch.trainer_id);
    setEditBatchName(batch.name);
    setEditRoom(batch.room_or_hall || 'Main Hall');
    setEditCapacity(batch.max_capacity || 25);
    setEditIsActive(batch.is_active ?? true);

    const sTime = batch.start_time ? batch.start_time.substring(0, 5) : '09:00';
    const eTime = batch.end_time ? batch.end_time.substring(0, 5) : '11:00';
    const days = (batch.days_of_week && batch.days_of_week.length > 0) 
      ? batch.days_of_week 
      : ['Monday', 'Wednesday'];

    setEditSchedules(days.map(d => ({
      day: d,
      startTime: sTime,
      endTime: eTime
    })));
  };

  // Schedule array handlers
  const addScheduleRow = (mode: 'add' | 'edit') => {
    const newEntry: ScheduleEntry = {
      day: 'Friday',
      startTime: '14:00',
      endTime: '16:00'
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

  // Filtered Batches
  const filteredBatches = batches.filter(b => {
    const matchesCourse = selectedCourseFilter === 'All' || b.course_id === selectedCourseFilter;
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.trainer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.room_or_hall || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  // Available gurus for current Add Course selection
  const addMatchingGurus = useMemo(() => {
    return getGurusForCourse(addCourseId);
  }, [addCourseId, courses, trainers]);

  // Available gurus for current Edit Course selection
  const editMatchingGurus = useMemo(() => {
    return getGurusForCourse(editCourseId);
  }, [editCourseId, courses, trainers]);

  // Courses filtered by search input inside Add Modal
  const addFilteredCourses = useMemo(() => {
    if (!addCourseSearch.trim()) return courses;
    const q = addCourseSearch.toLowerCase();
    return courses.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [courses, addCourseSearch]);

  // -------------------------------------------------------------
  // SUBMIT HANDLERS
  // -------------------------------------------------------------
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBatchName.trim()) return;
    setSaving(true);

    try {
      const distinctDays = Array.from(new Set(addSchedules.map(s => s.day)));
      const primaryStart = addSchedules[0]?.startTime ? `${addSchedules[0].startTime}:00` : '09:00:00';
      const primaryEnd = addSchedules[0]?.endTime ? `${addSchedules[0].endTime}:00` : '11:00:00';

      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addBatchName.trim(),
          course_id: addCourseId,
          trainer_id: addTrainerId,
          days_of_week: distinctDays,
          start_time: primaryStart,
          end_time: primaryEnd,
          room_or_hall: addRoom.trim(),
          max_capacity: Number(addCapacity)
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
        course_title: crs?.title || 'Course',
        course_category: crs?.category || 'Category',
        trainer_name: trn?.full_name || 'Guru',
        enrolled_count: 0
      };

      setBatches(prev => [...prev, completeBatch]);
      setIsAddOpen(false);
      showFeedback('success', `Batch "${completeBatch.name}" created successfully!`);
    } catch (e: any) {
      showFeedback('error', e.message || 'Error creating batch');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setSaving(true);

    try {
      const distinctDays = Array.from(new Set(editSchedules.map(s => s.day)));
      const primaryStart = editSchedules[0]?.startTime ? `${editSchedules[0].startTime}:00` : '09:00:00';
      const primaryEnd = editSchedules[0]?.endTime ? `${editSchedules[0].endTime}:00` : '11:00:00';

      const res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBatch.id,
          name: editBatchName.trim(),
          course_id: editCourseId,
          trainer_id: editTrainerId,
          days_of_week: distinctDays,
          start_time: primaryStart,
          end_time: primaryEnd,
          room_or_hall: editRoom.trim(),
          max_capacity: Number(editCapacity),
          is_active: editIsActive
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
                course_id: editCourseId,
                course_title: crs?.title || b.course_title,
                course_category: crs?.category || b.course_category,
                trainer_id: editTrainerId,
                trainer_name: trn?.full_name || b.trainer_name,
                days_of_week: distinctDays,
                start_time: primaryStart,
                end_time: primaryEnd,
                room_or_hall: editRoom.trim(),
                max_capacity: Number(editCapacity),
                is_active: editIsActive
              }
            : b
        )
      );

      if (viewingBatch && viewingBatch.id === editingBatch.id) {
        setViewingBatch({
          ...viewingBatch,
          name: editBatchName.trim(),
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
          is_active: editIsActive
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Class Batches & Schedules</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-semibold">
              {batches.length} Active Batches
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure weekly recurring class schedules, assigned hall rooms, seating capacity, and faculty Gurus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search batches by name, course, Guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-[#F0D5E4] rounded-xl text-xs w-72 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
            />
          </div>

          <button
            onClick={openAddModal}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      {/* Course Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCourseFilter('All')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedCourseFilter === 'All'
              ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#F9E33A]/50'
              : 'bg-white text-gray-600 border border-[#F0D5E4] hover:bg-gray-50'
          }`}
        >
          All Courses ({batches.length})
        </button>
        {courses.map((crs) => {
          const batchCount = batches.filter(b => b.course_id === crs.id).length;
          return (
            <button
              key={crs.id}
              onClick={() => setSelectedCourseFilter(crs.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCourseFilter === crs.id
                  ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#F9E33A]/50'
                  : 'bg-white text-gray-600 border border-[#F0D5E4] hover:bg-gray-50'
              }`}
            >
              <span>{crs.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCourseFilter === crs.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {batchCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((b) => {
          const fillPercentage = Math.round(((b.enrolled_count || 0) / (b.max_capacity || 25)) * 100);
          return (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Course Category Badge & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-0.5 rounded-full">
                    {b.course_category}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    b.is_active !== false 
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                      : 'text-amber-700 bg-amber-50 border border-amber-200'
                  }`}>
                    {b.is_active !== false ? 'Active Slot' : 'Paused'}
                  </span>
                </div>

                {/* Batch Name & Course */}
                <h3 className="font-bold text-base text-[#2D041A] leading-tight group-hover:text-[#8A064D] transition">
                  {b.name}
                </h3>
                <p className="text-xs font-semibold text-[#8A064D] mt-0.5">
                  Course: {b.course_title}
                </p>

                {/* Guru & Room */}
                <div className="mt-4 space-y-2 text-xs text-gray-600 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Guru: <strong className="text-gray-900">{b.trainer_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Timing: <strong className="text-gray-900">{b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span className="truncate">{b.room_or_hall || 'Main Hall'}</span>
                  </div>
                </div>

                {/* Days of Week Badges */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(b.days_of_week || []).map((day, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] font-semibold bg-[#FFF9FB] text-gray-700 border border-rose-100 px-2 py-0.5 rounded-md"
                    >
                      {day.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Capacity Progress Bar & Action Buttons */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">Batch Enrollment</span>
                  <span className="font-bold text-[#8A064D]">
                    {b.enrolled_count || 0} / {b.max_capacity} Students
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-4">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      fillPercentage >= 90 ? 'bg-rose-500' :
                      fillPercentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  />
                </div>

                {/* Actions: View Details, Edit, Delete */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setViewingBatch(b)}
                    className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-[#8A064D] hover:text-white text-gray-700 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(b)}
                      title="Edit Batch"
                      className="p-1.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] hover:bg-[#8A064D] hover:text-white text-[#8A064D] transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingBatch(b)}
                      title="Delete Batch"
                      className="p-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-rose-600 hover:text-white text-gray-400 hover:border-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* 1. VIEW DETAILS MODAL */}
      {/* ================================================================= */}
      {viewingBatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-md border border-rose-100">
                  {viewingBatch.course_category}
                </span>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Assigned Faculty Guru</span>
                  <span className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#8A064D]" />
                    <span>{viewingBatch.trainer_name}</span>
                  </span>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Room / Hall</span>
                  <span className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#8A064D]" />
                    <span>{viewingBatch.room_or_hall || 'Main Hall'}</span>
                  </span>
                </div>
              </div>

              {/* Schedule Details */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-[#8A064D]" />
                    <span>Weekly Class Schedule</span>
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {viewingBatch.days_of_week?.length || 0} Days / week
                  </span>
                </div>
                <div className="space-y-1.5">
                  {(viewingBatch.days_of_week || []).map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-gray-200">
                      <span className="font-semibold text-gray-800">{day}</span>
                      <span className="font-mono text-gray-600 font-medium">
                        {viewingBatch.start_time?.substring(0, 5)} - {viewingBatch.end_time?.substring(0, 5)}
                      </span>
                    </div>
                  ))}
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
              
              {/* 1. Searchable Course Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Course <span className="text-[10px] text-gray-400">(Searchable)</span>
                </label>
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Type to filter courses..."
                      value={addCourseSearch}
                      onChange={(e) => setAddCourseSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>
                  <select
                    value={addCourseId}
                    onChange={(e) => handleAddCourseChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] font-medium"
                  >
                    {addFilteredCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.code}) — {c.category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Assign Guru / Faculty (Filtered by Course) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Guru / Faculty <span className="text-[10px] text-[#8A064D] font-semibold">(Assigned to {courses.find(c => c.id === addCourseId)?.title})</span>
                </label>
                <select
                  value={addTrainerId}
                  onChange={(e) => setAddTrainerId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] font-medium"
                >
                  {addMatchingGurus.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} {t.display_title ? `— (${t.display_title})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Batch Name (Sequential by default) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Batch Name <span className="text-[10px] text-emerald-600 font-normal">(Auto-generated sequential numbering)</span>
                </label>
                <input
                  type="text"
                  required
                  value={addBatchName}
                  onChange={(e) => setAddBatchName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* 4. Weekly Class Schedule Builder (Multi-day) */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Weekly Class Schedule</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addScheduleRow('add')}
                    className="text-xs font-semibold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add another weekly class schedule</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {addSchedules.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                      {/* Day select */}
                      <div className="flex-1">
                        <select
                          value={entry.day}
                          onChange={(e) => updateScheduleRow(idx, 'day', e.target.value, 'add')}
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* Start Time */}
                      <div className="w-28">
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateScheduleRow(idx, 'startTime', e.target.value, 'add')}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>

                      <span className="text-xs text-gray-400 font-semibold">to</span>

                      {/* End Time */}
                      <div className="w-28">
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateScheduleRow(idx, 'endTime', e.target.value, 'add')}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>

                      {/* Remove Button */}
                      {addSchedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleRow(idx, 'add')}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition"
                          title="Remove this slot"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Room & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Hall Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sangeetha Shala (Room 202)"
                    value={addRoom}
                    onChange={(e) => setAddRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
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
                <p className="text-xs text-gray-500">Edit course, Guru, schedule entries, room, and capacity.</p>
              </div>
              <button
                onClick={() => setEditingBatch(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Batch Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Name</label>
                <input
                  type="text"
                  required
                  value={editBatchName}
                  onChange={(e) => setEditBatchName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Course & Guru Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course</label>
                  <select
                    value={editCourseId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setEditCourseId(cId);
                      const matched = getGurusForCourse(cId);
                      setEditTrainerId(matched[0]?.id || trainers[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Guru</label>
                  <select
                    value={editTrainerId}
                    onChange={(e) => setEditTrainerId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  >
                    {editMatchingGurus.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Schedule Builder */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Weekly Class Schedule</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addScheduleRow('edit')}
                    className="text-xs font-semibold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add another weekly class schedule</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editSchedules.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="flex-1">
                        <select
                          value={entry.day}
                          onChange={(e) => updateScheduleRow(idx, 'day', e.target.value, 'edit')}
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateScheduleRow(idx, 'startTime', e.target.value, 'edit')}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>

                      <span className="text-xs text-gray-400 font-semibold">to</span>

                      <div className="w-28">
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateScheduleRow(idx, 'endTime', e.target.value, 'edit')}
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>

                      {editSchedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleRow(idx, 'edit')}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Room & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Hall Name</label>
                  <input
                    type="text"
                    required
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
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

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-700">Batch Active Status</span>
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

    </div>
  );
}

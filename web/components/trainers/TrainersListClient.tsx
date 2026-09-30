'use client';

import React, { useState } from 'react';
import { Trainer, Course, Batch } from '@/lib/academy';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  X,
  Search,
  Sparkles,
  Edit3,
  Clock,
  MapPin,
  Check,
  ChevronDown,
  BookOpen,
  GraduationCap,
  Layers
} from 'lucide-react';

interface Props {
  initialTrainers: Trainer[];
  courses?: Course[];
  batches?: Batch[];
}

export default function TrainersListClient({ 
  initialTrainers, 
  courses = [], 
  batches = [] 
}: Props) {
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Add Guru Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addFullName, setAddFullName] = useState('');
  const [addDisplayTitle, setAddDisplayTitle] = useState('');
  const [addSelectedCourses, setAddSelectedCourses] = useState<string[]>([]);
  const [addBio, setAddBio] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');

  // Edit Guru Modal State
  const [editingGuru, setEditingGuru] = useState<Trainer | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editDisplayTitle, setEditDisplayTitle] = useState('');
  const [editSelectedCourses, setEditSelectedCourses] = useState<string[]>([]);
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditCourseDropdownOpen, setIsEditCourseDropdownOpen] = useState(false);
  const [editCourseSearch, setEditCourseSearch] = useState('');

  // Timetable Modal State
  const [timetableGuru, setTimetableGuru] = useState<Trainer | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper to get batches for a trainer
  const getGuruBatches = (trainer: Trainer): Batch[] => {
    return batches.filter(b => 
      b.trainer_id === trainer.id || 
      (b.trainer_name && trainer.full_name && 
       (b.trainer_name.toLowerCase().includes(trainer.full_name.toLowerCase()) || 
        trainer.full_name.toLowerCase().includes(b.trainer_name.toLowerCase())))
    );
  };

  const filteredTrainers = trainers.filter(t => 
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.display_title && t.display_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Toggle course selection in Add modal
  const toggleAddCourse = (courseTitle: string) => {
    setAddSelectedCourses(prev => 
      prev.includes(courseTitle)
        ? prev.filter(c => c !== courseTitle)
        : [...prev, courseTitle]
    );
  };

  // Toggle course selection in Edit modal
  const toggleEditCourse = (courseTitle: string) => {
    setEditSelectedCourses(prev => 
      prev.includes(courseTitle)
        ? prev.filter(c => c !== courseTitle)
        : [...prev, courseTitle]
    );
  };

  // Open Edit Modal
  const openEditModal = (guru: Trainer) => {
    setEditingGuru(guru);
    setEditFullName(guru.full_name);
    setEditDisplayTitle(guru.display_title || '');
    setEditSelectedCourses(guru.specializations || []);
    setEditBio(guru.bio || '');
    setEditPhone(guru.phone || '');
    setEditIsActive(guru.is_active !== false);
    setIsEditCourseDropdownOpen(false);
  };

  // Handle Add Guru Form Submission
  const handleAddGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFullName.trim()) return;
    if (addSelectedCourses.length === 0) {
      alert('Please select at least one course / discipline for this Guru.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: addFullName.trim(),
          display_title: addDisplayTitle.trim() || 'Revered Guru & Mentor',
          specializations: addSelectedCourses,
          bio: addBio.trim(),
          email: addEmail.trim() || undefined,
          phone: addPhone.trim() || undefined,
        })
      });

      if (res.ok) {
        const added = await res.json();
        setTrainers(prev => [...prev, {
          ...added,
          full_name: addFullName.trim(),
          display_title: addDisplayTitle.trim() || 'Revered Guru & Mentor',
          specializations: addSelectedCourses,
          bio: addBio.trim(),
          email: addEmail.trim() || `${addFullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@laasyaacademy.com`,
          phone: addPhone.trim() || '+91 8151 998 899',
          batches_assigned: 0
        }]);
        setIsAddOpen(false);
        setAddFullName('');
        setAddDisplayTitle('');
        setAddSelectedCourses([]);
        setAddBio('');
        setAddEmail('');
        setAddPhone('');
        showNotification(`Guru ${addFullName.trim()} successfully added to academy faculty!`);
      } else {
        const err = await res.json();
        alert(`Failed to add Guru: ${err.error || 'Server error'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error adding Guru: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit Guru Form Submission
  const handleUpdateGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuru) return;
    if (!editFullName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/trainers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGuru.id,
          full_name: editFullName.trim(),
          display_title: editDisplayTitle.trim(),
          specializations: editSelectedCourses,
          bio: editBio.trim(),
          phone: editPhone.trim(),
          is_active: editIsActive
        })
      });

      if (res.ok) {
        setTrainers(prev => prev.map(t => {
          if (t.id === editingGuru.id) {
            return {
              ...t,
              full_name: editFullName.trim(),
              display_title: editDisplayTitle.trim(),
              specializations: editSelectedCourses,
              bio: editBio.trim(),
              phone: editPhone.trim(),
              is_active: editIsActive
            };
          }
          return t;
        }));
        showNotification(`Guru details for ${editFullName.trim()} updated successfully!`);
        setEditingGuru(null);
      } else {
        const err = await res.json();
        alert(`Failed to update Guru: ${err.error || 'Server error'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error updating Guru: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredCoursesForAdd = courses.filter(c => 
    c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredCoursesForEdit = courses.filter(c => 
    c.title.toLowerCase().includes(editCourseSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(editCourseSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-[#2D041A] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-5 h-5 text-[#F9E33A]" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Faculty & Revered Gurus</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-bold">
              {trainers.length} Gurus
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage classical dance gurus, vocal masters, musical instrument mentors, and martial arts acharyas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by guru name, title, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#F0D5E4] rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Add New Guru</span>
          </button>
        </div>
      </div>

      {/* Gurus Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.map((t) => {
          const guruBatches = getGuruBatches(t);
          const activeBatchesCount = guruBatches.length || t.batches_assigned || 0;

          return (
            <div
              key={t.id}
              className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Profile Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] font-bold text-base flex items-center justify-center shadow-md shrink-0">
                      {t.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#2D041A] leading-tight">
                        {t.full_name}
                      </h3>
                      <p className="text-xs font-semibold text-[#8A064D] mt-0.5 line-clamp-1">
                        {t.display_title || 'Revered Guru & Mentor'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 rounded-xl bg-gray-50 hover:bg-[#FFF2F8] text-gray-500 hover:text-[#8A064D] border border-gray-200 hover:border-[#F0D5E4] transition flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                      title="Edit Guru Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      {t.is_active !== false ? 'Active' : 'On Leave'}
                    </span>
                  </div>
                </div>

                {/* Assigned Courses / Disciplines */}
                <div className="mb-3.5">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                    Assigned Courses ({t.specializations?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {t.specializations && t.specializations.length > 0 ? (
                      t.specializations.map((spec, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium bg-[#FFF9FB] text-[#8A064D] border border-rose-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1"
                        >
                          <BookOpen className="w-2.5 h-2.5 opacity-60" />
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No courses tagged yet</span>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                  {t.bio || 'Experienced artist and educator dedicated to fostering students artistic excellence.'}
                </p>

                {/* Timetable Schedule Snippet */}
                <div className="bg-[#FAF7F9] border border-[#F0D5E4] rounded-2xl p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#8A064D]" />
                      <span className="text-xs font-bold text-[#2D041A]">
                        Assigned Class Timetable
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-[#8A064D] text-white px-2 py-0.5 rounded-full">
                      {activeBatchesCount} {activeBatchesCount === 1 ? 'Batch' : 'Batches'}
                    </span>
                  </div>

                  {guruBatches.length > 0 ? (
                    <div className="space-y-1.5">
                      {guruBatches.slice(0, 2).map((b) => (
                        <div key={b.id} className="text-[11px] bg-white p-2 rounded-xl border border-gray-100 flex items-start justify-between gap-2 shadow-xs">
                          <div>
                            <span className="font-semibold text-gray-800 block line-clamp-1">
                              {b.course_title}: {b.name}
                            </span>
                            <span className="text-gray-500 text-[10px] flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-[#8A064D]" />
                              {Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week} • {b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                            {b.room_or_hall?.split('(')[0] || 'Studio'}
                          </span>
                        </div>
                      ))}

                      {guruBatches.length > 2 && (
                        <p className="text-[10px] text-center text-gray-400 font-medium pt-0.5">
                          + {guruBatches.length - 2} more active weekly classes
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic py-1 text-center">
                      No active class batches scheduled yet
                    </p>
                  )}
                </div>

              </div>

              {/* Card Footer: View Timetable & Contact */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setTimetableGuru(t)}
                  className="px-3 py-1.5 rounded-xl bg-[#FFF2F8] hover:bg-[#FFE3EF] text-[#8A064D] border border-[#F0D5E4] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View Timetable</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {t.phone && (
                    <span className="text-[11px] text-gray-600 font-medium">
                      {t.phone}
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* 1. ADD NEW GURU MODAL */}
      {/* =================================================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#2D041A] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#EBB128]" />
                  <span>Add New Guru / Faculty Master</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter Guru credentials, assign courses from the curriculum, and set display title.
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddGuru} className="space-y-4">
              
              {/* Field 1: Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  1. Guru Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guru Smt. Kalyani Devi or Vidwan Sri Ramesh"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Field 2: Course (Multi-Select Dropdown) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>2. Assigned Courses / Disciplines (Select Multiple) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-[#8A064D] font-bold">
                    {addSelectedCourses.length} Selected
                  </span>
                </label>

                {/* Selected Course Chips */}
                {addSelectedCourses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl">
                    {addSelectedCourses.map((cTitle) => (
                      <span
                        key={cTitle}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white text-[#8A064D] border border-rose-200 px-2 py-0.5 rounded-lg shadow-2xs"
                      >
                        {cTitle}
                        <button
                          type="button"
                          onClick={() => toggleAddCourse(cTitle)}
                          className="text-gray-400 hover:text-rose-600 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown Toggle Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs flex items-center justify-between text-left transition"
                  >
                    <span className={addSelectedCourses.length > 0 ? "font-semibold text-gray-800" : "text-gray-400"}>
                      {addSelectedCourses.length > 0 
                        ? `${addSelectedCourses.length} Courses Selected (Click to change)` 
                        : "Click to choose from all 18 academy courses..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCourseDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Course Dropdown Menu */}
                  {isCourseDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#F0D5E4] rounded-2xl shadow-xl z-30 p-3 max-h-56 overflow-y-auto">
                      <div className="mb-2 pb-2 border-b border-gray-100">
                        <input
                          type="text"
                          placeholder="Type to filter courses (e.g. Dance, Vocal, Guitar)..."
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {filteredCoursesForAdd.map((c) => {
                          const isSelected = addSelectedCourses.includes(c.title);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleAddCourse(c.title)}
                              className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FFF2F8] text-[#8A064D] font-bold border border-rose-200'
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#8A064D] border-[#8A064D] text-white' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="truncate">{c.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsCourseDropdownOpen(false)}
                          className="text-xs font-bold text-[#8A064D] hover:underline"
                        >
                          Done Selecting
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Field 3: Display Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  3. Display Title / Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Guru & Choreographer, Sangeetha Acharya, Director"
                  value={addDisplayTitle}
                  onChange={(e) => setAddDisplayTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Field 4: Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  4. Bio & Artistic Lineage <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Qualifications, guru lineage, temple performances, Trinity / RSL certifications, years of experience..."
                  value={addBio}
                  onChange={(e) => setAddBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Optional Contact fields */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@laasyaacademy.com"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 8151 998 899"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{saving ? 'Saving...' : 'Add Revered Guru'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. EDIT GURU MODAL */}
      {/* =================================================================== */}
      {editingGuru && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#2D041A] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#8A064D]" />
                  <span>Edit Guru Profile</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update full name, display title, assigned courses, and bio for {editingGuru.full_name}.
                </p>
              </div>
              <button
                onClick={() => setEditingGuru(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateGuru} className="space-y-4">
              
              {/* Field 1: Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Guru Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Field 2: Display Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Display Title / Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Guru & Choreographer, Sangeetha Acharya"
                  value={editDisplayTitle}
                  onChange={(e) => setEditDisplayTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Field 3: Courses Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Assigned Courses / Disciplines (Select Multiple) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-[#8A064D] font-bold">
                    {editSelectedCourses.length} Selected
                  </span>
                </label>

                {/* Selected Course Chips */}
                {editSelectedCourses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl">
                    {editSelectedCourses.map((cTitle) => (
                      <span
                        key={cTitle}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white text-[#8A064D] border border-rose-200 px-2 py-0.5 rounded-lg shadow-2xs"
                      >
                        {cTitle}
                        <button
                          type="button"
                          onClick={() => toggleEditCourse(cTitle)}
                          className="text-gray-400 hover:text-rose-600 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown Toggle Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEditCourseDropdownOpen(!isEditCourseDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs flex items-center justify-between text-left transition"
                  >
                    <span className="font-semibold text-gray-800">
                      {editSelectedCourses.length > 0 
                        ? `${editSelectedCourses.length} Courses Selected (Click to change)` 
                        : "Click to choose from all 18 academy courses..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isEditCourseDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Course Dropdown Menu */}
                  {isEditCourseDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#F0D5E4] rounded-2xl shadow-xl z-30 p-3 max-h-56 overflow-y-auto">
                      <div className="mb-2 pb-2 border-b border-gray-100">
                        <input
                          type="text"
                          placeholder="Type to filter courses..."
                          value={editCourseSearch}
                          onChange={(e) => setEditCourseSearch(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {filteredCoursesForEdit.map((c) => {
                          const isSelected = editSelectedCourses.includes(c.title);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleEditCourse(c.title)}
                              className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FFF2F8] text-[#8A064D] font-bold border border-rose-200'
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#8A064D] border-[#8A064D] text-white' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="truncate">{c.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEditCourseDropdownOpen(false)}
                          className="text-xs font-bold text-[#8A064D] hover:underline"
                        >
                          Done Selecting
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Field 4: Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bio / Profile Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Phone & Status Row */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty Status</label>
                  <select
                    value={editIsActive ? 'active' : 'leave'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="active">Active Teaching Guru</option>
                    <option value="leave">On Sabbatical / Leave</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingGuru(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#F9E33A]" />
                  <span>{saving ? 'Updating...' : 'Save Guru Changes'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. FULL TIMETABLE MODAL */}
      {/* =================================================================== */}
      {timetableGuru && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] font-bold text-lg flex items-center justify-center shadow-md shrink-0">
                  {timetableGuru.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#2D041A] leading-tight">
                    {timetableGuru.full_name}
                  </h3>
                  <p className="text-xs text-[#8A064D] font-semibold">
                    {timetableGuru.display_title || 'Revered Guru'} • Master Class Schedule
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTimetableGuru(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timetable Content */}
            <div className="space-y-4">
              {(() => {
                const guruBatches = getGuruBatches(timetableGuru);

                if (guruBatches.length === 0) {
                  return (
                    <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-gray-700">No Batches Scheduled Yet</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        This Guru currently has no active weekly class batches. Navigate to the <strong>Batches</strong> tab to assign new batches.
                      </p>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div className="bg-[#FFF2F8] border border-[#F0D5E4] p-3 rounded-2xl">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Weekly Batches</span>
                        <span className="text-xl font-bold text-[#8A064D]">{guruBatches.length} Classes</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                        <span className="text-[10px] font-bold text-amber-700 uppercase block">Students Enrolled</span>
                        <span className="text-xl font-bold text-amber-900">
                          {guruBatches.reduce((acc, b) => acc + (b.enrolled_count || 0), 0)} Enrolled
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">Disciplines</span>
                        <span className="text-xl font-bold text-emerald-900">
                          {timetableGuru.specializations?.length || 1} Courses
                        </span>
                      </div>
                    </div>

                    <div className="overflow-hidden border border-[#F0D5E4] rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF7F9] text-gray-700 font-bold border-b border-[#F0D5E4]">
                          <tr>
                            <th className="py-3 px-4">Course & Batch</th>
                            <th className="py-3 px-4">Days of Week</th>
                            <th className="py-3 px-4">Timings</th>
                            <th className="py-3 px-4">Hall / Studio</th>
                            <th className="py-3 px-4 text-center">Enrolled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {guruBatches.map((b) => (
                            <tr key={b.id} className="hover:bg-gray-50/80 transition">
                              <td className="py-3 px-4">
                                <span className="font-bold text-[#2D041A] block">{b.course_title}</span>
                                <span className="text-[11px] text-[#8A064D]">{b.name}</span>
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-700">
                                {Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-gray-800">
                                  {b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#8A064D]" />
                                  {b.room_or_hall}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                  {b.enrolled_count} / {b.max_capacity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-5">
              <span className="text-[11px] text-gray-400">
                Laasya Cultural Academy Official Timetable
              </span>
              <button
                onClick={() => setTimetableGuru(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
              >
                Close Timetable
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

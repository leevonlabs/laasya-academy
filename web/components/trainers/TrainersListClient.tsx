'use client';

import React, { useState } from 'react';
import { Trainer, Course, Batch } from '@/lib/academy';
import GuruPhotoUploadInput from '@/components/common/GuruPhotoUploadInput';
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
  Eye, 
  Trash2, 
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  DoorOpen,
  CheckCircle2,
  ZoomIn,
  Maximize2,
  ArrowLeft
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Dedicated Full Page View Mode ('list' | 'add' | 'edit')
  const [pageMode, setPageMode] = useState<'list' | 'add' | 'edit'>('list');

  // Add Guru Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addFullName, setAddFullName] = useState('');
  const [addAge, setAddAge] = useState<string>('');
  const [addGender, setAddGender] = useState<'male' | 'female' | 'trans'>('female');
  const [addDisplayTitle, setAddDisplayTitle] = useState('');
  const [addAvatarUrl, setAddAvatarUrl] = useState<string | null>(null);
  const [addSelectedCourses, setAddSelectedCourses] = useState<string[]>([]);
  const [addBio, setAddBio] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addAlternatePhone, setAddAlternatePhone] = useState('');
  const [addMonthlySalary, setAddMonthlySalary] = useState<number>(25000);
  const [addIsActive, setAddIsActive] = useState<boolean>(true);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');

  // Edit Guru Modal State
  const [editingGuru, setEditingGuru] = useState<Trainer | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editAge, setEditAge] = useState<string>('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'trans'>('female');
  const [editDisplayTitle, setEditDisplayTitle] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [editSelectedCourses, setEditSelectedCourses] = useState<string[]>([]);
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAlternatePhone, setEditAlternatePhone] = useState('');
  const [editMonthlySalary, setEditMonthlySalary] = useState<number>(25000);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditCourseDropdownOpen, setIsEditCourseDropdownOpen] = useState(false);
  const [editCourseSearch, setEditCourseSearch] = useState('');

  // Details Modal State
  const [viewingGuru, setViewingGuru] = useState<Trainer | null>(null);
  const [deletingGuru, setDeletingGuru] = useState<Trainer | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  // Timetable Modal State
  const [timetableGuru, setTimetableGuru] = useState<Trainer | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to get batches for a trainer
  const getGuruBatches = (trainer: Trainer): Batch[] => {
    if (trainer.assigned_batches && trainer.assigned_batches.length > 0) {
      // Map trainer.assigned_batches to Batch format
      return trainer.assigned_batches.map(ab => ({
        id: ab.id,
        course_id: ab.course_id,
        course_title: ab.course_title,
        course_category: ab.course_category || 'Classical Arts',
        trainer_id: trainer.id,
        trainer_name: trainer.full_name,
        name: ab.name,
        days_of_week: ab.days_of_week,
        start_time: ab.start_time,
        end_time: ab.end_time,
        room_or_hall: ab.room_or_hall,
        max_capacity: ab.max_capacity || 25,
        is_active: true,
        enrolled_count: ab.enrolled_count || 0
      }));
    }

    return batches.filter(b => 
      b.trainer_id === trainer.id || 
      (b.trainer_name && trainer.full_name && 
       (b.trainer_name.toLowerCase().includes(trainer.full_name.toLowerCase()) || 
        trainer.full_name.toLowerCase().includes(b.trainer_name.toLowerCase())))
    );
  };

  // Filter Trainers by Search and Status
  const filteredTrainers = trainers.filter(t => {
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? (t.is_active !== false) :
      (t.is_active === false);

    const matchesSearch = 
      t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.display_title && t.display_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.phone && t.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const activeCount = trainers.filter(t => t.is_active !== false).length;
  const inactiveCount = trainers.filter(t => t.is_active === false).length;

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

  // Open Add Modal with Clean Blank State
  const openAddModal = () => {
    setAddFullName('');
    setAddAge('');
    setAddGender('female');
    setAddDisplayTitle('');
    setAddAvatarUrl(null);
    setAddSelectedCourses([]);
    setAddBio('');
    setAddEmail('');
    setAddPhone('');
    setAddAlternatePhone('');
    setAddMonthlySalary(25000);
    setAddIsActive(true);
    setIsCourseDropdownOpen(false);
    setCourseSearch('');
    setIsAddOpen(true);
    setPageMode('add');
  };

  // Open Edit Modal
  const openEditModal = (guru: Trainer) => {
    setEditingGuru(guru);
    setEditFullName(guru.full_name);
    setEditAge(guru.age ? String(guru.age) : '');
    setEditGender((guru.gender as any) || 'female');
    setEditDisplayTitle(guru.display_title || '');
    setEditAvatarUrl(guru.avatar_url || null);
    setEditSelectedCourses(guru.specializations || []);
    setEditBio(guru.bio || '');
    setEditPhone(guru.phone || '');
    setEditAlternatePhone(guru.alternate_phone || '');
    setEditMonthlySalary(Number(guru.monthly_salary) || 25000);
    setEditIsActive(guru.is_active !== false);
    setIsEditCourseDropdownOpen(false);
    setPageMode('edit');
  };

  // Handle Add Guru Form Submission
  const handleAddGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFullName.trim()) {
      alert('Please enter Guru Full Name.');
      return;
    }
    if (!addAge || Number(addAge) <= 0) {
      alert('Age is required. Please specify a valid age in years.');
      return;
    }
    if (!addGender) {
      alert('Gender is required. Please select a gender.');
      return;
    }
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
          age: Number(addAge),
          gender: addGender,
          display_title: addDisplayTitle.trim() || undefined,
          specializations: addSelectedCourses,
          bio: addBio.trim() || undefined,
          email: addEmail.trim() || undefined,
          phone: addPhone.trim() || undefined,
          alternate_phone: addAlternatePhone.trim() || undefined,
          avatar_url: addAvatarUrl || undefined,
          monthly_salary: Number(addMonthlySalary) || 25000,
          is_active: addIsActive
        })
      });

      if (res.ok) {
        const added = await res.json();
        const newGuru: Trainer = {
          ...added,
          full_name: addFullName.trim(),
          age: Number(addAge),
          gender: addGender,
          display_title: addDisplayTitle.trim() || 'Revered Guru & Mentor',
          specializations: addSelectedCourses,
          bio: addBio.trim(),
          avatar_url: addAvatarUrl || undefined,
          email: addEmail.trim() || `${addFullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@laasyaacademy.com`,
          phone: addPhone.trim() || '+91 8151 998 899',
          alternate_phone: addAlternatePhone.trim() || undefined,
          monthly_salary: Number(addMonthlySalary) || 25000,
          salary_payment_status: 'pending',
          is_active: addIsActive,
          batches_assigned: 0,
          assigned_batches: []
        };
        setTrainers(prev => [...prev, newGuru]);
        setIsAddOpen(false);
        setPageMode('list');
        showNotification(`Guru ${addFullName.trim()} successfully registered to academy faculty!`);
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
    if (!editFullName.trim()) {
      alert('Please enter Guru Full Name.');
      return;
    }
    if (!editAge || Number(editAge) <= 0) {
      alert('Age is required. Please specify a valid age in years.');
      return;
    }
    if (!editGender) {
      alert('Gender is required. Please select a gender.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/trainers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGuru.id,
          full_name: editFullName.trim(),
          age: Number(editAge),
          gender: editGender,
          display_title: editDisplayTitle.trim(),
          specializations: editSelectedCourses,
          bio: editBio.trim() || undefined,
          phone: editPhone.trim(),
          alternate_phone: editAlternatePhone.trim() || undefined,
          avatar_url: editAvatarUrl !== undefined ? editAvatarUrl : null,
          is_active: editIsActive,
          monthly_salary: Number(editMonthlySalary) || 25000
        })
      });

      if (res.ok) {
        setTrainers(prev => prev.map(t => {
          if (t.id === editingGuru.id) {
            return {
              ...t,
              full_name: editFullName.trim(),
              age: Number(editAge),
              gender: editGender,
              display_title: editDisplayTitle.trim(),
              specializations: editSelectedCourses,
              bio: editBio.trim(),
              phone: editPhone.trim(),
              alternate_phone: editAlternatePhone.trim() || undefined,
              avatar_url: editAvatarUrl || undefined,
              is_active: editIsActive,
              monthly_salary: Number(editMonthlySalary) || 25000
            };
          }
          return t;
        }));

        if (viewingGuru && viewingGuru.id === editingGuru.id) {
          setViewingGuru(prev => prev ? ({
            ...prev,
            full_name: editFullName.trim(),
            age: Number(editAge),
            gender: editGender,
            display_title: editDisplayTitle.trim(),
            specializations: editSelectedCourses,
            bio: editBio.trim(),
            phone: editPhone.trim(),
            alternate_phone: editAlternatePhone.trim() || undefined,
            avatar_url: editAvatarUrl || undefined,
            is_active: editIsActive,
            monthly_salary: Number(editMonthlySalary) || 25000
          }) : null);
        }

        showNotification(`Guru details for ${editFullName.trim()} updated successfully!`);
        setEditingGuru(null);
        setPageMode('list');
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

  // Handle Delete Guru
  const handleDeleteGuru = async () => {
    if (!deletingGuru) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/trainers?id=${deletingGuru.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete Guru');
      }

      setTrainers(prev => prev.filter(t => t.id !== deletingGuru.id));
      if (viewingGuru && viewingGuru.id === deletingGuru.id) {
        setViewingGuru(null);
      }
      showNotification(`Guru "${deletingGuru.full_name}" has been removed successfully.`);
      setDeletingGuru(null);
    } catch (e: any) {
      alert(`Error deleting Guru: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Course filtering in modals
  const filteredCoursesForAdd = courses.filter(c => 
    c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredCoursesForEdit = courses.filter(c => 
    c.title.toLowerCase().includes(editCourseSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(editCourseSearch.toLowerCase())
  );

  // =====================================================================
  // DEDICATED FULL PAGE FOR REGISTERING NEW REVERED GURU
  // =====================================================================
  if (pageMode === 'add') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPageMode('list')}
              className="p-2.5 rounded-2xl bg-[#FFF2F8] hover:bg-rose-100 text-[#8A064D] border border-rose-200 transition cursor-pointer"
              title="Back to Faculty Gurus"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-lg border border-rose-100">
                  New Faculty
                </span>
                <span className="text-xs text-[#8A064D] font-bold">Laasya Academy of Fine Arts</span>
              </div>
              <h1 className="text-2xl font-black text-[#2D041A] tracking-tight mt-1 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#EBB128]" />
                <span>Register New Guru / Faculty Master</span>
              </h1>
              <p className="text-xs text-[#6E3955] mt-0.5 font-medium">
                Enter Guru credentials, assign courses, configure monthly salary compensation, and active status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPageMode('list')}
              className="px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleAddGuru(e as any)}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] active:scale-95 text-white text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#F9E33A]" />
              <span>{saving ? 'Saving...' : 'Add Revered Guru'}</span>
            </button>
          </div>
        </div>

        {/* Spacious 2-Column Form */}
        <form onSubmit={handleAddGuru} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Personal Identity & Portrait Photo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-5">
              <h3 className="font-black text-sm text-[#2D041A] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                <Users className="w-4 h-4 text-[#8A064D]" />
                <span>Profile & Identity</span>
              </h3>

              {/* Profile Photo Upload */}
              <GuruPhotoUploadInput
                value={addAvatarUrl}
                onChange={setAddAvatarUrl}
                label="Guru Portrait Photo"
                initials={addFullName ? addFullName.slice(0, 2).toUpperCase() : 'GU'}
                guruName={addFullName}
                displayTitle={addDisplayTitle || 'Revered Guru & Mentor'}
                maxSizeMB={4}
              />

              {/* Guru Full Name */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Guru Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Guru's full name"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Display Title */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Display Title / Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter designation (e.g. Senior Faculty / Guru)"
                  value={addDisplayTitle}
                  onChange={(e) => setAddDisplayTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Age (Years) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={100}
                    placeholder="e.g. 35"
                    value={addAge}
                    onChange={(e) => setAddAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={addGender}
                    onChange={(e) => setAddGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white cursor-pointer"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="trans">Trans</option>
                  </select>
                </div>
              </div>

              {/* Bio & Artistic Lineage */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Bio & Artistic Lineage <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Qualifications, guru lineage, performance background, experience..."
                  value={addBio}
                  onChange={(e) => setAddBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Disciplines, Salary, Status & Contacts */}
          <div className="lg:col-span-7 space-y-6">
            {/* Academy Disciplines & Roles */}
            <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-5">
              <h3 className="font-black text-sm text-[#2D041A] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                <BookOpen className="w-4 h-4 text-[#8A064D]" />
                <span>Disciplines, Salary & Status</span>
              </h3>

              {/* Course Multi-Select */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>Assigned Courses / Disciplines (Select Multiple) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-[#8A064D] font-extrabold">
                    {addSelectedCourses.length} Selected
                  </span>
                </label>

                {addSelectedCourses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl">
                    {addSelectedCourses.map((cTitle) => (
                      <span
                        key={cTitle}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-[#8A064D] border border-rose-200 px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        {cTitle}
                        <button
                          type="button"
                          onClick={() => toggleAddCourse(cTitle)}
                          className="text-gray-400 hover:text-rose-600 ml-1 cursor-pointer font-black"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs flex items-center justify-between text-left transition cursor-pointer font-bold text-[#1A010F]"
                  >
                    <span className={addSelectedCourses.length > 0 ? "font-bold text-[#1A010F]" : "font-normal text-gray-400"}>
                      {addSelectedCourses.length > 0 
                        ? `${addSelectedCourses.length} Courses Selected (Click to change)` 
                        : "Click to choose from all academy courses..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCourseDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCourseDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#F0D5E4] rounded-2xl shadow-xl z-30 p-3 max-h-56 overflow-y-auto">
                      <div className="mb-2 pb-2 border-b border-gray-100">
                        <input
                          type="text"
                          placeholder="Type to filter courses (e.g. Dance, Vocal, Guitar)..."
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                                  : 'hover:bg-gray-50 text-gray-700 font-semibold'
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

                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsCourseDropdownOpen(false)}
                          className="text-xs font-bold text-[#8A064D] hover:underline cursor-pointer"
                        >
                          Done Selecting
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Salary & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Monthly Salary (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-500 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      placeholder="25000"
                      value={addMonthlySalary}
                      onChange={(e) => setAddMonthlySalary(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Initial Faculty Status
                  </label>
                  <select
                    value={addIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setAddIsActive(e.target.value === 'active')}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white cursor-pointer"
                  >
                    <option value="active">Active Teaching Guru</option>
                    <option value="inactive">Inactive / On Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
              <h3 className="font-black text-sm text-[#2D041A] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                <Phone className="w-4 h-4 text-[#8A064D]" />
                <span>Contact & Communication</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Primary Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Alternate Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 01234"
                    value={addAlternatePhone}
                    onChange={(e) => setAddAlternatePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="guru@laasyaacademy.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPageMode('list')}
                className="px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] active:scale-95 text-white text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#F9E33A]" />
                <span>{saving ? 'Saving...' : 'Add Revered Guru'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // =====================================================================
  // DEDICATED FULL PAGE FOR EDITING GURU PROFILE
  // =====================================================================
  if (pageMode === 'edit' && editingGuru) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPageMode('list');
                setEditingGuru(null);
              }}
              className="p-2.5 rounded-2xl bg-[#FFF2F8] hover:bg-rose-100 text-[#8A064D] border border-rose-200 transition cursor-pointer"
              title="Back to Faculty Gurus"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-lg border border-rose-100">
                  Faculty Profile
                </span>
                <span className="text-xs text-[#8A064D] font-bold">Laasya Academy of Fine Arts</span>
              </div>
              <h1 className="text-2xl font-black text-[#2D041A] tracking-tight mt-1 flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-[#8A064D]" />
                <span>Edit Guru Profile: {editingGuru.full_name}</span>
              </h1>
              <p className="text-xs text-[#6E3955] mt-0.5 font-medium">
                Update full name, display title, monthly salary, status, and assigned disciplines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPageMode('list');
                setEditingGuru(null);
              }}
              className="px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleUpdateGuru(e as any)}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] active:scale-95 text-white text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#F9E33A]" />
              <span>{saving ? 'Updating...' : 'Save Guru Changes'}</span>
            </button>
          </div>
        </div>

        {/* Spacious 2-Column Form */}
        <form onSubmit={handleUpdateGuru} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Personal Identity & Profile Photo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-5">
              <h3 className="font-black text-sm text-[#2D041A] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                <Users className="w-4 h-4 text-[#8A064D]" />
                <span>Profile & Identity</span>
              </h3>

              {/* Profile Photo Upload */}
              <GuruPhotoUploadInput
                value={editAvatarUrl}
                onChange={setEditAvatarUrl}
                label="Guru Portrait Photo"
                initials={editFullName ? editFullName.slice(0, 2).toUpperCase() : 'GU'}
                guruName={editFullName}
                displayTitle={editDisplayTitle || 'Revered Guru & Mentor'}
                maxSizeMB={4}
              />

              {/* Full Name */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Guru Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Display Title */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Display Title / Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayTitle}
                  onChange={(e) => setEditDisplayTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Age (Years) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={100}
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white cursor-pointer"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="trans">Trans</option>
                  </select>
                </div>
              </div>

              {/* Bio & Artistic Lineage */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Bio / Profile Summary <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Qualifications, guru lineage, performance background, experience..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Disciplines, Salary, Status & Contacts */}
          <div className="lg:col-span-7 space-y-6">
            {/* Academy Disciplines & Roles */}
            <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-5">
              <h3 className="font-black text-sm text-[#2D041A] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                <BookOpen className="w-4 h-4 text-[#8A064D]" />
                <span>Disciplines, Salary & Status</span>
              </h3>

              {/* Course Multi-Select */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>Assigned Courses / Disciplines (Select Multiple) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-[#8A064D] font-extrabold">
                    {editSelectedCourses.length} Selected
                  </span>
                </label>

                {editSelectedCourses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl">
                    {editSelectedCourses.map((cTitle) => (
                      <span
                        key={cTitle}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-[#8A064D] border border-rose-200 px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        {cTitle}
                        <button
                          type="button"
                          onClick={() => toggleEditCourse(cTitle)}
                          className="text-gray-400 hover:text-rose-600 ml-1 cursor-pointer font-black"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEditCourseDropdownOpen(!isEditCourseDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs flex items-center justify-between text-left transition cursor-pointer font-bold text-[#1A010F]"
                  >
                    <span className={editSelectedCourses.length > 0 ? "font-bold text-[#1A010F]" : "font-normal text-gray-400"}>
                      {editSelectedCourses.length > 0 
                        ? `${editSelectedCourses.length} Courses Selected (Click to change)` 
                        : "Click to choose from all academy courses..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isEditCourseDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isEditCourseDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#F0D5E4] rounded-2xl shadow-xl z-30 p-3 max-h-56 overflow-y-auto">
                      <div className="mb-2 pb-2 border-b border-gray-100">
                        <input
                          type="text"
                          placeholder="Type to filter courses..."
                          value={editCourseSearch}
                          onChange={(e) => setEditCourseSearch(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                                  : 'hover:bg-gray-50 text-gray-700 font-semibold'
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

                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEditCourseDropdownOpen(false)}
                          className="text-xs font-bold text-[#8A064D] hover:underline cursor-pointer"
                        >
                          Done Selecting
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Salary & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Monthly Salary (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-500 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={editMonthlySalary}
                      onChange={(e) => setEditMonthlySalary(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Faculty Status (Active / Inactive)
                  </label>
                  <select
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white cursor-pointer"
                  >
                    <option value="active">Active Teaching Guru</option>
                    <option value="inactive">Inactive / On Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
              <h3 className="font-black text-sm text-[#2D041A] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                <Phone className="w-4 h-4 text-[#8A064D]" />
                <span>Contact & Communication</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Primary Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Alternate Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 01234"
                    value={editAlternatePhone}
                    onChange={(e) => setEditAlternatePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPageMode('list');
                  setEditingGuru(null);
                }}
                className="px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] active:scale-95 text-white text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-[#F9E33A]" />
                <span>{saving ? 'Updating...' : 'Save Guru Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-70 bg-[#2D041A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8A064D] to-[#EBB128] flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-black text-[#F9E33A] uppercase tracking-wider">Action Successful</div>
            <div className="text-xs font-bold text-white mt-0.5">{notification}</div>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition ml-3 cursor-pointer text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4]/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FCE7F3] text-[#8A064D]">
              Academy Mentors
            </span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-bold tabular-nums">
              {trainers.length} Faculty Masters
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#2D041A] tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#8A064D]" />
            <span>Faculty & Revered Gurus</span>
          </h1>
          <p className="text-xs text-[#6E3955] mt-1 font-medium max-w-2xl">
            Manage classical dance gurus, vocal masters, instrumental mentors, monthly salaries, and batch timetables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A064D]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by guru name, title, course, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-2xl text-xs font-semibold text-[#2D041A] placeholder:text-[#8A064D]/40 w-72 sm:w-80 focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] focus:bg-white transition"
            />
          </div>

          <button
            onClick={openAddModal}
            className="bg-[#8A064D] hover:bg-[#70043E] active:scale-98 text-white px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide shadow-sm hover:shadow-md transition flex items-center gap-2 cursor-pointer border border-[#F9E33A]/40 shrink-0"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Add New Guru</span>
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            statusFilter === 'all'
              ? 'bg-[#8A064D] text-white shadow-xs ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-[#521D38] border border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <span>All Gurus</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold tabular-nums ${
            statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-[#FFF2F8] text-[#8A064D]'
          }`}>
            {trainers.length}
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            statusFilter === 'active'
              ? 'bg-[#8A064D] text-white shadow-xs ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-[#521D38] border border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Active</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold tabular-nums ${
            statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
          }`}>
            {activeCount}
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            statusFilter === 'inactive'
              ? 'bg-[#8A064D] text-white shadow-xs ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-[#521D38] border border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
          <span>Inactive / Leave</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold tabular-nums ${
            statusFilter === 'inactive' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {inactiveCount}
          </span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* GURUS CARDS GRID (ENLARGED GRID & HERO CARDS) */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
        {filteredTrainers.map((t) => {
          const isSalaryPaid = t.salary_payment_status === 'paid';

          return (
            <div
              key={t.id}
              className="bg-white rounded-3xl overflow-hidden border-2 border-[#F0D5E4] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* 1. FIXED OUTLOOK FRAME (4:5 RATIO) MATCHING ADJUSTMENT MODAL EXACTLY */}
                <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-[#3D0322] via-[#590231] to-[#1A010F] overflow-hidden">
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt={t.full_name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#590231] via-[#3A0320] to-[#1F0111]">
                      <div className="w-24 h-24 rounded-3xl bg-[#F9E33A]/20 border-2 border-[#F9E33A] flex items-center justify-center shadow-inner">
                        <span className="font-serif text-3xl font-black text-[#F9E33A] tracking-wider">
                          {t.full_name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white/70 text-xs font-bold mt-3 tracking-widest uppercase">
                        Classical Faculty Master
                      </span>
                    </div>
                  )}

                  {/* FLOATING STATUS PILLS AT TOP CORNERS */}
                  <div className="absolute top-3.5 left-3.5 z-20">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold backdrop-blur-md shadow-md border ${
                      t.is_active !== false 
                        ? 'bg-emerald-950/75 text-emerald-300 border-emerald-500/40' 
                        : 'bg-zinc-900/75 text-zinc-300 border-zinc-600/40'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${t.is_active !== false ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`}></span>
                      <span>{t.is_active !== false ? 'Active Guru' : 'Inactive'}</span>
                    </span>
                  </div>

                  <div className="absolute top-3.5 right-3.5 z-20">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md shadow-md border ${
                      isSalaryPaid
                        ? 'bg-emerald-950/75 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-950/75 text-rose-300 border-rose-500/40'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isSalaryPaid ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                      <span>Salary: {isSalaryPaid ? 'Paid' : 'Pending'}</span>
                    </span>
                  </div>

                  {/* INSIDE THE IMAGE: FULL NAME & DISPLAY NAME AS DISTINCT MARK AT BOTTOM */}
                  <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent pt-28 pb-4 px-5 flex flex-col justify-end">
                    <h3 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight drop-shadow-md leading-tight line-clamp-2">
                      {t.full_name}
                    </h3>

                    {/* Display name as a distinct mark inside the image */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9E33A] text-[#2D041A] font-black text-xs uppercase tracking-wider shadow-lg border border-[#F9E33A]">
                        <Sparkles className="w-3 h-3 text-[#2D041A] fill-[#2D041A]" />
                        <span>{t.display_title || 'Guru & Mentor'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. CARD CONTENT BELOW IMAGE */}
                <div className="p-5 space-y-4">
                  {/* HIGHLIGHTED CONTACT CARD */}
                  <div className="bg-gradient-to-br from-[#FFF9FB] to-[#FFF0F6] border-2 border-[#F0D5E4] rounded-2xl p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0D5E4]/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#8A064D] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#8A064D]" />
                        <span>Contact & Personal Details</span>
                      </span>
                      {/* Age & Gender Tag */}
                      {(t.age || t.gender) && (
                        <span className="text-[11px] font-bold text-[#6E3955] bg-white px-2 py-0.5 rounded-full border border-[#F0D5E4]">
                          {t.age ? `${t.age} yrs` : ''}{t.age && t.gender ? ' • ' : ''}{t.gender ? t.gender.toUpperCase() : ''}
                        </span>
                      )}
                    </div>

                    {/* Primary Phone */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-500">Primary Phone:</span>
                      {t.phone ? (
                        <a
                          href={`tel:${t.phone}`}
                          className="font-bold text-[#2D041A] hover:text-[#8A064D] flex items-center gap-1 tabular-nums transition"
                        >
                          <span>{t.phone}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </div>

                    {/* Alternate Phone */}
                    {t.alternate_phone && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-500">Alternate Phone:</span>
                        <a
                          href={`tel:${t.alternate_phone}`}
                          className="font-bold text-[#8A064D] hover:underline flex items-center gap-1 tabular-nums"
                        >
                          <span>{t.alternate_phone}</span>
                        </a>
                      </div>
                    )}

                    {/* Email */}
                    {t.email && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#F0D5E4]/40">
                        <span className="font-semibold text-gray-500">Official Email:</span>
                        <span className="font-medium text-gray-700 truncate max-w-[200px]" title={t.email}>
                          {t.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3. ASSIGNED COURSES BELOW CONTACT */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#590231] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#8A064D]" />
                        <span>Assigned Courses ({t.specializations?.length || 0})</span>
                      </span>
                      <span className="text-[11px] font-bold text-gray-500">
                        {t.batches_assigned || getGuruBatches(t).length} Batches
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                      {t.specializations && t.specializations.length > 0 ? (
                        t.specializations.map((spec, i) => (
                          <span
                            key={i}
                            className="text-xs font-bold bg-[#FFF2F8] text-[#8A064D] border border-rose-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>{spec}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No courses assigned yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ACTION BUTTONS: DETAILS, EDIT, TIMETABLE BELOW IT */}
              <div className="p-5 pt-0">
                <div className="pt-3.5 border-t border-[#F0D5E4]/80 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setViewingGuru(t)}
                    className="py-2.5 px-3 rounded-xl bg-[#2D041A] hover:bg-[#48082B] text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95 border border-[#48082B]"
                    title="View complete Guru profile and batch details"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                    <span>Details</span>
                  </button>

                  <button
                    onClick={() => openEditModal(t)}
                    className="py-2.5 px-3 rounded-xl bg-[#FFF5F9] hover:bg-[#FCE7F3] text-[#8A064D] text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border border-[#E8BFD5]"
                    title="Edit Guru profile and salary"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setTimetableGuru(t)}
                    className="py-2.5 px-3 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border border-[#8A064D]"
                    title="View assigned classes timetable"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#F9E33A]" />
                    <span className="truncate">Timetable</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredTrainers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#F0D5E4] p-8">
          <Users className="w-12 h-12 text-[#8A064D]/30 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#2D041A]">No Gurus Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            No faculty masters match the selected filters or search keyword &quot;{searchQuery}&quot;.
          </p>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. DETAILS POPUP SUB-PAGE (MODAL) WITH BIG IMAGE & PERFECT ALIGNMENT */}
      {/* =================================================================== */}
      {viewingGuru && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header & Hero Card */}
            <div className="flex flex-col sm:flex-row items-start gap-5 pb-6 border-b border-gray-100 mb-5 relative">
              {/* Close Button Top Right */}
              <button
                onClick={() => setViewingGuru(null)}
                className="absolute top-0 right-0 w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-[#8A064D] hover:text-[#590231] border border-rose-200 flex items-center justify-center transition shadow-2xs cursor-pointer z-10"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* BIG PORTRAIT IMAGE WITH CLICK TO ENLARGE LIGHTBOX */}
              <div className="shrink-0 mx-auto sm:mx-0">
                {viewingGuru.avatar_url ? (
                  <div
                    onClick={() => setLightboxImage({ src: viewingGuru.avatar_url!, title: viewingGuru.full_name })}
                    className="relative w-44 h-56 sm:w-52 sm:h-64 rounded-2xl overflow-hidden border-2 border-[#F0D5E4] bg-neutral-900 shadow-md group cursor-pointer"
                    title="Click to view full image"
                  >
                    <img
                      src={viewingGuru.avatar_url}
                      alt={viewingGuru.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Hover Overlay with Zoom Icon */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 p-3 text-center">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-xs">
                        <ZoomIn className="w-6 h-6 text-[#F9E33A]" />
                      </div>
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full border border-white/20">
                        Click to view full image
                      </span>
                    </div>

                    {/* Subtle Corner Badge Indicator */}
                    <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 text-white group-hover:opacity-0 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5 text-[#F9E33A]" />
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-56 sm:w-52 sm:h-64 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] font-bold text-3xl flex flex-col items-center justify-center shadow-md border-2 border-[#F9E33A]/40 gap-2">
                    <span>{viewingGuru.full_name.slice(0, 2).toUpperCase()}</span>
                    <span className="text-[10px] text-white/70 uppercase tracking-widest font-sans font-normal">No Photo</span>
                  </div>
                )}
              </div>

              {/* GURU PRIMARY DETAILS & STATUS OVERVIEW */}
              <div className="flex-1 min-w-0 pr-8 space-y-3">
                <div>
                  <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#2D041A] leading-tight">
                    {viewingGuru.full_name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9E33A] text-[#2D041A] font-black text-xs uppercase tracking-wider shadow-xs border border-[#F9E33A]">
                      <Sparkles className="w-3 h-3 text-[#2D041A] fill-[#2D041A]" />
                      <span>{viewingGuru.display_title || 'Revered Guru & Mentor'}</span>
                    </span>
                  </div>
                </div>

                {/* Quick Status Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Teaching Status */}
                  <div className="bg-[#FFF9FB] border border-[#F0D5E4] p-2.5 rounded-xl">
                    <span className="text-[9.5px] font-black text-[#590231] uppercase tracking-wider block mb-1">
                      Faculty Status
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      viewingGuru.is_active !== false 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${viewingGuru.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`}></span>
                      <span>{viewingGuru.is_active !== false ? 'Active Guru' : 'Inactive'}</span>
                    </span>
                  </div>

                  {/* Salary Status */}
                  <div className="bg-[#FFF9FB] border border-[#F0D5E4] p-2.5 rounded-xl">
                    <span className="text-[9.5px] font-black text-[#590231] uppercase tracking-wider block mb-1">
                      Salary Status
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      viewingGuru.salary_payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${viewingGuru.salary_payment_status === 'paid' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                      <span>{viewingGuru.salary_payment_status === 'paid' ? 'Paid' : 'Pending'}</span>
                    </span>
                  </div>

                  {/* Monthly Base Salary */}
                  <div className="bg-[#FFF2F8] border border-[#F0D5E4] p-2.5 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[9.5px] font-black text-[#8A064D] uppercase tracking-wider block mb-1">
                      Monthly Salary
                    </span>
                    <span className="text-sm font-extrabold text-[#2D041A]">
                      ₹{Number(viewingGuru.monthly_salary || 25000).toLocaleString('en-IN')}
                      <span className="text-[10px] font-normal text-gray-500 ml-1">/mo</span>
                    </span>
                  </div>
                </div>

                {/* Quick Contact Snippet */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-700 pt-1">
                  {viewingGuru.phone && (
                    <a
                      href={`tel:${viewingGuru.phone}`}
                      className="flex items-center gap-1.5 font-bold text-[#8A064D] hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#8A064D]" />
                      <span>{viewingGuru.phone}</span>
                    </a>
                  )}
                  {viewingGuru.email && (
                    <div className="flex items-center gap-1.5 font-medium text-gray-600 truncate max-w-[240px]">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{viewingGuru.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PERFECTLY ALIGNED DETAILS SECTIONS */}
            <div className="space-y-4">
              {/* SECTION 1: CONTACT & PERSONAL INFORMATION */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Personal &amp; Contact Details</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-[#590231] font-black uppercase tracking-wider block mb-1">Primary Phone</span>
                    <span className="text-gray-900 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#8A064D]" />
                      {viewingGuru.phone || '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-[#590231] font-black uppercase tracking-wider block mb-1">Alternate Phone</span>
                    <span className="text-gray-900 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {viewingGuru.alternate_phone || '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#590231] font-black uppercase tracking-wider block mb-1">Official Email</span>
                    <span className="text-gray-900 font-bold flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
                      <span className="truncate">{viewingGuru.email || `${viewingGuru.full_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@laasyaacademy.com`}</span>
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-[#590231] font-black uppercase tracking-wider block mb-1">Age</span>
                    <span className="text-gray-900 font-bold flex items-center gap-1.5">
                      {viewingGuru.age ? `${viewingGuru.age} Years` : '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-[#590231] font-black uppercase tracking-wider block mb-1">Gender</span>
                    <span className="text-gray-900 font-bold capitalize flex items-center gap-1.5">
                      {viewingGuru.gender || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: BIO & ARTISTIC LINEAGE */}
              <div>
                <span className="text-xs font-black text-[#590231] uppercase tracking-wide block mb-1.5">
                  Bio &amp; Artistic Lineage
                </span>
                <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4] text-xs text-gray-800 font-semibold leading-relaxed">
                  {viewingGuru.bio || 'Revered faculty member dedicated to classical arts instruction, student mentoring, and performance coaching.'}
                </div>
              </div>

              {/* SECTION 3: ASSIGNED DISCIPLINES */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-[#590231] uppercase tracking-wide">
                    Assigned Courses &amp; Disciplines ({viewingGuru.specializations?.length || 0})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 bg-white border border-[#F0D5E4] rounded-2xl">
                  {viewingGuru.specializations && viewingGuru.specializations.length > 0 ? (
                    viewingGuru.specializations.map((spec, i) => (
                      <span
                        key={i}
                        className="text-xs font-semibold bg-[#FFF2F8] text-[#8A064D] border border-rose-200 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#8A064D]" />
                        <span>{spec}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No courses currently tagged</span>
                  )}
                </div>
              </div>

              {/* SECTION 4: BATCH DETAILS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#2D041A] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Assigned Batch Details</span>
                  </span>
                  <span className="text-[10px] font-bold bg-[#8A064D] text-white px-2.5 py-0.5 rounded-full">
                    {getGuruBatches(viewingGuru).length} Batches
                  </span>
                </div>

                {(() => {
                  const guruBatches = getGuruBatches(viewingGuru);

                  if (guruBatches.length === 0) {
                    return (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                        <p className="text-xs text-gray-500">No active batches assigned to this Guru yet.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {guruBatches.map(b => (
                        <div key={b.id} className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs shadow-2xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#2D041A]">{b.name}</span>
                              <span className="text-[10px] bg-[#FFF2F8] text-[#8A064D] font-semibold px-2 py-0.5 rounded-md border border-rose-100">
                                {b.course_title}
                              </span>
                            </div>
                            <div className="text-gray-500 text-[11px] flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#8A064D]" />
                                {Array.isArray(b.days_of_week) ? b.days_of_week.join(', ') : b.days_of_week}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}
                              </span>
                              <span className="flex items-center gap-1">
                                <DoorOpen className="w-3 h-3 text-gray-400" />
                                {b.room_or_hall}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                            {b.enrolled_count || 0} / {b.max_capacity} Seats
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Actions Footer: Delete Guru, Edit Guru, Close */}
            <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-5">
              <button
                type="button"
                onClick={() => setDeletingGuru(viewingGuru)}
                className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Guru</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingGuru(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const g = viewingGuru;
                    setViewingGuru(null);
                    openEditModal(g);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#70043E] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-[#8A064D] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. DELETE GURU CONFIRMATION MODAL */}
      {/* =================================================================== */}
      {deletingGuru && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-200">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Delete Revered Guru</h3>
                <p className="text-xs text-gray-500">Confirm permanent faculty removal</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Are you sure you want to delete Guru <strong className="text-gray-900">{deletingGuru.full_name}</strong>? All assigned weekly class schedules and faculty records will be removed.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingGuru(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteGuru}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{saving ? 'Deleting...' : 'Confirm Delete Guru'}</span>
              </button>
            </div>
          </div>
        </div>
      )}





      {/* =================================================================== */}
      {/* 5. FULL TIMETABLE MODAL */}
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
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-[#8A064D] hover:text-[#590231] border border-rose-200 flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
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

      {/* =================================================================== */}
      {/* FULLSCREEN IMAGE LIGHTBOX VIEWER */}
      {/* =================================================================== */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-80 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          {/* Top Bar with title and close button */}
          <div 
            className="w-full max-w-4xl flex items-center justify-between pb-3 text-white mb-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-[#F9E33A]">{lightboxImage.title}</span>
              <span className="text-xs text-gray-400 font-medium">(Full Resolution Portrait)</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-white/20"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>

          {/* Full Image Container */}
          <div 
            className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>

          <p className="text-xs text-white/50 mt-3 font-medium">
            Click anywhere outside or press Close to dismiss
          </p>
        </div>
      )}

    </div>
  );
}

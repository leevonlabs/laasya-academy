'use client';

import React, { useState } from 'react';
import { Course } from '@/lib/academy';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2,
  Eye,
  Calendar, 
  IndianRupee, 
  Check, 
  X,
  BookOpen,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  Award
} from 'lucide-react';

const COURSE_GURUS_MAP: Record<string, string> = {
  'Bharathanatyam': 'Smt. Anusha Sumesh (Founder & Guru)',
  'Kuchupudi': 'Guru Pramod T. Peethambaran',
  'Mohiniyatam': 'Guru Sruthy Ramesh',
  'Semi Classical': 'Guru Nandhana (Nandana Krishna)',
  'Western Dance': 'Guru Karthik R (Dhee / DKD)',
  'Zumba': 'Guru Ranjith Kumar S J',
  'Gymnastic': 'Guru Ranjith Kumar S J',
  'Carnatic Music': 'Shri H. Manikandan (Sangeetha Acharya)',
  'Violin': 'Guru Amos P Ovung (Director)',
  'Keyboard': 'Guru Shahil Patro (Trinity / RSL)',
  'Guitar': 'Guru Amos P Ovung (Director)',
  'Ukulele': 'Guru Shahil Patro',
  'Drawing': 'Guru Dipayan Sarkar (MFA Santiniketan)',
  'Art and Craft': 'Guru Dipayan Sarkar',
  'Kalari': 'Guru Vrushabh Prakash Owhal',
  'Karatte': 'Sensei Vijay Kumar Olekar (2nd Dan)',
  'Yoga': 'Acharya Sathish Kale (Yoga Acharya)',
  'Chess': 'Coach Sai Krishna (State Medalist)',
};

interface Props {
  initialCourses: Course[];
}

export default function CourseListClient({ initialCourses }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dynamic categories list
  const initialCategoryList = Array.from(new Set([
    'Classical Dance',
    'Modern Dance & Fitness',
    'Vocal & Music',
    'Musical Instruments',
    'Martial Arts',
    'Fine Arts',
    'Mind Sports',
    ...initialCourses.map(c => c.category).filter(Boolean)
  ]));
  const [categories, setCategories] = useState<string[]>(initialCategoryList);

  // View Details Modal State
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  // Edit Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editFee, setEditFee] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(12);
  const [editDesc, setEditDesc] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isEditingNewCategory, setIsEditingNewCategory] = useState(false);
  const [customEditCategory, setCustomEditCategory] = useState('');

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('Classical Dance');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [customNewCategory, setCustomNewCategory] = useState('');
  const [newFee, setNewFee] = useState(2000);
  const [newDuration, setNewDuration] = useState(12);
  const [newDesc, setNewDesc] = useState('');

  // Delete Modal State
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Status/feedback
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Helper to generate next unique code
  const generateNextCourseCode = (courseList: Course[]) => {
    const codes = courseList.map(c => c.code).filter(Boolean);
    let maxNum = 0;
    for (const c of codes) {
      const match = c.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = Math.max(maxNum + 1, courseList.length + 1);
    return `LCA-CRS-${String(nextNum).padStart(3, '0')}`;
  };

  const openAddModal = () => {
    setNewTitle('');
    setNewCode(generateNextCourseCode(courses));
    setNewCategory(categories[0] || 'Classical Dance');
    setIsCreatingNewCategory(false);
    setCustomNewCategory('');
    setNewFee(2000);
    setNewDuration(12);
    setNewDesc('');
    setIsAddOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditCode(course.code);
    setEditCategory(course.category);
    setEditFee(Number(course.monthly_fee));
    setEditDuration(course.duration_months);
    setEditDesc(course.description || '');
    setEditIsActive(course.is_active ?? true);
    setIsEditingNewCategory(false);
    setCustomEditCategory('');
  };

  const handleSaveNewCategory = (mode: 'add' | 'edit') => {
    const catName = mode === 'add' ? customNewCategory.trim() : customEditCategory.trim();
    if (!catName) return;
    if (!categories.includes(catName)) {
      setCategories(prev => [...prev, catName]);
    }
    if (mode === 'add') {
      setNewCategory(catName);
      setIsCreatingNewCategory(false);
      setCustomNewCategory('');
    } else {
      setEditCategory(catName);
      setIsEditingNewCategory(false);
      setCustomEditCategory('');
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalCategory = isCreatingNewCategory && customNewCategory.trim() 
        ? customNewCategory.trim() 
        : newCategory;

      if (isCreatingNewCategory && customNewCategory.trim() && !categories.includes(customNewCategory.trim())) {
        setCategories(prev => [...prev, customNewCategory.trim()]);
      }

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          code: newCode.trim().toUpperCase(),
          category: finalCategory,
          monthly_fee: Number(newFee),
          duration_months: Number(newDuration),
          description: newDesc.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create course');
      }

      const added: Course = await res.json();
      setCourses(prev => [...prev, { ...added, batch_count: 0 }]);
      setIsAddOpen(false);
      showFeedback('success', `Course "${added.title}" (${added.code}) created successfully!`);
    } catch (e: any) {
      showFeedback('error', e.message || 'Error creating course');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setSaving(true);

    try {
      const finalCategory = isEditingNewCategory && customEditCategory.trim()
        ? customEditCategory.trim()
        : editCategory;

      if (isEditingNewCategory && customEditCategory.trim() && !categories.includes(customEditCategory.trim())) {
        setCategories(prev => [...prev, customEditCategory.trim()]);
      }

      const res = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCourse.id,
          title: editTitle.trim(),
          code: editCode.trim().toUpperCase(),
          category: finalCategory,
          monthly_fee: Number(editFee),
          duration_months: Number(editDuration),
          description: editDesc.trim(),
          is_active: editIsActive
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update course');
      }

      const updated = await res.json();
      setCourses(prev =>
        prev.map(c =>
          c.id === editingCourse.id
            ? {
                ...c,
                title: editTitle.trim(),
                code: editCode.trim().toUpperCase(),
                category: finalCategory,
                monthly_fee: Number(editFee),
                duration_months: Number(editDuration),
                description: editDesc.trim(),
                is_active: editIsActive
              }
            : c
        )
      );

      if (viewingCourse && viewingCourse.id === editingCourse.id) {
        setViewingCourse({
          ...viewingCourse,
          title: editTitle.trim(),
          code: editCode.trim().toUpperCase(),
          category: finalCategory,
          monthly_fee: Number(editFee),
          duration_months: Number(editDuration),
          description: editDesc.trim(),
          is_active: editIsActive
        });
      }

      setEditingCourse(null);
      showFeedback('success', `Course "${editTitle}" updated successfully!`);
    } catch (e: any) {
      showFeedback('error', e.message || 'Error updating course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/courses?id=${deletingCourse.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete course');
      }

      setCourses(prev => prev.filter(c => c.id !== deletingCourse.id));
      if (viewingCourse && viewingCourse.id === deletingCourse.id) {
        setViewingCourse(null);
      }
      showFeedback('success', `Course "${deletingCourse.title}" deleted successfully.`);
      setDeletingCourse(null);
    } catch (e: any) {
      showFeedback('error', e.message || 'Error deleting course');
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

      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Course Catalog & Curriculum</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-semibold">
              {courses.length} Disciplines
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage course disciplines, duration, curriculum, categories, and monthly fees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search course by name, code, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-[#F0D5E4] rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
            />
          </div>

          <button
            onClick={openAddModal}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#F9E33A]/50'
              : 'bg-white text-gray-600 border border-[#F0D5E4] hover:bg-gray-50'
          }`}
        >
          All Categories ({courses.length})
        </button>
        {categories.map((cat) => {
          const count = courses.filter(c => c.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#F9E33A]/50'
                  : 'bg-white text-gray-600 border border-[#F0D5E4] hover:bg-gray-50'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs hover:shadow-md hover:border-[#8A064D]/50 transition flex flex-col justify-between group"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono font-bold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg">
                  {c.code}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full">
                    {c.category}
                  </span>
                  {c.is_active === false && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-[#2D041A] group-hover:text-[#8A064D] transition">
                {c.title}
              </h3>

              {/* Assigned Guru Badge */}
              <div className="mt-2 py-1.5 px-3 rounded-xl bg-[#FFF9FB] border border-rose-100 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#8A064D]">Assigned Guru</span>
                <span className="text-xs font-bold text-gray-800 truncate ml-2">
                  {COURSE_GURUS_MAP[c.title] || 'Senior Faculty Guru'}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 mt-2.5 line-clamp-2 leading-relaxed">
                {c.description || 'Comprehensive training syllabus developed for beginner to advanced learners.'}
              </p>
            </div>

            {/* Bottom Meta & Action Buttons */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Monthly Fee</span>
                <span className="text-base font-bold text-[#8A064D] flex items-center">
                  ₹{Number(c.monthly_fee).toLocaleString('en-IN')}
                  <span className="text-[10px] font-normal text-gray-400 ml-1">/ mo</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* View Details Button */}
                <button
                  onClick={() => setViewingCourse(c)}
                  title="View Complete Course Details"
                  className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-[#8A064D] hover:text-white text-gray-700 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => openEditModal(c)}
                  title="Edit Course Details"
                  className="p-1.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] hover:bg-[#8A064D] hover:text-white text-[#8A064D] transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => setDeletingCourse(c)}
                  title="Delete Course"
                  className="p-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-rose-600 hover:text-white text-gray-400 hover:border-rose-600 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* ================================================================= */}
      {/* 1. VIEW DETAILS MODAL */}
      {/* ================================================================= */}
      {viewingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#8A064D] bg-[#FFF2F8] px-2 py-0.5 rounded-md border border-rose-100">
                  {viewingCourse.code}
                </span>
                <h3 className="font-bold text-lg text-[#2D041A] mt-1">{viewingCourse.title}</h3>
                <span className="text-xs text-gray-500">{viewingCourse.category}</span>
              </div>
              <button
                onClick={() => setViewingCourse(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Highlight Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Monthly Fee</span>
                  <span className="text-lg font-bold text-[#8A064D] mt-0.5 flex items-center">
                    ₹{Number(viewingCourse.monthly_fee).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-gray-500 ml-1">/ month</span>
                  </span>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Course Duration</span>
                  <span className="text-lg font-bold text-gray-800 mt-0.5 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#8A064D]" />
                    <span>{viewingCourse.duration_months} Months</span>
                  </span>
                </div>
              </div>

              {/* Guru & Batches Info */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-500">Assigned Faculty Guru</span>
                  <span className="font-bold text-gray-900">{COURSE_GURUS_MAP[viewingCourse.title] || 'Senior Faculty'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-500">Active Batches</span>
                  <span className="font-bold text-[#8A064D] bg-[#FFF2F8] px-2 py-0.5 rounded-md">
                    {viewingCourse.batch_count || 1} Batch{(viewingCourse.batch_count || 1) > 1 ? 'es' : ''} Running
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-500">Status</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                    viewingCourse.is_active !== false 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {viewingCourse.is_active !== false ? 'Active & Open for Admission' : 'Suspended'}
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <label className="text-xs font-bold text-[#2D041A] block mb-1.5">
                  Complete Course Syllabus & Description
                </label>
                <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed max-h-40 overflow-y-auto">
                  {viewingCourse.description || 'No detailed syllabus text provided.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const c = viewingCourse;
                    setViewingCourse(null);
                    setDeletingCourse(c);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Course</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingCourse(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const c = viewingCourse;
                      setViewingCourse(null);
                      openEditModal(c);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Course Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. EDIT COURSE MODAL (Allows editing ALL details including code) */}
      {/* ================================================================= */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Edit Course: {editingCourse.title}</h3>
                <p className="text-xs text-gray-500">Edit all course parameters, syllabus, code, and pricing.</p>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Course Code <span className="text-[10px] text-[#8A064D]">(Editable)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Category Dropdown + Add New Option */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                {!isEditingNewCategory ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsEditingNewCategory(true);
                        } else {
                          setEditCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__NEW__">➕ Create and Save New Category...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter new category name..."
                      value={customEditCategory}
                      onChange={(e) => setCustomEditCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#8A064D] rounded-xl text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNewCategory('edit')}
                      className="px-3 py-2 bg-[#8A064D] text-white rounded-xl text-xs font-semibold whitespace-nowrap"
                    >
                      Save Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingNewCategory(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monthly Fee (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editFee}
                    onChange={(e) => setEditFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Course Description & Curriculum Details
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-700">Course Active Status</span>
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
                  onClick={() => setEditingCourse(null)}
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
      {/* 3. ADD NEW COURSE MODAL */}
      {/* ================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Add New Academy Course</h3>
                <p className="text-xs text-gray-500">Unique course code generated automatically.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathak Classical"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Course Code <span className="text-[10px] text-emerald-600 font-normal">(Auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Category Dropdown + Add New Option */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                {!isCreatingNewCategory ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingNewCategory(true);
                        } else {
                          setNewCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__NEW__">➕ Create and Save New Category...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type new category (e.g. Heritage Crafts)..."
                      value={customNewCategory}
                      onChange={(e) => setCustomNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#8A064D] rounded-xl text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNewCategory('add')}
                      className="px-3 py-2 bg-[#8A064D] text-white rounded-xl text-xs font-semibold whitespace-nowrap"
                    >
                      Save Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCategory(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newFee}
                    onChange={(e) => setNewFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Description & Curriculum</label>
                <textarea
                  rows={3}
                  placeholder="Complete description of the course syllabus, target age, prerequisites..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
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
                  {saving ? 'Creating Course...' : 'Save & Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. DELETE CONFIRMATION MODAL */}
      {/* ================================================================= */}
      {deletingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#2D041A]">Confirm Course Deletion</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">{deletingCourse.title}</strong> ({deletingCourse.code})? 
              This will remove all associated batches and class session records under this course.
            </p>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteCourse}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting...' : 'Yes, Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

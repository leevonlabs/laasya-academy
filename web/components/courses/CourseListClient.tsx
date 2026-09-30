'use client';

import React, { useState } from 'react';
import { Course } from '@/lib/academy';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Edit3, 
  Calendar, 
  IndianRupee, 
  Check, 
  X,
  BookOpen
} from 'lucide-react';

interface Props {
  initialCourses: Course[];
}

export default function CourseListClient({ initialCourses }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Edit Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editFee, setEditFee] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(12);
  const [editDesc, setEditDesc] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('Classical Dance');
  const [newFee, setNewFee] = useState(2000);
  const [newDuration, setNewDuration] = useState(12);
  const [newDesc, setNewDesc] = useState('');

  const categories = [
    'All',
    'Classical Dance',
    'Modern Dance & Fitness',
    'Vocal & Music',
    'Musical Instruments',
    'Martial Arts',
    'Fine Arts',
    'Mind Sports'
  ];

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setEditFee(Number(course.monthly_fee));
    setEditDuration(course.duration_months);
    setEditDesc(course.description || '');
  };

  const saveEdit = async () => {
    if (!editingCourse) return;
    setSaving(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCourse.id,
          monthly_fee: editFee,
          duration_months: editDuration,
          description: editDesc
        })
      });

      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id
              ? { ...c, monthly_fee: editFee, duration_months: editDuration, description: editDesc }
              : c
          )
        );
        setEditingCourse(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          code: newCode,
          category: newCategory,
          monthly_fee: newFee,
          duration_months: newDuration,
          description: newDesc
        })
      });

      if (res.ok) {
        const added = await res.json();
        setCourses((prev) => [...prev, added]);
        setIsAddOpen(false);
        setNewTitle('');
        setNewCode('');
        setNewDesc('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Course Catalog</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-semibold">
              {courses.length} Disciplines
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage course disciplines, duration, curriculum, and monthly fees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search course by name or code..."
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
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#F9E33A]/50'
                : 'bg-white text-gray-600 border border-[#F0D5E4] hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-5 border border-[#F0D5E4] shadow-sm hover:shadow-md hover:border-[#8A064D]/40 transition flex flex-col justify-between group"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono font-bold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-lg">
                  {c.code}
                </span>
                <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full">
                  {c.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-[#2D041A] group-hover:text-[#8A064D] transition">
                {c.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                {c.description || 'Comprehensive training program tailored for beginner to advanced learners.'}
              </p>
            </div>

            {/* Bottom Meta & Edit Button */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Monthly Fee</span>
                <span className="text-base font-bold text-[#8A064D] flex items-center">
                  ₹{Number(c.monthly_fee).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Duration</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {c.duration_months} Months
                  </span>
                </div>

                <button
                  onClick={() => openEdit(c)}
                  title="Edit Course Fee & Info"
                  className="p-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] hover:bg-[#8A064D] hover:text-white text-[#8A064D] transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Edit Course: {editingCourse.title}</h3>
                <span className="text-xs font-mono text-[#8A064D]">{editingCourse.code} • {editingCourse.category}</span>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Monthly Fee (INR ₹)
                </label>
                <input
                  type="number"
                  value={editFee}
                  onChange={(e) => setEditFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Course Duration (Months)
                </label>
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Course Description & Highlights
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveEdit}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Course Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Add New Academy Course</h3>
                <p className="text-xs text-gray-500">Introduce a new art form or discipline to the academy roster.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathak Dance"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LCA-KT02"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={newFee}
                    onChange={(e) => setNewFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Mos)</label>
                  <input
                    type="number"
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Course syllabus, technique details and target learners..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
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
                  {saving ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

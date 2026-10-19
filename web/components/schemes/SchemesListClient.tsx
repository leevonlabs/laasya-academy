'use client';

import React, { useState, useMemo } from 'react';
import { Scheme, Course, Batch } from '@/lib/academy';
import CourseMultiSearchSelect from '@/components/common/CourseMultiSearchSelect';
import BatchMultiSearchSelect from '@/components/common/BatchMultiSearchSelect';
import AiEnhanceButton from '@/components/common/AiEnhanceButton';
import {
  Sparkles,
  Plus,
  Search,
  Check,
  X,
  Edit3,
  Trash2,
  Filter,
  Layers,
  BookOpen,
  Calendar,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  RotateCcw,
  Tag,
  Percent,
  CheckSquare,
  Square,
  Eye
} from 'lucide-react';

interface Props {
  initialSchemes: Scheme[];
  courses: Course[];
  batches: Batch[];
}

export default function SchemesListClient({ initialSchemes, courses, batches }: Props) {
  const [schemes, setSchemes] = useState<Scheme[]>(initialSchemes);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [viewingScheme, setViewingScheme] = useState<Scheme | null>(null);
  const [deletingScheme, setDeletingScheme] = useState<Scheme | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCourseIds, setFormCourseIds] = useState<string[]>([]);
  const [formBatchIds, setFormBatchIds] = useState<string[]>([]);
  const [formTotalMonthlyFee, setFormTotalMonthlyFee] = useState<number | string>(0);
  const [formFixedDiscount, setFormFixedDiscount] = useState<number | string>(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick lookup maps
  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses]);
  const batchMap = useMemo(() => new Map(batches.map(b => [b.id, b])), [batches]);

  // Options for multi-selects
  const courseOptions = useMemo(() => {
    return courses.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category
    }));
  }, [courses]);

  const batchOptions = useMemo(() => {
    // If courses are selected in the form, prioritize/filter batches belonging to those courses
    // otherwise show all batches
    const list = formCourseIds.length > 0
      ? batches.filter(b => formCourseIds.includes(b.course_id))
      : batches;

    return list.map(b => {
      const parent = courseMap.get(b.course_id);
      return {
        id: b.id,
        name: `${b.name} (₹${b.monthly_fee || 0}/mo)`,
        course_id: b.course_id,
        course_title: parent?.title || ''
      };
    });
  }, [batches, formCourseIds, courseMap]);

  // Auto-calculation of sum of monthly fees for selected batches
  const calculatedBatchesSum = useMemo(() => {
    return formBatchIds.reduce((acc, bId) => {
      const b = batchMap.get(bId);
      return acc + (Number(b?.monthly_fee) || 0);
    }, 0);
  }, [formBatchIds, batchMap]);

  // Handle batch selection changes with auto-updating default total monthly fee
  const handleFormBatchesChange = (newBatchIds: string[]) => {
    setFormBatchIds(newBatchIds);

    // Auto-compute total monthly fee
    const newSum = newBatchIds.reduce((acc, bId) => {
      const b = batchMap.get(bId);
      return acc + (Number(b?.monthly_fee) || 0);
    }, 0);
    setFormTotalMonthlyFee(newSum);

    // Also auto-add parent courses of selected batches to formCourseIds if not present
    const associatedCourseIds = new Set(formCourseIds);
    newBatchIds.forEach(bId => {
      const b = batchMap.get(bId);
      if (b?.course_id) {
        associatedCourseIds.add(b.course_id);
      }
    });
    setFormCourseIds(Array.from(associatedCourseIds));
  };

  // Open Create Modal with clean blank state
  const handleOpenCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormCourseIds([]);
    setFormBatchIds([]);
    setFormTotalMonthlyFee(0);
    setFormFixedDiscount(0);
    setFormIsActive(true);
    setFormError('');
    setIsCreateOpen(true);
  };

  // Open Edit Modal with existing scheme data
  const handleOpenEdit = (scheme: Scheme) => {
    setEditingScheme(scheme);
    setFormName(scheme.name || '');
    setFormDescription(scheme.description || '');
    setFormCourseIds(Array.isArray(scheme.course_ids) ? scheme.course_ids : []);
    setFormBatchIds(Array.isArray(scheme.batch_ids) ? scheme.batch_ids : []);
    setFormTotalMonthlyFee(Number(scheme.total_monthly_fee) || 0);
    setFormFixedDiscount(Number(scheme.fixed_discount) || 0);
    setFormIsActive(scheme.is_active !== false);
    setFormError('');
    setIsEditOpen(true);
  };

  // Quick Toggle Active / Inactive
  const handleToggleStatus = async (scheme: Scheme, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !scheme.is_active;

    // Optimistic UI update
    setSchemes(prev => prev.map(s => s.id === scheme.id ? { ...s, is_active: newStatus } : s));

    try {
      const res = await fetch('/api/schemes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scheme.id, is_active: newStatus })
      });
      if (!res.ok) {
        // Revert on error
        setSchemes(prev => prev.map(s => s.id === scheme.id ? { ...s, is_active: scheme.is_active } : s));
      }
    } catch {
      setSchemes(prev => prev.map(s => s.id === scheme.id ? { ...s, is_active: scheme.is_active } : s));
    }
  };

  // Submit Create Scheme
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter a scheme name');
      return;
    }
    if (formCourseIds.length === 0 && formBatchIds.length === 0) {
      setFormError('Please select at least one course or batch for the scheme');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        course_ids: formCourseIds,
        batch_ids: formBatchIds,
        total_monthly_fee: Number(formTotalMonthlyFee) || 0,
        fixed_discount: Number(formFixedDiscount) || 0,
        is_active: formIsActive
      };

      const res = await fetch('/api/schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create scheme');
      }

      const createdScheme = await res.json();
      setSchemes(prev => [createdScheme, ...prev]);
      setIsCreateOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Scheme
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheme) return;
    if (!formName.trim()) {
      setFormError('Please enter a scheme name');
      return;
    }
    if (formCourseIds.length === 0 && formBatchIds.length === 0) {
      setFormError('Please select at least one course or batch for the scheme');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      const payload = {
        id: editingScheme.id,
        name: formName.trim(),
        description: formDescription.trim(),
        course_ids: formCourseIds,
        batch_ids: formBatchIds,
        total_monthly_fee: Number(formTotalMonthlyFee) || 0,
        fixed_discount: Number(formFixedDiscount) || 0,
        is_active: formIsActive
      };

      const res = await fetch('/api/schemes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update scheme');
      }

      const updatedScheme = await res.json();
      setSchemes(prev => prev.map(s => s.id === updatedScheme.id ? updatedScheme : s));
      setIsEditOpen(false);
      setEditingScheme(null);
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingScheme) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/schemes?id=${deletingScheme.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete scheme');
      }
      setSchemes(prev => prev.filter(s => s.id !== deletingScheme.id));
      setDeletingScheme(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete scheme');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered schemes list
  const filteredSchemes = useMemo(() => {
    return schemes.filter(s => {
      // 1. Status Filter
      if (statusFilter === 'active' && !s.is_active) return false;
      if (statusFilter === 'inactive' && s.is_active) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDesc = s.description?.toLowerCase().includes(q);
        const matchesCourses = (s.course_ids || []).some(cId => {
          const c = courseMap.get(cId);
          return c?.title.toLowerCase().includes(q);
        });
        const matchesBatches = (s.batch_ids || []).some(bId => {
          const b = batchMap.get(bId);
          return b?.name.toLowerCase().includes(q);
        });
        if (!matchesName && !matchesDesc && !matchesCourses && !matchesBatches) return false;
      }

      return true;
    });
  }, [schemes, statusFilter, searchQuery, courseMap, batchMap]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#590231] text-[#F9E33A] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-[#2D041A]">Combo Schemes & Packages</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Group multiple courses and batches into packaged schemes with bundled monthly pricing and fixed monthly discounts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#8A064D] hover:bg-[#590231] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer hover:shadow-md"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Create New Scheme</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search schemes by name, course, batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500 text-[11px] uppercase tracking-wider font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Schemes</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer px-2 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium shrink-0 self-center">
          Showing <strong className="text-gray-800">{filteredSchemes.length}</strong> of {schemes.length} Schemes
        </div>
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#F0D5E4] p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No schemes found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {schemes.length === 0
              ? 'Get started by creating your first combo scheme with multi-course and batch packages.'
              : 'Try clearing your search query or changing the status filter.'}
          </p>
          {schemes.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#8A064D] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#590231] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F9E33A]" />
              <span>Create First Scheme</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => {
            const schemeCourses = (scheme.course_ids || []).map(id => courseMap.get(id)).filter(Boolean) as Course[];
            const schemeBatches = (scheme.batch_ids || []).map(id => batchMap.get(id)).filter(Boolean) as Batch[];
            const totalMonthly = Number(scheme.total_monthly_fee) || 0;
            const fixedDiscount = Number(scheme.fixed_discount) || 0;
            const netAmount = Math.max(0, totalMonthly - fixedDiscount);
            const savingsPercent = totalMonthly > 0 ? Math.round((fixedDiscount / totalMonthly) * 100) : 0;

            return (
              <div
                key={scheme.id}
                className={`bg-white rounded-3xl p-6 sm:p-7 border-2 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  scheme.is_active
                    ? 'border-emerald-500/80 hover:border-emerald-500'
                    : 'border-rose-400/80 hover:border-rose-400'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Scheme Name + Active Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-100 mb-1.5 inline-block">
                        Combo Scheme
                      </span>
                      <h3 className="text-lg font-black text-[#2D041A] tracking-tight">
                        {scheme.name}
                      </h3>
                      {scheme.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {scheme.description}
                        </p>
                      )}
                    </div>

                    {/* Active / Inactive Status Badge & Quick Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(scheme, e)}
                      title={`Click to switch to ${scheme.is_active ? 'Inactive' : 'Active'}`}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
                        scheme.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${scheme.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{scheme.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>

                  {/* Bundled Courses & Batches Badges */}
                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Bundled Courses ({schemeCourses.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                        {schemeCourses.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">No specific courses</span>
                        ) : (
                          schemeCourses.map(c => (
                            <span
                              key={c.id}
                              className="px-2.5 py-0.5 rounded-lg bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] text-[11px] font-bold"
                            >
                              {c.title}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Bundled Batches ({schemeBatches.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                        {schemeBatches.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">All batches for selected courses</span>
                        ) : (
                          schemeBatches.map(b => (
                            <span
                              key={b.id}
                              className="px-2.5 py-0.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-semibold"
                            >
                              {b.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown Card & Action Buttons */}
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="bg-gradient-to-br from-[#FFF9FB] to-white p-4 rounded-2xl border border-rose-100/80 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Standard Total Fee:</span>
                      <span className="font-semibold line-through text-gray-400">
                        ₹{totalMonthly.toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Fixed Monthly Discount:</span>
                      </span>
                      <span>
                        -₹{fixedDiscount.toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-rose-100">
                      <div>
                        <span className="text-xs font-black text-[#2D041A] block">Net Package Price</span>
                        {savingsPercent > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            Save {savingsPercent}% monthly
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#8A064D] tabular-nums">
                          ₹{netAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-gray-500 block">/ month</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View Details, Edit, Delete */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setViewingScheme(scheme)}
                      className="py-2.5 px-3 bg-[#2D041A] hover:bg-[#48082B] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border border-[#48082B]"
                      title="View Complete Scheme Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(scheme)}
                      className="py-2.5 px-3 bg-[#FFF2F8] hover:bg-[#8A064D] text-[#8A064D] hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[#F0D5E4] cursor-pointer shadow-2xs"
                      title="Edit Scheme"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingScheme(scheme)}
                      className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer shadow-2xs"
                      title="Delete Scheme"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );

          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE SCHEME MODAL */}
      {/* =================================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#590231] text-[#F9E33A]">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#2D041A]">Create New Scheme</h3>
                  <p className="text-xs text-gray-500">Configure combo packages with bundled courses, batches, and discounts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Scheme Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Scheme Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classical Dance & Music Combo (Weekend)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Description with AI Enhance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Scheme Description / Terms</label>
                  <AiEnhanceButton
                    value={formDescription}
                    context={`Scheme Name: ${formName || 'Combo Scheme'}, Courses: ${formCourseIds.map(id => courseMap.get(id)?.title).filter(Boolean).join(', ')}`}
                    onEnhance={(enhanced: string) => setFormDescription(enhanced)}
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Explain eligibility, combo benefits, or terms..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D] focus:bg-white resize-none"
                />
              </div>

              {/* Multi-Select Courses */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Included Courses <span className="text-rose-500">*</span>
                </label>
                <CourseMultiSearchSelect
                  courses={courseOptions}
                  selectedIds={formCourseIds}
                  onChange={setFormCourseIds}
                  placeholder="Choose courses for this scheme..."
                  className="w-full"
                />
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Select all academy courses that are part of this combo scheme.
                </span>
              </div>

              {/* Multi-Select Batches */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Select Included Batches <span className="text-rose-500">*</span>
                  </label>
                  {calculatedBatchesSum > 0 && (
                    <span className="text-[11px] text-[#8A064D] font-bold">
                      Batches Standard Sum: ₹{calculatedBatchesSum}/mo
                    </span>
                  )}
                </div>
                <BatchMultiSearchSelect
                  batches={batchOptions}
                  selectedIds={formBatchIds}
                  onChange={handleFormBatchesChange}
                  placeholder="Choose specific batches for this scheme..."
                  className="w-full"
                />
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Selecting batches will automatically sum their monthly fees into the default combo fee below.
                </span>
              </div>

              {/* Pricing Grid: Combo Monthly Fee & Fixed Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFF9FB] p-4 rounded-2xl border border-rose-100">
                {/* Total Monthly Fee */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">Total Monthly Fee (₹)</label>
                    {Number(formTotalMonthlyFee) !== calculatedBatchesSum && calculatedBatchesSum > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormTotalMonthlyFee(calculatedBatchesSum)}
                        className="text-[10px] text-[#8A064D] font-bold hover:underline cursor-pointer"
                      >
                        Reset to sum (₹{calculatedBatchesSum})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="e.g. 5000"
                      value={formTotalMonthlyFee}
                      onChange={(e) => setFormTotalMonthlyFee(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Combined standard fee of all batches in the combo.
                  </span>
                </div>

                {/* Fixed Monthly Discount */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fixed Monthly Discount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 500"
                      value={formFixedDiscount}
                      onChange={(e) => setFormFixedDiscount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Fixed discount deducted each month for this combo.
                  </span>
                </div>

                {/* Net Combo Payable Banner */}
                <div className="sm:col-span-2 pt-2 border-t border-rose-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#2D041A]">Net Monthly Combo Fee:</span>
                    <span className="text-[11px] text-gray-500 block">Total standard minus fixed combo discount</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#8A064D] tabular-nums">
                      ₹{Math.max(0, (Number(formTotalMonthlyFee) || 0) - (Number(formFixedDiscount) || 0)).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold block">/ month</span>
                  </div>
                </div>
              </div>

              {/* Status Toggle (Active / Inactive) */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Scheme Status</span>
                  <span className="text-[11px] text-gray-500">
                    Active schemes are available for enrollment and discounts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      formIsActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formIsActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{formIsActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#8A064D] hover:bg-[#590231] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Saving Scheme...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#F9E33A]" />
                      <span>Create Scheme</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* EDIT SCHEME MODAL */}
      {/* =================================================================== */}
      {isEditOpen && editingScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#590231] text-[#F9E33A]">
                  <Edit3 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#2D041A]">Edit Scheme: {editingScheme.name}</h3>
                  <p className="text-xs text-gray-500">Update combo packages, courses, batches, and discount structure</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingScheme(null);
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Scheme Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Scheme Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Description with AI Enhance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Scheme Description / Terms</label>
                  <AiEnhanceButton
                    value={formDescription}
                    context={`Scheme Name: ${formName || 'Combo Scheme'}, Courses: ${formCourseIds.map(id => courseMap.get(id)?.title).filter(Boolean).join(', ')}`}
                    onEnhance={(enhanced: string) => setFormDescription(enhanced)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D] focus:bg-white resize-none"
                />
              </div>

              {/* Multi-Select Courses */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Included Courses <span className="text-rose-500">*</span>
                </label>
                <CourseMultiSearchSelect
                  courses={courseOptions}
                  selectedIds={formCourseIds}
                  onChange={setFormCourseIds}
                  placeholder="Select courses..."
                  className="w-full"
                />
              </div>

              {/* Multi-Select Batches */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Included Batches <span className="text-rose-500">*</span>
                  </label>
                  {calculatedBatchesSum > 0 && (
                    <span className="text-[11px] text-[#8A064D] font-bold">
                      Batches Standard Sum: ₹{calculatedBatchesSum}/mo
                    </span>
                  )}
                </div>
                <BatchMultiSearchSelect
                  batches={batchOptions}
                  selectedIds={formBatchIds}
                  onChange={handleFormBatchesChange}
                  placeholder="Select batches..."
                  className="w-full"
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFF9FB] p-4 rounded-2xl border border-rose-100">
                {/* Total Monthly Fee */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">Total Monthly Fee (₹)</label>
                    {Number(formTotalMonthlyFee) !== calculatedBatchesSum && calculatedBatchesSum > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormTotalMonthlyFee(calculatedBatchesSum)}
                        className="text-[10px] text-[#8A064D] font-bold hover:underline cursor-pointer"
                      >
                        Reset to sum (₹{calculatedBatchesSum})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formTotalMonthlyFee}
                      onChange={(e) => setFormTotalMonthlyFee(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>
                </div>

                {/* Fixed Monthly Discount */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fixed Monthly Discount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={formFixedDiscount}
                      onChange={(e) => setFormFixedDiscount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Net Combo Banner */}
                <div className="sm:col-span-2 pt-2 border-t border-rose-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#2D041A]">Net Monthly Combo Fee:</span>
                    <span className="text-[11px] text-gray-500 block">Total standard minus fixed combo discount</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#8A064D] tabular-nums">
                      ₹{Math.max(0, (Number(formTotalMonthlyFee) || 0) - (Number(formFixedDiscount) || 0)).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold block">/ month</span>
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Scheme Status</span>
                  <span className="text-[11px] text-gray-500">Active schemes are available for enrollment</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    formIsActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formIsActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>{formIsActive ? 'Active' : 'Inactive'}</span>
                </button>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingScheme(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#8A064D] hover:bg-[#590231] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Saving Changes...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#F9E33A]" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =================================================================== */}
      {/* SCHEME DETAILS MODAL */}
      {/* =================================================================== */}
      {viewingScheme && (() => {
        const vCourses = (viewingScheme.course_ids || []).map(id => courseMap.get(id)).filter(Boolean) as Course[];
        const vBatches = (viewingScheme.batch_ids || []).map(id => batchMap.get(id)).filter(Boolean) as Batch[];
        const total = Number(viewingScheme.total_monthly_fee) || 0;
        const discount = Number(viewingScheme.fixed_discount) || 0;
        const net = Math.max(0, total - discount);
        const savingsPct = total > 0 ? Math.round((discount / total) * 100) : 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#F0D5E4] space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-100">
                      Combo Scheme Details
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border ${
                      viewingScheme.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${viewingScheme.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{viewingScheme.is_active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#2D041A] tracking-tight">
                    {viewingScheme.name}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingScheme(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              {viewingScheme.description ? (
                <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] space-y-1">
                  <span className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Scheme Description</span>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{viewingScheme.description}</p>
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No description provided for this scheme.
                </div>
              )}

              {/* Included Courses */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#590231] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Included Disciplines &amp; Courses ({vCourses.length})</span>
                  </span>
                </div>
                {vCourses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No courses assigned to this scheme.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vCourses.map(c => (
                      <div key={c.id} className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-[#2D041A] block">{c.title}</span>
                          <span className="text-[10px] text-gray-500">{c.code} • {c.category || 'Classical Arts'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF2F8] text-[#8A064D] border border-rose-100">
                          Course
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Included Batches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#590231] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Bundled Batches &amp; Class Schedules ({vBatches.length})</span>
                  </span>
                </div>
                {vBatches.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No batches bundled in this scheme.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {vBatches.map(b => (
                      <div key={b.id} className="p-3 bg-[#FFF9FB] rounded-xl border border-[#F0D5E4] flex items-center justify-between gap-3 shadow-2xs">
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-[#2D041A] block truncate">{b.name}</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">
                            {b.course_title || 'Course'} • Guru: {b.trainer_name || 'Assigned'}
                          </span>
                          <span className="text-[10px] text-gray-600 block mt-0.5">
                            {b.days_of_week?.join(', ')} • {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)} • Room: {b.room_or_hall || 'Hall'}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black shrink-0 tabular-nums">
                          ₹{Number(b.monthly_fee || 0).toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Breakdown Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF9FB] to-white border border-[#F0D5E4] space-y-2.5">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Combined Standard Fee:</span>
                  <span className="font-bold text-gray-700">₹{total.toLocaleString('en-IN')}/month</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Fixed Monthly Combo Discount:</span>
                  </span>
                  <span>-₹{discount.toLocaleString('en-IN')}/month</span>
                </div>
                <div className="pt-2 border-t border-[#F0D5E4] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-[#2D041A] block">Net Payable Combo Fee:</span>
                    {savingsPct > 0 && (
                      <span className="text-[10.5px] font-bold text-emerald-600">
                        Saves {savingsPct}% every month
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#8A064D] tabular-nums">
                      ₹{net.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-500 block">/ month</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setViewingScheme(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingScheme;
                    setViewingScheme(null);
                    handleOpenEdit(target);
                  }}
                  className="px-5 py-2 bg-[#8A064D] hover:bg-[#590231] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4 text-[#F9E33A]" />
                  <span>Edit This Scheme</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* =================================================================== */}
      {deletingScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Delete Scheme</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to permanently delete the scheme <strong className="text-gray-900">&quot;{deletingScheme.name}&quot;</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingScheme(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Scheme'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

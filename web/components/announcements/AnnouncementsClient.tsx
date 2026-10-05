'use client';

import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  BookOpen, 
  Send, 
  Archive, 
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { Announcement } from '@/lib/announcements';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';

interface Course {
  id: string;
  title: string;
}

interface Batch {
  id: string;
  name: string;
  course_id: string;
}

interface Props {
  initialAnnouncements: Announcement[];
  courses: Course[];
  batches: Batch[];
}

export default function AnnouncementsClient({ initialAnnouncements, courses, batches }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [typeTagFilter, setTypeTagFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image_url: '',
    audience: 'All students' as 'All students' | 'Selected course or batch' | 'Trainers' | 'Chosen recipients',
    target_course_id: '',
    target_course_title: '',
    target_batch_id: '',
    target_batch_name: '',
    type_tag: 'General' as 'Holiday' | 'Schedule change' | 'Cancellation' | 'Fee reminder' | 'General',
    publish_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'Published' as 'Draft' | 'Scheduled' | 'Published' | 'Expired'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-resize uploaded image to fit 2.5:1 mobile banner
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const targetWidth = 800;
        const targetHeight = 320;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const srcRatio = img.width / img.height;
          const targetRatio = targetWidth / targetHeight;
          let sw, sh, sx, sy;
          if (srcRatio > targetRatio) {
            sh = img.height;
            sw = img.height * targetRatio;
            sx = (img.width - sw) / 2;
            sy = 0;
          } else {
            sw = img.width;
            sh = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, image_url: resizedDataUrl }));
          showToast('Image automatically adjusted & scaled to suit app banner size!');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Preview tab inside create/edit modal
  const [activeFormTab, setActiveFormTab] = useState<'edit' | 'preview'>('edit');

  // Toast state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered batches based on selected course in form
  const availableBatches = useMemo(() => {
    if (!formData.target_course_id) return [];
    return batches.filter(b => b.course_id === formData.target_course_id);
  }, [formData.target_course_id, batches]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      if (ann.is_deleted) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ann.title.toLowerCase().includes(q);
        const matchMsg = ann.message.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg) return false;
      }

      if (statusFilter !== 'all' && ann.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      if (audienceFilter !== 'all' && ann.audience !== audienceFilter) {
        return false;
      }

      if (typeTagFilter !== 'all' && ann.type_tag !== typeTagFilter) {
        return false;
      }

      if (startDate && ann.publish_date < startDate) {
        return false;
      }
      if (endDate && ann.publish_date > endDate) {
        return false;
      }

      return true;
    });
  }, [announcements, searchQuery, statusFilter, audienceFilter, typeTagFilter, startDate, endDate]);

  const hasActiveFilters = Boolean(
    searchQuery || 
    statusFilter !== 'all' || 
    audienceFilter !== 'all' || 
    typeTagFilter !== 'all' || 
    startDate || 
    endDate
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setAudienceFilter('all');
    setTypeTagFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      title: '',
      message: '',
      image_url: '',
      audience: 'All students',
      target_course_id: '',
      target_course_title: '',
      target_batch_id: '',
      target_batch_name: '',
      type_tag: 'General',
      publish_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      status: 'Published'
    });
    setFormErrors({});
    setActiveFormTab('edit');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setFormData({
      title: ann.title,
      message: ann.message,
      image_url: ann.image_url || '',
      audience: ann.audience as any,
      target_course_id: ann.target_course_id || '',
      target_course_title: ann.target_course_title || '',
      target_batch_id: ann.target_batch_id || '',
      target_batch_name: ann.target_batch_name || '',
      type_tag: ann.type_tag,
      publish_date: ann.publish_date.split('T')[0],
      expiry_date: ann.expiry_date ? ann.expiry_date.split('T')[0] : '',
      status: ann.status
    });
    setFormErrors({});
    setActiveFormTab('edit');
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.message || !formData.message.trim()) {
      errors.message = 'Message content is required';
    }
    if (!formData.publish_date) {
      errors.publish_date = 'Publish date is required';
    }
    if (formData.audience === 'Selected course or batch' && !formData.target_course_id) {
      errors.target_course_id = 'Please select a target course';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create Announcement
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setActiveFormTab('edit');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCourse = courses.find(c => c.id === formData.target_course_id);
      const selectedBatch = batches.find(b => b.id === formData.target_batch_id);

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_course_title: selectedCourse ? selectedCourse.title : undefined,
          target_batch_name: selectedBatch ? selectedBatch.name : undefined
        })
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => [json.announcement, ...prev]);
        setIsCreateModalOpen(false);
        showToast('Announcement published and dispatched to target audience!');
      } else {
        showToast(json.error || 'Failed to create announcement', 'error');
      }
    } catch {
      showToast('Network error while saving announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Announcement
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement || !validateForm()) {
      setActiveFormTab('edit');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCourse = courses.find(c => c.id === formData.target_course_id);
      const selectedBatch = batches.find(b => b.id === formData.target_batch_id);

      const res = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_course_title: selectedCourse ? selectedCourse.title : undefined,
          target_batch_name: selectedBatch ? selectedBatch.name : undefined
        })
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => prev.map(item => item.id === editingAnnouncement.id ? json.announcement : item));
        setEditingAnnouncement(null);
        showToast('Announcement updated successfully!');
      } else {
        showToast(json.error || 'Failed to update announcement', 'error');
      }
    } catch {
      showToast('Network error while updating announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate Announcement
  const handleDuplicate = async (ann: Announcement) => {
    try {
      const res = await fetch(`/api/announcements/${ann.id}/duplicate`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => [json.announcement, ...prev]);
        showToast(`Duplicated as Draft: "${json.announcement.title}"`);
      } else {
        showToast(json.error || 'Failed to duplicate', 'error');
      }
    } catch {
      showToast('Network error while duplicating', 'error');
    }
  };

  // Unpublish Announcement
  const handleUnpublish = async (ann: Announcement) => {
    try {
      const res = await fetch(`/api/announcements/${ann.id}/unpublish`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => prev.map(item => item.id === ann.id ? json.announcement : item));
        showToast('Announcement unpublished and set to Draft');
      } else {
        showToast(json.error || 'Failed to unpublish', 'error');
      }
    } catch {
      showToast('Network error while unpublishing', 'error');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingAnnouncement) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/announcements/${deletingAnnouncement.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setAnnouncements(prev => prev.filter(item => item.id !== deletingAnnouncement.id));
        setDeletingAnnouncement(null);
        showToast('Announcement deleted.');
      } else {
        showToast(json.error || 'Failed to delete announcement', 'error');
      }
    } catch {
      showToast('Network error while deleting', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            Published
          </span>
        );
      case 'Scheduled':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
            Scheduled
          </span>
        );
      case 'Draft':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-gray-100 text-gray-700 border border-gray-300">
            Draft
          </span>
        );
      case 'Expired':
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            Expired
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Helper for Type Tag Badge styling
  const renderTypeTagBadge = (tag: string) => {
    switch (tag) {
      case 'Holiday':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
            Holiday
          </span>
        );
      case 'Schedule change':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">
            Schedule change
          </span>
        );
      case 'Cancellation':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-red-100 text-red-900 border border-red-300">
            Cancellation
          </span>
        );
      case 'Fee reminder':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-[#FEF9C3] text-[#854D0E] border border-[#F9E33A]">
            Fee reminder
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">
            General
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-white transition-all transform animate-in slide-in-from-bottom duration-300 ${
          toastMessage.type === 'success' ? 'bg-[#590231] border-[#F9E33A] text-white' : 'bg-red-700 border-red-400'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-[#F9E33A] shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-white shrink-0" />
          )}
          <span className="font-bold text-sm tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#590231] tracking-tight">
              Announcements & Circulars
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              Send clear notices to students and trainers: holidays, schedule changes, cancellations and fee reminders
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#8A064D] hover:bg-[#590231] text-white font-black text-base shadow-lg hover:shadow-xl transition-all border border-[#F9E33A]/60 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 text-[#F9E33A]" />
          <span>Create Announcement</span>
        </button>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements by title or content..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Audience Filter */}
          <div>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            >
              <option value="all">All Audiences</option>
              <option value="All students">All students</option>
              <option value="Selected course or batch">Selected course or batch</option>
              <option value="Trainers">Trainers</option>
              <option value="Chosen recipients">Chosen recipients</option>
            </select>
          </div>

        </div>

        {/* Date and Type Tag Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0D5E4]/60">
          
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Tag Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8A064D] uppercase">Type:</span>
              <select
                value={typeTagFilter}
                onChange={(e) => setTypeTagFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
              >
                <option value="all">All Types</option>
                <option value="Holiday">Holiday</option>
                <option value="Schedule change">Schedule change</option>
                <option value="Cancellation">Cancellation</option>
                <option value="Fee reminder">Fee reminder</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Date Range Quick Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8A064D] uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date:
              </span>
              <DateRangeQuickFilter
                startDate={startDate}
                endDate={endDate}
                align="left"
                onApply={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                placeholder="Select Publish Date Range"
              />
            </div>

          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-[#8A064D] text-xs font-black transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}

        </div>

      </div>

      {/* Announcements List Grid / History Cards */}
      <div className="space-y-4">
        
        {filteredAnnouncements.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-[#F0D5E4] p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
              <Megaphone className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-black text-[#590231]">
                {hasActiveFilters 
                  ? 'No announcements match the selected filters.' 
                  : 'No announcements yet. Create your first announcement.'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {hasActiveFilters 
                  ? 'Clear your filters to view past notices and circulars.' 
                  : 'Notify parents, students, and gurus about upcoming events, timings, holidays or reminders.'}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-[#8A064D] text-white text-xs font-bold hover:bg-[#590231] transition"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={openCreateModal}
                className="px-6 py-3 rounded-2xl bg-[#8A064D] text-white text-sm font-bold hover:bg-[#590231] shadow-md transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#F9E33A]" />
                <span>Create your first announcement</span>
              </button>
            )}
          </div>
        ) : (
          filteredAnnouncements.map((ann) => {
            const pubDateStr = ann.publish_date 
              ? new Date(ann.publish_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—';
            const expDateStr = ann.expiry_date 
              ? new Date(ann.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : null;

            return (
              <div 
                key={ann.id}
                className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs hover:shadow-md transition space-y-4"
              >
                
                {/* Header Row: Type, Status, Audience, Dates */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0D5E4]/60 pb-3">
                  
                  <div className="flex flex-wrap items-center gap-2.5">
                    {renderTypeTagBadge(ann.type_tag)}
                    {renderStatusBadge(ann.status)}
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-600 px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-200">
                      <Users className="w-3.5 h-3.5 text-[#8A064D]" />
                      <span>{ann.audience}</span>
                      {ann.target_course_title && (
                        <span className="text-[#8A064D] font-black">• {ann.target_course_title}</span>
                      )}
                      {ann.target_batch_name && (
                        <span className="text-gray-500 font-semibold">({ann.target_batch_name})</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                      Published: <strong>{pubDateStr}</strong>
                    </span>
                    {expDateStr && (
                      <span className="text-gray-400">
                        Expires: <strong>{expDateStr}</strong>
                      </span>
                    )}
                  </div>

                </div>

                {/* Announcement Content & Image */}
                {ann.image_url && (
                  <div className="w-full aspect-[2.6/1] max-h-48 rounded-2xl overflow-hidden border border-[#F0D5E4] relative group bg-black/5 shadow-2xs">
                    <img
                      src={ann.image_url}
                      alt={ann.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                      App Banner Showcase
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-lg md:text-xl font-black text-[#590231]">
                    {ann.title}
                  </h3>
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed whitespace-pre-line">
                    {ann.message}
                  </p>
                </div>

                {/* Footer: System Delivery Verification & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0D5E4]/60">
                  
                  {/* Delivery Status Rule: Show delivery status only if connected system confirms it */}
                  <div className="flex items-center gap-2">
                    {ann.status === 'Published' && ann.delivery_status.includes('Delivered') ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>System Verified: Delivered to Recipients</span>
                      </div>
                    ) : ann.status === 'Draft' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Draft: Not dispatched</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{ann.delivery_status}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Edit, Duplicate, Unpublish, Delete */}
                  <div className="flex items-center gap-2">
                    
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewAnnouncement(ann)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] text-white border border-[#48082B] text-xs font-bold transition shadow-2xs cursor-pointer"
                      title="Preview how users see it"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                      <span>Preview</span>
                    </button>

                    {/* Duplicate Button */}
                    <button
                      onClick={() => handleDuplicate(ann)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF5F9] border border-[#E8BFD5] hover:bg-[#FCE7F3] text-[#8A064D] text-xs font-bold transition shadow-2xs cursor-pointer"
                      title="Duplicate as new draft"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>

                    {/* Unpublish Button (if published) */}
                    {ann.status === 'Published' && (
                      <button
                        onClick={() => handleUnpublish(ann)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="Unpublish and return to Draft"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Unpublish</span>
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(ann)}
                      className="p-1.5 rounded-xl bg-[#FFF5F9] border border-[#E8BFD5] hover:bg-[#FCE7F3] text-[#8A064D] transition shadow-2xs cursor-pointer"
                      title="Edit Announcement"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingAnnouncement(ann)}
                      className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 transition shadow-2xs cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>

      {/* CREATE & EDIT ANNOUNCEMENT MODAL (WITH PREVIEW FEATURE) */}
      {(isCreateModalOpen || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#F0D5E4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-[#590231] px-6 py-4 text-white flex items-center justify-between border-b border-[#8A064D]">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-[#F9E33A]" />
                <h3 className="font-black text-lg text-white">
                  {editingAnnouncement ? 'Edit Announcement' : 'Create New Academy Announcement'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-[#8A064D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs: Edit vs Preview */}
            <div className="flex items-center border-b border-[#F0D5E4] bg-[#FFF9FB] px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveFormTab('edit')}
                className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider border-b-2 transition ${
                  activeFormTab === 'edit'
                    ? 'border-[#8A064D] text-[#8A064D]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                1. Compose & Settings
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('preview')}
                className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                  activeFormTab === 'preview'
                    ? 'border-[#8A064D] text-[#8A064D]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>2. Audience Live Preview</span>
              </button>
            </div>

            {/* Form Body */}
            {activeFormTab === 'edit' ? (
              <form 
                onSubmit={editingAnnouncement ? handleSubmitEdit : handleSubmitCreate} 
                className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
              >
                
                {/* Title */}
                <div>
                  <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Navaratri Festival Holiday & Special Pooja Schedule..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-900 focus:outline-none focus:border-[#8A064D]"
                  />
                  {formErrors.title && (
                    <p className="text-xs font-bold text-red-600 mt-1">{formErrors.title}</p>
                  )}
                </div>

                {/* Message Body */}
                <div>
                  <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                    Announcement Message Content *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Write the detailed circular for students, parents, or gurus..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#8A064D]"
                  />
                  {formErrors.message && (
                    <p className="text-xs font-bold text-red-600 mt-1">{formErrors.message}</p>
                  )}
                </div>

                {/* Banner Advertisement Image */}
                <div className="space-y-2 p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#590231] uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#8A064D]" />
                      <span>Banner Advertisement Image (App & Web Showcase)</span>
                    </label>
                    {formData.image_url && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Image
                      </button>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-gray-500">
                    Attached image will automatically be adjusted to suit the moving advertisement banner aspect ratio (2.5:1) in the mobile app.
                  </p>

                  {/* Upload button & URL input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#8A064D]/50 bg-white hover:bg-[#FFF2F8] text-[#8A064D] text-xs font-bold cursor-pointer transition">
                      <Upload className="w-4 h-4" />
                      <span>Upload & Auto-Fit Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Or paste image URL (https://...)"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#F0D5E4] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#8A064D]"
                      />
                    </div>
                  </div>

                  {/* Quick Academy Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Quick Presets:</span>
                    {[
                      { label: 'Classical Dance', url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Carnatic Music', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Grand Festival', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Arts & Craft', url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: preset.url }))}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-[#F0D5E4] hover:border-[#8A064D] hover:text-[#8A064D] text-gray-600 transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Live Banner Preview adjusted for mobile app */}
                  {formData.image_url && (
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-[#8A064D] uppercase mb-1">
                        Mobile App Banner Preview (Aspect Ratio 2.5:1)
                      </div>
                      <div className="relative w-full aspect-[2.5/1] rounded-2xl overflow-hidden border-2 border-[#8A064D]/30 shadow-sm bg-black/10">
                        <img
                          src={formData.image_url}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-3 text-white">
                          <span className="text-[10px] font-black uppercase text-[#F9E33A] tracking-wider mb-0.5">
                            {formData.type_tag}
                          </span>
                          <h4 className="text-sm font-bold text-white line-clamp-1 drop-shadow-sm">
                            {formData.title || 'Announcement Headline'}
                          </h4>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audience & Type Tag in 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Audience */}
                  <div>
                    <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                      Audience *
                    </label>
                    <select
                      value={formData.audience}
                      onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                    >
                      <option value="All students">All students</option>
                      <option value="Selected course or batch">Selected course or batch</option>
                      <option value="Trainers">Trainers (Gurus)</option>
                      <option value="Chosen recipients">Chosen recipients</option>
                    </select>
                  </div>

                  {/* Type Tag */}
                  <div>
                    <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                      Category Type Tag *
                    </label>
                    <select
                      value={formData.type_tag}
                      onChange={(e) => setFormData(prev => ({ ...prev, type_tag: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                    >
                      <option value="Holiday">Holiday</option>
                      <option value="Schedule change">Schedule change</option>
                      <option value="Cancellation">Cancellation</option>
                      <option value="Fee reminder">Fee reminder</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                </div>

                {/* If selected course or batch, show course & batch picker */}
                {formData.audience === 'Selected course or batch' && (
                  <div className="p-4 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] space-y-3">
                    <span className="text-xs font-black text-[#8A064D] uppercase tracking-wider block">
                      Target Course & Batch Selection
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Course *</label>
                        <select
                          value={formData.target_course_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, target_course_id: e.target.value, target_batch_id: '' }))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#F0D5E4] text-xs font-bold text-gray-800"
                        >
                          <option value="">-- Choose Course --</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                        {formErrors.target_course_id && (
                          <p className="text-xs font-bold text-red-600 mt-1">{formErrors.target_course_id}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1">Specific Batch (Optional)</label>
                        <select
                          value={formData.target_batch_id}
                          disabled={!formData.target_course_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, target_batch_id: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#F0D5E4] text-xs font-bold text-gray-800 disabled:opacity-50"
                        >
                          <option value="">All Batches in this Course</option>
                          {availableBatches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dates & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Publish Date */}
                  <div>
                    <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                      Publish Date *
                    </label>
                    <input
                      type="date"
                      value={formData.publish_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                    />
                    {formErrors.publish_date && (
                      <p className="text-xs font-bold text-red-600 mt-1">{formErrors.publish_date}</p>
                    )}
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                    />
                  </div>

                  {/* Initial Status */}
                  <div>
                    <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                    >
                      <option value="Published">Publish Now</option>
                      <option value="Scheduled">Schedule For Later</option>
                      <option value="Draft">Save as Draft</option>
                    </select>
                  </div>

                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-[#F0D5E4] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('preview')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF2F8] text-[#8A064D] hover:bg-[#FCE7F3] text-xs font-black transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Card First</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setEditingAnnouncement(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Processing...' : (editingAnnouncement ? 'Save Changes' : 'Confirm & Publish')}
                    </button>
                  </div>
                </div>

              </form>
            ) : (
              /* PREVIEW TAB */
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8A064D] bg-[#FFF2F8] p-3 rounded-2xl border border-[#F0D5E4]">
                  <Sparkles className="w-4 h-4 text-[#F9E33A] shrink-0" />
                  <span>
                    Here is exactly how this announcement will appear to recipients on their portal and mobile app notifications.
                  </span>
                </div>

                {/* Realistic Card Preview */}
                <div className="bg-white rounded-3xl p-6 border-2 border-[#8A064D]/30 shadow-xl space-y-4 max-w-lg mx-auto">
                  <div className="flex items-center justify-between border-b border-[#F0D5E4] pb-3">
                    <div className="flex items-center gap-2">
                      {renderTypeTagBadge(formData.type_tag)}
                      <span className="text-xs font-black text-[#590231]">{formData.audience}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">
                      {formData.publish_date || 'Today'}
                    </span>
                  </div>

                  {formData.image_url && (
                    <div className="w-full aspect-[2.5/1] rounded-2xl overflow-hidden border border-[#F0D5E4] shadow-xs">
                      <img
                        src={formData.image_url}
                        alt="Preview Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-[#590231]">
                      {formData.title || '(Untitled Announcement Title)'}
                    </h3>
                    <p className="text-sm font-semibold text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
                      {formData.message || '(Announcement message body will appear here...)'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F0D5E4] flex items-center justify-between text-xs text-gray-500 font-semibold">
                    <span>Issued by: Academy Director</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready for broadcast
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('edit')}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (editingAnnouncement) {
                        handleSubmitEdit(e as any);
                      } else {
                        handleSubmitCreate(e as any);
                      }
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white font-black text-xs shadow-md transition"
                  >
                    {isSubmitting ? 'Publishing...' : 'Looks Great! Confirm & Publish'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* STANDALONE PREVIEW MODAL */}
      {previewAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#F0D5E4] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-[#F0D5E4] pb-3">
              <div className="flex items-center gap-2">
                {renderTypeTagBadge(previewAnnouncement.type_tag)}
                {renderStatusBadge(previewAnnouncement.status)}
              </div>
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#8A064D]" />
                Target: {previewAnnouncement.audience}
                {previewAnnouncement.target_course_title && ` • ${previewAnnouncement.target_course_title}`}
              </div>

              {previewAnnouncement.image_url && (
                <div className="w-full aspect-[2.5/1] rounded-2xl overflow-hidden border border-[#F0D5E4] shadow-xs">
                  <img
                    src={previewAnnouncement.image_url}
                    alt={previewAnnouncement.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h3 className="text-xl font-black text-[#590231]">
                {previewAnnouncement.title}
              </h3>

              <p className="text-sm font-semibold text-gray-700 leading-relaxed whitespace-pre-line bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]">
                {previewAnnouncement.message}
              </p>
            </div>

            <div className="pt-2 border-t border-[#F0D5E4] flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Published: {new Date(previewAnnouncement.publish_date).toLocaleDateString('en-GB')}</span>
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-red-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">
                Confirm Deleting Announcement
              </h3>
              <p className="text-xs font-semibold text-gray-600 mt-2 leading-relaxed">
                Are you sure you want to remove <strong className="text-gray-900">"{deletingAnnouncement.title}"</strong>?
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs font-bold text-[#8A064D]">
                ⚠️ <strong>Audience Impact:</strong> This notice will immediately cease displaying to students, parents, and trainers.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAnnouncement(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

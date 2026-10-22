'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Users, 
  Image as ImageIcon, 
  Upload,
  ExternalLink,
  Smartphone,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Announcement } from '@/lib/announcements';
import AiEnhanceButton from '@/components/common/AiEnhanceButton';

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
  canDelete?: boolean;
}

export default function AdvertisementsClient({ initialAnnouncements, courses, batches, canDelete = true }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [typeTagFilter, setTypeTagFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Viewers state
  const [viewingAdViewers, setViewingAdViewers] = useState<Announcement | null>(null);
  const [adViewersList, setAdViewersList] = useState<any[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);

  // Multi-select Course & Batch state for form
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image_url: '',
    audience: 'All students' as 'All students' | 'Students and Gurus' | 'Selected course or batch' | 'Trainers' | 'Chosen recipients',
    target_course_id: '',
    target_course_title: '',
    target_batch_id: '',
    target_batch_name: '',
    type_tag: 'General' as 'Holiday' | 'Schedule change' | 'Cancellation' | 'Fee reminder' | 'General',
    publish_date: new Date().toISOString().split('T')[0],
    publish_time: '10:00',
    expiry_date: '',
    status: 'Published' as 'Draft' | 'Scheduled' | 'Published' | 'Expired',
    action_links: [] as Array<{ title: string; url: string }>
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'edit' | 'preview'>('edit');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to distinguish banner
  const isBanner = (ann: Announcement) => {
    return ann.announcement_type === 'banner' || (Boolean(ann.image_url) && ann.announcement_type !== 'message');
  };

  // Filter banner items
  const bannerList = useMemo(() => {
    return announcements.filter(isBanner);
  }, [announcements]);

  // Status computation and filtering
  const filteredBanners = useMemo(() => {
    return bannerList.filter(ann => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ann.title?.toLowerCase().includes(q);
        const matchesMsg = ann.message?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }

      // Status
      if (statusFilter !== 'all' && ann.status !== statusFilter) {
        return false;
      }

      // Audience
      if (audienceFilter !== 'all' && ann.audience !== audienceFilter) {
        return false;
      }

      // Type Tag
      if (typeTagFilter !== 'all' && ann.type_tag !== typeTagFilter) {
        return false;
      }

      return true;
    });
  }, [bannerList, searchQuery, statusFilter, audienceFilter, typeTagFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = bannerList.length;
    const active = bannerList.filter(a => a.status === 'Published').length;
    const scheduled = bannerList.filter(a => a.status === 'Scheduled').length;
    const draft = bannerList.filter(a => a.status === 'Draft').length;
    const expired = bannerList.filter(a => a.status === 'Expired').length;
    return { total, active, scheduled, draft, expired };
  }, [bannerList]);

  // File Upload Helper (3:4 aspect ratio compression)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 800;
        const maxH = 1050;
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
          setFormData(prev => ({ ...prev, image_url: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setSelectedCourseIds([]);
    setSelectedBatchIds([]);
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
      publish_time: '10:00',
      expiry_date: '',
      status: 'Published',
      action_links: []
    });
    setFormErrors({});
    setActiveFormTab('edit');
    setIsCreateModalOpen(true);
  };

  // Open Viewers Modal
  const handleOpenViewers = async (ann: Announcement) => {
    setViewingAdViewers(ann);
    setIsLoadingViewers(true);
    try {
      const res = await fetch(`/api/advertisements/view?announcement_id=${ann.id}`);
      const data = await res.json();
      if (data.success) {
        setAdViewersList(data.viewers || []);
        if (data.views_count !== undefined) {
          setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, views_count: data.views_count } : a));
        }
      } else {
        setAdViewersList([]);
      }
    } catch (err) {
      console.error('Error fetching advertisement viewers:', err);
      setAdViewersList([]);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    const cIds = ann.target_course_id ? ann.target_course_id.split(',').map(s => s.trim()).filter(Boolean) : [];
    const bIds = ann.target_batch_id ? ann.target_batch_id.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedCourseIds(cIds);
    setSelectedBatchIds(bIds);

    const links = Array.isArray(ann.action_links) ? ann.action_links : [];

    setFormData({
      title: ann.title || '',
      message: ann.message || '',
      image_url: ann.image_url || '',
      audience: (ann.audience || 'All students') as any,
      target_course_id: ann.target_course_id || '',
      target_course_title: ann.target_course_title || '',
      target_batch_id: ann.target_batch_id || '',
      target_batch_name: ann.target_batch_name || '',
      type_tag: (ann.type_tag || 'General') as any,
      publish_date: ann.publish_date ? ann.publish_date.split('T')[0] : new Date().toISOString().split('T')[0],
      publish_time: '10:00',
      expiry_date: ann.expiry_date ? ann.expiry_date.split('T')[0] : '',
      status: (ann.status || 'Published') as any,
      action_links: links
    });
    setFormErrors({});
    setActiveFormTab('edit');
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Banner headline is required';
    }
    if (!formData.image_url || !formData.image_url.trim()) {
      errors.image_url = 'A banner image is required for app home banner showcase';
    }
    if (formData.status === 'Scheduled' && !formData.publish_date) {
      errors.publish_date = 'Scheduled publish date is required';
    }
    if (formData.audience === 'Selected course or batch' && selectedCourseIds.length === 0) {
      errors.target_course_id = 'Please select at least one course';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setActiveFormTab('edit');
      return;
    }

    setIsSubmitting(true);
    try {
      const courseTitles = courses
        .filter(c => selectedCourseIds.includes(c.id))
        .map(c => c.title)
        .join(', ');

      const batchNames = batches
        .filter(b => selectedBatchIds.includes(b.id))
        .map(b => b.name)
        .join(', ');

      const effectivePublishDate = formData.status === 'Published' 
        ? new Date().toISOString().split('T')[0]
        : formData.publish_date;

      const cleanActionLinks = formData.action_links.filter(l => l.title.trim() && l.url.trim());
      const effectiveMessage = formData.message.trim() || formData.title.trim();

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          message: effectiveMessage,
          sender_role: 'admin',
          created_by: 'Academy Director',
          publish_date: effectivePublishDate,
          announcement_type: 'banner',
          action_links: cleanActionLinks,
          target_course_id: selectedCourseIds.length > 0 ? selectedCourseIds.join(',') : undefined,
          target_course_title: courseTitles || undefined,
          target_batch_id: selectedBatchIds.length > 0 ? selectedBatchIds.join(',') : undefined,
          target_batch_name: batchNames || undefined
        })
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => [json.announcement, ...prev]);
        setIsCreateModalOpen(false);
        showToast('Banner Advertisement added to Student App Home carousel!');
      } else {
        showToast(json.error || 'Failed to create banner ad', 'error');
      }
    } catch {
      showToast('Network error while saving banner ad', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement || !validateForm()) {
      setActiveFormTab('edit');
      return;
    }

    setIsSubmitting(true);
    try {
      const courseTitles = courses
        .filter(c => selectedCourseIds.includes(c.id))
        .map(c => c.title)
        .join(', ');

      const batchNames = batches
        .filter(b => selectedBatchIds.includes(b.id))
        .map(b => b.name)
        .join(', ');

      const effectivePublishDate = formData.status === 'Published' 
        ? new Date().toISOString().split('T')[0]
        : formData.publish_date;

      const cleanActionLinks = formData.action_links.filter(l => l.title.trim() && l.url.trim());
      const effectiveMessage = formData.message.trim() || formData.title.trim();

      const res = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          message: effectiveMessage,
          sender_role: 'admin',
          created_by: 'Academy Director',
          publish_date: effectivePublishDate,
          announcement_type: 'banner',
          action_links: cleanActionLinks,
          target_course_id: selectedCourseIds.length > 0 ? selectedCourseIds.join(',') : undefined,
          target_course_title: courseTitles || undefined,
          target_batch_id: selectedBatchIds.length > 0 ? selectedBatchIds.join(',') : undefined,
          target_batch_name: batchNames || undefined
        })
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => prev.map(item => item.id === editingAnnouncement.id ? json.announcement : item));
        setEditingAnnouncement(null);
        showToast('Banner advertisement updated successfully!');
      } else {
        showToast(json.error || 'Failed to update banner ad', 'error');
      }
    } catch {
      showToast('Network error while updating banner ad', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
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
        showToast('Banner advertisement deleted successfully.');
      } else {
        showToast(json.error || 'Failed to delete banner ad', 'error');
      }
    } catch {
      showToast('Network error while deleting banner ad', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Active in Carousel</span>
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Scheduled</span>
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <span>Draft</span>
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700 border border-gray-300">
            <span>Expired</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Type tag badge
  const renderTypeTagBadge = (tag: string) => {
    return (
      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/40 backdrop-blur-xs text-[#F9E33A] border border-white/20">
        {tag}
      </span>
    );
  };

  // Audience badge
  const renderAudienceBadge = (aud: string) => {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700">
        <Users className="w-3 h-3 text-[#8A064D]" />
        <span>{aud}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${
            toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#590231] via-[#8A064D] to-[#4A0128] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-[#F9E33A] text-xs font-black tracking-wide uppercase">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>App Home Banner Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Advertisements & Promo Banners
            </h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
              Manage vertical promotional flyers, masterclass posters, and cultural event banners showcased in the student mobile app moving carousel.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              className="px-5 py-3 rounded-2xl bg-[#F9E33A] hover:bg-[#FDEE68] text-[#590231] text-xs sm:text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#590231]" />
              <span>Create New Banner Ad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Ads</p>
            <p className="text-2xl font-black text-[#590231] mt-1">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active in App</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">{stats.active}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Scheduled</p>
            <p className="text-2xl font-black text-blue-800 mt-1">{stats.scheduled}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Drafts</p>
            <p className="text-2xl font-black text-amber-800 mt-1">{stats.draft}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Edit3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search banner ads..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-medium text-gray-800"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Active (Published)</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Drafts</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Audience Filter */}
          <div>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
            >
              <option value="all">All Audiences</option>
              <option value="All students">All Students</option>
              <option value="Students and Gurus">Students and Gurus</option>
              <option value="Selected course or batch">Selected Course / Batch</option>
              <option value="Trainers">Faculty Gurus</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center">
            {(searchQuery || statusFilter !== 'all' || audienceFilter !== 'all' || typeTagFilter !== 'all') ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setAudienceFilter('all');
                  setTypeTagFilter('all');
                }}
                className="w-full py-2.5 rounded-2xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            ) : (
              <div className="w-full text-center text-xs text-gray-400 font-medium py-2.5">
                Showing {filteredBanners.length} of {bannerList.length} flyers
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3:4 Posters Grid */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#F0D5E4] shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-[#FFF2F8] text-[#8A064D]">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800">No Banner Advertisements Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              Create vertical poster banner advertisements (3:4 ratio) to showcase in the student mobile app moving carousel.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 rounded-2xl bg-[#8A064D] hover:bg-[#590231] text-white text-sm font-bold shadow-md transition flex items-center gap-2 mx-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create First Banner Ad</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((ann) => {
            const pubDateStr = ann.publish_date 
              ? new Date(ann.publish_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—';

            return (
              <div 
                key={ann.id}
                className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col group"
              >
                {/* Poster Image (Vertical 3:4 Aspect Ratio) */}
                <div className="relative aspect-[3/4] bg-[#1E0111] overflow-hidden">
                  {ann.image_url ? (
                    <img 
                      src={ann.image_url} 
                      alt={ann.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/40 p-4 text-center">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <span className="text-xs">No flyer image uploaded</span>
                    </div>
                  )}

                  {/* Gradient Overlay for Top & Bottom Details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 flex flex-col justify-between p-4 text-white">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-[#F9E33A] text-[10px] font-black border border-white/20">
                        App Carousel Banner
                      </span>
                      {renderStatusBadge(ann.status)}
                    </div>

                    <div>
                      {renderTypeTagBadge(ann.type_tag)}
                      <h3 className="text-base font-black text-white leading-tight drop-shadow-md mt-2">
                        {ann.title}
                      </h3>
                      {ann.message && (
                        <p className="text-xs text-white/80 line-clamp-2 mt-1 drop-shadow-sm font-medium">
                          {ann.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Info & Actions */}
                <div className="p-4 space-y-3 bg-[#FFF9FB]/60 border-t border-[#F0D5E4] flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-semibold">Target:</span>
                      {renderAudienceBadge(ann.audience)}
                    </div>
                    {ann.target_course_title && (
                      <div className="text-[11px] text-[#8A064D] font-bold truncate">
                        Course: {ann.target_course_title}
                      </div>
                    )}
                    {ann.action_links && ann.action_links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ann.action_links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] hover:bg-[#FCE7F3] transition"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[120px]">{link.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>Published: {pubDateStr}</span>
                      <span className="font-semibold text-gray-400">by {ann.created_by || 'Director'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F0D5E4] flex items-center justify-between">
                    <button
                      onClick={() => setPreviewAnnouncement(ann)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#8A064D] hover:underline cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview App Banner</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Beside edit button on each advertisement grid as views */}
                      <button
                        onClick={() => handleOpenViewers(ann)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black transition flex items-center gap-1 cursor-pointer border border-blue-200 shadow-2xs"
                        title="View Readers Count and Impressions"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>{ann.views_count || 0} Views</span>
                      </button>

                      <button
                        onClick={() => openEditModal(ann)}
                        className="p-1.5 rounded-xl bg-[#FFF2F8] text-[#8A064D] hover:bg-[#FCE7F3] cursor-pointer"
                        title="Edit Banner"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => setDeletingAnnouncement(ann)}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT BANNER MODAL */}
      {(isCreateModalOpen || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#F0D5E4] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#8A064D] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-[#F9E33A]" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingAnnouncement ? 'Edit Banner Advertisement' : 'Create Banner Advertisement'}
                  </h3>
                  <p className="text-xs text-white/80">
                    Displayed in the Student Mobile App Home Moving Carousel
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#F0D5E4] bg-[#FFF9FB]">
              <button
                type="button"
                onClick={() => setActiveFormTab('edit')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${
                  activeFormTab === 'edit'
                    ? 'border-[#8A064D] text-[#8A064D] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                1. Banner Details & Flyer
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('preview')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center justify-center gap-1.5 ${
                  activeFormTab === 'preview'
                    ? 'border-[#8A064D] text-[#8A064D] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>2. App Carousel Preview</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={editingAnnouncement ? handleSubmitEdit : handleSubmitCreate} className="p-6 space-y-5">
              {activeFormTab === 'edit' ? (
                <>
                  {/* Title / Headline */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        Banner Headline / Title *
                      </label>
                      <AiEnhanceButton
                        context="announcement_title"
                        value={formData.title}
                        onEnhance={(text: string) => setFormData(prev => ({ ...prev, title: text }))}
                      />
                    </div>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Annual Classical Dance Festival 2026"
                      className="w-full px-4 py-3 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-800"
                    />
                    {formErrors.title && <p className="text-xs font-bold text-rose-600">{formErrors.title}</p>}
                  </div>

                  {/* 3:4 Aspect Flyer Upload */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-[#8A064D] uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#8A064D]" />
                        <span>Poster Banner Image (3:4 Ratio) *</span>
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
                      Images are automatically adjusted to the 3:4 vertical flyer format to perfectly fit the mobile home carousel.
                    </p>

                    <div className="pt-1">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-[#8A064D]/50 bg-white hover:bg-[#FFF2F8] text-[#8A064D] text-xs font-black cursor-pointer transition">
                        <Upload className="w-4 h-4" />
                        <span>Upload Flyer & Auto-Fit</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>
                    </div>

                    {formErrors.image_url && (
                      <p className="text-xs font-bold text-rose-600 mt-1">{formErrors.image_url}</p>
                    )}

                    {formData.image_url && (
                      <div className="pt-2">
                        <div className="text-[10px] font-bold text-[#8A064D] uppercase mb-1">
                          Poster Aspect Ratio Preview (3:4 Format)
                        </div>
                        <div className="relative w-40 mx-auto aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#8A064D]/40 shadow-md bg-[#1E0111]">
                          <img
                            src={formData.image_url}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Caption / Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        Banner Subtitle / Description (Optional)
                      </label>
                      <AiEnhanceButton
                        context="announcement_message"
                        value={formData.message}
                        onEnhance={(text: string) => setFormData(prev => ({ ...prev, message: text }))}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Brief note or venue details shown under the banner headline..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-medium text-gray-800"
                    />
                  </div>

                  {/* Audience & Tag */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        Target Audience *
                      </label>
                      <select
                        value={formData.audience}
                        onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
                      >
                        <option value="All students">All Students</option>
                        <option value="Students and Gurus">Students and Gurus</option>
                        <option value="Selected course or batch">Selected Course / Batch</option>
                        <option value="Trainers">Faculty Gurus</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        Category Tag *
                      </label>
                      <select
                        value={formData.type_tag}
                        onChange={(e) => setFormData(prev => ({ ...prev, type_tag: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
                      >
                        <option value="General">General Promo</option>
                        <option value="Holiday">Special Workshop</option>
                        <option value="Schedule change">Grand Recital / Arangetram</option>
                        <option value="Cancellation">Competition</option>
                        <option value="Fee reminder">Festival Greeting</option>
                      </select>
                    </div>
                  </div>

                  {/* Course & Batch Selection (if Selected course or batch) */}
                  {formData.audience === 'Selected course or batch' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                      <div>
                        <label className="text-xs font-bold text-gray-700">Target Courses:</label>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {courses.map(c => {
                            const isSelected = selectedCourseIds.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCourseIds(prev => prev.filter(id => id !== c.id));
                                  } else {
                                    setSelectedCourseIds(prev => [...prev, c.id]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                                  isSelected 
                                    ? 'bg-[#8A064D] text-white shadow-xs' 
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {c.title}
                              </button>
                            );
                          })}
                        </div>
                        {formErrors.target_course_id && (
                          <p className="text-xs font-bold text-rose-600 mt-1">{formErrors.target_course_id}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dispatch Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      Publish Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#F0D5E4] focus:outline-none focus:ring-2 focus:ring-[#8A064D] text-xs font-bold text-gray-700 bg-white"
                    >
                      <option value="Published">Publish Now (Immediately Active)</option>
                      <option value="Scheduled">Schedule for Future Date</option>
                      <option value="Draft">Save as Draft</option>
                    </select>
                  </div>

                  {/* Scheduled Date Input */}
                  {formData.status === 'Scheduled' && (
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                      <label className="text-xs font-bold text-blue-900">Scheduled Date *</label>
                      <input
                        type="date"
                        value={formData.publish_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-xs font-bold text-blue-900 bg-white"
                      />
                      {formErrors.publish_date && <p className="text-xs font-bold text-rose-600">{formErrors.publish_date}</p>}
                    </div>
                  )}

                  {/* Action Links */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-[#8A064D] uppercase tracking-wider flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Action Links / External URLs (Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            action_links: [...prev.action_links, { title: '', url: '' }]
                          }));
                        }}
                        className="px-2.5 py-1 rounded-xl bg-[#8A064D] text-white text-[10px] font-black hover:bg-[#590231] cursor-pointer"
                      >
                        + Add Link
                      </button>
                    </div>

                    {formData.action_links.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic">
                        No links attached. Click "+ Add Link" to include buttons like "Register Here" or "Event Location".
                      </p>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {formData.action_links.map((link, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={link.title}
                              placeholder="Button Label (e.g. Register)"
                              onChange={(e) => {
                                const newLinks = [...formData.action_links];
                                newLinks[idx].title = e.target.value;
                                setFormData(prev => ({ ...prev, action_links: newLinks }));
                              }}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-[#F0D5E4] text-xs font-semibold"
                            />
                            <input
                              type="url"
                              value={link.url}
                              placeholder="https://..."
                              onChange={(e) => {
                                const newLinks = [...formData.action_links];
                                newLinks[idx].url = e.target.value;
                                setFormData(prev => ({ ...prev, action_links: newLinks }));
                              }}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-[#F0D5E4] text-xs font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  action_links: prev.action_links.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Live Preview Tab */
                <div className="space-y-4 py-2">
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-500">Live Preview in Student App Moving Carousel</p>
                  </div>
                  <div className="max-w-xs mx-auto aspect-[3/4] rounded-3xl overflow-hidden border-4 border-[#8A064D]/30 shadow-2xl bg-[#1E0111] relative">
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/50 p-4 text-center">
                        <ImageIcon className="w-12 h-12 mb-2" />
                        <span className="text-xs">Upload flyer to preview</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 flex flex-col justify-between p-4 text-white">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded-lg bg-black/60 text-[#F9E33A] text-[9px] font-black border border-white/20">
                          App Carousel
                        </span>
                        {renderTypeTagBadge(formData.type_tag)}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white leading-tight">
                          {formData.title || 'Banner Headline'}
                        </h4>
                        {formData.message && (
                          <p className="text-xs text-white/80 line-clamp-2 mt-1">
                            {formData.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#F0D5E4] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingAnnouncement(null);
                  }}
                  className="px-5 py-2.5 rounded-2xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting 
                    ? 'Saving...' 
                    : editingAnnouncement 
                      ? 'Update Banner Ad' 
                      : 'Publish Banner Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STANDALONE PHONE PREVIEW MODAL */}
      {previewAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#F0D5E4] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F0D5E4] pb-3">
              <div className="flex items-center gap-2">
                {renderTypeTagBadge(previewAnnouncement.type_tag)}
                {renderStatusBadge(previewAnnouncement.status)}
              </div>
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-[#8A064D]" />
                <span>Student App Home Carousel Preview</span>
              </div>
              {previewAnnouncement.image_url && (
                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden border border-[#F0D5E4] shadow-md bg-[#1E0111]">
                  <img
                    src={previewAnnouncement.image_url}
                    alt={previewAnnouncement.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-base font-black text-[#590231] text-center">
                {previewAnnouncement.title}
              </h3>
              {previewAnnouncement.message && (
                <p className="text-xs font-semibold text-gray-700 text-center">
                  {previewAnnouncement.message}
                </p>
              )}
              {previewAnnouncement.action_links && previewAnnouncement.action_links.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {previewAnnouncement.action_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold transition shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#F9E33A]" />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#F0D5E4] flex justify-end">
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">Delete Banner Advertisement?</h3>
              <p className="text-xs text-gray-600">
                Are you sure you want to remove <span className="font-bold text-gray-900">"{deletingAnnouncement.title}"</span>? It will no longer appear in the student app carousel.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAnnouncement(null)}
                className="px-5 py-2.5 rounded-2xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVERTISEMENT VIEWERS MODAL */}
      {viewingAdViewers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#F9E33A] border border-white/20">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Advertisement Readership</h3>
                  <p className="text-xs text-white/80 font-medium">Logged-in Users Who Opened This Notice</p>
                </div>
              </div>
              <button
                onClick={() => setViewingAdViewers(null)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header / Summary */}
            <div className="p-4 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Title</p>
                <h4 className="text-sm font-black text-gray-900 truncate">{viewingAdViewers.title}</h4>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-xs shrink-0 flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{adViewersList.length || viewingAdViewers.views_count || 0} Total Views</span>
              </div>
            </div>

            {/* Viewers List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {isLoadingViewers ? (
                <div className="py-12 text-center text-gray-500 text-xs font-bold flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#590231] border-t-transparent rounded-full animate-spin" />
                  <span>Loading readership records...</span>
                </div>
              ) : adViewersList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 space-y-1">
                  <Eye className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs font-bold text-gray-700">No readers yet</p>
                  <p className="text-[11px] text-gray-400">
                    Views will register here when a student or guru actively taps and reads this advertisement.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {adViewersList.map((viewer: any, idx: number) => {
                    const roleLabel = viewer.user_role === 'trainer' ? 'Guru / Faculty' : viewer.user_role === 'receptionist' ? 'Receptionist' : 'Student';
                    const roleBadgeColor = viewer.user_role === 'trainer' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    const viewTime = viewer.viewed_at ? new Date(viewer.viewed_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Recently';

                    return (
                      <div key={viewer.id || idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate">{viewer.user_name || 'Logged-in Member'}</p>
                            <span className={`inline-block px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase border ${roleBadgeColor}`}>
                              {roleLabel}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{viewTime}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingAdViewers(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

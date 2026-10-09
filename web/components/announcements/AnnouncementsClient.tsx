'use client';

import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  X, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Users, 
  Send, 
  Archive, 
  Sparkles, 
  Image as ImageIcon, 
  Upload,
  MessageSquare,
  CheckCheck,
  ShieldCheck,
  Smartphone,
  Link as LinkIcon,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Announcement } from '@/lib/announcements';

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

  // Top Section: 'banners' (App Home Banners/Advertisements) vs 'messages' (Student Broadcast Messages)
  const [activeCategory, setActiveCategory] = useState<'banners' | 'messages'>('banners');
  const [formAnnouncementType, setFormAnnouncementType] = useState<'banner' | 'message'>('banner');

  // Subpage: dedicated Scheduled Messages view
  const [isScheduledViewOpen, setIsScheduledViewOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Used ONLY for banner advertisements
  const [startDate, setStartDate] = useState('');          // Standard Date Range Filter for messages
  const [endDate, setEndDate] = useState('');              // Standard Date Range Filter for messages
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [typeTagFilter, setTypeTagFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Multi-select Course & Batch state for form
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  // Form State (Clean defaults, no prefilled text, current date as default)
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

  // Helper to distinguish banner vs message
  const isBanner = (ann: Announcement) => {
    return ann.announcement_type === 'banner' || (Boolean(ann.image_url) && ann.announcement_type !== 'message');
  };

  const isMessage = (ann: Announcement) => {
    return !isBanner(ann);
  };

  // 30-day Lifespan check helper
  const isExpiredBy30Days = (ann: Announcement) => {
    if (!isMessage(ann)) return false;
    const dateStr = ann.publish_date || ann.created_at;
    if (!dateStr) return false;
    const pubTime = new Date(dateStr).getTime();
    return pubTime < Date.now() - 30 * 24 * 60 * 60 * 1000;
  };

  const bannerCount = useMemo(() => announcements.filter(a => !a.is_deleted && isBanner(a)).length, [announcements]);
  const messageCount = useMemo(() => announcements.filter(a => !a.is_deleted && isMessage(a) && !isExpiredBy30Days(a)).length, [announcements]);

  // Scheduled messages list
  const scheduledMessages = useMemo(() => {
    return announcements.filter(a => !a.is_deleted && isMessage(a) && (a.status === 'Scheduled' || (a.publish_date && new Date(a.publish_date).getTime() > Date.now())));
  }, [announcements]);

  // Auto-resize uploaded image
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

  // Batches available for all currently selected courses
  const availableBatchesForSelectedCourses = useMemo(() => {
    if (selectedCourseIds.length === 0) return [];
    return batches.filter(b => selectedCourseIds.includes(b.course_id));
  }, [selectedCourseIds, batches]);

  // Filtered announcements for the ACTIVE category
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      if (ann.is_deleted) return false;

      // Strict category filter
      if (activeCategory === 'banners' && !isBanner(ann)) {
        return false;
      }
      if (activeCategory === 'messages') {
        if (!isMessage(ann)) return false;
        // Filter out messages older than 30 days
        if (isExpiredBy30Days(ann)) return false;

        // Standard Date Range Filter for Message Broadcasts
        if (startDate) {
          const itemDate = (ann.publish_date || ann.created_at || '').substring(0, 10);
          if (itemDate && itemDate < startDate) return false;
        }
        if (endDate) {
          const itemDate = (ann.publish_date || ann.created_at || '').substring(0, 10);
          if (itemDate && itemDate > endDate) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ann.title.toLowerCase().includes(q);
        const matchMsg = ann.message.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg) return false;
      }

      // Status filter is applied ONLY for banner advertisements
      if (activeCategory === 'banners') {
        if (statusFilter !== 'all' && ann.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      if (audienceFilter !== 'all' && ann.audience !== audienceFilter) {
        return false;
      }

      if (typeTagFilter !== 'all' && ann.type_tag !== typeTagFilter) {
        return false;
      }

      return true;
    });
  }, [announcements, activeCategory, searchQuery, statusFilter, startDate, endDate, audienceFilter, typeTagFilter]);

  const hasActiveFilters = Boolean(
    searchQuery || 
    (activeCategory === 'banners' ? statusFilter !== 'all' : (startDate || endDate)) || 
    audienceFilter !== 'all' || 
    typeTagFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setAudienceFilter('all');
    setTypeTagFilter('all');
  };

  // Immediate Publish Action for Scheduled Messages
  const handlePublishNow = async (ann: Announcement) => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/announcements/${ann.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ann,
          status: 'Published',
          publish_date: today
        })
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => prev.map(item => item.id === ann.id ? json.announcement : item));
        showToast(`"${ann.title}" published immediately to student mobile logins!`);
      } else {
        showToast(json.error || 'Failed to publish announcement', 'error');
      }
    } catch {
      showToast('Network error while publishing announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Create Modal - NO PREFILLED INFO, TODAY'S DATE DEFAULT
  const openCreateModal = (type: 'banner' | 'message' = activeCategory === 'banners' ? 'banner' : 'message') => {
    setFormAnnouncementType(type);
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
      publish_date: new Date().toISOString().split('T')[0], // Default current date
      publish_time: '10:00',
      expiry_date: '',
      status: 'Published', // Default Publish Now
      action_links: []
    });
    setFormErrors({});
    setActiveFormTab('edit');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (ann: Announcement) => {
    const type = isBanner(ann) ? 'banner' : 'message';
    setFormAnnouncementType(type);
    setEditingAnnouncement(ann);

    // Parse multi-course & multi-batch if any
    const cIds = ann.target_course_id ? ann.target_course_id.split(',').map(s => s.trim()).filter(Boolean) : [];
    const bIds = ann.target_batch_id ? ann.target_batch_id.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedCourseIds(cIds);
    setSelectedBatchIds(bIds);

    // Parse action links if present
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
      errors.title = formAnnouncementType === 'banner' ? 'Banner headline is required' : 'Notice title is required';
    }
    if (formAnnouncementType === 'banner') {
      if (!formData.image_url || !formData.image_url.trim()) {
        errors.image_url = 'A banner image is required for app home banner showcase';
      }
    } else {
      if (!formData.message || !formData.message.trim()) {
        errors.message = 'Broadcast message content is required';
      }
    }
    if (formData.status === 'Scheduled') {
      if (!formData.publish_date) {
        errors.publish_date = 'Scheduled publish date is required';
      }
    }
    if (formData.audience === 'Selected course or batch' && selectedCourseIds.length === 0) {
      errors.target_course_id = 'Please select at least one course';
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
      const courseTitles = courses
        .filter(c => selectedCourseIds.includes(c.id))
        .map(c => c.title)
        .join(', ');

      const batchNames = batches
        .filter(b => selectedBatchIds.includes(b.id))
        .map(b => b.name)
        .join(', ');

      // Enforce current date if published immediately
      const effectivePublishDate = formData.status === 'Published' 
        ? new Date().toISOString().split('T')[0]
        : formData.publish_date;

      const cleanActionLinks = formData.action_links.filter(l => l.title.trim() && l.url.trim());

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publish_date: effectivePublishDate,
          announcement_type: formAnnouncementType,
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
        showToast(formAnnouncementType === 'banner' 
          ? 'Banner Advertisement added to Student App Home carousel!' 
          : 'Message broadcasted directly to Student App Messages!');
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

      const res = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publish_date: effectivePublishDate,
          announcement_type: formAnnouncementType,
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
        showToast('Announcement deleted successfully.');
      } else {
        showToast(json.error || 'Failed to delete announcement', 'error');
      }
    } catch {
      showToast('Network error while deleting', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const renderTypeTagBadge = (tag: string) => {
    switch (tag) {
      case 'Holiday':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Holiday
          </span>
        );
      case 'Schedule change':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Schedule Change
          </span>
        );
      case 'Fee reminder':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            Fee Reminder
          </span>
        );
      case 'Cancellation':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            Cancellation
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">
            {tag || 'General'}
          </span>
        );
    }
  };

  const renderAudienceBadge = (audience: string) => {
    if (audience === 'Students and Gurus') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
          <Users className="w-3 h-3 text-purple-600" />
          <span>Students & Gurus (Dual Broadcast)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
        <Users className="w-3 h-3 text-gray-500" />
        <span>{audience}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-70 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 ${
          toastMessage.type === 'error' ? 'bg-[#7F1D1D]' : 'bg-[#2D041A]'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8A064D] to-[#EBB128] flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-black text-[#F9E33A] uppercase tracking-wider">
              {toastMessage.type === 'error' ? 'Action Failed' : 'Action Successful'}
            </div>
            <div className="text-xs font-bold text-white mt-0.5">{toastMessage.text}</div>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition ml-3 cursor-pointer text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
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
              Academy Announcements
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              Manage promotional app banner advertisements and official student broadcast messages separately
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        {activeCategory === 'banners' ? (
          <button
            onClick={() => openCreateModal('banner')}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#8A064D] hover:bg-[#590231] text-white font-black text-sm shadow-lg hover:shadow-xl transition-all border border-[#F9E33A]/60 cursor-pointer shrink-0"
          >
            <ImageIcon className="w-5 h-5 text-[#F9E33A]" />
            <span>+ Create Banner Ad</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsScheduledViewOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-sm shadow-xs transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Scheduled Messages</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">
                {scheduledMessages.length}
              </span>
            </button>
            <button
              onClick={() => openCreateModal('message')}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] text-white font-black text-sm shadow-lg hover:shadow-xl transition-all border border-emerald-300 cursor-pointer shrink-0"
            >
              <Send className="w-5 h-5 text-emerald-300" />
              <span>+ Broadcast New Message</span>
            </button>
          </div>
        )}
      </div>

      {/* SEPARATE CATEGORY TOGGLE (BANNER IMAGES VS MESSAGE ANNOUNCEMENTS) */}
      <div className="bg-white p-2 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          
          {/* TAB 1: Banner Advertisements */}
          <button
            type="button"
            onClick={() => {
              setActiveCategory('banners');
              setIsScheduledViewOpen(false);
            }}
            className={`flex items-center justify-between p-4 rounded-2xl transition text-left cursor-pointer border ${
              activeCategory === 'banners' && !isScheduledViewOpen
                ? 'bg-gradient-to-r from-[#590231] to-[#8A064D] text-white border-[#F9E33A]/60 shadow-md'
                : 'bg-[#FFF9FB] hover:bg-[#FFF2F8] text-gray-700 border-[#F0D5E4]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeCategory === 'banners' && !isScheduledViewOpen ? 'bg-white/20 text-[#F9E33A]' : 'bg-[#FFF2F8] text-[#8A064D]'
              }`}>
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base">App Banner Advertisements</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    activeCategory === 'banners' && !isScheduledViewOpen ? 'bg-[#F9E33A] text-[#590231]' : 'bg-[#8A064D]/10 text-[#8A064D]'
                  }`}>
                    {bannerCount} Posters
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${activeCategory === 'banners' && !isScheduledViewOpen ? 'text-white/80' : 'text-gray-500'}`}>
                  Image-based moving banner flyers displayed on Student App Home carousel
                </p>
              </div>
            </div>
          </button>

          {/* TAB 2: Message Broadcasts */}
          <button
            type="button"
            onClick={() => {
              setActiveCategory('messages');
              setIsScheduledViewOpen(false);
            }}
            className={`flex items-center justify-between p-4 rounded-2xl transition text-left cursor-pointer border ${
              activeCategory === 'messages' && !isScheduledViewOpen
                ? 'bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white border-emerald-300 shadow-md'
                : 'bg-[#F0FDF4] hover:bg-emerald-50 text-gray-700 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeCategory === 'messages' && !isScheduledViewOpen ? 'bg-white/20 text-emerald-300' : 'bg-emerald-100 text-[#075E54]'
              }`}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base">Message Broadcasts</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    activeCategory === 'messages' && !isScheduledViewOpen ? 'bg-emerald-300 text-[#075E54]' : 'bg-emerald-200 text-[#075E54]'
                  }`}>
                    {messageCount} Circulars
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${activeCategory === 'messages' && !isScheduledViewOpen ? 'text-white/80' : 'text-gray-500'}`}>
                  Official notices & circulars sent to Student App (30-day auto-clear lifespan)
                </p>
              </div>
            </div>
          </button>

        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
        <div className={`grid grid-cols-1 ${activeCategory === 'banners' ? 'md:grid-cols-4' : 'md:grid-cols-5'} gap-4`}>
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeCategory === 'banners' ? "Search banner ads..." : "Search messages..."}
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

          {/* If BANNERS: show Status Filter. If MESSAGES: Status Filter completely removed, show standard Date Range filter */}
          {activeCategory === 'banners' ? (
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
          ) : (
            <>
              {/* Standard Date Range Filter: From Date */}
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="From Date"
                  placeholder="From Date"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#075E54]"
                />
              </div>

              {/* Standard Date Range Filter: To Date */}
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="To Date"
                  placeholder="To Date"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#075E54]"
                />
              </div>
            </>
          )}

          {/* Audience Filter */}
          <div>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            >
              <option value="all">All Audiences</option>
              <option value="All students">All students</option>
              <option value="Students and Gurus">Students and Gurus</option>
              <option value="Selected course or batch">Selected course or batch</option>
              <option value="Trainers">Trainers</option>
              <option value="Chosen recipients">Chosen recipients</option>
            </select>
          </div>

          {/* Category Tag Filter */}
          <div>
            <select
              value={typeTagFilter}
              onChange={(e) => setTypeTagFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            >
              <option value="all">All Category Tags</option>
              <option value="Holiday">Holiday</option>
              <option value="Schedule change">Schedule change</option>
              <option value="Cancellation">Cancellation</option>
              <option value="Fee reminder">Fee reminder</option>
              <option value="General">General</option>
            </select>
          </div>

        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-2 border-t border-[#F0D5E4]/60">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-[#8A064D] text-xs font-black transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Notice Banner: 30-Day Lifespan Rule for Messages */}
      {activeCategory === 'messages' && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-950 font-semibold shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>30-Day Auto Lifespan:</strong> Messages are retained for exactly 30 days from publication and automatically cleared from student and trainer applications.
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
            Auto-Retention Active
          </span>
        </div>
      )}

      {/* Main Content Area OR Dedicated Scheduled Messages Sub-Page */}
      {isScheduledViewOpen ? (
        <div className="space-y-6">
          {/* Subpage Header Banner */}
          <div className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsScheduledViewOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-[#F4F4F5] hover:bg-[#E4E4E7] text-gray-800 transition font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs border border-gray-200"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
                <span>Back to Message Broadcasts</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    Scheduled Message Broadcasts
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs">
                    {scheduledMessages.length} Queued
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Official circulars queued for automated future release to student &amp; trainer mobile logins
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                openCreateModal('message');
                setFormData(prev => ({ ...prev, status: 'Scheduled' }));
              }}
              className="px-5 py-3 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Schedule New Message</span>
            </button>
          </div>

          {/* Scheduled Messages List */}
          {scheduledMessages.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-amber-200 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-200">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800">
                  No Messages Currently Scheduled
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                  You do not have any pending scheduled message broadcasts. Click the button below to draft a circular and queue it for future release.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  openCreateModal('message');
                  setFormData(prev => ({ ...prev, status: 'Scheduled' }));
                }}
                className="px-6 py-3 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] text-white text-sm font-bold shadow-md transition flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Schedule a Broadcast Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledMessages.map((ann) => {
                const pubDateStr = ann.publish_date 
                  ? new Date(ann.publish_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Pending Date';

                return (
                  <div
                    key={ann.id}
                    className="bg-white rounded-3xl border-2 border-amber-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Scheduled Card Header */}
                    <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-amber-200 flex items-center justify-center font-black text-xs text-white">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-black text-sm">
                            <span>Scheduled for: {pubDateStr}</span>
                            {ann.sender_role === 'trainer' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-amber-900 border border-amber-300">
                                Guru Broadcast • {ann.trainer_name || 'Faculty'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-100 flex items-center gap-2">
                            <span>Target: <strong>{ann.audience}</strong></span>
                            {ann.target_course_title && <span>• {ann.target_course_title}</span>}
                            {ann.target_batch_name && <span>({ann.target_batch_name})</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-white text-amber-800 shadow-2xs">
                          Scheduled Broadcast
                        </span>
                        {renderTypeTagBadge(ann.type_tag)}
                      </div>
                    </div>

                    {/* Scheduled Card Body */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-lg md:text-xl font-black text-gray-900">
                          {ann.title}
                        </h3>

                        {ann.image_url && (
                          <div className="mt-3 max-w-sm rounded-2xl overflow-hidden border border-amber-200 shadow-xs bg-black/5">
                            <img
                              src={ann.image_url}
                              alt={ann.title}
                              className="w-full max-h-56 object-cover"
                            />
                          </div>
                        )}

                        <div className="mt-2.5 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-sm font-semibold text-gray-800 whitespace-pre-line leading-relaxed">
                          {ann.message}
                        </div>

                        {ann.action_links && ann.action_links.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {ann.action_links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 transition shadow-2xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{link.title}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Scheduled Actions Footer */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Queued in Broadcast Outbox</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePublishNow(ann)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                            title="Publish this message immediately"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Publish Now</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(ann)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
                            title="Reschedule / Edit Message"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Reschedule</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAnnouncement(ann)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="Cancel &amp; Delete Schedule"
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
          )}
        </div>
      ) : (
      <div>
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#F0D5E4] shadow-xs space-y-4">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              activeCategory === 'banners' ? 'bg-[#FFF2F8] text-[#8A064D]' : 'bg-emerald-50 text-[#075E54]'
            }`}>
              {activeCategory === 'banners' ? <ImageIcon className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800">
                {activeCategory === 'banners' ? 'No Banner Advertisements Found' : 'No Message Broadcasts Found'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                {activeCategory === 'banners' 
                  ? 'Create vertical poster banner advertisements (3:4 ratio) to showcase in the student mobile app moving carousel.'
                  : 'Broadcast official circulars, exam notifications, and fee reminders to the student app message channel.'}
              </p>
            </div>
            {activeCategory === 'banners' ? (
              <button
                onClick={() => openCreateModal('banner')}
                className="px-6 py-3 rounded-2xl bg-[#8A064D] hover:bg-[#590231] text-white text-sm font-bold shadow-md transition flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Create First Banner Ad</span>
              </button>
            ) : (
              <button
                onClick={() => openCreateModal('message')}
                className="px-6 py-3 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] text-white text-sm font-bold shadow-md transition flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Broadcast First Message</span>
              </button>
            )}
          </div>
        ) : activeCategory === 'banners' ? (
          /* ================================================================= */
          /* 1. APP BANNER ADVERTISEMENTS LIST (3:4 POSTER CAROUSEL POSTERS)   */
          /* ================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.map((ann) => {
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
                          // Fallback to placeholder image
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
                        <button
                          onClick={() => openEditModal(ann)}
                          className="p-1.5 rounded-xl bg-[#FFF2F8] text-[#8A064D] hover:bg-[#FCE7F3]"
                          title="Edit Banner"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingAnnouncement(ann)}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Delete Banner"
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
        ) : (
          /* ================================================================= */
          /* 2. MESSAGE BROADCASTS LIST (OFFICIAL BROADCAST FEED)              */
          /* NO DUPLICATE BUTTON per requirement                               */
          /* ================================================================= */
          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => {
              const pubDateStr = ann.publish_date 
                ? new Date(ann.publish_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';

              // Calculate 30-day lifespan countdown
              const pubTime = new Date(ann.publish_date || ann.created_at).getTime();
              const daysPassed = Math.floor((Date.now() - pubTime) / (1000 * 60 * 60 * 24));
              const daysLeft = Math.max(0, 30 - daysPassed);

              return (
                <div 
                  key={ann.id}
                  className="bg-white rounded-3xl border-2 border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Broadcast Card Header */}
                  <div className="bg-[#075E54] px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/20 border border-emerald-300 flex items-center justify-center font-black text-xs text-emerald-200">
                        {ann.sender_role === 'trainer' ? 'GR' : 'LC'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-black text-sm">
                          {ann.sender_role === 'trainer' ? (
                            <>
                              <span className="text-[#F9E33A]">Guru Broadcast: Guru {ann.trainer_name || 'Faculty Member'}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F9E33A]/20 text-[#F9E33A] border border-[#F9E33A]/40">
                                GURU
                              </span>
                            </>
                          ) : (
                            <>
                              <span>Academy Administration (Sri Ramesh Rao)</span>
                              <ShieldCheck className="w-4 h-4 text-emerald-300" />
                            </>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-100 flex items-center gap-2">
                          <span>Target: <strong>{ann.audience}</strong></span>
                          {ann.target_course_title && <span>• {ann.target_course_title}</span>}
                          {ann.target_batch_name && <span>({ann.target_batch_name})</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderStatusBadge(ann.status)}
                      {renderTypeTagBadge(ann.type_tag)}
                    </div>
                  </div>

                  {/* Card Message Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg md:text-xl font-black text-gray-900">
                          {ann.title}
                        </h3>
                        {/* 30-Day Lifespan Indicator */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Lifespan: {daysLeft} days remaining (30-day auto-clear)</span>
                        </span>
                      </div>

                      {/* Attached Image Preview if present */}
                      {ann.image_url && (
                        <div className="mt-3 max-w-sm rounded-2xl overflow-hidden border border-emerald-200 shadow-xs bg-black/5">
                          <img 
                            src={ann.image_url} 
                            alt={ann.title} 
                            className="w-full max-h-56 object-cover" 
                          />
                        </div>
                      )}

                      <div className="mt-2.5 p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-100 text-sm font-semibold text-gray-800 whitespace-pre-line leading-relaxed">
                        {ann.message}
                      </div>

                      {/* Attached Action Links */}
                      {ann.action_links && ann.action_links.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {ann.action_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-[#31C48D] text-[#075E54] hover:bg-emerald-50 transition shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{link.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delivery & Action Footer (NO DUPLICATE BUTTON per requirement) */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                          <span>Delivered to Student App Messages</span>
                        </div>
                        <span className="text-xs text-gray-400 font-semibold">
                          Published: {pubDateStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewAnnouncement(ann)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Message Preview</span>
                        </button>
                        {/* Duplicate option intentionally removed per requirement */}
                        <button
                          onClick={() => openEditModal(ann)}
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#075E54]"
                          title="Edit Message"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingAnnouncement(ann)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Delete Message"
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
        )}
      </div>
      )}

      {/* ===================================================================== */}
      {/* CREATE & EDIT MODAL (CUSTOMIZED FOR BANNER VS MESSAGE)                 */}
      {/* ===================================================================== */}
      {(isCreateModalOpen || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#F0D5E4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className={`px-6 py-4 text-white flex items-center justify-between border-b ${
              formAnnouncementType === 'banner' ? 'bg-[#590231] border-[#8A064D]' : 'bg-[#075E54] border-[#128C7E]'
            }`}>
              <div className="flex items-center gap-2.5">
                {formAnnouncementType === 'banner' ? (
                  <ImageIcon className="w-5 h-5 text-[#F9E33A]" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-emerald-300" />
                )}
                <div>
                  <h3 className="font-black text-lg text-white">
                    {editingAnnouncement 
                      ? (formAnnouncementType === 'banner' ? 'Edit App Banner Advertisement' : 'Edit Message Broadcast')
                      : (formAnnouncementType === 'banner' ? 'Create App Banner Advertisement' : 'Broadcast Message Announcement')}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    {formAnnouncementType === 'banner' 
                      ? 'Displays in Student Mobile App Home Moving Carousel' 
                      : 'Delivers to Student Mobile App Message Channel (30-day retention)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
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
                    ? (formAnnouncementType === 'banner' ? 'border-[#8A064D] text-[#8A064D]' : 'border-[#075E54] text-[#075E54]')
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                1. Compose & Details
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('preview')}
                className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                  activeFormTab === 'preview'
                    ? (formAnnouncementType === 'banner' ? 'border-[#8A064D] text-[#8A064D]' : 'border-[#075E54] text-[#075E54]')
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>2. Message Preview</span>
              </button>
            </div>

            {/* Form Body */}
            {activeFormTab === 'edit' ? (
              <form 
                onSubmit={editingAnnouncement ? handleSubmitEdit : handleSubmitCreate} 
                className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
              >
                
                {/* 1. Title / Subject */}
                <div>
                  <label className="text-xs font-black text-gray-800 uppercase tracking-wider block mb-1">
                    {formAnnouncementType === 'banner' ? 'Banner Promotional Headline *' : 'Notice Subject / Title *'}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={formAnnouncementType === 'banner' 
                      ? 'Enter banner headline...' 
                      : 'Enter notice subject...'}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-900 focus:outline-none focus:border-[#8A064D]"
                  />
                  {formErrors.title && (
                    <p className="text-xs font-bold text-red-600 mt-1">{formErrors.title}</p>
                  )}
                </div>

                {/* 2. Banner-Specific Section: Image Upload & Presets (REQUIRED FOR BANNERS) */}
                {formAnnouncementType === 'banner' && (
                  <div className="space-y-2 p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-[#590231] uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#8A064D]" />
                        <span>Poster Banner Image (Mandatory for App Carousel) *</span>
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
                      Images are automatically adjusted to the 3:4 vertical flyer aspect ratio to fit the home page moving carousel.
                    </p>

                    {/* Upload button only */}
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
                      <p className="text-xs font-bold text-red-600 mt-1">{formErrors.image_url}</p>
                    )}

                    {/* Poster Preview */}
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
                )}

                {/* 2b. Message-Specific Section: Image Sharing (OPTIONAL FOR MESSAGES) */}
                {formAnnouncementType === 'message' && (
                  <div className="space-y-2 p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-[#075E54] uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span>Attach Image / Flyer (Optional)</span>
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

                    <p className="text-[11px] text-gray-600">
                      Share an invitation poster, schedule chart, or notice photo inside the broadcast message bubble.
                    </p>

                    {/* Upload button only */}
                    <div className="pt-1">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-emerald-500 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-black cursor-pointer transition">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Upload Message Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>
                    </div>

                    {/* Attached Image Thumbnail */}
                    {formData.image_url && (
                      <div className="pt-2 flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-emerald-300 bg-black/5 shrink-0">
                          <img
                            src={formData.image_url}
                            alt="Attached Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs text-gray-600 font-semibold">
                          <span className="text-emerald-800 font-bold block">✓ Image Attached</span>
                          <span>Will be displayed in the message bubble for all recipients.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Description / Message Body */}
                <div>
                  <label className="text-xs font-black text-gray-800 uppercase tracking-wider block mb-1">
                    {formAnnouncementType === 'banner' ? 'Promotional Details' : 'Broadcast Message Content *'}
                  </label>
                  <textarea
                    rows={formAnnouncementType === 'banner' ? 2 : 5}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={formAnnouncementType === 'banner' 
                      ? 'Brief 1-2 line catchphrase...' 
                      : 'Type official circular message content here...'}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#8A064D]"
                  />
                  {formErrors.message && (
                    <p className="text-xs font-bold text-red-600 mt-1">{formErrors.message}</p>
                  )}
                </div>

                {/* 4. Audience & Category Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider block mb-1">
                      Target Audience *
                    </label>
                    <select
                      value={formData.audience}
                      onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                    >
                      <option value="All students">All students</option>
                      <option value="Students and Gurus">Students and Gurus</option>
                      <option value="Selected course or batch">Selected course or batch</option>
                      <option value="Trainers">Trainers (Gurus only)</option>
                      <option value="Chosen recipients">Chosen recipients</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-800 uppercase tracking-wider block mb-1">
                      Category Tag *
                    </label>
                    <select
                      value={formData.type_tag}
                      onChange={(e) => setFormData(prev => ({ ...prev, type_tag: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                    >
                      <option value="General">General</option>
                      <option value="Holiday">Holiday Notice</option>
                      <option value="Schedule change">Schedule Change</option>
                      <option value="Fee reminder">Fee Due Reminder</option>
                      <option value="Cancellation">Class Cancellation</option>
                    </select>
                  </div>
                </div>

                {/* 5. MULTI-COURSE AND MULTI-BATCH SELECTION (When 'Selected course or batch' is chosen) */}
                {formData.audience === 'Selected course or batch' && (
                  <div className="p-4 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] space-y-4">
                    {/* Multi-Course Picker */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-[#8A064D] uppercase tracking-wider block">
                          1. Select Courses ({selectedCourseIds.length} Selected) *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedCourseIds.length === courses.length) {
                              setSelectedCourseIds([]);
                              setSelectedBatchIds([]);
                            } else {
                              setSelectedCourseIds(courses.map(c => c.id));
                            }
                          }}
                          className="text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                        >
                          {selectedCourseIds.length === courses.length ? 'Clear All Courses' : 'Select All Courses'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-[#F0D5E4]">
                        {courses.map(c => {
                          const isSelected = selectedCourseIds.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition border ${
                                isSelected
                                  ? 'bg-[#8A064D] text-white border-[#8A064D]'
                                  : 'bg-[#FFF9FB] text-gray-700 hover:bg-[#FFF2F8] border-[#F0D5E4]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    const next = selectedCourseIds.filter(id => id !== c.id);
                                    setSelectedCourseIds(next);
                                    const removedCourseBatches = batches.filter(b => b.course_id === c.id).map(b => b.id);
                                    setSelectedBatchIds(prev => prev.filter(bid => !removedCourseBatches.includes(bid)));
                                  } else {
                                    setSelectedCourseIds([...selectedCourseIds, c.id]);
                                  }
                                }}
                                className="hidden"
                              />
                              <span className="truncate">{c.title}</span>
                            </label>
                          );
                        })}
                      </div>
                      {formErrors.target_course_id && (
                        <p className="text-xs font-bold text-red-600 mt-1">{formErrors.target_course_id}</p>
                      )}
                    </div>

                    {/* Multi-Batch Picker for selected courses */}
                    {selectedCourseIds.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-black text-[#8A064D] uppercase tracking-wider block">
                            2. Select Batches ({selectedBatchIds.length > 0 ? `${selectedBatchIds.length} Selected` : 'All Batches in Selected Courses'})
                          </label>
                          {availableBatchesForSelectedCourses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedBatchIds.length === availableBatchesForSelectedCourses.length) {
                                  setSelectedBatchIds([]);
                                } else {
                                  setSelectedBatchIds(availableBatchesForSelectedCourses.map(b => b.id));
                                }
                              }}
                              className="text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                            >
                              {selectedBatchIds.length === availableBatchesForSelectedCourses.length ? 'Clear (Defaults to All)' : 'Select All Batches'}
                            </button>
                          )}
                        </div>

                        {availableBatchesForSelectedCourses.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-[#F0D5E4]">
                            {availableBatchesForSelectedCourses.map(b => {
                              const isSelected = selectedBatchIds.includes(b.id);
                              const parentCourse = courses.find(c => c.id === b.course_id);
                              return (
                                <label
                                  key={b.id}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition border ${
                                    isSelected
                                      ? 'bg-[#075E54] text-white border-[#075E54]'
                                      : 'bg-[#F0FDF4] text-gray-700 hover:bg-emerald-50 border-emerald-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedBatchIds(selectedBatchIds.filter(id => id !== b.id));
                                      } else {
                                        setSelectedBatchIds([...selectedBatchIds, b.id]);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <div className="truncate flex flex-col">
                                    <span>{b.name}</span>
                                    {parentCourse && (
                                      <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                        {parentCourse.title}
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic bg-white p-2 rounded-xl border border-[#F0D5E4]">
                            No batches defined for selected courses (will broadcast to all enrolled students).
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. STATUS SELECTION & CONDITIONAL SCHEDULE DATE/TIME */}
                <div>
                  <label className="text-xs font-black text-gray-800 uppercase tracking-wider block mb-1">
                    Dispatch Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as any;
                      setFormData(prev => ({
                        ...prev,
                        status: nextStatus,
                        publish_date: nextStatus === 'Published' ? new Date().toISOString().split('T')[0] : prev.publish_date
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  >
                    <option value="Published">Publish Now</option>
                    <option value="Scheduled">Schedule Later</option>
                    <option value="Draft">Save as Draft</option>
                  </select>
                </div>

                {/* If Publish Now: Inform user of immediate dispatch today */}
                {formData.status === 'Published' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Publish Now: Active immediately with today&apos;s date (<strong>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>).
                    </span>
                  </div>
                )}

                {/* If Schedule Later: Ask for publish date AND publish time */}
                {formData.status === 'Scheduled' && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Schedule Later — Set Target Date & Time</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Publish Date *
                        </label>
                        <input
                          type="date"
                          value={formData.publish_date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-600"
                        />
                        {formErrors.publish_date && (
                          <p className="text-xs font-bold text-red-600 mt-1">{formErrors.publish_date}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Publish Time *
                        </label>
                        <input
                          type="time"
                          value={formData.publish_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, publish_time: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* If Draft */}
                {formData.status === 'Draft' && (
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-2.5 text-xs font-bold text-gray-700">
                    <Archive className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Save as Draft: Stored internally without broadcasting to student or trainer applications.</span>
                  </div>
                )}

                {/* 7. ACTION LINKS SECTION (OPTION TO SHARE MULTIPLE LINK TITLE & URL PAIRS) */}
                <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-black text-[#8A064D] uppercase tracking-wider flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-[#8A064D]" />
                        <span>Action Links / External URLs (Optional)</span>
                      </label>
                      <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                        Add link title and URL pairs (e.g. Register for Workshop, Drive Link, Syllabus PDF)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          action_links: [...prev.action_links, { title: '', url: '' }]
                        }));
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Link</span>
                    </button>
                  </div>

                  {formData.action_links.length === 0 ? (
                    <div className="text-center py-3 bg-white/70 rounded-xl border border-dashed border-[#F0D5E4]">
                      <p className="text-xs text-gray-400 font-medium">
                        No external links attached. Click &quot;+ Add Link&quot; to include clickable links in the mobile app.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {formData.action_links.map((linkItem, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-[#F0D5E4] shadow-xs">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[10px] font-black text-gray-600 uppercase block mb-1">
                                Link Title *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Register for Workshop"
                                value={linkItem.title}
                                onChange={(e) => {
                                  const updated = [...formData.action_links];
                                  updated[idx].title = e.target.value;
                                  setFormData(prev => ({ ...prev, action_links: updated }));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-900 focus:outline-none focus:border-[#8A064D]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-gray-600 uppercase block mb-1">
                                Link URL (https://...) *
                              </label>
                              <input
                                type="url"
                                placeholder="https://example.com/register"
                                value={linkItem.url}
                                onChange={(e) => {
                                  const updated = [...formData.action_links];
                                  updated[idx].url = e.target.value;
                                  setFormData(prev => ({ ...prev, action_links: updated }));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-900 focus:outline-none focus:border-[#8A064D]"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.action_links.filter((_, i) => i !== idx);
                              setFormData(prev => ({ ...prev, action_links: updated }));
                            }}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0 mt-3 sm:mt-0"
                            title="Remove link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-[#F0D5E4] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('preview')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF2F8] text-[#8A064D] hover:bg-[#FCE7F3] text-xs font-black transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Message Preview</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setEditingAnnouncement(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer ${
                        formAnnouncementType === 'banner' ? 'bg-[#8A064D] hover:bg-[#590231]' : 'bg-[#075E54] hover:bg-[#128C7E]'
                      }`}
                    >
                      {isSubmitting ? 'Processing...' : (editingAnnouncement ? 'Save Changes' : (formAnnouncementType === 'banner' ? 'Save & Add Banner' : 'Broadcast Message'))}
                    </button>
                  </div>
                </div>

              </form>
            ) : (
              /* PREVIEW TAB (NO WHATSAPP MENTION) */
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8A064D] bg-[#FFF2F8] p-3 rounded-2xl border border-[#F0D5E4]">
                  <Sparkles className="w-4 h-4 text-[#F9E33A] shrink-0" />
                  <span>
                    {formAnnouncementType === 'banner' 
                      ? 'Live preview of how this banner flyer will appear on the Student App Home Carousel.' 
                      : 'Live preview of how this message will appear inside the Student App message channel.'}
                  </span>
                </div>

                {formAnnouncementType === 'banner' ? (
                  /* Realistic Banner Card Preview */
                  <div className="max-w-xs mx-auto aspect-[3/4] rounded-3xl overflow-hidden border-2 border-[#8A064D]/40 shadow-2xl bg-[#1E0111] relative">
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Preview Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                        <ImageIcon className="w-12 h-12 mb-2" />
                        <span className="text-xs">Attach image to preview</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 flex flex-col justify-between p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-lg bg-black/60 text-[#F9E33A] text-[10px] font-black border border-white/20">
                          App Home Carousel
                        </span>
                        {renderTypeTagBadge(formData.type_tag)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight drop-shadow-sm">
                          {formData.title || '(Untitled Headline)'}
                        </h4>
                        <p className="text-[11px] text-white/80 line-clamp-2 mt-1">
                          {formData.message || '(Promotional catchphrase will appear here...)'}
                        </p>
                        {formData.action_links.filter(l => l.title.trim()).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {formData.action_links.filter(l => l.title.trim()).map((l, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#8A064D]/90 text-white text-[9px] font-bold border border-white/20">
                                <ExternalLink className="w-2.5 h-2.5 text-[#F9E33A]" />
                                <span>{l.title}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Realistic Message Channel Bubble Preview with optional image */
                  <div className="max-w-md mx-auto p-4 rounded-3xl bg-[#ECE5DD] border border-[#F0D5E4] shadow-xl">
                    <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-md space-y-2 border border-black/5">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-xs font-bold text-[#075E54] flex items-center gap-1">
                          Academy Administration <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                        </span>
                        {renderTypeTagBadge(formData.type_tag)}
                      </div>

                      {/* Attached image preview inside bubble */}
                      {formData.image_url && (
                        <div className="rounded-xl overflow-hidden border border-gray-200">
                          <img
                            src={formData.image_url}
                            alt="Attached Notice"
                            className="w-full max-h-48 object-cover"
                          />
                        </div>
                      )}

                      <h4 className="text-sm font-bold text-gray-900">
                        {formData.title || '(Notice Subject)'}
                      </h4>
                      <p className="text-xs font-medium text-gray-700 whitespace-pre-line leading-relaxed">
                        {formData.message || '(Broadcast message content will appear here...)'}
                      </p>

                      {/* Attached action links in message preview */}
                      {formData.action_links.filter(l => l.title.trim()).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {formData.action_links.filter(l => l.title.trim()).map((l, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0FDF4] border border-[#31C48D] text-[#075E54] text-[11px] font-bold">
                              <ExternalLink className="w-3 h-3 text-[#075E54]" />
                              <span>{l.title}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 pt-1">
                        <span>{formData.status === 'Scheduled' ? formData.publish_time : '10:30 AM'}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('edit')}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer"
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
                    className={`px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition cursor-pointer ${
                      formAnnouncementType === 'banner' ? 'bg-[#8A064D] hover:bg-[#590231]' : 'bg-[#075E54] hover:bg-[#128C7E]'
                    }`}
                  >
                    {isSubmitting ? 'Publishing...' : 'Looks Great! Confirm & Dispatch'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STANDALONE PREVIEW MODAL                                              */}
      {/* ===================================================================== */}
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

            {isBanner(previewAnnouncement) ? (
              /* Banner Modal Preview */
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Student App Home Carousel Banner</span>
                </div>
                {previewAnnouncement.image_url && (
                  <div className="max-w-xs mx-auto aspect-[3/4] rounded-2xl overflow-hidden border border-[#F0D5E4] shadow-md bg-[#1E0111]">
                    <img
                      src={previewAnnouncement.image_url}
                      alt={previewAnnouncement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-lg font-black text-[#590231] text-center">
                  {previewAnnouncement.title}
                </h3>
                <p className="text-xs font-semibold text-gray-700 text-center">
                  {previewAnnouncement.message}
                </p>
                {previewAnnouncement.action_links && previewAnnouncement.action_links.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
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
            ) : (
              /* Message Preview (NO WHATSAPP MENTION) */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#075E54]">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Student Messages Broadcast</span>
                  </div>
                  <span className="text-amber-800 text-[10px] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    30-Day Retention
                  </span>
                </div>
                <div className="bg-[#ECE5DD] p-4 rounded-2xl">
                  <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#075E54] border-b border-gray-100 pb-1.5">
                      <span className="flex items-center gap-1">
                        Academy Office <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                      </span>
                      {renderTypeTagBadge(previewAnnouncement.type_tag)}
                    </div>

                    {/* Attached image preview */}
                    {previewAnnouncement.image_url && (
                      <div className="rounded-xl overflow-hidden border border-gray-200">
                        <img
                          src={previewAnnouncement.image_url}
                          alt={previewAnnouncement.title}
                          className="w-full max-h-56 object-cover"
                        />
                      </div>
                    )}

                    <h4 className="text-base font-black text-gray-900">
                      {previewAnnouncement.title}
                    </h4>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      {previewAnnouncement.message}
                    </p>

                    {/* Action Links */}
                    {previewAnnouncement.action_links && previewAnnouncement.action_links.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {previewAnnouncement.action_links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#31C48D] text-[#075E54] hover:bg-emerald-50 text-xs font-bold transition shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#075E54]" />
                            <span>{link.title}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 pt-1">
                      <span>10:30 AM</span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#F0D5E4] flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Published: {new Date(previewAnnouncement.publish_date).toLocaleDateString('en-GB')}</span>
              <button
                onClick={() => setPreviewAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DELETE CONFIRMATION MODAL                                              */}
      {/* ===================================================================== */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">Delete Announcement?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to remove &quot;{deletingAnnouncement.title}&quot;? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingAnnouncement(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

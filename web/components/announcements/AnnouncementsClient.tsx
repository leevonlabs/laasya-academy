'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles, 
  Image as ImageIcon, 
  Upload,
  MessageSquare,
  CheckCheck,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Filter,
  Calendar,
  UserCheck,
  GraduationCap,
  ChevronRight,
  Phone,
  RefreshCw,
  Mail,
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

interface Trainer {
  id: string;
  full_name: string;
  display_title?: string;
  phone?: string;
  email?: string;
}

interface RecipientStudent {
  id: string;
  roll_number: string;
  full_name: string;
  email?: string;
  phone?: string;
  parent_name?: string;
  parent_contact?: string;
  course_title?: string;
  batch_name?: string;
}

interface Props {
  initialAnnouncements: Announcement[];
  courses: Course[];
  batches: Batch[];
  trainers?: Trainer[];
}

export default function AnnouncementsClient({ initialAnnouncements, courses, batches, trainers = [] }: Props) {
  // Filter out any legacy pure banner ads if any
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    initialAnnouncements.filter(a => a.announcement_type !== 'banner')
  );

  // Active Tab: 'admin_sent' vs 'guru_sent'
  const [activeTab, setActiveTab] = useState<'admin_sent' | 'guru_sent'>('admin_sent');

  // Default Current Month Dates
  const defaultDates = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { firstDay, lastDay };
  }, []);

  // Filter Form State for Guru Sent Messages
  const [filterGuruId, setFilterGuruId] = useState('all');
  const [filterCourseId, setFilterCourseId] = useState('all');
  const [filterBatchId, setFilterBatchId] = useState('all');
  const [guruStartDate, setGuruStartDate] = useState(defaultDates.firstDay);
  const [guruEndDate, setGuruEndDate] = useState(defaultDates.lastDay);

  // Applied Filters State for Guru Sent (Admin clicks "View Messages" to apply)
  const [appliedGuruFilters, setAppliedGuruFilters] = useState({
    guruId: 'all',
    courseId: 'all',
    batchId: 'all',
    startDate: defaultDates.firstDay,
    endDate: defaultDates.lastDay,
    hasApplied: false
  });

  // Filter State for Admin Sent Messages
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminTypeTagFilter, setAdminTypeTagFilter] = useState('all');
  const [adminAudienceFilter, setAdminAudienceFilter] = useState('all');
  const [adminStartDate, setAdminStartDate] = useState(defaultDates.firstDay);
  const [adminEndDate, setAdminEndDate] = useState(defaultDates.lastDay);

  // Applied Filters State for Admin Sent
  const [appliedAdminFilters, setAppliedAdminFilters] = useState({
    search: '',
    typeTag: 'all',
    audience: 'all',
    startDate: defaultDates.firstDay,
    endDate: defaultDates.lastDay,
    hasApplied: false
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Eye Details Modal State
  const [detailModalAnnouncement, setDetailModalAnnouncement] = useState<Announcement | null>(null);

  // Students Recipient Modal State
  const [recipientModalAnnouncement, setRecipientModalAnnouncement] = useState<Announcement | null>(null);
  const [recipientStudents, setRecipientStudents] = useState<RecipientStudent[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');

  // Compose / Edit Form State (Reference Image 1)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
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
  const [activeFormTab, setActiveFormTab] = useState<'compose' | 'preview'>('compose');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to distinguish Admin Sent vs Guru Sent
  const isGuruSent = (ann: Announcement) => {
    if (ann.sender_role === 'trainer') return true;
    if (ann.trainer_id || ann.trainer_name) return true;
    const author = ann.created_by?.toLowerCase() || '';
    if (author.includes('guru') || author.includes('trainer') || author.includes('faculty')) return true;
    return false;
  };

  const isAdminSent = (ann: Announcement) => {
    return !isGuruSent(ann);
  };

  // Batches filtered by selected course for filter dropdown
  const filteredBatchesForFilter = useMemo(() => {
    if (filterCourseId === 'all') return batches;
    return batches.filter(b => b.course_id === filterCourseId);
  }, [batches, filterCourseId]);

  // Handle Apply Filter for Guru Sent
  const handleApplyGuruFilters = () => {
    setAppliedGuruFilters({
      guruId: filterGuruId,
      courseId: filterCourseId,
      batchId: filterBatchId,
      startDate: guruStartDate,
      endDate: guruEndDate,
      hasApplied: true
    });
  };

  // Handle Reset Filter for Guru Sent
  const handleResetGuruFilters = () => {
    setFilterGuruId('all');
    setFilterCourseId('all');
    setFilterBatchId('all');
    setGuruStartDate(defaultDates.firstDay);
    setGuruEndDate(defaultDates.lastDay);
    setAppliedGuruFilters({
      guruId: 'all',
      courseId: 'all',
      batchId: 'all',
      startDate: defaultDates.firstDay,
      endDate: defaultDates.lastDay,
      hasApplied: false
    });
  };

  // Handle Apply Filter for Admin Sent
  const handleApplyAdminFilters = () => {
    setAppliedAdminFilters({
      search: adminSearchQuery,
      typeTag: adminTypeTagFilter,
      audience: adminAudienceFilter,
      startDate: adminStartDate,
      endDate: adminEndDate,
      hasApplied: true
    });
  };

  // Handle Reset Filter for Admin Sent
  const handleResetAdminFilters = () => {
    setAdminSearchQuery('');
    setAdminTypeTagFilter('all');
    setAdminAudienceFilter('all');
    setAdminStartDate(defaultDates.firstDay);
    setAdminEndDate(defaultDates.lastDay);
    setAppliedAdminFilters({
      search: '',
      typeTag: 'all',
      audience: 'all',
      startDate: defaultDates.firstDay,
      endDate: defaultDates.lastDay,
      hasApplied: false
    });
  };

  // Filtered Guru Sent Messages
  const guruMessages = useMemo(() => {
    return announcements.filter(ann => {
      if (!isGuruSent(ann)) return false;

      // Guru filter
      if (appliedGuruFilters.guruId !== 'all') {
        const matchesId = ann.trainer_id === appliedGuruFilters.guruId;
        const selectedTrainer = trainers.find(t => t.id === appliedGuruFilters.guruId);
        const matchesName = selectedTrainer && ann.trainer_name?.toLowerCase().includes(selectedTrainer.full_name.toLowerCase());
        if (!matchesId && !matchesName) return false;
      }

      // Course filter
      if (appliedGuruFilters.courseId !== 'all') {
        const matchesCourse = ann.target_course_id?.includes(appliedGuruFilters.courseId);
        if (!matchesCourse) return false;
      }

      // Batch filter
      if (appliedGuruFilters.batchId !== 'all') {
        const matchesBatch = ann.target_batch_id?.includes(appliedGuruFilters.batchId);
        if (!matchesBatch) return false;
      }

      // Date Range filter
      const dateStr = ann.publish_date?.split('T')[0] || ann.created_at?.split('T')[0];
      if (dateStr) {
        if (appliedGuruFilters.startDate && dateStr < appliedGuruFilters.startDate) return false;
        if (appliedGuruFilters.endDate && dateStr > appliedGuruFilters.endDate) return false;
      }

      return true;
    });
  }, [announcements, appliedGuruFilters, trainers]);

  // Filtered Admin Sent Messages
  const adminMessages = useMemo(() => {
    return announcements.filter(ann => {
      if (!isAdminSent(ann)) return false;

      // Search
      if (appliedAdminFilters.search.trim()) {
        const q = appliedAdminFilters.search.toLowerCase();
        const matchesTitle = ann.title?.toLowerCase().includes(q);
        const matchesMsg = ann.message?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }

      // Type Tag
      if (appliedAdminFilters.typeTag !== 'all' && ann.type_tag !== appliedAdminFilters.typeTag) {
        return false;
      }

      // Audience
      if (appliedAdminFilters.audience !== 'all' && ann.audience !== appliedAdminFilters.audience) {
        return false;
      }

      // Date Range
      const dateStr = ann.publish_date?.split('T')[0] || ann.created_at?.split('T')[0];
      if (dateStr) {
        if (appliedAdminFilters.startDate && dateStr < appliedAdminFilters.startDate) return false;
        if (appliedAdminFilters.endDate && dateStr > appliedAdminFilters.endDate) return false;
      }

      return true;
    });
  }, [announcements, appliedAdminFilters]);

  // Combined Messages (sorted chronologically oldest to newest for realistic chat timeline)
  const combinedChronologicalMessages = useMemo(() => {
    const list = [...announcements];
    list.sort((a, b) => {
      const timeA = new Date(a.publish_date || a.created_at).getTime();
      const timeB = new Date(b.publish_date || b.created_at).getTime();
      return timeA - timeB;
    });
    return list;
  }, [announcements]);

  // Fetch Recipients for "View Students" button
  const handleOpenRecipientsModal = async (ann: Announcement) => {
    setRecipientModalAnnouncement(ann);
    setIsLoadingRecipients(true);
    setRecipientStudents([]);
    setRecipientSearchQuery('');

    try {
      const res = await fetch(`/api/announcements/${ann.id}/students`);
      const data = await res.json();
      if (data.success && Array.isArray(data.students)) {
        setRecipientStudents(data.students);
      } else {
        showToast(data.error || 'Failed to load recipients list', 'error');
      }
    } catch {
      showToast('Network error loading student recipients', 'error');
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  // Filtered recipients search inside modal
  const filteredRecipientStudents = useMemo(() => {
    if (!recipientSearchQuery.trim()) return recipientStudents;
    const q = recipientSearchQuery.toLowerCase();
    return recipientStudents.filter(s => 
      s.full_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.parent_name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.parent_contact?.includes(q)
    );
  }, [recipientStudents, recipientSearchQuery]);

  // Image Upload Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 900;
        const maxH = 900;
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
    setActiveFormTab('compose');
    setIsCreateModalOpen(true);
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
    setActiveFormTab('compose');
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Notice title is required';
    }
    if (!formData.message || !formData.message.trim()) {
      errors.message = 'Broadcast message content is required';
    }
    if (formData.status === 'Scheduled' && !formData.publish_date) {
      errors.publish_date = 'Scheduled date is required';
    }
    if (formData.audience === 'Selected course or batch' && selectedCourseIds.length === 0) {
      errors.target_course_id = 'Please select at least one course';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Submit Create
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setActiveFormTab('compose');
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

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publish_date: effectivePublishDate,
          announcement_type: 'message',
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
        showToast('Message broadcasted directly to student mobile apps!');
      } else {
        showToast(json.error || 'Failed to broadcast message', 'error');
      }
    } catch {
      showToast('Network error while broadcasting message', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement || !validateForm()) {
      setActiveFormTab('compose');
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
          announcement_type: 'message',
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
        showToast('Broadcast message updated successfully!');
      } else {
        showToast(json.error || 'Failed to update broadcast message', 'error');
      }
    } catch {
      showToast('Network error while updating broadcast message', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete
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
        showToast('Message deleted successfully.');
      } else {
        showToast(json.error || 'Failed to delete message', 'error');
      }
    } catch {
      showToast('Network error while deleting message', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatted date and time helper
  const formatDateTime = (dateStr?: string, createdStr?: string) => {
    const raw = dateStr || createdStr;
    if (!raw) return { date: '—', time: '—' };
    const d = new Date(raw);
    const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date: dateFormatted, time: timeFormatted };
  };

  // Render Category Tag Badge
  const renderCategoryTag = (tag: string) => {
    let colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    if (tag === 'Holiday') colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    if (tag === 'Fee reminder') colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    if (tag === 'Schedule change') colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
    if (tag === 'Cancellation') colorClasses = 'bg-red-50 text-red-700 border-red-200';

    return (
      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${colorClasses}`}>
        {tag}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${
            toastMessage.type === 'success' ? 'bg-[#075E54]' : 'bg-rose-600'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#0A473E] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-[#25D366] text-xs font-black tracking-wide uppercase">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Style Broadcast Messages</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Announcements & Message Broadcasts
            </h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
              Official circulars, exam notifications, and faculty messages delivered directly to student mobile app inboxes. Admin messages align on right, and Guru messages align on left.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              className="px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-[#075E54] text-xs sm:text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#075E54]" />
              <span>Broadcast New Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs: "Admin Sent" and "Guru Sent" */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('admin_sent')}
          className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'admin_sent'
              ? 'bg-[#075E54] text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin Sent</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
            activeTab === 'admin_sent' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {adminMessages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('guru_sent')}
          className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'guru_sent'
              ? 'bg-[#075E54] text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Guru Sent</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
            activeTab === 'guru_sent' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {guruMessages.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 1. GURU SENT TAB WITH REPORT-STYLE FILTER BAR                         */}
      {/* ===================================================================== */}
      {activeTab === 'guru_sent' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter Bar (Guru, Course, Batch, Date Range, View Messages Button) */}
          <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#075E54] uppercase tracking-wider">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Filter Faculty Guru Broadcasts</span>
              </div>
              <span className="text-[11px] font-bold text-gray-400">
                Default: Current Month ({new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Guru Filter */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Guru / Faculty:</label>
                <select
                  value={filterGuruId}
                  onChange={(e) => setFilterGuruId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white"
                >
                  <option value="all">All Gurus / Faculty</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Course:</label>
                <select
                  value={filterCourseId}
                  onChange={(e) => {
                    setFilterCourseId(e.target.value);
                    setFilterBatchId('all');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Batch:</label>
                <select
                  value={filterBatchId}
                  onChange={(e) => setFilterBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white"
                >
                  <option value="all">All Batches</option>
                  {filteredBatchesForFilter.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">From Date:</label>
                <input
                  type="date"
                  value={guruStartDate}
                  onChange={(e) => setGuruStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">To Date:</label>
                <input
                  type="date"
                  value={guruEndDate}
                  onChange={(e) => setGuruEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white"
                />
              </div>
            </div>

            {/* Filter Actions: "View Messages" Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-medium text-gray-500">
                Found <span className="font-bold text-[#075E54]">{guruMessages.length}</span> faculty broadcasts
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetGuruFilters}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApplyGuruFilters}
                  className="px-6 py-2 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Messages</span>
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Chat View for Guru Messages */}
          <div className="rounded-3xl p-6 sm:p-8 bg-[#EFEAE2] border border-gray-300 shadow-inner min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            {/* Subtle WhatsApp wallpaper watermark feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#075E54_1px,transparent_1px)] [background-size:16px_16px]" />

            {guruMessages.length === 0 ? (
              <div className="my-auto text-center py-12 space-y-3 bg-white/70 backdrop-blur-xs rounded-3xl p-8 max-w-md mx-auto border border-gray-200">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-gray-800">No Guru Messages Found</h3>
                <p className="text-xs text-gray-500">
                  No messages match the current filter selection. Adjust the Guru, course, or date range and click "View Messages".
                </p>
                <button
                  onClick={handleResetGuruFilters}
                  className="px-4 py-2 rounded-xl bg-[#075E54] text-white text-xs font-bold cursor-pointer"
                >
                  Show All Current Month Messages
                </button>
              </div>
            ) : (
              <div className="space-y-6 relative z-10 max-w-4xl mx-auto w-full">
                {/* Date Header Pill */}
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-white/90 shadow-xs border border-gray-200 text-[11px] font-black uppercase text-gray-600 tracking-wider">
                    Guru Broadcast History
                  </span>
                </div>

                {/* Left Aligned Guru Messages */}
                {guruMessages.map((ann) => {
                  const { date, time } = formatDateTime(ann.publish_date, ann.created_at);

                  return (
                    <div key={ann.id} className="flex justify-start">
                      <div className="max-w-xl w-full bg-white rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-md border border-gray-200 space-y-3">
                        {/* Header: Guru Name and Role */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#075E54] flex items-center justify-center font-black text-xs">
                              🙏
                            </div>
                            <div>
                              <div className="text-xs font-black text-[#075E54] flex items-center gap-1.5">
                                <span>Guru: {ann.trainer_name || ann.created_by || 'Faculty Guru'}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Faculty
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-medium">
                                {date} at {time}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {renderCategoryTag(ann.type_tag)}
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <h4 className="text-sm font-black text-gray-900 leading-snug">
                            {ann.title}
                          </h4>
                          {/* Target info */}
                          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 font-semibold mt-1">
                            {ann.target_course_title && (
                              <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700">
                                📚 {ann.target_course_title}
                              </span>
                            )}
                            {ann.target_batch_name && (
                              <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700">
                                👥 {ann.target_batch_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attached Image if present */}
                        {ann.image_url && (
                          <div className="rounded-xl overflow-hidden border border-gray-200 max-h-56 bg-black/5">
                            <img
                              src={ann.image_url}
                              alt={ann.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Message Content */}
                        <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                          {ann.message}
                        </p>

                        {/* Action Links */}
                        {ann.action_links && ann.action_links.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {ann.action_links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-[#075E54] border border-emerald-200 hover:bg-emerald-100 transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>{link.title}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Card Footer with Details Button */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Megaphone className="w-3 h-3 text-[#075E54]" />
                            <span>Broadcasted to Enrolled Disciples</span>
                          </div>

                          {/* Eye Details Button */}
                          <button
                            onClick={() => setDetailModalAnnouncement(ann)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#075E54] text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details & Students</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. ADMIN SENT TAB WITH RIGHT-ALIGNED WHATSAPP BUBBLES                 */}
      {/* ===================================================================== */}
      {activeTab === 'admin_sent' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Admin Sent Filter Bar */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  placeholder="Search admin messages..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-medium text-gray-800"
                />
              </div>

              {/* Category Tag */}
              <div>
                <select
                  value={adminTypeTagFilter}
                  onChange={(e) => setAdminTypeTagFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-bold text-gray-700 bg-white"
                >
                  <option value="all">All Category Tags</option>
                  <option value="General">General Circular</option>
                  <option value="Holiday">Holiday Notice</option>
                  <option value="Schedule change">Schedule Update</option>
                  <option value="Cancellation">Class Cancellation</option>
                  <option value="Fee reminder">Fee Reminder</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <select
                  value={adminAudienceFilter}
                  onChange={(e) => setAdminAudienceFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-bold text-gray-700 bg-white"
                >
                  <option value="all">All Audiences</option>
                  <option value="All students">All Students</option>
                  <option value="Students and Gurus">Students and Gurus</option>
                  <option value="Selected course or batch">Selected Course / Batch</option>
                  <option value="Trainers">Faculty Gurus</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAdminFilters}
                  className="flex-1 py-2.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleApplyAdminFilters}
                  className="flex-1 py-2.5 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-md transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Chat View for Admin Messages */}
          <div className="rounded-3xl p-6 sm:p-8 bg-[#EFEAE2] border border-gray-300 shadow-inner min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#075E54_1px,transparent_1px)] [background-size:16px_16px]" />

            {adminMessages.length === 0 ? (
              <div className="my-auto text-center py-12 space-y-3 bg-white/70 backdrop-blur-xs rounded-3xl p-8 max-w-md mx-auto border border-gray-200">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#075E54] mx-auto flex items-center justify-center">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-gray-800">No Admin Broadcasts Found</h3>
                <p className="text-xs text-gray-500">
                  Broadcast official notices, fee reminders, and circulars directly to student app message feeds.
                </p>
                <button
                  onClick={openCreateModal}
                  className="px-5 py-2.5 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  + Broadcast First Message
                </button>
              </div>
            ) : (
              <div className="space-y-6 relative z-10 max-w-4xl mx-auto w-full">
                {/* Date Header Pill */}
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-white/90 shadow-xs border border-gray-200 text-[11px] font-black uppercase text-gray-600 tracking-wider">
                    Official Academy Dispatches
                  </span>
                </div>

                {/* Right Aligned Admin Messages */}
                {adminMessages.map((ann) => {
                  const { date, time } = formatDateTime(ann.publish_date, ann.created_at);

                  return (
                    <div key={ann.id} className="flex justify-end">
                      <div className="max-w-xl w-full bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-4 sm:p-5 shadow-md border border-[#C2EDB9] space-y-3">
                        {/* Header: Admin / Director Info */}
                        <div className="flex items-center justify-between border-b border-[#C2EDB9] pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#075E54] text-white flex items-center justify-center font-black text-xs shadow-xs">
                              👑
                            </div>
                            <div>
                              <div className="text-xs font-black text-[#075E54] flex items-center gap-1.5">
                                <span>Academy Administration</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#075E54] text-white">
                                  Director / Admin
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 font-medium">
                                {date} at {time}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {renderCategoryTag(ann.type_tag)}
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <h4 className="text-sm font-black text-gray-900 leading-snug">
                            {ann.title}
                          </h4>
                          {/* Target Audience Pill */}
                          <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 font-semibold mt-1">
                            <span className="px-2 py-0.5 rounded-lg bg-white/70 text-[#075E54] border border-[#C2EDB9]">
                              🎯 Target: {ann.audience}
                            </span>
                            {ann.target_course_title && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/70 text-gray-700">
                                📚 {ann.target_course_title}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attached Image if present */}
                        {ann.image_url && (
                          <div className="rounded-xl overflow-hidden border border-[#C2EDB9] max-h-56 bg-black/5">
                            <img
                              src={ann.image_url}
                              alt={ann.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Message Content */}
                        <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                          {ann.message}
                        </p>

                        {/* Action Links */}
                        {ann.action_links && ann.action_links.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {ann.action_links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white text-[#075E54] border border-[#C2EDB9] hover:bg-emerald-50 transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>{link.title}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Card Footer with Details, Edit & Delete */}
                        <div className="pt-2 border-t border-[#C2EDB9] flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                            <span>Delivered to Student Inboxes</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Eye Details Button */}
                            <button
                              onClick={() => setDetailModalAnnouncement(ann)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#075E54] text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details & Students</span>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(ann)}
                              className="p-1.5 rounded-xl bg-white hover:bg-emerald-50 text-gray-700 cursor-pointer shadow-xs"
                              title="Edit Message"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeletingAnnouncement(ann)}
                              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 cursor-pointer shadow-xs"
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. EYE DETAILS MODAL WITH "VIEW STUDENTS" BUTTON                      */}
      {/* ===================================================================== */}
      {detailModalAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm ${
                  isGuruSent(detailModalAnnouncement) ? 'bg-emerald-100 text-[#075E54]' : 'bg-[#075E54] text-white'
                }`}>
                  {isGuruSent(detailModalAnnouncement) ? '🙏' : '👑'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Broadcast Message Details</h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {isGuruSent(detailModalAnnouncement) ? 'Sent by Faculty Guru' : 'Sent by Academy Administration'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalAnnouncement(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender & Target Information Table */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 font-bold">Sender: </span>
                  <span className="font-black text-gray-900">
                    {detailModalAnnouncement.trainer_name || detailModalAnnouncement.created_by || 'Director'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold">Role: </span>
                  <span className="font-black text-[#075E54]">
                    {isGuruSent(detailModalAnnouncement) ? 'Faculty Guru' : 'Admin / Director'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold">Date & Time: </span>
                  <span className="font-bold text-gray-800">
                    {formatDateTime(detailModalAnnouncement.publish_date, detailModalAnnouncement.created_at).date} at {formatDateTime(detailModalAnnouncement.publish_date, detailModalAnnouncement.created_at).time}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-bold">Category: </span>
                  {renderCategoryTag(detailModalAnnouncement.type_tag)}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="text-gray-500 font-bold">Targeted Audience & Batch:</div>
                <div className="font-bold text-gray-800 mt-0.5">
                  {detailModalAnnouncement.target_course_title 
                    ? `Course: ${detailModalAnnouncement.target_course_title}` 
                    : `Audience: ${detailModalAnnouncement.audience}`}
                  {detailModalAnnouncement.target_batch_name && ` • Batch: ${detailModalAnnouncement.target_batch_name}`}
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <h4 className="text-base font-black text-gray-900">
                {detailModalAnnouncement.title}
              </h4>
              <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium bg-[#F8FAF9] p-4 rounded-2xl border border-gray-100">
                {detailModalAnnouncement.message}
              </p>
            </div>

            {/* Attached Photo */}
            {detailModalAnnouncement.image_url && (
              <div className="rounded-2xl overflow-hidden border border-gray-200 max-h-64 bg-black/5">
                <img
                  src={detailModalAnnouncement.image_url}
                  alt={detailModalAnnouncement.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Action Links */}
            {detailModalAnnouncement.action_links && detailModalAnnouncement.action_links.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-500">Action Links:</div>
                <div className="flex flex-wrap gap-2">
                  {detailModalAnnouncement.action_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#075E54] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: "View Students" Button */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDetailModalAnnouncement(null)}
                className="px-4 py-2 rounded-xl text-gray-600 text-xs font-bold hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const ann = detailModalAnnouncement;
                  setDetailModalAnnouncement(null);
                  handleOpenRecipientsModal(ann);
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>View Recipient Students</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. RECIPIENT STUDENTS MODAL (LIST OF STUDENTS WHO RECEIVED MESSAGE)  */}
      {/* ===================================================================== */}
      {recipientModalAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#075E54] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Message Recipient Disciples</h3>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-md">
                    Targeted for: <span className="font-bold text-gray-800">"{recipientModalAnnouncement.title}"</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRecipientModalAnnouncement(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-bold text-gray-700">
                Total Recipient Disciples:{' '}
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#075E54] font-black">
                  {recipientStudents.length}
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={recipientSearchQuery}
                  onChange={(e) => setRecipientSearchQuery(e.target.value)}
                  placeholder="Search disciple or roll no..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#075E54] w-56"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
              {isLoadingRecipients ? (
                <div className="py-16 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#075E54] mx-auto" />
                  <p className="text-xs font-bold text-gray-500">Loading recipient student list...</p>
                </div>
              ) : filteredRecipientStudents.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 font-medium">
                  {recipientStudents.length === 0 
                    ? 'No students enrolled in this target batch or course.' 
                    : 'No matching students found.'}
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Course & Batch</th>
                      <th className="py-2.5 px-3">Parent Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecipientStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-emerald-50/40 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-700">
                          {st.roll_number || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          {st.full_name}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          <div className="font-semibold text-gray-800">{st.course_title || 'General'}</div>
                          <div className="text-[11px] text-gray-400">{st.batch_name || 'Active Batch'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          <div className="font-semibold">{st.parent_name || 'Parent'}</div>
                          <div className="text-[11px] text-[#075E54] font-mono">
                            {st.parent_contact || st.phone || '—'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Verified delivery to Student Mobile App notifications & messages feed.
              </span>
              <button
                type="button"
                onClick={() => setRecipientModalAnnouncement(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. ADMIN COMPOSE MODAL (EXACTLY MATCHING REFERENCE IMAGE 1)           */}
      {/* ===================================================================== */}
      {(isCreateModalOpen || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header: Dark Green with Message Icon */}
            <div className="bg-[#075E54] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingAnnouncement ? 'Edit Broadcast Message Announcement' : 'Broadcast Message Announcement'}
                  </h3>
                  <p className="text-xs text-white/80">
                    Delivers to Student Mobile App Message Channel (30-day retention)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs matching Reference Image 1 */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setActiveFormTab('compose')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition ${
                  activeFormTab === 'compose'
                    ? 'border-[#075E54] text-[#075E54] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                1. COMPOSE & DETAILS
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('preview')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center justify-center gap-1.5 ${
                  activeFormTab === 'preview'
                    ? 'border-[#075E54] text-[#075E54] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>2. MESSAGE PREVIEW</span>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={editingAnnouncement ? handleSubmitEdit : handleSubmitCreate} className="p-6 space-y-5">
              {activeFormTab === 'compose' ? (
                <>
                  {/* NOTICE SUBJECT / TITLE * with Enhance button */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        NOTICE SUBJECT / TITLE *
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
                      placeholder="Enter notice subject..."
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-bold text-gray-800 bg-[#F9FAFB]"
                    />
                    {formErrors.title && <p className="text-xs font-bold text-rose-600">{formErrors.title}</p>}
                  </div>

                  {/* ATTACH IMAGE / FLYER (OPTIONAL) matching Reference Image 1 */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-[#075E54] uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span>ATTACH IMAGE / FLYER (OPTIONAL)</span>
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
                          Image attached! Will appear inside the broadcast chat bubble.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BROADCAST MESSAGE CONTENT * with Enhance button */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        BROADCAST MESSAGE CONTENT *
                      </label>
                      <AiEnhanceButton
                        context="announcement_message"
                        value={formData.message}
                        onEnhance={(text: string) => setFormData(prev => ({ ...prev, message: text }))}
                      />
                    </div>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Type official circular message content here..."
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-medium text-gray-800 bg-[#F9FAFB]"
                    />
                    {formErrors.message && <p className="text-xs font-bold text-rose-600">{formErrors.message}</p>}
                  </div>

                  {/* TARGET AUDIENCE * & CATEGORY TAG * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        TARGET AUDIENCE *
                      </label>
                      <select
                        value={formData.audience}
                        onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-bold text-gray-700 bg-white"
                      >
                        <option value="All students">All students</option>
                        <option value="Students and Gurus">Students and Gurus</option>
                        <option value="Selected course or batch">Selected course or batch</option>
                        <option value="Trainers">Faculty Gurus</option>
                        <option value="Chosen recipients">Chosen recipients</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        CATEGORY TAG *
                      </label>
                      <select
                        value={formData.type_tag}
                        onChange={(e) => setFormData(prev => ({ ...prev, type_tag: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-bold text-gray-700 bg-white"
                      >
                        <option value="General">General</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Schedule change">Schedule change</option>
                        <option value="Cancellation">Cancellation</option>
                        <option value="Fee reminder">Fee reminder</option>
                      </select>
                    </div>
                  </div>

                  {/* Course & Batch Selection when "Selected course or batch" is selected */}
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
                                    ? 'bg-[#075E54] text-white shadow-xs' 
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

                  {/* DISPATCH STATUS * */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      DISPATCH STATUS *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-bold text-gray-700 bg-white"
                    >
                      <option value="Published">Publish Now</option>
                      <option value="Scheduled">Schedule Later</option>
                      <option value="Draft">Save as Draft</option>
                    </select>
                  </div>

                  {/* Informational banner matching Reference Image 1 */}
                  {formData.status === 'Published' && (
                    <div className="p-3.5 rounded-2xl bg-[#E8F8F0] border border-[#BCE8D0] flex items-center gap-2.5 text-xs font-bold text-[#075E54]">
                      <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                      <span>
                        Publish Now: Active immediately with today's date ({new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}).
                      </span>
                    </div>
                  )}

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

                  {/* ACTION LINKS / EXTERNAL URLS (OPTIONAL) matching Reference Image 1 */}
                  <div className="space-y-2 p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-[#8A064D] uppercase tracking-wider flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>ACTION LINKS / EXTERNAL URLS (OPTIONAL)</span>
                        </label>
                        <p className="text-[11px] text-gray-500 mt-0.5">
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
                        className="px-3 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-xs"
                      >
                        + Add Link
                      </button>
                    </div>

                    {formData.action_links.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400 font-medium bg-white">
                        No external links attached. Click "+ Add Link" to include clickable links in the mobile app.
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {formData.action_links.map((link, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={link.title}
                              placeholder="Link Title (e.g. Workshop Registration)"
                              onChange={(e) => {
                                const newLinks = [...formData.action_links];
                                newLinks[idx].title = e.target.value;
                                setFormData(prev => ({ ...prev, action_links: newLinks }));
                              }}
                              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
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
                              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  action_links: prev.action_links.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
                /* 2. MESSAGE PREVIEW TAB */
                <div className="space-y-4 py-2">
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-500">Live Preview in Student App WhatsApp Channel</p>
                  </div>

                  <div className="max-w-md mx-auto bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-4 shadow-md border border-[#C2EDB9] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#C2EDB9] pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#075E54] text-white flex items-center justify-center font-black text-xs">
                          👑
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#075E54]">Academy Administration</div>
                          <div className="text-[10px] text-gray-500">Today, 10:30 AM</div>
                        </div>
                      </div>
                      {renderCategoryTag(formData.type_tag)}
                    </div>

                    <h4 className="text-sm font-black text-gray-900 leading-snug">
                      {formData.title || 'Notice Subject'}
                    </h4>

                    {formData.image_url && (
                      <div className="rounded-xl overflow-hidden border border-[#C2EDB9] max-h-48">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                      {formData.message || 'Broadcast message content will appear here...'}
                    </p>

                    <div className="pt-2 border-t border-[#C2EDB9] flex items-center justify-between text-[10px] text-gray-500">
                      <span>Target: {formData.audience}</span>
                      <div className="flex items-center gap-1">
                        <span>10:30 AM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
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
                  className="px-6 py-2.5 rounded-2xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting 
                    ? 'Broadcasting...' 
                    : editingAnnouncement 
                      ? 'Update Broadcast' 
                      : 'Broadcast Message Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. DELETE CONFIRMATION MODAL                                          */}
      {/* ===================================================================== */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">Delete Broadcast Message?</h3>
              <p className="text-xs text-gray-600">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{deletingAnnouncement.title}"</span>? It will be removed from all student inboxes.
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
    </div>
  );
}

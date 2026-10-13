'use client';

import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  X, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Users, 
  Send, 
  Sparkles, 
  MessageSquare, 
  ExternalLink,
  Calendar,
  Filter,
  Check,
  Phone,
  Mail,
  GraduationCap,
  BookOpen
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
  avatar_url?: string;
  display_title?: string;
  phone?: string;
}

interface Props {
  initialAnnouncements: Announcement[];
  courses: Course[];
  batches: Batch[];
  trainers?: Trainer[];
}

export default function AnnouncementsClient({ initialAnnouncements, courses, batches, trainers = [] }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  // Tab State: 'admin_sent' vs 'guru_sent'
  const [activeTab, setActiveTab] = useState<'admin_sent' | 'guru_sent'>('admin_sent');

  // Compute current month start and end dates as default
  const defaultDates = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const start = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }, []);

  // Admin Sent Filters
  const [adminSearch, setAdminSearch] = useState('');
  const [adminAudienceFilter, setAdminAudienceFilter] = useState('all');

  // Guru Sent Pending Filter Controls
  const [selectedGuruId, setSelectedGuruId] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [selectedStartDate, setSelectedStartDate] = useState(defaultDates.start);
  const [selectedEndDate, setSelectedEndDate] = useState(defaultDates.end);

  // Guru Sent APPLIED Filters (Applied ONLY when user clicks "View Messages")
  const [appliedGuruFilters, setAppliedGuruFilters] = useState({
    guruId: 'all',
    courseId: 'all',
    batchId: 'all',
    startDate: defaultDates.start,
    endDate: defaultDates.end
  });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMessageForDetails, setSelectedMessageForDetails] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Students View State (Recipients Modal)
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsList, setRecipientsList] = useState<any[]>([]);
  const [recipientsMessageTitle, setRecipientsMessageTitle] = useState('');

  // Form State for Admin Create Announcement
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'All students' as 'All students' | 'Students and Gurus' | 'Selected course or batch' | 'Trainers',
    target_course_id: '',
    target_course_title: '',
    target_batch_id: '',
    target_batch_name: '',
    type_tag: 'General' as 'Holiday' | 'Schedule change' | 'Cancellation' | 'Fee reminder' | 'General',
    publish_date: new Date().toISOString().split('T')[0],
    action_links: [] as Array<{ title: string; url: string }>
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to distinguish Admin vs Guru sent
  const isGuruSent = (ann: Announcement) => {
    return ann.sender_role === 'trainer' || Boolean(ann.trainer_id) || (Boolean(ann.trainer_name) && !ann.trainer_name?.toLowerCase().includes('director'));
  };

  const isMessageBroadcast = (ann: Announcement) => {
    return ann.announcement_type !== 'banner' && !ann.image_url;
  };

  // All Admin sent messages
  const adminSentMessages = useMemo(() => {
    return announcements.filter(a => !a.is_deleted && !isGuruSent(a) && isMessageBroadcast(a));
  }, [announcements]);

  // All Guru sent messages
  const guruSentMessages = useMemo(() => {
    return announcements.filter(a => !a.is_deleted && isGuruSent(a));
  }, [announcements]);

  // Filtered Admin Sent messages
  const filteredAdminMessages = useMemo(() => {
    return adminSentMessages.filter(a => {
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.message.toLowerCase().includes(q)) return false;
      }
      if (adminAudienceFilter !== 'all' && a.audience !== adminAudienceFilter) {
        return false;
      }
      return true;
    });
  }, [adminSentMessages, adminSearch, adminAudienceFilter]);

  // Filtered Guru Sent messages (uses APPLIED filters!)
  const filteredGuruMessages = useMemo(() => {
    return guruSentMessages.filter(a => {
      // Guru filter
      if (appliedGuruFilters.guruId !== 'all') {
        const matchedTrainer = trainers.find(t => t.id === appliedGuruFilters.guruId);
        const tName = matchedTrainer?.full_name?.toLowerCase();
        const aTId = a.trainer_id;
        const aTName = (a.trainer_name || a.created_by || '').toLowerCase();
        if (aTId !== appliedGuruFilters.guruId && (!tName || !aTName.includes(tName))) {
          return false;
        }
      }

      // Course filter
      if (appliedGuruFilters.courseId !== 'all') {
        if (a.target_course_id && a.target_course_id !== appliedGuruFilters.courseId) {
          return false;
        }
      }

      // Batch filter
      if (appliedGuruFilters.batchId !== 'all') {
        if (a.target_batch_id && a.target_batch_id !== appliedGuruFilters.batchId) {
          return false;
        }
      }

      // Date range filter
      const pDate = a.publish_date?.split('T')[0] || a.created_at?.split('T')[0];
      if (pDate) {
        if (appliedGuruFilters.startDate && pDate < appliedGuruFilters.startDate) return false;
        if (appliedGuruFilters.endDate && pDate > appliedGuruFilters.endDate) return false;
      }

      return true;
    });
  }, [guruSentMessages, appliedGuruFilters, trainers]);

  // Trigger Apply Filters for Guru Messages
  const handleApplyGuruFilters = () => {
    setAppliedGuruFilters({
      guruId: selectedGuruId,
      courseId: selectedCourseId,
      batchId: selectedBatchId,
      startDate: selectedStartDate,
      endDate: selectedEndDate
    });
    showToast('Guru messages filtered successfully.');
  };

  const handleResetGuruFilters = () => {
    setSelectedGuruId('all');
    setSelectedCourseId('all');
    setSelectedBatchId('all');
    setSelectedStartDate(defaultDates.start);
    setSelectedEndDate(defaultDates.end);
    setAppliedGuruFilters({
      guruId: 'all',
      courseId: 'all',
      batchId: 'all',
      startDate: defaultDates.start,
      endDate: defaultDates.end
    });
  };

  // Batches matching selected course in Guru filter
  const availableFilterBatches = useMemo(() => {
    if (selectedCourseId === 'all') return batches;
    return batches.filter(b => b.course_id === selectedCourseId);
  }, [batches, selectedCourseId]);

  // Batches matching selected course in Create Announcement form
  const availableFormBatches = useMemo(() => {
    if (!formData.target_course_id) return [];
    return batches.filter(b => b.course_id === formData.target_course_id);
  }, [batches, formData.target_course_id]);

  // Format Date and Time
  const formatDateTime = (dateStr?: string, timeStr?: string | null) => {
    if (!dateStr) return '--';
    try {
      const dt = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const datePart = `${String(dt.getDate()).padStart(2, '0')} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
      if (dateStr.includes('T')) {
        let hours = dt.getHours();
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${datePart} at ${String(hours).padStart(2, '0')}:${minutes} ${period}`;
      }
      if (timeStr) return `${datePart} at ${timeStr}`;
      return datePart;
    } catch {
      return dateStr;
    }
  };

  // Fetch recipients for a specific announcement
  const handleOpenStudentsView = async (ann: Announcement) => {
    setRecipientsMessageTitle(ann.title);
    setIsStudentsModalOpen(true);
    setRecipientsLoading(true);
    try {
      const res = await fetch(`/api/announcements/recipients?announcementId=${ann.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.recipients)) {
        setRecipientsList(data.recipients);
      } else {
        setRecipientsList([]);
      }
    } catch {
      setRecipientsList([]);
      showToast('Could not load student recipients list.', 'error');
    } finally {
      setRecipientsLoading(false);
    }
  };

  // Handle Admin Submit Announcement
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required.';
    if (!formData.message.trim()) errors.message = 'Message content is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        audience: formData.audience,
        target_course_id: formData.target_course_id || null,
        target_course_title: formData.target_course_title || null,
        target_batch_id: formData.target_batch_id || null,
        target_batch_name: formData.target_batch_name || null,
        type_tag: formData.type_tag,
        publish_date: formData.publish_date,
        status: 'Published',
        sender_role: 'admin',
        created_by: 'Academy Director',
        announcement_type: 'message',
        action_links: formData.action_links
      };

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => [json.announcement, ...prev]);
        showToast('Announcement broadcast sent successfully!');
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          message: '',
          audience: 'All students',
          target_course_id: '',
          target_course_title: '',
          target_batch_id: '',
          target_batch_name: '',
          type_tag: 'General',
          publish_date: new Date().toISOString().split('T')[0],
          action_links: []
        });
      } else {
        showToast(json.error || 'Failed to send announcement', 'error');
      }
    } catch {
      showToast('Network error while saving announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!deletingAnnouncement) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/announcements/${deletingAnnouncement.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== deletingAnnouncement.id));
        showToast('Announcement deleted.');
        setDeletingAnnouncement(null);
        if (selectedMessageForDetails?.id === deletingAnnouncement.id) {
          setSelectedMessageForDetails(null);
        }
      } else {
        showToast(json.error || 'Failed to delete announcement', 'error');
      }
    } catch {
      showToast('Network error while deleting', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
          toastMessage.type === 'success' ? 'bg-[#03543F] text-white' : 'bg-red-600 text-white'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <X className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#590231] to-[#8A064D] p-6 sm:p-8 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#F9E33A] text-[#590231] text-xs font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              OFFICIAL BROADCASTS
            </span>
            <span className="text-white/70 text-xs font-semibold">• Direct Academy Communications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-[#F9E33A]" />
            Announcements & Messages
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-2xl">
            Broadcast official circulars from administration or audit all classroom messages shared by Gurus with their disciples.
          </p>
        </div>

        {activeTab === 'admin_sent' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#F9E33A] hover:bg-[#ebd52f] text-[#590231] font-bold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Broadcast</span>
          </button>
        )}
      </div>

      {/* Main Tabs: Admin Sent vs Guru Sent */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab('admin_sent')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
            activeTab === 'admin_sent'
              ? 'bg-[#590231] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Admin Sent</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            activeTab === 'admin_sent' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {adminSentMessages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('guru_sent')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
            activeTab === 'guru_sent'
              ? 'bg-[#590231] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Guru Sent</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            activeTab === 'guru_sent' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {guruSentMessages.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ADMIN SENT MESSAGES                                                */}
      {/* ========================================================================= */}
      {activeTab === 'admin_sent' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search admin broadcasts..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={adminAudienceFilter}
                onChange={(e) => setAdminAudienceFilter(e.target.value)}
                className="px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] text-gray-700 font-medium"
              >
                <option value="all">All Audiences</option>
                <option value="All students">All Students</option>
                <option value="Trainers">Faculty Gurus</option>
                <option value="Students and Gurus">Students & Gurus</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          {filteredAdminMessages.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#F0D5E4] text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No Admin Broadcasts Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Create and share official announcements, holiday notices, and exam schedules with disciples.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 bg-[#590231] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#70043e]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Announcement</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAdminMessages.map(ann => (
                <div key={ann.id} className="bg-white rounded-2xl border border-[#F0D5E4] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border border-emerald-200">
                        {ann.type_tag || 'General'}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {formatDateTime(ann.publish_date || ann.created_at)}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base mb-1.5">{ann.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-line">{ann.message}</p>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Audience: {ann.audience}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedMessageForDetails(ann)}
                        className="px-3 py-1.5 font-bold text-[#590231] bg-[#FFF2F8] hover:bg-[#FCE7F3] rounded-lg transition-all"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setDeletingAnnouncement(ann)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GURU SENT MESSAGES (WITH EXPLICIT VIEW MESSAGES BUTTON FILTER)      */}
      {/* ========================================================================= */}
      {activeTab === 'guru_sent' && (
        <div className="space-y-6">
          {/* Comprehensive Filter Panel */}
          <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-[#590231] uppercase tracking-wider">
                <Filter className="w-4 h-4" />
                <span>Filter Guru Broadcasts</span>
              </div>
              <button
                type="button"
                onClick={handleResetGuruFilters}
                className="text-xs text-gray-500 hover:text-gray-900 font-medium hover:underline"
              >
                Reset Filters
              </button>
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* 1. Guru Filter */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Guru / Faculty
                </label>
                <select
                  value={selectedGuruId}
                  onChange={(e) => setSelectedGuruId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] text-gray-800 font-semibold"
                >
                  <option value="all">All Gurus (14)</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Course Filter */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedBatchId('all');
                  }}
                  className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] text-gray-800 font-semibold"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* 3. Batch Filter */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] text-gray-800 font-semibold"
                >
                  <option value="all">All Batches</option>
                  {availableFilterBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* 4. Start Date */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={selectedStartDate}
                  onChange={(e) => setSelectedStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] text-gray-800"
                />
              </div>

              {/* 5. End Date */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={selectedEndDate}
                  onChange={(e) => setSelectedEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] text-gray-800"
                />
              </div>
            </div>

            {/* Crucial Action: View Messages Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleApplyGuruFilters}
                className="bg-[#590231] hover:bg-[#70043e] text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                <span>View Messages</span>
              </button>
            </div>
          </div>

          {/* Broadcast Type Cards List */}
          {filteredGuruMessages.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#F0D5E4] text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No Guru Messages Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No classroom announcements matching the selected filters for this time window. Click "View Messages" after adjusting criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuruMessages.map(ann => {
                const guruName = ann.trainer_name || ann.created_by || 'Faculty Guru';
                return (
                  <div key={ann.id} className="bg-white rounded-2xl border border-[#F0D5E4] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      {/* Guru Attribution Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#590231] to-[#8A064D] text-white flex items-center justify-center font-black text-xs border border-amber-300/40">
                            {guruName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs">{guruName}</div>
                            <div className="text-[10px] text-[#8A064D] font-semibold">Faculty Guru</div>
                          </div>
                        </div>

                        <span className="text-[11px] text-gray-500 font-medium">
                          {formatDateTime(ann.publish_date || ann.created_at)}
                        </span>
                      </div>

                      {/* Course / Batch Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        {ann.target_course_title && (
                          <span className="bg-[#FFF2F8] text-[#590231] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#F0D5E4]">
                            {ann.target_course_title}
                          </span>
                        )}
                        {ann.target_batch_name && (
                          <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                            {ann.target_batch_name}
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {ann.type_tag || 'General'}
                        </span>
                      </div>

                      {/* Content */}
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{ann.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-line">{ann.message}</p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500 text-[11px]">
                        Target: {ann.target_batch_name || ann.audience || 'Assigned Disciples'}
                      </span>
                      <button
                        onClick={() => setSelectedMessageForDetails(ann)}
                        className="px-3.5 py-1.5 font-bold text-[#590231] bg-[#FFF2F8] hover:bg-[#FCE7F3] rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILS MODAL (FOR BOTH ADMIN AND GURU SENT WITH STUDENTS VIEW BUTTON)    */}
      {/* ========================================================================= */}
      {selectedMessageForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#590231] to-[#70043e] text-white">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-[#F9E33A]" />
                <h3 className="text-base font-bold">Broadcast Message Details</h3>
              </div>
              <button
                onClick={() => setSelectedMessageForDetails(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Attribution Meta Box */}
              <div className="bg-[#FFF9FB] p-4 rounded-xl border border-[#F0D5E4] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Shared By</div>
                  <div className="text-sm font-black text-[#590231] mt-0.5">
                    {selectedMessageForDetails.trainer_name || selectedMessageForDetails.created_by || 'Academy Director'}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {isGuruSent(selectedMessageForDetails) ? 'Faculty Guru' : 'Administration & Management'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dispatched At</div>
                  <div className="text-xs font-bold text-gray-800 mt-0.5">
                    {formatDateTime(selectedMessageForDetails.publish_date || selectedMessageForDetails.created_at)}
                  </div>
                </div>
              </div>

              {/* Course & Batch info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="text-gray-500 font-bold text-[10px] uppercase">Course</div>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {selectedMessageForDetails.target_course_title || 'All Courses / General'}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="text-gray-500 font-bold text-[10px] uppercase">Batch</div>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {selectedMessageForDetails.target_batch_name || selectedMessageForDetails.audience || 'All Batches'}
                  </div>
                </div>
              </div>

              {/* Title & Full Message */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-1.5">{selectedMessageForDetails.title}</h4>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                  {selectedMessageForDetails.message}
                </div>
              </div>
            </div>

            {/* Footer with "Students View" Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedMessageForDetails(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>

              <button
                onClick={() => handleOpenStudentsView(selectedMessageForDetails)}
                className="bg-[#03543F] hover:bg-[#046c51] text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <GraduationCap className="w-4 h-4 text-emerald-300" />
                <span>Students View (Recipient List)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENTS VIEW MODAL (ALL STUDENTS WHO RECEIVED THIS GURU / ADMIN MESSAGE) */}
      {/* ========================================================================= */}
      {isStudentsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#03543F] to-[#046c51] text-white">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-base font-bold">Message Recipients</h3>
                  <div className="text-xs text-emerald-100 truncate max-w-md">"{recipientsMessageTitle}"</div>
                </div>
              </div>
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {recipientsLoading ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-500">
                  <div className="animate-spin w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
                  Loading recipient students...
                </div>
              ) : recipientsList.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  No explicit recipient records found for this broadcast.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 pb-2 border-b">
                    <span>{recipientsList.length} Disciples Received This Message</span>
                    <span className="text-emerald-700">Verified Broadcast</span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {recipientsList.map((st, i) => (
                      <div key={st.id || i} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FFF2F8] text-[#590231] font-bold text-xs flex items-center justify-center border border-[#F0D5E4]">
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900">{st.name || st.full_name}</div>
                            <div className="text-[11px] text-gray-500 font-mono">{st.roll_number || 'Enrolled Disciple'}</div>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-gray-600 flex items-center gap-3">
                          {st.phone && (
                            <span className="flex items-center gap-1 text-gray-700">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{st.phone}</span>
                            </span>
                          )}
                          {st.email && (
                            <span className="hidden sm:flex items-center gap-1 text-gray-500">
                              <Mail className="w-3 h-3 text-blue-500" />
                              <span>{st.email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE ADMIN BROADCAST MODAL                                              */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#590231] to-[#70043e] text-white">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#F9E33A]" />
                <h3 className="text-base font-bold">New Message Broadcast (Admin)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Broadcast Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Navaratri Festival Performance Schedule"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D]"
                />
                {formErrors.title && <p className="text-xs font-bold text-red-600 mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Message Content *
                  </label>
                  <AiEnhanceButton
                    value={formData.message}
                    onEnhance={(newText: string) => setFormData(prev => ({ ...prev, message: newText }))}
                    context="announcement broadcast"
                  />
                </div>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter notice details, instructions, or holiday dates..."
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D]"
                />
                {formErrors.message && <p className="text-xs font-bold text-red-600 mt-1">{formErrors.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Audience
                  </label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <option value="All students">All Students</option>
                    <option value="Students and Gurus">Students and Gurus</option>
                    <option value="Trainers">Trainers Only</option>
                    <option value="Selected course or batch">Selected Course / Batch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <select
                    value={formData.type_tag}
                    onChange={(e) => setFormData(prev => ({ ...prev, type_tag: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <option value="General">General</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Schedule change">Schedule change</option>
                    <option value="Cancellation">Cancellation</option>
                    <option value="Fee reminder">Fee reminder</option>
                  </select>
                </div>
              </div>

              {formData.audience === 'Selected course or batch' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Target Course</label>
                    <select
                      value={formData.target_course_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const match = courses.find(c => c.id === id);
                        setFormData(prev => ({
                          ...prev,
                          target_course_id: id,
                          target_course_title: match?.title || '',
                          target_batch_id: '',
                          target_batch_name: ''
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-gray-200"
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Target Batch</label>
                    <select
                      value={formData.target_batch_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const match = batches.find(b => b.id === id);
                        setFormData(prev => ({
                          ...prev,
                          target_batch_id: id,
                          target_batch_name: match?.name || ''
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-gray-200"
                    >
                      <option value="">All Batches in Course</option>
                      {availableFormBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#590231] hover:bg-[#70043e] rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{isSubmitting ? 'Sending...' : 'Broadcast Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-base font-bold text-gray-900">Delete Announcement?</h4>
            <p className="text-xs text-gray-600 mt-2">
              Are you sure you want to delete <span className="font-bold">"{deletingAnnouncement.title}"</span>? This will remove it from all student feeds.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingAnnouncement(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAnnouncement}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

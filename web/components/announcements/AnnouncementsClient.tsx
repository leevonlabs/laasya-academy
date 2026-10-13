'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  GraduationCap,
  ExternalLink,
  Filter,
  Calendar,
  Check,
  ChevronDown,
  RefreshCw,
  Link as LinkIcon,
  Globe,
  Info,
  User,
  BookOpen
} from 'lucide-react';
import { Announcement } from '@/lib/announcements';
import AiEnhanceButton from '@/components/common/AiEnhanceButton';

interface Course {
  id: string;
  title: string;
  category?: string;
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

interface Student {
  id: string;
  roll_number?: string;
  full_name: string;
  phone?: string;
  parent_name?: string;
  parent_contact?: string;
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
  students?: Student[];
}

// -------------------------------------------------------------
// Searchable Multi-Select Dropdown Component
// -------------------------------------------------------------
function SearchableMultiSelect({
  label,
  placeholder,
  items,
  selectedIds,
  onChange,
  className = ''
}: {
  label: string;
  placeholder: string;
  items: Array<{ id: string; label: string; sublabel?: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter(
      item => item.label.toLowerCase().includes(q) || (item.sublabel && item.sublabel.toLowerCase().includes(q))
    );
  }, [items, searchTerm]);

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onChange(items.map(i => i.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl border border-gray-200 bg-white hover:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54] text-xs font-semibold text-left flex items-center justify-between gap-2 shadow-xs transition"
      >
        <div className="flex-1 truncate">
          {selectedIds.length === 0 ? (
            <span className="text-gray-400 font-medium">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#075E54] text-[10px] font-black shrink-0">
                {selectedIds.length} Selected
              </span>
              <span className="text-gray-800 truncate text-[11px] font-bold">
                {items
                  .filter(i => selectedIds.includes(i.id))
                  .map(i => i.label)
                  .slice(0, 2)
                  .join(', ')}
                {selectedIds.length > 2 && ` +${selectedIds.length - 2} more`}
              </span>
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#075E54]' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 min-w-[260px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              autoFocus
            />
          </div>

          {/* Quick Select Actions */}
          <div className="flex items-center justify-between text-[10px] font-bold px-1 text-gray-500 border-b border-gray-100 pb-1.5">
            <button
              type="button"
              onClick={selectAll}
              className="text-[#075E54] hover:underline cursor-pointer"
            >
              Select All ({items.length})
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-rose-600 hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Items List */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {filteredItems.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 font-medium">No results found</p>
            ) : (
              filteredItems.map(item => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition select-none ${
                      isChecked ? 'bg-emerald-50 text-[#075E54] font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                        isChecked ? 'bg-[#075E54] border-[#075E54] text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.sublabel && (
                      <span className="text-[10px] text-gray-400 font-normal ml-2 shrink-0">
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MAIN ANNOUNCEMENTS CLIENT
// -------------------------------------------------------------
export default function AnnouncementsClient({ 
  initialAnnouncements, 
  courses, 
  batches, 
  trainers = [], 
  students = [] 
}: Props) {
  // Announcements list (excluding pure banners)
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    initialAnnouncements.filter(a => a.announcement_type !== 'banner')
  );

  // Active Tab: 'admin_sent' vs 'guru_sent'
  const [activeTab, setActiveTab] = useState<'admin_sent' | 'guru_sent'>('admin_sent');

  // Default Current Month
  const defaultDates = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { firstDay, lastDay };
  }, []);

  // Filter State for Guru Sent (Searchable Multi-Selection for Guru, Batch, Student + Date Range)
  const [guruSelectedGurus, setGuruSelectedGurus] = useState<string[]>([]);
  const [guruSelectedBatches, setGuruSelectedBatches] = useState<string[]>([]);
  const [guruSelectedStudents, setGuruSelectedStudents] = useState<string[]>([]);
  const [guruStartDate, setGuruStartDate] = useState(defaultDates.firstDay);
  const [guruEndDate, setGuruEndDate] = useState(defaultDates.lastDay);

  // Applied Filters State for Guru Sent (Admin clicks "View Messages" / "Apply" to filter)
  const [appliedGuruFilters, setAppliedGuruFilters] = useState({
    guruIds: [] as string[],
    batchIds: [] as string[],
    studentIds: [] as string[],
    startDate: defaultDates.firstDay,
    endDate: defaultDates.lastDay,
    hasApplied: false
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Details Modal & Recipient Modal
  const [detailModalAnnouncement, setDetailModalAnnouncement] = useState<Announcement | null>(null);
  const [recipientModalAnnouncement, setRecipientModalAnnouncement] = useState<Announcement | null>(null);
  const [recipientStudents, setRecipientStudents] = useState<RecipientStudent[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');

  // Form State (Reference Image 1 + Schedule Date/Time + Side-by-Side Dropdowns + Share Link)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image_url: '',
    audience: 'All students' as 'All students' | 'Students and Gurus' | 'Specific Courses & Batches' | 'Trainers',
    type_tag: 'General' as 'Holiday' | 'Schedule change' | 'Cancellation' | 'Fee reminder' | 'General',
    publish_date: new Date().toISOString().split('T')[0],
    publish_time: '10:00',
    expiry_date: '',
    status: 'Published' as 'Draft' | 'Scheduled' | 'Published' | 'Expired',
    share_links: [] as Array<{ title: string; url: string }>
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'compose' | 'preview'>('compose');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto-scroll chat to bottom
  const adminChatEndRef = useRef<HTMLDivElement>(null);
  const guruChatEndRef = useRef<HTMLDivElement>(null);

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

  // Format Date and Time
  const formatDateTime = (dateStr?: string, createdStr?: string) => {
    const raw = dateStr || createdStr;
    if (!raw) return { date: '—', time: '—', rawDate: '' };
    const d = new Date(raw);
    const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date: dateFormatted, time: timeFormatted, rawDate: d.toISOString().split('T')[0] };
  };

  // Format Day Separator Header (e.g. "TODAY", "YESTERDAY", or "06 OCT 2026")
  const getDaySeparator = (dateStr?: string) => {
    if (!dateStr) return '';
    const msgDate = new Date(dateStr).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (msgDate === today) return 'TODAY';
    if (msgDate === yesterday) return 'YESTERDAY';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  // Admin Sent Messages: Sorted CHRONOLOGICALLY (Oldest on top, Latest below like WhatsApp)
  const adminMessages = useMemo(() => {
    const list = announcements.filter(isAdminSent);
    list.sort((a, b) => {
      const timeA = new Date(a.publish_date || a.created_at).getTime();
      const timeB = new Date(b.publish_date || b.created_at).getTime();
      return timeA - timeB;
    });
    return list;
  }, [announcements]);

  // Guru Sent Messages: Filtered and Sorted CHRONOLOGICALLY (Oldest on top, Latest below like WhatsApp)
  const guruMessages = useMemo(() => {
    const list = announcements.filter(ann => {
      if (!isGuruSent(ann)) return false;

      // Guru Filter
      if (appliedGuruFilters.guruIds.length > 0) {
        const matchesId = ann.trainer_id && appliedGuruFilters.guruIds.includes(ann.trainer_id);
        const matchesName = trainers.some(
          t => appliedGuruFilters.guruIds.includes(t.id) && ann.trainer_name?.toLowerCase().includes(t.full_name.toLowerCase())
        );
        if (!matchesId && !matchesName) return false;
      }

      // Batch Filter
      if (appliedGuruFilters.batchIds.length > 0) {
        const matchesBatch = appliedGuruFilters.batchIds.some(bId => ann.target_batch_id?.includes(bId));
        if (!matchesBatch) return false;
      }

      // Student Filter
      if (appliedGuruFilters.studentIds.length > 0) {
        const studentRaw = ann.target_students ? JSON.stringify(ann.target_students) : '';
        const matchesStudent = appliedGuruFilters.studentIds.some(sId => studentRaw.includes(sId));
        if (!matchesStudent) return false;
      }

      // Date Range Filter
      const dateStr = ann.publish_date?.split('T')[0] || ann.created_at?.split('T')[0];
      if (dateStr) {
        if (appliedGuruFilters.startDate && dateStr < appliedGuruFilters.startDate) return false;
        if (appliedGuruFilters.endDate && dateStr > appliedGuruFilters.endDate) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      const timeA = new Date(a.publish_date || a.created_at).getTime();
      const timeB = new Date(b.publish_date || b.created_at).getTime();
      return timeA - timeB;
    });
    return list;
  }, [announcements, appliedGuruFilters, trainers]);

  // Scroll to bottom on initial load / message change
  useEffect(() => {
    if (activeTab === 'admin_sent') {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      guruChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, adminMessages.length, guruMessages.length]);

  // Handle Apply Guru Filters
  const handleApplyGuruFilters = () => {
    setAppliedGuruFilters({
      guruIds: guruSelectedGurus,
      batchIds: guruSelectedBatches,
      studentIds: guruSelectedStudents,
      startDate: guruStartDate,
      endDate: guruEndDate,
      hasApplied: true
    });
  };

  // Handle Reset Guru Filters
  const handleResetGuruFilters = () => {
    setGuruSelectedGurus([]);
    setGuruSelectedBatches([]);
    setGuruSelectedStudents([]);
    setGuruStartDate(defaultDates.firstDay);
    setGuruEndDate(defaultDates.lastDay);
    setAppliedGuruFilters({
      guruIds: [],
      batchIds: [],
      studentIds: [],
      startDate: defaultDates.firstDay,
      endDate: defaultDates.lastDay,
      hasApplied: false
    });
  };

  // Fetch Recipient Students for "View Recipient Students" button
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

  // Filtered Recipient Search Inside Modal
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
      type_tag: 'General',
      publish_date: new Date().toISOString().split('T')[0],
      publish_time: '10:00',
      expiry_date: '',
      status: 'Published',
      share_links: []
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
      type_tag: (ann.type_tag || 'General') as any,
      publish_date: ann.publish_date ? ann.publish_date.split('T')[0] : new Date().toISOString().split('T')[0],
      publish_time: ann.publish_time || '10:00',
      expiry_date: ann.expiry_date ? ann.expiry_date.split('T')[0] : '',
      status: (ann.status || 'Published') as any,
      share_links: links
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
    if (formData.status === 'Scheduled') {
      if (!formData.publish_date) errors.publish_date = 'Scheduled date is required';
      if (!formData.publish_time) errors.publish_time = 'Scheduled time is required';
    }
    if (formData.audience === 'Specific Courses & Batches' && selectedCourseIds.length === 0 && selectedBatchIds.length === 0) {
      errors.audience = 'Please select at least one course or batch';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create
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

      const cleanShareLinks = formData.share_links.filter(l => l.title.trim() && l.url.trim());

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publish_date: effectivePublishDate,
          publish_time: formData.publish_time,
          announcement_type: 'message',
          action_links: cleanShareLinks,
          target_course_id: selectedCourseIds.length > 0 ? selectedCourseIds.join(',') : undefined,
          target_course_title: courseTitles || undefined,
          target_batch_id: selectedBatchIds.length > 0 ? selectedBatchIds.join(',') : undefined,
          target_batch_name: batchNames || undefined
        })
      });
      const json = await res.json();
      if (json.success && json.announcement) {
        setAnnouncements(prev => [...prev, json.announcement]);
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

  // Submit Edit
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

      const cleanShareLinks = formData.share_links.filter(l => l.title.trim() && l.url.trim());

      const res = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          publish_date: effectivePublishDate,
          publish_time: formData.publish_time,
          announcement_type: 'message',
          action_links: cleanShareLinks,
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

  // Category Tag Badge
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

  // Available Batches for Compose Modal (filtered by selected courses if any)
  const availableBatchesForCompose = useMemo(() => {
    if (selectedCourseIds.length === 0) return batches;
    return batches.filter(b => selectedCourseIds.includes(b.course_id));
  }, [batches, selectedCourseIds]);

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 ${
            toastMessage.type === 'success' ? 'bg-[#075E54]' : 'bg-rose-600'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* MINIMISED TOP HEADING BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#075E54] text-[#25D366] flex items-center justify-center shadow-xs shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Announcements & Broadcast Messages</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#075E54] text-[10px] font-black border border-emerald-200 uppercase">
                WhatsApp Channel View
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Official notifications, class alerts & faculty messages stream directly to student mobile inboxes.
            </p>
          </div>
        </div>

        {/* Real-time Indicator */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#075E54] bg-[#E8F8F0] px-3.5 py-1.5 rounded-2xl border border-[#BCE8D0] shrink-0 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span>Real-time Live Sync</span>
        </div>
      </div>

      {/* FULL-WIDTH EQUAL BUTTONS ROW: ADMIN SENT & GURU SENT */}
      <div className="w-full grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => setActiveTab('admin_sent')}
          className={`w-full py-4 px-4 rounded-3xl font-black text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs border-2 ${
            activeTab === 'admin_sent'
              ? 'bg-[#075E54] text-white border-[#075E54] shadow-md ring-2 ring-[#075E54]/20'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>Admin Sent</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
            activeTab === 'admin_sent' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-800'
          }`}>
            {adminMessages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('guru_sent')}
          className={`w-full py-4 px-4 rounded-3xl font-black text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs border-2 ${
            activeTab === 'guru_sent'
              ? 'bg-[#075E54] text-white border-[#075E54] shadow-md ring-2 ring-[#075E54]/20'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <GraduationCap className="w-5 h-5 shrink-0" />
          <span>Guru Sent</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
            activeTab === 'guru_sent' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-800'
          }`}>
            {guruMessages.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 1. ADMIN SENT TAB (NO EXTRA FILTERS, CLEAN WHATSAPP CHAT + FAB)       */}
      {/* ===================================================================== */}
      {activeTab === 'admin_sent' && (
        <div className="relative rounded-3xl bg-[#EFEAE2] border border-gray-300 shadow-inner min-h-[620px] flex flex-col justify-between overflow-hidden">
          {/* Subtle WhatsApp chat watermark pattern */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#075E54_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Chat Stream: Oldest on Top, Latest Below */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6 relative z-10 w-full overflow-y-auto max-h-[750px]">
            {adminMessages.length === 0 ? (
              <div className="text-center py-24 space-y-3 bg-white/70 backdrop-blur-xs rounded-3xl p-8 max-w-md mx-auto border border-gray-200 my-auto">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#075E54] mx-auto flex items-center justify-center">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-gray-800">No Admin Broadcasts Yet</h3>
                <p className="text-xs text-gray-500">
                  Broadcast notices, circulars, and fee reminders to all students or specific batches.
                </p>
              </div>
            ) : (
              adminMessages.map((ann, idx) => {
                const { date, time } = formatDateTime(ann.publish_date, ann.created_at);
                const prevMsg = idx > 0 ? adminMessages[idx - 1] : null;
                const prevDate = prevMsg ? formatDateTime(prevMsg.publish_date, prevMsg.created_at).date : null;
                const showDateHeader = idx === 0 || date !== prevDate;

                return (
                  <div key={ann.id} className="space-y-4">
                    {/* Centered WhatsApp Date Header Divider */}
                    {showDateHeader && (
                      <div className="flex justify-center my-3">
                        <span className="px-3.5 py-1 rounded-full bg-white/95 shadow-xs border border-gray-200 text-[10px] font-black uppercase text-gray-600 tracking-wider">
                          {getDaySeparator(ann.publish_date || ann.created_at)} • {date}
                        </span>
                      </div>
                    )}

                    {/* Right-Aligned Admin Chat Bubble */}
                    <div className="flex justify-end">
                      <div className="max-w-2xl w-full sm:w-auto min-w-[280px] sm:min-w-[360px] bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-4 sm:p-5 shadow-md border border-[#C2EDB9] space-y-3 transition hover:shadow-lg">
                        {/* Top of Message: Sender Info & Date Tag */}
                        <div className="flex items-center justify-between border-b border-[#C2EDB9] pb-2 gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#075E54] text-white flex items-center justify-center font-black text-xs shadow-xs">
                              👑
                            </div>
                            <div>
                              <div className="text-xs font-black text-[#075E54] flex items-center gap-1.5">
                                <span>Academy Administration</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#075E54] text-white">
                                  Director / Admin
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 font-semibold">
                                {date}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {renderCategoryTag(ann.type_tag)}
                          </div>
                        </div>

                        {/* Message Subject / Title */}
                        <div>
                          <h4 className="text-sm font-black text-gray-900 leading-snug">
                            {ann.title}
                          </h4>
                          {/* Target Audience Pill */}
                          <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-600 font-bold mt-1">
                            <span className="px-2 py-0.5 rounded-lg bg-white/80 text-[#075E54] border border-[#C2EDB9]">
                              🎯 Target: {ann.audience}
                            </span>
                            {ann.target_course_title && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/80 text-gray-700">
                                📚 {ann.target_course_title}
                              </span>
                            )}
                            {ann.target_batch_name && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/80 text-gray-700">
                                👥 {ann.target_batch_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attached Image/Flyer */}
                        {ann.image_url && (
                          <div className="rounded-xl overflow-hidden border border-[#C2EDB9] max-h-60 bg-black/5">
                            <img
                              src={ann.image_url}
                              alt={ann.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Full Broadcast Message Content */}
                        <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                          {ann.message}
                        </p>

                        {/* Share Links (if any) */}
                        {ann.action_links && ann.action_links.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {ann.action_links.map((link, lIdx) => (
                              <a
                                key={lIdx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white text-[#075E54] border border-[#C2EDB9] hover:bg-emerald-50 transition shadow-xs"
                              >
                                <ExternalLink className="w-3 h-3 text-[#075E54]" />
                                <span>{link.title}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Bottom of Message: Time & Action Buttons */}
                        <div className="pt-2 border-t border-[#C2EDB9] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            {/* Eye Details Button */}
                            <button
                              onClick={() => setDetailModalAnnouncement(ann)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#075E54] text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#075E54]" />
                              <span>Details & Students</span>
                            </button>

                            <button
                              onClick={() => openEditModal(ann)}
                              className="p-1.5 rounded-xl bg-white hover:bg-emerald-50 text-gray-700 cursor-pointer shadow-xs"
                              title="Edit Message"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingAnnouncement(ann)}
                              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 cursor-pointer shadow-xs"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Time & Double Checkmarks (Delivered) */}
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold shrink-0">
                            <span>{time}</span>
                            <CheckCheck className="w-4 h-4 text-[#34B7F1]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={adminChatEndRef} />
          </div>

          {/* RIGHT SIDE DOWN NEW MESSAGE BUTTON (FLOATING ACTION BUTTON) */}
          <div className="sticky bottom-4 right-4 p-4 flex justify-end z-20 pointer-events-none">
            <button
              onClick={openCreateModal}
              className="pointer-events-auto px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-[#075E54] font-black text-xs sm:text-sm shadow-xl flex items-center gap-2.5 cursor-pointer transition transform hover:scale-105 active:scale-95 border-2 border-white"
            >
              <Plus className="w-5 h-5 text-[#075E54] stroke-[3]" />
              <span>Broadcast New Message</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. GURU SENT TAB (SEARCHABLE MULTI-SELECT FILTERS, READ-ONLY CHAT)     */}
      {/* ===================================================================== */}
      {activeTab === 'guru_sent' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* SEARCHABLE MULTI-SELECTION FILTER BAR (GURU, BATCH, STUDENT, DATES) */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#075E54] uppercase tracking-wider">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Searchable Filters for Faculty Guru Broadcasts</span>
              </div>
              <span className="text-[11px] font-bold text-gray-400">
                Default: Current Month ({new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* 1. Guru Filter (Searchable Multi-Select) */}
              <SearchableMultiSelect
                label="Guru / Faculty"
                placeholder="All Gurus"
                items={trainers.map(t => ({ id: t.id, label: t.full_name, sublabel: t.display_title || 'Faculty Guru' }))}
                selectedIds={guruSelectedGurus}
                onChange={setGuruSelectedGurus}
              />

              {/* 2. Batch Filter (Searchable Multi-Select) */}
              <SearchableMultiSelect
                label="Assigned Batch"
                placeholder="All Batches"
                items={batches.map(b => ({ id: b.id, label: b.name }))}
                selectedIds={guruSelectedBatches}
                onChange={setGuruSelectedBatches}
              />

              {/* 3. Student Filter (Searchable Multi-Select) */}
              <SearchableMultiSelect
                label="Disciple Student"
                placeholder="All Students"
                items={students.map(s => ({ id: s.id, label: s.full_name, sublabel: s.roll_number || 'Disciple' }))}
                selectedIds={guruSelectedStudents}
                onChange={setGuruSelectedStudents}
              />

              {/* 4. Start Date */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={guruStartDate}
                  onChange={(e) => setGuruStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white h-[42px]"
                />
              </div>

              {/* 5. End Date */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={guruEndDate}
                  onChange={(e) => setGuruEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] bg-white h-[42px]"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500">
                Found <span className="font-bold text-[#075E54]">{guruMessages.length}</span> faculty broadcasts matching filters
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetGuruFilters}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
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

          {/* GURU CHAT FEED: Left-Aligned Chat Bubbles, Oldest on Top, Latest Below */}
          <div className="relative rounded-3xl bg-[#EFEAE2] border border-gray-300 shadow-inner min-h-[620px] flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#075E54_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="p-4 sm:p-6 md:p-8 space-y-6 relative z-10 w-full overflow-y-auto max-h-[750px]">
              {guruMessages.length === 0 ? (
                <div className="text-center py-24 space-y-3 bg-white/70 backdrop-blur-xs rounded-3xl p-8 max-w-md mx-auto border border-gray-200 my-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-black text-gray-800">No Guru Messages Found</h3>
                  <p className="text-xs text-gray-500">
                    No faculty broadcasts match the current filters. Adjust your Guru, batch, student, or date selection.
                  </p>
                  <button
                    onClick={handleResetGuruFilters}
                    className="px-4 py-2 rounded-xl bg-[#075E54] text-white text-xs font-bold cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                guruMessages.map((ann, idx) => {
                  const { date, time } = formatDateTime(ann.publish_date, ann.created_at);
                  const prevMsg = idx > 0 ? guruMessages[idx - 1] : null;
                  const prevDate = prevMsg ? formatDateTime(prevMsg.publish_date, prevMsg.created_at).date : null;
                  const showDateHeader = idx === 0 || date !== prevDate;

                  return (
                    <div key={ann.id} className="space-y-4">
                      {/* Centered Date Header Divider */}
                      {showDateHeader && (
                        <div className="flex justify-center my-3">
                          <span className="px-3.5 py-1 rounded-full bg-white/95 shadow-xs border border-gray-200 text-[10px] font-black uppercase text-gray-600 tracking-wider">
                            {getDaySeparator(ann.publish_date || ann.created_at)} • {date}
                          </span>
                        </div>
                      )}

                      {/* Left-Aligned Guru Chat Bubble */}
                      <div className="flex justify-start">
                        <div className="max-w-2xl w-full sm:w-auto min-w-[280px] sm:min-w-[360px] bg-white rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-md border border-gray-200 space-y-3 transition hover:shadow-lg">
                          {/* Top of Message: Guru Name, Role & Date */}
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2 gap-3">
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
                                <div className="text-[10px] text-gray-400 font-bold">
                                  {date}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {renderCategoryTag(ann.type_tag)}
                            </div>
                          </div>

                          {/* Message Subject */}
                          <div>
                            <h4 className="text-sm font-black text-gray-900 leading-snug">
                              {ann.title}
                            </h4>
                            {/* Target Course & Batch Tags */}
                            <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-600 font-bold mt-1">
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
                            <div className="rounded-xl overflow-hidden border border-gray-200 max-h-60 bg-black/5">
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

                          {/* Action / Share Links if any */}
                          {ann.action_links && ann.action_links.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {ann.action_links.map((link, lIdx) => (
                                <a
                                  key={lIdx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-[#075E54] border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{link.title}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Bottom of Message: Time & Details Button */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                            {/* Eye Details & Students Button */}
                            <button
                              onClick={() => setDetailModalAnnouncement(ann)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#075E54] text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details & Students</span>
                            </button>

                            {/* Time */}
                            <div className="text-[11px] text-gray-400 font-bold shrink-0">
                              {time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={guruChatEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. DETAILS MODAL                                                      */}
      {/* ===================================================================== */}
      {detailModalAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
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

            <div className="space-y-2">
              <h4 className="text-base font-black text-gray-900">
                {detailModalAnnouncement.title}
              </h4>
              <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium bg-[#F8FAF9] p-4 rounded-2xl border border-gray-100">
                {detailModalAnnouncement.message}
              </p>
            </div>

            {detailModalAnnouncement.image_url && (
              <div className="rounded-2xl overflow-hidden border border-gray-200 max-h-64 bg-black/5">
                <img
                  src={detailModalAnnouncement.image_url}
                  alt={detailModalAnnouncement.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {detailModalAnnouncement.action_links && detailModalAnnouncement.action_links.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-500">Share Links:</div>
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
      {/* 4. RECIPIENT STUDENTS MODAL (ERROR-FREE & POLISHED)                   */}
      {/* ===================================================================== */}
      {recipientModalAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 my-8">
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

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Verified delivery to Student Mobile App notifications & messages channel.
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
      {/* 5. ADMIN COMPOSE MODAL (SCHEDULE DATE+TIME, SIDE-BY-SIDE DROPDOWNS)    */}
      {/* ===================================================================== */}
      {(isCreateModalOpen || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header: Dark Green */}
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

            {/* Tabs */}
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

            {/* Form Body */}
            <form onSubmit={editingAnnouncement ? handleSubmitEdit : handleSubmitCreate} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {activeFormTab === 'compose' ? (
                <>
                  {/* Notice Subject / Title */}
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

                  {/* Attach Image / Flyer (Optional) */}
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
                          Image attached! Will display inside the broadcast message card.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Broadcast Message Content */}
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

                  {/* Target Audience & Category Tag */}
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
                        <option value="Specific Courses & Batches">Specific Courses & Batches</option>
                        <option value="Trainers">Faculty Gurus Only</option>
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

                  {/* SIDE-BY-SIDE SEARCHABLE MULTI-SELECT DROPDOWNS FOR COURSES & BATCHES */}
                  {formData.audience === 'Specific Courses & Batches' && (
                    <div className="p-4 rounded-3xl bg-gray-50 border border-gray-200 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#075E54] uppercase tracking-wider">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>Select Target Courses & Batches (Side-by-Side Searchable)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Left: Courses Searchable Multi-Select */}
                        <SearchableMultiSelect
                          label="Select Courses"
                          placeholder="Search & choose courses..."
                          items={courses.map(c => ({ id: c.id, label: c.title, sublabel: c.category || 'Course' }))}
                          selectedIds={selectedCourseIds}
                          onChange={setSelectedCourseIds}
                        />

                        {/* Right: Batches Searchable Multi-Select */}
                        <SearchableMultiSelect
                          label="Select Batches"
                          placeholder="Search & choose batches..."
                          items={availableBatchesForCompose.map(b => ({ id: b.id, label: b.name }))}
                          selectedIds={selectedBatchIds}
                          onChange={setSelectedBatchIds}
                        />
                      </div>

                      {formErrors.audience && (
                        <p className="text-xs font-bold text-rose-600">{formErrors.audience}</p>
                      )}
                    </div>
                  )}

                  {/* DISPATCH STATUS */}
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

                  {/* Informational Banner for Publish Now */}
                  {formData.status === 'Published' && (
                    <div className="p-3.5 rounded-2xl bg-[#E8F8F0] border border-[#BCE8D0] flex items-center gap-2.5 text-xs font-bold text-[#075E54]">
                      <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                      <span>
                        Publish Now: Active immediately with today's date ({new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}).
                      </span>
                    </div>
                  )}

                  {/* SCHEDULE LATER: DATE AND TIME SELECTION */}
                  {formData.status === 'Scheduled' && (
                    <div className="p-4 rounded-3xl bg-blue-50 border border-blue-200 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase tracking-wider">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Select Scheduled Dispatch Date & Time *</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-blue-900 mb-1">
                            Scheduled Date:
                          </label>
                          <input
                            type="date"
                            value={formData.publish_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                            className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-xs font-bold text-blue-900 bg-white"
                          />
                          {formErrors.publish_date && <p className="text-xs font-bold text-rose-600 mt-1">{formErrors.publish_date}</p>}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-blue-900 mb-1">
                            Scheduled Time:
                          </label>
                          <input
                            type="time"
                            value={formData.publish_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, publish_time: e.target.value }))}
                            className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-xs font-bold text-blue-900 bg-white"
                          />
                          {formErrors.publish_time && <p className="text-xs font-bold text-rose-600 mt-1">{formErrors.publish_time}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SHARE LINK (IMPROVED UI) */}
                  <div className="space-y-3 p-4 rounded-3xl bg-[#FFF9FB] border border-[#F0D5E4]">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-[#8A064D] uppercase tracking-wider flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>SHARE LINK (OPTIONAL)</span>
                        </label>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Attach registration URLs, Google Drive syllabus folders, or video links.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            share_links: [...prev.share_links, { title: '', url: '' }]
                          }));
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-xs"
                      >
                        + Add Share Link
                      </button>
                    </div>

                    {formData.share_links.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400 font-medium bg-white">
                        No share links attached. Click "+ Add Share Link" to include buttons in the mobile app.
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        {formData.share_links.map((link, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#F0D5E4] shadow-xs">
                            <Globe className="w-4 h-4 text-[#8A064D] shrink-0 ml-1" />
                            <input
                              type="text"
                              value={link.title}
                              placeholder="Link Title (e.g. Register for Workshop)"
                              onChange={(e) => {
                                const newLinks = [...formData.share_links];
                                newLinks[idx].title = e.target.value;
                                setFormData(prev => ({ ...prev, share_links: newLinks }));
                              }}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                            />
                            <input
                              type="url"
                              value={link.url}
                              placeholder="https://..."
                              onChange={(e) => {
                                const newLinks = [...formData.share_links];
                                newLinks[idx].url = e.target.value;
                                setFormData(prev => ({ ...prev, share_links: newLinks }));
                              }}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  share_links: prev.share_links.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                              title="Remove Link"
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
                          <div className="text-[10px] text-gray-500">Today</div>
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

                    {formData.share_links && formData.share_links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formData.share_links.map((link, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white text-[#075E54] border border-[#C2EDB9]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{link.title || 'Link'}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#C2EDB9] flex items-center justify-between text-[10px] text-gray-500 font-bold">
                      <span>Target: {formData.audience}</span>
                      <div className="flex items-center gap-1">
                        <span>{formData.publish_time || '10:30 AM'}</span>
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

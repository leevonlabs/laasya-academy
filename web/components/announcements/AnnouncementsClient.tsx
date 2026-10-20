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
  BookOpen,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  CalendarX2,
  CalendarCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Announcement } from '@/lib/announcements';
import AiEnhanceButton from '@/components/common/AiEnhanceButton';
import MonthPicker from '@/components/common/MonthPicker';
import AnnouncementsNavTabs from './AnnouncementsNavTabs';

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
  defaultTab?: 'admin_sent' | 'guru_sent';
  defaultViewMode?: 'overview' | 'chat';
}

// -------------------------------------------------------------
// Compact Searchable Multi-Select Dropdown Component
// -------------------------------------------------------------
function CompactSearchableMultiSelect({
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
      {label && (
        <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-0.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white hover:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54] text-xs font-semibold text-left flex items-center justify-between gap-1.5 shadow-2xs transition"
      >
        <div className="flex-1 truncate">
          {selectedIds.length === 0 ? (
            <span className="text-gray-400 font-medium truncate">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1 flex-nowrap truncate">
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#075E54] text-[9px] font-black shrink-0">
                {selectedIds.length}
              </span>
              <span className="text-gray-800 truncate text-[11px] font-bold">
                {items
                  .filter(i => selectedIds.includes(i.id))
                  .map(i => i.label)
                  .slice(0, 1)
                  .join(', ')}
                {selectedIds.length > 1 && ` +${selectedIds.length - 1}`}
              </span>
            </div>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#075E54]' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 min-w-[240px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search...`}
              className="w-full pl-7 pr-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#075E54]"
              autoFocus
            />
          </div>

          {/* Quick Select Actions */}
          <div className="flex items-center justify-between text-[10px] font-bold px-1 text-gray-500 border-b border-gray-100 pb-1">
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
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredItems.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3 font-medium">No results</p>
            ) : (
              filteredItems.map(item => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                      isChecked ? 'bg-emerald-50 text-[#075E54] font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition ${
                        isChecked ? 'bg-[#075E54] border-[#075E54] text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.sublabel && (
                      <span className="text-[9px] text-gray-400 font-normal ml-1.5 shrink-0">
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
// MAIN COMPONENT
// -------------------------------------------------------------
export default function AnnouncementsClient({ 
  initialAnnouncements, 
  courses, 
  batches, 
  trainers = [], 
  students = [],
  defaultTab = 'admin_sent',
  defaultViewMode = 'overview'
}: Props) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    initialAnnouncements.filter(a => a.announcement_type !== 'banner')
  );

  // Active Tab: 'admin_sent' vs 'guru_sent'
  const [activeTab, setActiveTab] = useState<'admin_sent' | 'guru_sent'>(defaultTab);

  // View Mode: 'overview' (landing 3 cards) vs 'chat' (full dedicated chat page)
  const [viewMode, setViewMode] = useState<'overview' | 'chat'>(defaultViewMode);

  // Default Current Month
  const defaultDates = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { firstDay, lastDay };
  }, []);

  // -------------------------------------------------------------
  // ADMIN SENT FILTERS STATE (Date Range, Audience, Category, Search)
  // -------------------------------------------------------------
  // ADMIN SENT FILTERS STATE
  // -------------------------------------------------------------
  const [adminSearch, setAdminSearch] = useState('');
  const [adminAudience, setAdminAudience] = useState('all');
  const [adminCategory, setAdminCategory] = useState('all');
  const [adminMonthLabel, setAdminMonthLabel] = useState('October 2026');
  const [adminStartDate, setAdminStartDate] = useState(defaultDates.firstDay);
  const [adminEndDate, setAdminEndDate] = useState(defaultDates.lastDay);
  const [appliedAdminFilters, setAppliedAdminFilters] = useState({
    search: '',
    audience: 'all',
    category: 'all',
    startDate: defaultDates.firstDay,
    endDate: defaultDates.lastDay,
    hasApplied: false
  });

  const handleApplyAdminFilters = () => {
    setAppliedAdminFilters({
      search: adminSearch,
      audience: adminAudience,
      category: adminCategory,
      startDate: adminStartDate,
      endDate: adminEndDate,
      hasApplied: true
    });
  };

  const handleResetAdminFilters = () => {
    setAdminSearch('');
    setAdminAudience('all');
    setAdminCategory('all');
    setAdminMonthLabel('October 2026');
    setAdminStartDate(defaultDates.firstDay);
    setAdminEndDate(defaultDates.lastDay);
    setAppliedAdminFilters({
      search: '',
      audience: 'all',
      category: 'all',
      startDate: defaultDates.firstDay,
      endDate: defaultDates.lastDay,
      hasApplied: false
    });
  };

  // -------------------------------------------------------------
  // GURU SENT FILTERS STATE (Multi-select Guru, Batch, Student + Date Range)
  // -------------------------------------------------------------
  const [guruSelectedGurus, setGuruSelectedGurus] = useState<string[]>([]);
  const [guruSelectedBatches, setGuruSelectedBatches] = useState<string[]>([]);
  const [guruSelectedStudents, setGuruSelectedStudents] = useState<string[]>([]);
  const [guruMonthLabel, setGuruMonthLabel] = useState('October 2026');
  const [guruStartDate, setGuruStartDate] = useState(defaultDates.firstDay);
  const [guruEndDate, setGuruEndDate] = useState(defaultDates.lastDay);

  const [appliedGuruFilters, setAppliedGuruFilters] = useState({
    guruIds: [] as string[],
    batchIds: [] as string[],
    studentIds: [] as string[],
    startDate: defaultDates.firstDay,
    endDate: defaultDates.lastDay,
    hasApplied: false
  });

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

  const handleResetGuruFilters = () => {
    setGuruSelectedGurus([]);
    setGuruSelectedBatches([]);
    setGuruSelectedStudents([]);
    setGuruMonthLabel('October 2026');
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

  // -------------------------------------------------------------
  // Modals & Popups State
  // -------------------------------------------------------------
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  const [detailModalAnnouncement, setDetailModalAnnouncement] = useState<Announcement | null>(null);
  const [recipientModalAnnouncement, setRecipientModalAnnouncement] = useState<Announcement | null>(null);
  const [recipientStudents, setRecipientStudents] = useState<RecipientStudent[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');

  // Compose / Edit Form State
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

  // Chat scroll anchors & container refs
  const adminChatEndRef = useRef<HTMLDivElement>(null);
  const guruChatEndRef = useRef<HTMLDivElement>(null);
  const adminScrollContainerRef = useRef<HTMLDivElement>(null);
  const guruScrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Format Date and Time in Indian Standard Time (IST)
  const formatDateTime = (dateStr?: string, createdStr?: string) => {
    // Time priority: createdStr contains the true exact timestamp when message was broadcast
    const rawTime = createdStr || dateStr;
    const rawDate = dateStr || createdStr;
    if (!rawDate && !rawTime) return { date: '—', time: '—', rawDate: '' };

    const dateObj = new Date(rawDate!);
    const timeObj = new Date(rawTime!);

    const dateFormatted = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
      : '—';
    const timeFormatted = !isNaN(timeObj.getTime())
      ? timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
      : '—';

    return { 
      date: dateFormatted, 
      time: timeFormatted, 
      rawDate: !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '' 
    };
  };

  const getDaySeparator = (dateStr?: string, createdStr?: string) => {
    const raw = dateStr || createdStr;
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';

    const todayStr = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });
    const msgDateStr = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });

    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });

    if (msgDateStr === todayStr) return 'TODAY';
    if (msgDateStr === yesterdayStr) return 'YESTERDAY';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).toUpperCase();
  };

  // Admin Sent Messages (Sorted Oldest on Top, Latest Below like WhatsApp)
  const adminMessages = useMemo(() => {
    const list = announcements.filter(ann => {
      if (!isAdminSent(ann)) return false;

      // Filter: Search
      if (appliedAdminFilters.search.trim()) {
        const q = appliedAdminFilters.search.toLowerCase();
        const matchesTitle = ann.title?.toLowerCase().includes(q);
        const matchesMsg = ann.message?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }

      // Filter: Audience
      if (appliedAdminFilters.audience !== 'all' && ann.audience !== appliedAdminFilters.audience) {
        return false;
      }

      // Filter: Category
      if (appliedAdminFilters.category !== 'all' && ann.type_tag !== appliedAdminFilters.category) {
        return false;
      }

      // Filter: Date Range
      const dateStr = ann.publish_date?.split('T')[0] || ann.created_at?.split('T')[0];
      if (dateStr) {
        if (appliedAdminFilters.startDate && dateStr < appliedAdminFilters.startDate) return false;
        if (appliedAdminFilters.endDate && dateStr > appliedAdminFilters.endDate) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      const timeA = new Date(a.created_at || a.publish_date).getTime();
      const timeB = new Date(b.created_at || b.publish_date).getTime();
      return timeA - timeB;
    });

    // Deduplicate broadcasts (especially holiday alerts dispatched across multiple courses/batches)
    const seen = new Set<string>();
    const deduped: Announcement[] = [];
    for (const ann of list) {
      const isHol = ann.type_tag === 'Holiday' || (ann.title || '').toLowerCase().includes('holiday');
      const d = ann.publish_date?.split('T')[0] || ann.created_at?.split('T')[0] || '';
      const t = (ann.title || '').trim().toLowerCase();
      const m = (ann.message || '').trim().toLowerCase();
      const key = isHol ? `holiday|${t}|${d}` : `${t}|${m}|${d}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(ann);
      }
    }
    return deduped;
  }, [announcements, appliedAdminFilters]);

  // Guru Sent Messages (Sorted Oldest on Top, Latest Below like WhatsApp)
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
      const timeA = new Date(a.created_at || a.publish_date).getTime();
      const timeB = new Date(b.created_at || b.publish_date).getTime();
      return timeA - timeB;
    });
    return list;
  }, [announcements, appliedGuruFilters, trainers]);

  // WhatsApp-style Auto-scroll: Immediately position view at the bottom (latest messages)
  useEffect(() => {
    if (viewMode === 'chat') {
      const timer = setTimeout(() => {
        if (activeTab === 'admin_sent') {
          if (adminScrollContainerRef.current) {
            adminScrollContainerRef.current.scrollTop = adminScrollContainerRef.current.scrollHeight;
          }
          adminChatEndRef.current?.scrollIntoView({ behavior: 'auto' });
        } else {
          if (guruScrollContainerRef.current) {
            guruScrollContainerRef.current.scrollTop = guruScrollContainerRef.current.scrollHeight;
          }
          guruChatEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode, activeTab, adminMessages.length, guruMessages.length]);

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

  const availableBatchesForCompose = useMemo(() => {
    if (selectedCourseIds.length === 0) return batches;
    return batches.filter(b => selectedCourseIds.includes(b.course_id));
  }, [batches, selectedCourseIds]);

  return (
    <div className="w-full space-y-2.5 pb-2">
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

      {viewMode === 'overview' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Announcements Heading & Description */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#075E54] text-[#25D366] flex items-center justify-center shadow-md shrink-0">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                    <span>Announcements & Broadcast Messages</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#075E54] text-xs font-black border border-emerald-200 uppercase">
                      Live Feed
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 max-w-2xl leading-relaxed">
                    Centralized communications directory for Laasya Academy. Broadcast official updates, holiday notices, fee reminders, and monitor faculty guru messages sent to students and batches.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Grid-Based Action Cards (Admin, Guru, Holiday Alert) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Admin Broadcasts */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 hover:border-[#075E54] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#075E54] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-[#075E54]">
                    {adminMessages.length} Messages
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 group-hover:text-[#075E54] transition-colors">Admin Broadcasts</h2>
                  <p className="text-xs text-gray-600 font-medium mt-1.5 leading-relaxed">
                    Official academy-wide notices, fee reminders, schedule changes, and general broadcasts sent directly to students and gurus.
                  </p>
                </div>
              </div>

              <Link
                href="/announcements/admin-broadcasts"
                className="w-full py-3 px-4 rounded-xl bg-[#075E54] hover:bg-[#064e46] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
              >
                <span>Open Admin Chat</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card 2: Guru Announcements */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 hover:border-[#075E54] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-[#8A064D]">
                    {guruMessages.length} Messages
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 group-hover:text-[#8A064D] transition-colors">Guru Announcements</h2>
                  <p className="text-xs text-gray-600 font-medium mt-1.5 leading-relaxed">
                    Batch practice directives, classroom instructions, curriculum notes, and direct updates shared by faculty gurus.
                  </p>
                </div>
              </div>

              <Link
                href="/announcements/guru-announcements"
                className="w-full py-3 px-4 rounded-xl bg-[#075E54] hover:bg-[#064e46] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
              >
                <span>Open Guru Feed</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card 3: Holiday Alert */}
            <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 hover:border-[#8A064D] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <CalendarX2 className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-[#8A064D]">
                    Multi-Batch &amp; Realtime
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 group-hover:text-[#8A064D] transition-colors">Holiday Alert</h2>
                  <p className="text-xs text-gray-600 font-medium mt-1.5 leading-relaxed">
                    Declare academy holidays with multi-course &amp; multi-batch selection. Assigned Gurus and enrolled students get notified instantly and at 12 AM.
                  </p>
                </div>
              </div>

              <Link
                href="/announcements/holiday-alert"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#590231] to-[#8A064D] hover:from-[#48082B] hover:to-[#70043E] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
              >
                <span>Declare Holiday Alert</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* ===================================================================== */}
      {/* 1. ADMIN SENT TAB (WITH COMPACT FILTER BAR + TALL WHATSAPP CHAT)      */}
      {/* ===================================================================== */}
      {activeTab === 'admin_sent' && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          {/* COMPACT FILTER BAR FOR ADMIN SENT */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Back to Overview */}
              <Link
                href="/announcements"
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer shrink-0 shadow-2xs"
                title="Back to Overview"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
                <span className="hidden sm:inline">Back to Overview</span>
                <span className="sm:hidden">Back</span>
              </Link>

              {/* Search: expands to fill remaining space cleanly */}
              <div className="relative min-w-[180px] flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Search notices, broadcasts, messages..."
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#075E54] bg-gray-50/50 hover:bg-white transition"
                />
              </div>

              {/* Audience Filter */}
              <div className="w-auto min-w-[125px]">
                <select
                  value={adminAudience}
                  onChange={(e) => setAdminAudience(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#075E54]"
                >
                  <option value="all">All Audiences</option>
                  <option value="All students">All Students</option>
                  <option value="Students and Gurus">Students & Gurus</option>
                  <option value="Specific Courses & Batches">Selected Courses/Batches</option>
                  <option value="Trainers">Faculty Gurus Only</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="w-auto min-w-[110px]">
                <select
                  value={adminCategory}
                  onChange={(e) => setAdminCategory(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#075E54]"
                >
                  <option value="all">All Categories</option>
                  <option value="General">General</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Schedule change">Schedule change</option>
                  <option value="Cancellation">Cancellation</option>
                  <option value="Fee reminder">Fee reminder</option>
                </select>
              </div>

              {/* Month & Year Filter using MonthPicker */}
              <div className="w-auto min-w-[140px]">
                <MonthPicker
                  value={adminMonthLabel}
                  onChange={(label, key, sDate, eDate) => {
                    setAdminMonthLabel(label);
                    setAdminStartDate(sDate);
                    setAdminEndDate(eDate);
                  }}
                  align="left"
                  placeholder="Select Month & Year"
                  className="w-full"
                />
              </div>

              {/* Filter Action Buttons */}
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={handleApplyAdminFilters}
                  className="h-9 px-4 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-md ring-2 ring-[#075E54]/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Apply Filter</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAdminFilters}
                  className="h-9 px-3 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 shadow-2xs cursor-pointer transition flex items-center justify-center gap-1"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* EXPANDED FULL-HEIGHT WHATSAPP CHAT STREAM */}
          <div className="relative rounded-3xl bg-[#EFEAE2] border border-gray-300 shadow-inner h-[calc(100vh-170px)] min-h-[620px] flex flex-col overflow-hidden">
            <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#075E54_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Scrollable messages container */}
            <div 
              ref={adminScrollContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 relative z-10 w-full"
            >
              {adminMessages.length === 0 ? (
                <div className="text-center py-20 space-y-2 bg-white/70 backdrop-blur-xs rounded-3xl p-6 max-w-sm mx-auto border border-gray-200 my-auto">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#075E54] mx-auto flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-gray-800">No Admin Broadcasts Found</h3>
                  <p className="text-xs text-gray-500">
                    No messages match current filters. Click "Reset" or broadcast a new message.
                  </p>
                </div>
              ) : (
                adminMessages.map((ann, idx) => {
                  const { date, time } = formatDateTime(ann.publish_date, ann.created_at);
                  const prevMsg = idx > 0 ? adminMessages[idx - 1] : null;
                  const prevDate = prevMsg ? formatDateTime(prevMsg.publish_date, prevMsg.created_at).date : null;
                  const showDateHeader = idx === 0 || date !== prevDate;

                  return (
                    <div key={ann.id} className="space-y-2">
                      {/* Date Divider */}
                      {showDateHeader && (
                        <div className="flex justify-center my-2">
                          <span className="px-3 py-0.5 rounded-full bg-white/95 shadow-2xs border border-gray-200 text-[9px] font-black uppercase text-gray-600 tracking-wider">
                            {getDaySeparator(ann.publish_date, ann.created_at)} • {date}
                          </span>
                        </div>
                      )}

                      {/* Right-Aligned Admin Chat Bubble */}
                      <div className="flex justify-end">
                        <div className="max-w-xl w-full sm:w-auto min-w-[280px] sm:min-w-[340px] bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-3.5 sm:p-4 shadow-sm border border-[#C2EDB9] space-y-2.5 transition hover:shadow-md">
                          {/* Top Header: Sender & Date */}
                          <div className="flex items-center justify-between border-b border-[#C2EDB9] pb-1.5 gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-black text-[10px] shadow-2xs">
                                👑
                              </div>
                              <div>
                                <div className="text-[11px] font-black text-[#075E54] flex items-center gap-1">
                                  <span>Academy Administration</span>
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#075E54] text-white">
                                    Director
                                  </span>
                                </div>
                                <div className="text-[9px] text-gray-500 font-semibold">
                                  {date}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {renderCategoryTag(ann.type_tag)}
                            </div>
                          </div>

                          {/* Subject / Title */}
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-snug">
                              {ann.title}
                            </h4>
                            <div className="flex flex-wrap gap-1 text-[9px] text-gray-600 font-bold mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-white/80 text-[#075E54] border border-[#C2EDB9]">
                                🎯 {ann.audience}
                              </span>
                            </div>
                          </div>

                          {/* Image */}
                          {ann.image_url && (
                            <div className="rounded-xl overflow-hidden border border-[#C2EDB9] max-h-52 bg-black/5">
                              <img
                                src={ann.image_url}
                                alt={ann.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Content */}
                          <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                            {ann.message}
                          </p>

                          {/* Share Links */}
                          {ann.action_links && ann.action_links.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {ann.action_links.map((link, lIdx) => (
                                <a
                                  key={lIdx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg bg-white text-[#075E54] border border-[#C2EDB9] hover:bg-emerald-50 transition shadow-2xs"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 text-[#075E54]" />
                                  <span>{link.title}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Bottom Row: Actions & Time */}
                          <div className="pt-2 border-t border-[#C2EDB9] flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {/* Details text button */}
                              <button
                                onClick={() => {
                                  const isHoliday = ann.type_tag === 'Holiday' || (ann.title || '').toLowerCase().includes('holiday') || (ann.message || '').toLowerCase().includes('holiday');
                                  if (isHoliday) {
                                    router.push(`/announcements/holiday-alert?viewTitle=${encodeURIComponent(ann.title)}&action=details`);
                                  } else {
                                    setDetailModalAnnouncement(ann);
                                  }
                                }}
                                className="h-7 px-3 rounded-lg bg-white hover:bg-emerald-50 text-[#075E54] border border-[#C2EDB9] text-[10px] font-black shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3 h-3 text-[#075E54]" />
                                <span>Details</span>
                              </button>

                              {/* Edit text button */}
                              <button
                                onClick={() => {
                                  const isHoliday = ann.type_tag === 'Holiday' || (ann.title || '').toLowerCase().includes('holiday') || (ann.message || '').toLowerCase().includes('holiday');
                                  if (isHoliday) {
                                    router.push(`/announcements/holiday-alert?viewTitle=${encodeURIComponent(ann.title)}&action=edit`);
                                  } else {
                                    openEditModal(ann);
                                  }
                                }}
                                className="h-7 px-3 rounded-lg bg-white hover:bg-emerald-50 text-gray-700 border border-[#C2EDB9] text-[10px] font-black shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer"
                                title="Edit Broadcast"
                              >
                                <Edit3 className="w-3 h-3 text-gray-600" />
                                <span>Edit</span>
                              </button>

                              {/* Delete text button */}
                              <button
                                onClick={() => {
                                  const isHoliday = ann.type_tag === 'Holiday' || (ann.title || '').toLowerCase().includes('holiday') || (ann.message || '').toLowerCase().includes('holiday');
                                  if (isHoliday) {
                                    router.push(`/announcements/holiday-alert?viewTitle=${encodeURIComponent(ann.title)}&action=delete`);
                                  } else {
                                    setDeletingAnnouncement(ann);
                                  }
                                }}
                                className="h-7 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer"
                                title="Delete Broadcast"
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                                <span>Delete</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold shrink-0 ml-auto">
                              <span>{time}</span>
                              <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
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

            {/* PINNED BOTTOM-LEFT FLOATING ACTION BUTTON */}
            <div className="absolute bottom-4 left-5 z-20">
              <button
                onClick={openCreateModal}
                className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-[#075E54] font-black text-sm sm:text-base shadow-2xl flex items-center gap-2.5 cursor-pointer transition transform hover:scale-105 active:scale-95 border-2 border-white ring-4 ring-emerald-500/20"
              >
                <Plus className="w-5 h-5 text-[#075E54] stroke-[3.5]" />
                <span>+ Broadcast New Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. GURU SENT TAB (STREAMLINED ULTRA-COMPACT FILTERS + TALL CHAT)       */}
      {/* ===================================================================== */}
      {activeTab === 'guru_sent' && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          {/* STREAMLINED ULTRA-COMPACT FILTER BAR */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Back to Overview */}
              <Link
                href="/announcements"
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer shrink-0 shadow-2xs"
                title="Back to Overview"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
                <span className="hidden sm:inline">Back to Overview</span>
                <span className="sm:hidden">Back</span>
              </Link>

              {/* 1. Guru Filter: flexes to fill space */}
              <div className="flex-1 min-w-[160px]">
                <CompactSearchableMultiSelect
                  label="Faculty Guru"
                  placeholder="All Gurus"
                  items={trainers.map(t => ({ id: t.id, label: t.full_name, sublabel: t.display_title || 'Faculty' }))}
                  selectedIds={guruSelectedGurus}
                  onChange={setGuruSelectedGurus}
                />
              </div>

              {/* 2. Batch Filter: flexes to fill space */}
              <div className="flex-1 min-w-[150px]">
                <CompactSearchableMultiSelect
                  label="Batch"
                  placeholder="All Batches"
                  items={batches.map(b => ({ id: b.id, label: b.name }))}
                  selectedIds={guruSelectedBatches}
                  onChange={setGuruSelectedBatches}
                />
              </div>

              {/* 3. Student Filter: flexes to fill space */}
              <div className="flex-1 min-w-[160px]">
                <CompactSearchableMultiSelect
                  label="Disciple Student"
                  placeholder="All Students"
                  items={students.map(s => ({ id: s.id, label: s.full_name, sublabel: s.roll_number || 'Student' }))}
                  selectedIds={guruSelectedStudents}
                  onChange={setGuruSelectedStudents}
                />
              </div>

              {/* 4. Month & Year Filter using MonthPicker */}
              <div className="w-auto min-w-[145px]">
                <MonthPicker
                  value={guruMonthLabel}
                  onChange={(label, key, sDate, eDate) => {
                    setGuruMonthLabel(label);
                    setGuruStartDate(sDate);
                    setGuruEndDate(eDate);
                  }}
                  align="left"
                  placeholder="Select Month & Year"
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={handleApplyGuruFilters}
                  className="h-9 px-3.5 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetGuruFilters}
                  className="h-9 px-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* EXPANDED FULL-HEIGHT GURU CHAT STREAM */}
          <div className="relative rounded-3xl bg-[#EFEAE2] border border-gray-300 shadow-inner h-[calc(100vh-170px)] min-h-[620px] flex flex-col overflow-hidden">
            <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#075E54_1px,transparent_1px)] [background-size:16px_16px]" />

            <div 
              ref={guruScrollContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 relative z-10 w-full"
            >
              {guruMessages.length === 0 ? (
                <div className="text-center py-20 space-y-2 bg-white/70 backdrop-blur-xs rounded-3xl p-6 max-w-sm mx-auto border border-gray-200 my-auto">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-gray-800">No Guru Messages Found</h3>
                  <p className="text-xs text-gray-500">
                    No faculty broadcasts match current filters. Click "Reset" or adjust your filter selection.
                  </p>
                </div>
              ) : (
                guruMessages.map((ann, idx) => {
                  const { date, time } = formatDateTime(ann.publish_date, ann.created_at);
                  const prevMsg = idx > 0 ? guruMessages[idx - 1] : null;
                  const prevDate = prevMsg ? formatDateTime(prevMsg.publish_date, prevMsg.created_at).date : null;
                  const showDateHeader = idx === 0 || date !== prevDate;

                  return (
                    <div key={ann.id} className="space-y-2">
                      {showDateHeader && (
                        <div className="flex justify-center my-2">
                          <span className="px-3 py-0.5 rounded-full bg-white/95 shadow-2xs border border-gray-200 text-[9px] font-black uppercase text-gray-600 tracking-wider">
                            {getDaySeparator(ann.publish_date, ann.created_at)} • {date}
                          </span>
                        </div>
                      )}

                      {/* Left-Aligned Guru Bubble */}
                      <div className="flex justify-start">
                        <div className="max-w-xl w-full sm:w-auto min-w-[280px] sm:min-w-[340px] bg-white rounded-2xl rounded-tl-xs p-3.5 sm:p-4 shadow-sm border border-gray-200 space-y-2.5 transition hover:shadow-md">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#075E54] flex items-center justify-center font-black text-[10px]">
                                🙏
                              </div>
                              <div>
                                <div className="text-[11px] font-black text-[#075E54] flex items-center gap-1">
                                  <span>Guru: {ann.trainer_name || ann.created_by || 'Faculty'}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Faculty
                                  </span>
                                </div>
                                <div className="text-[9px] text-gray-400 font-bold">
                                  {date}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {renderCategoryTag(ann.type_tag)}
                            </div>
                          </div>

                          {/* Title */}
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-snug">
                              {ann.title}
                            </h4>
                            <div className="flex flex-wrap gap-1 text-[9px] text-gray-600 font-bold mt-0.5">
                              {ann.target_course_title && (
                                <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">
                                  📚 {ann.target_course_title}
                                </span>
                              )}
                              {ann.target_batch_name && (
                                <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">
                                  👥 {ann.target_batch_name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Image */}
                          {ann.image_url && (
                            <div className="rounded-xl overflow-hidden border border-gray-200 max-h-52 bg-black/5">
                              <img
                                src={ann.image_url}
                                alt={ann.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Content */}
                          <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                            {ann.message}
                          </p>

                          {/* Action Links */}
                          {ann.action_links && ann.action_links.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {ann.action_links.map((link, lIdx) => (
                                <a
                                  key={lIdx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-[#075E54] border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>{link.title}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Bottom Row: Details Button & Time */}
                          <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setDetailModalAnnouncement(ann)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#075E54] text-[10px] font-black shadow-2xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Details & Students</span>
                            </button>

                            <div className="text-[10px] text-gray-400 font-bold shrink-0">
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. DETAILS MODAL                                                      */}
      {/* ===================================================================== */}
      {detailModalAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                  isGuruSent(detailModalAnnouncement) ? 'bg-emerald-100 text-[#075E54]' : 'bg-[#075E54] text-white'
                }`}>
                  {isGuruSent(detailModalAnnouncement) ? '🙏' : '👑'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Broadcast Message Details</h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {isGuruSent(detailModalAnnouncement) ? 'Sent by Faculty Guru' : 'Sent by Academy Administration'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalAnnouncement(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-xs">
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

              <div className="pt-1.5 border-t border-gray-200">
                <div className="text-gray-500 font-bold">Targeted Audience & Batch:</div>
                <div className="font-bold text-gray-800 mt-0.5">
                  {detailModalAnnouncement.target_course_title 
                    ? `Course: ${detailModalAnnouncement.target_course_title}` 
                    : `Audience: ${detailModalAnnouncement.audience}`}
                  {detailModalAnnouncement.target_batch_name && ` • Batch: ${detailModalAnnouncement.target_batch_name}`}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-gray-900">
                {detailModalAnnouncement.title}
              </h4>
              <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium bg-[#F8FAF9] p-3 rounded-xl border border-gray-100">
                {detailModalAnnouncement.message}
              </p>
            </div>

            {detailModalAnnouncement.image_url && (
              <div className="rounded-xl overflow-hidden border border-gray-200 max-h-56 bg-black/5">
                <img
                  src={detailModalAnnouncement.image_url}
                  alt={detailModalAnnouncement.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {detailModalAnnouncement.action_links && detailModalAnnouncement.action_links.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-gray-500">Share Links:</div>
                <div className="flex flex-wrap gap-1.5">
                  {detailModalAnnouncement.action_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#075E54] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
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
                className="px-4 py-2 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
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
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#075E54] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Message Recipient Disciples</h3>
                  <p className="text-[11px] text-gray-500 font-medium truncate max-w-md">
                    Targeted for: <span className="font-bold text-gray-800">"{recipientModalAnnouncement.title}"</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRecipientModalAnnouncement(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs font-bold text-gray-700">
                Total Recipient Disciples:{' '}
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#075E54] font-black">
                  {recipientStudents.length}
                </span>
              </div>

              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={recipientSearchQuery}
                  onChange={(e) => setRecipientSearchQuery(e.target.value)}
                  placeholder="Search disciple or roll no..."
                  className="pl-7 pr-2.5 py-1 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#075E54] w-52"
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
              {isLoadingRecipients ? (
                <div className="py-12 text-center space-y-1.5">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#075E54] mx-auto" />
                  <p className="text-xs font-bold text-gray-500">Loading recipient student list...</p>
                </div>
              ) : filteredRecipientStudents.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-500 font-medium">
                  {recipientStudents.length === 0 
                    ? 'No students enrolled in this target batch or course.' 
                    : 'No matching students found.'}
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Roll No</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Course & Batch</th>
                      <th className="py-2 px-3">Parent Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecipientStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-emerald-50/40 transition">
                        <td className="py-2 px-3 font-mono font-bold text-gray-700">
                          {st.roll_number || '—'}
                        </td>
                        <td className="py-2 px-3 font-bold text-gray-900">
                          {st.full_name}
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          <div className="font-semibold text-gray-800">{st.course_title || 'General'}</div>
                          <div className="text-[10px] text-gray-400">{st.batch_name || 'Active Batch'}</div>
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          <div className="font-semibold">{st.parent_name || 'Parent'}</div>
                          <div className="text-[10px] text-[#075E54] font-mono">
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
              <span className="text-[10px] text-gray-400">
                Verified delivery to Student Mobile App notifications & messages channel.
              </span>
              <button
                type="button"
                onClick={() => setRecipientModalAnnouncement(null)}
                className="px-4 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. COMPOSE MODAL                                                      */}
      {/* ===================================================================== */}
      {(isCreateModalOpen || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#075E54] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    {editingAnnouncement ? 'Edit Broadcast Message Announcement' : 'Broadcast Message Announcement'}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Delivers to Student Mobile App Message Channel (30-day retention)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingAnnouncement(null);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setActiveFormTab('compose')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition ${
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
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center justify-center gap-1 ${
                  activeFormTab === 'preview'
                    ? 'border-[#075E54] text-[#075E54] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>2. MESSAGE PREVIEW</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={editingAnnouncement ? handleSubmitEdit : handleSubmitCreate} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {activeFormTab === 'compose' ? (
                <>
                  {/* Notice Subject / Title */}
                  <div className="space-y-1">
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#075E54] text-xs font-bold text-gray-800 bg-[#F9FAFB]"
                    />
                    {formErrors.title && <p className="text-xs font-bold text-rose-600">{formErrors.title}</p>}
                  </div>

                  {/* Attach Image / Flyer */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-[#F0FDF4] border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-[#075E54] uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ATTACH IMAGE / FLYER (OPTIONAL)</span>
                      </label>
                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Image
                        </button>
                      )}
                    </div>

                    <div className="pt-0.5">
                      <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-emerald-500 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-black cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
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
                      <div className="pt-1.5 flex items-center gap-2.5">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-300 bg-black/5 shrink-0">
                          <img
                            src={formData.image_url}
                            alt="Attached Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-[11px] text-gray-600 font-semibold">
                          Image attached! Will display inside the broadcast card.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="space-y-1">
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
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Type official circular message content here..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#075E54] text-xs font-medium text-gray-800 bg-[#F9FAFB]"
                    />
                    {formErrors.message && <p className="text-xs font-bold text-rose-600">{formErrors.message}</p>}
                  </div>

                  {/* Target Audience & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        TARGET AUDIENCE *
                      </label>
                      <select
                        value={formData.audience}
                        onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value as any }))}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#075E54] text-xs font-bold text-gray-700 bg-white"
                      >
                        <option value="All students">All students</option>
                        <option value="Students and Gurus">Students and Gurus</option>
                        <option value="Specific Courses & Batches">Specific Courses & Batches</option>
                        <option value="Trainers">Faculty Gurus Only</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        CATEGORY TAG *
                      </label>
                      <select
                        value={formData.type_tag}
                        onChange={(e) => setFormData(prev => ({ ...prev, type_tag: e.target.value as any }))}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#075E54] text-xs font-bold text-gray-700 bg-white"
                      >
                        <option value="General">General</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Schedule change">Schedule change</option>
                        <option value="Cancellation">Cancellation</option>
                        <option value="Fee reminder">Fee reminder</option>
                      </select>
                    </div>
                  </div>

                  {/* Side-by-Side Courses & Batches Searchable Dropdowns */}
                  {formData.audience === 'Specific Courses & Batches' && (
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#075E54] uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Select Target Courses & Batches (Side-by-Side)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CompactSearchableMultiSelect
                          label="Target Courses"
                          placeholder="Search courses..."
                          items={courses.map(c => ({ id: c.id, label: c.title, sublabel: c.category || 'Course' }))}
                          selectedIds={selectedCourseIds}
                          onChange={setSelectedCourseIds}
                        />

                        <CompactSearchableMultiSelect
                          label="Target Batches"
                          placeholder="Search batches..."
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

                  {/* Dispatch Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      DISPATCH STATUS *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full h-9 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#075E54] text-xs font-bold text-gray-700 bg-white"
                    >
                      <option value="Published">Publish Now</option>
                      <option value="Scheduled">Schedule Later</option>
                      <option value="Draft">Save as Draft</option>
                    </select>
                  </div>

                  {formData.status === 'Published' && (
                    <div className="p-2.5 rounded-xl bg-[#E8F8F0] border border-[#BCE8D0] flex items-center gap-2 text-xs font-bold text-[#075E54]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                      <span>
                        Publish Now: Active immediately with today's date ({new Date().toLocaleDateString('en-GB')}).
                      </span>
                    </div>
                  )}

                  {/* Schedule Later Date + Time */}
                  {formData.status === 'Scheduled' && (
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-blue-900 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select Scheduled Date & Time *</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 mb-0.5">Date:</label>
                          <input
                            type="date"
                            value={formData.publish_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                            className="w-full h-9 px-2.5 rounded-xl border border-blue-300 text-xs font-bold text-blue-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 mb-0.5">Time:</label>
                          <input
                            type="time"
                            value={formData.publish_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, publish_time: e.target.value }))}
                            className="w-full h-9 px-2.5 rounded-xl border border-blue-300 text-xs font-bold text-blue-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Share Link UI */}
                  <div className="space-y-2 p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-[#8A064D] uppercase tracking-wider flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          <span>SHARE LINK (OPTIONAL)</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            share_links: [...prev.share_links, { title: '', url: '' }]
                          }));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#8A064D] hover:bg-[#590231] text-white text-[11px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
                      >
                        + Add Share Link
                      </button>
                    </div>

                    {formData.share_links.length === 0 ? (
                      <div className="p-2.5 rounded-xl border border-dashed border-gray-200 text-center text-[11px] text-gray-400 font-medium bg-white">
                        No share links attached. Click "+ Add Share Link" to attach buttons.
                      </div>
                    ) : (
                      <div className="space-y-2 pt-0.5">
                        {formData.share_links.map((link, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-[#F0D5E4]">
                            <Globe className="w-3.5 h-3.5 text-[#8A064D] shrink-0 ml-0.5" />
                            <input
                              type="text"
                              value={link.title}
                              placeholder="Title (e.g. Register Form)"
                              onChange={(e) => {
                                const newLinks = [...formData.share_links];
                                newLinks[idx].title = e.target.value;
                                setFormData(prev => ({ ...prev, share_links: newLinks }));
                              }}
                              className="flex-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
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
                              className="flex-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  share_links: prev.share_links.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* 2. Message Preview */
                <div className="space-y-3 py-1">
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-500">Live Preview in Student App WhatsApp Channel</p>
                  </div>

                  <div className="max-w-md mx-auto bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-3.5 shadow-sm border border-[#C2EDB9] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#C2EDB9] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-black text-[10px]">
                          👑
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-[#075E54]">Academy Administration</div>
                          <div className="text-[9px] text-gray-500">Today</div>
                        </div>
                      </div>
                      {renderCategoryTag(formData.type_tag)}
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-snug">
                      {formData.title || 'Notice Subject'}
                    </h4>

                    {formData.image_url && (
                      <div className="rounded-xl overflow-hidden border border-[#C2EDB9] max-h-44">
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

                    <div className="pt-1.5 border-t border-[#C2EDB9] flex items-center justify-between text-[10px] text-gray-500 font-bold">
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
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingAnnouncement(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-black shadow-xs transition disabled:opacity-50 cursor-pointer"
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
      {/* 6. DELETE MODAL                                                       */}
      {/* ===================================================================== */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-rose-200 shadow-2xl p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">Delete Broadcast Message?</h3>
              <p className="text-xs text-gray-600">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{deletingAnnouncement.title}"</span>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingAnnouncement(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
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

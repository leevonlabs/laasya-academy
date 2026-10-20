'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  CalendarX2, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  Trash2, 
  Eye, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  X, 
  BookOpen, 
  Layers, 
  Send, 
  ArrowRight,
  ArrowLeft,
  Check, 
  RotateCcw,
  Tag,
  ShieldCheck,
  CalendarCheck,
  HelpCircle,
  AlertCircle,
  Edit3,
  Image as ImageIcon,
  UploadCloud,
  Table,
  ChevronUp
} from 'lucide-react';
import { HolidayAlert } from '@/lib/holidayTally';
import { Course, Batch, Trainer, Student } from '@/lib/academy';
import AiEnhanceButton from '@/components/common/AiEnhanceButton';

interface Props {
  initialAlerts: HolidayAlert[];
  courses: Course[];
  batches: Batch[];
  trainers: Trainer[];
  students: Student[];
}

export default function HolidayAlertClient({
  initialAlerts,
  courses,
  batches,
  trainers,
  students
}: Props) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<HolidayAlert[]>(initialAlerts);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<HolidayAlert | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingAlert, setViewingAlert] = useState<HolidayAlert | null>(null);
  const [showCourseBatchTableInDetails, setShowCourseBatchTableInDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYearNum = String(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearNum);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    const action = searchParams?.get('action');
    const viewTitle = searchParams?.get('viewTitle');
    const viewId = searchParams?.get('viewId');
    if (action && (viewTitle || viewId)) {
      const match = alerts.find(a => 
        (viewId && a.id === viewId) || 
        (viewTitle && a.title.toLowerCase().includes(viewTitle.toLowerCase()))
      );
      if (match) {
        if (action === 'details') {
          setViewingAlert(match);
        } else if (action === 'edit') {
          handleOpenEdit(match);
        } else if (action === 'delete') {
          handleDeleteAlert(match.id, match.title);
        }
      }
    }
  }, [searchParams, alerts]);

  // Helper to format created ISO string into DD MMM YYYY, hh:mm AM/PM
  const formatCreatedDateTime = (iso?: string) => {
    if (!iso) return '—';
    try {
      const dt = new Date(iso);
      if (isNaN(dt.getTime())) return iso;
      return dt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ', ' + dt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return iso;
    }
  };

  // Form State
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [holidayDate, setHolidayDate] = useState<string>(tomorrowStr);
  const [title, setTitle] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [sendInstant, setSendInstant] = useState<boolean>(true);
  const [send12am, setSend12am] = useState<boolean>(true);

  // Dropdown UI states
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setCourseDropdownOpen(false);
      }
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
        setBatchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter batches based on selected courses
  const availableBatches = useMemo(() => {
    if (selectedCourseIds.length === 0) return batches;
    return batches.filter(b => selectedCourseIds.includes(b.course_id));
  }, [batches, selectedCourseIds]);

  // When selectedCourseIds change, remove batches that belong to unselected courses
  const handleCourseSelectionChange = (newCourseIds: string[]) => {
    setSelectedCourseIds(newCourseIds);
    if (newCourseIds.length > 0) {
      setSelectedBatchIds(prev =>
        prev.filter(bId => {
          const b = batches.find(x => x.id === bId);
          return b && newCourseIds.includes(b.course_id);
        })
      );
    }
  };

  // Derive affected gurus from selected batches
  const affectedGurus = useMemo(() => {
    const guruMap = new Map<string, { id: string; name: string; guru_id?: string; count: number }>();
    selectedBatchIds.forEach(bId => {
      const b = batches.find(x => x.id === bId);
      if (b && b.trainer_id) {
        const t = trainers.find(tr => tr.id === b.trainer_id);
        const name = b.trainer_name || t?.full_name || 'Assigned Guru';
        const gid = t?.guru_id || t?.code;
        if (!guruMap.has(b.trainer_id)) {
          guruMap.set(b.trainer_id, { id: b.trainer_id, name, guru_id: gid, count: 1 });
        } else {
          guruMap.get(b.trainer_id)!.count += 1;
        }
      }
    });
    return Array.from(guruMap.values());
  }, [selectedBatchIds, batches, trainers]);

  // Derive estimated recipient students count
  const affectedStudentsCount = useMemo(() => {
    if (selectedBatchIds.length === 0) return 0;
    const studentIds = new Set<string>();
    students.forEach(s => {
      const enrolled = s.enrolled_batches || [];
      if (enrolled.some(eb => selectedBatchIds.includes(eb.batch_id))) {
        studentIds.add(s.id);
      }
    });
    return studentIds.size;
  }, [selectedBatchIds, students]);

  // Show Toast
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick Preset Holidays
  const setPresetHoliday = (pTitle: string, pReason: string) => {
    setTitle(pTitle);
    setReason(pReason);
  };

  // Reset Form
  const resetForm = () => {
    setTitle('');
    setReason('');
    setImageUrl('');
    setSelectedCourseIds([]);
    setSelectedBatchIds([]);
    setHolidayDate(tomorrowStr);
    setSendInstant(true);
    setSend12am(true);
  };

  // Handle Image File Upload (Optional)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Open Edit Modal
  const handleOpenEdit = (alert: HolidayAlert) => {
    setEditingAlert(alert);
    setHolidayDate(alert.holiday_date);
    setTitle(alert.title);
    setReason(alert.reason);
    setSelectedCourseIds(alert.target_course_ids || []);
    setSelectedBatchIds(alert.target_batch_ids || []);
    setImageUrl(alert.image_url || '');
    setIsEditModalOpen(true);
  };

  // Create Holiday Alert
  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate) {
      showToast('Please select a holiday date', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Please enter a holiday title', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide a reason / description', 'error');
      return;
    }
    if (selectedCourseIds.length === 0) {
      showToast('Please select at least one course', 'error');
      return;
    }
    if (selectedBatchIds.length === 0) {
      showToast('Please select at least one batch', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCoursesData = courses.filter(c => selectedCourseIds.includes(c.id));
      const selectedBatchesData = batches.filter(b => selectedBatchIds.includes(b.id));

      const payload = {
        holiday_date: holidayDate,
        title: title.trim(),
        reason: reason.trim(),
        target_course_ids: selectedCourseIds,
        target_course_titles: selectedCoursesData.map(c => c.title),
        target_batch_ids: selectedBatchIds,
        target_batch_names: selectedBatchesData.map(b => b.name),
        affected_guru_ids: affectedGurus.map(g => g.id),
        affected_guru_names: affectedGurus.map(g => g.name),
        image_url: imageUrl || null,
        send_instant: sendInstant,
        send_scheduled_12am: send12am
      };

      const res = await fetch('/api/holiday-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to declare holiday alert');
      }

      setAlerts(prev => [data.alert, ...prev]);
      showToast(`Holiday Alert "${data.alert.title}" successfully declared and broadcasted!`);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Error declaring holiday alert', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Holiday Alert
  const handleUpdateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlert) return;
    if (!holidayDate) {
      showToast('Please select a holiday date', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Please enter a holiday title', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide a reason / description', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCoursesData = courses.filter(c => selectedCourseIds.includes(c.id));
      const selectedBatchesData = batches.filter(b => selectedBatchIds.includes(b.id));

      const payload = {
        id: editingAlert.id,
        holiday_date: holidayDate,
        title: title.trim(),
        reason: reason.trim(),
        target_course_ids: selectedCourseIds,
        target_course_titles: selectedCoursesData.map(c => c.title),
        target_batch_ids: selectedBatchIds,
        target_batch_names: selectedBatchesData.map(b => b.name),
        affected_guru_ids: affectedGurus.map(g => g.id),
        affected_guru_names: affectedGurus.map(g => g.name),
        image_url: imageUrl || null
      };

      const res = await fetch('/api/holiday-alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update holiday alert');
      }

      setAlerts(prev => prev.map(a => a.id === data.alert.id ? data.alert : a));
      showToast(`Holiday Alert "${data.alert.title}" successfully updated!`);
      setIsEditModalOpen(false);
      setEditingAlert(null);
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Error updating holiday alert', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Holiday Alert
  const handleDeleteAlert = async (id: string, alertTitle: string) => {
    if (!confirm(`Are you sure you want to remove the holiday alert "${alertTitle}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/holiday-alerts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete holiday alert');
      setAlerts(prev => prev.filter(a => a.id !== id));
      if (viewingAlert && viewingAlert.id === id) {
        setViewingAlert(null);
      }
      showToast('Holiday alert cancelled and removed.');
    } catch (err: any) {
      showToast(err.message || 'Error deleting holiday alert', 'error');
    }
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (statusFilter !== 'all' && a.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (selectedYear !== 'all') {
        const aYear = a.holiday_date.split('-')[0];
        if (aYear !== selectedYear) return false;
      }
      if (selectedMonth !== 'all') {
        const aMonth = a.holiday_date.split('-')[1];
        if (aMonth !== selectedMonth) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesReason = a.reason.toLowerCase().includes(q);
        const matchesDate = a.holiday_date.includes(q);
        const matchesCourses = (a.target_course_titles || []).some(t => t.toLowerCase().includes(q));
        const matchesBatches = (a.target_batch_names || []).some(b => b.toLowerCase().includes(q));
        const matchesGurus = (a.affected_guru_names || []).some(g => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesReason && !matchesDate && !matchesCourses && !matchesBatches && !matchesGurus) {
          return false;
        }
      }
      return true;
    });
  }, [alerts, statusFilter, selectedYear, selectedMonth, searchQuery]);

  // Formatted day of week for selected holiday date
  const holidayDayOfWeek = useMemo(() => {
    if (!holidayDate) return '';
    try {
      const [y, m, d] = holidayDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '';
    }
  }, [holidayDate]);

  return (
    <div className="w-full space-y-4 pb-12">
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

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#FFF2F8] text-[#8A064D] border border-rose-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarX2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Holiday Alerts & Notices
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#8A064D] text-xs font-black">
                  Faculty & Student Broadcasts
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 max-w-2xl leading-relaxed">
                Declare scheduled academy holidays for multiple courses and batches. Assigned Gurus and enrolled students receive notifications instantly and at 12:00 AM on the holiday. Cancelled sessions can then be effortlessly rescheduled via Tally Classes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              href="/announcements"
              className="py-3 px-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
              <span>Back to Announcements</span>
            </Link>

            <Link
              href="/tally-classes"
              className="py-3 px-4 rounded-2xl bg-[#E8F8F0] hover:bg-[#d5f3e4] border border-emerald-200 text-[#075E54] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-[#075E54]" />
              <span>Go to Tally Classes</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-[#590231] to-[#8A064D] hover:from-[#470126] hover:to-[#70043E] active:scale-95 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F9E33A]" />
              <span>Declare Holiday Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar with Standard Month & Year Filter */}
      <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search holiday alerts by title, course, batch, guru, or date..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8A064D] bg-gray-50/50 hover:bg-white"
            />
          </div>

          {/* Month Filter Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8A064D] shadow-2xs cursor-pointer"
          >
            <option value="all">All Months</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          {/* Year Filter Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8A064D] shadow-2xs cursor-pointer"
          >
            <option value="all">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2027">2027</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8A064D] shadow-2xs cursor-pointer"
          >
            <option value="all">All Statuses ({alerts.length})</option>
            <option value="scheduled">Scheduled / Upcoming</option>
            <option value="active">Active Today</option>
            <option value="passed">Passed Holidays</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Reset Filters Button */}
          {(searchQuery || statusFilter !== 'all' || selectedMonth !== 'all' || selectedYear !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSelectedMonth('all');
                setSelectedYear('all');
              }}
              className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-gray-500">
          Showing <span className="text-[#8A064D] font-extrabold">{filteredAlerts.length}</span> of {alerts.length} declared alerts
        </div>
      </div>

      {/* Alerts Grid */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <CalendarX2 className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 text-base">No Holiday Alerts Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No holiday alerts match your search or filter criteria.'
              : 'No holiday alerts have been declared yet. Click "Declare Holiday Alert" to notify assigned gurus and students.'}
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8A064D] text-white text-xs font-bold hover:bg-[#70043E] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#F9E33A]" />
            <span>Declare New Holiday</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlerts.map(alert => {
            const isToday = alert.status === 'Active';
            const isPassed = alert.status === 'Passed';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isToday 
                    ? 'border-emerald-300 bg-emerald-50/20 shadow-xs' 
                    : isPassed 
                      ? 'border-gray-200 opacity-80' 
                      : 'border-rose-200 shadow-2xs hover:border-[#8A064D]'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Dates & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#8A064D] bg-[#FFF2F8] px-2.5 py-1 rounded-lg border border-rose-100">
                        <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                        <span>{alert.holiday_date}</span>
                      </div>
                      <div className="text-[10px] font-semibold text-gray-400 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>Created: {formatCreatedDateTime(alert.created_at)}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        alert.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                          : alert.status === 'Scheduled'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : alert.status === 'Passed'
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {alert.status === 'Active' ? 'Active Today' : alert.status}
                    </span>
                  </div>

                  {/* Title & Reason */}
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 line-clamp-1">{alert.title}</h3>
                    <p className="text-xs text-gray-600 mt-1.5 line-clamp-3 leading-relaxed">
                      {alert.reason}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingAlert(alert);
                      setShowCourseBatchTableInDetails(false);
                    }}
                    className="py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-gray-200 shadow-2xs"
                    title="View Full Holiday Details & Batch Table"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Details</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(alert)}
                      className="py-2 px-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-[#8A064D] text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-gray-200 shadow-2xs"
                      title="Edit Holiday Alert"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(alert.id, alert.title)}
                      className="py-2 px-2.5 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition cursor-pointer border border-gray-200 shadow-2xs"
                      title="Cancel / Delete Holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      href={`/tally-classes?holiday_id=${alert.id}&holiday_date=${alert.holiday_date}&from=${alert.holiday_date}&to=${alert.holiday_date}&title=${encodeURIComponent(alert.title)}`}
                      className="py-2 px-3 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                      title="Reschedule affected classes with date range filter prefilled"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-[#F9E33A]" />
                      <span>Reschedule</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* DECLARE HOLIDAY ALERT MODAL                                           */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center shadow-2xs">
                  <CalendarX2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-xl sm:text-2xl text-gray-900">
                    Declare Holiday Alert
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Notify assigned faculty gurus and enrolled students across courses &amp; batches instantly and at 12:00 AM
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateHoliday} className="p-6 sm:p-7 space-y-5">
              {/* Image Upload Option (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                  Holiday Banner / Circular Image <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {imageUrl ? (
                    <div className="relative w-36 h-20 rounded-2xl overflow-hidden border border-[#F0D5E4] shadow-2xs group shrink-0">
                      <img src={imageUrl} alt="Uploaded circular" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl border-2 border-dashed border-[#F0D5E4] bg-[#FFF9FB] hover:bg-white text-center cursor-pointer transition w-full shadow-2xs group">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#F0D5E4] text-[#8A064D] flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                        <UploadCloud className="w-6 h-6 text-[#8A064D]" />
                      </div>
                      <div className="text-xs font-bold text-[#8A064D]">
                        Click to upload or drag &amp; drop holiday banner / circular flyer
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        PNG, JPG, WEBP up to 5MB (Optional notice banner)
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Holiday Date & Day Display & Title */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Holiday Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8A064D] bg-gray-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Day &amp; Schedule Details
                  </label>
                  <div className="h-10 px-3.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] flex items-center text-xs font-bold text-[#8A064D]">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-[#8A064D]" />
                    <span className="truncate">{holidayDayOfWeek || 'Select date'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Holiday Title / Occasion <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Deepavali Vacation / Festive Break"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8A064D] bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Reason / Description with AI Enhance Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                    Reason / Description <span className="text-rose-500">*</span>
                  </label>
                  <AiEnhanceButton
                    value={reason}
                    onEnhance={(enhanced: string) => setReason(enhanced)}
                    context="Academy Holiday Announcement Reason"
                  />
                </div>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter holiday notification details and guidance for students and gurus..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8A064D] bg-gray-50 focus:bg-white leading-relaxed"
                />
              </div>

              {/* 2-COLUMN GRID FOR COURSES & BATCHES SELECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5" ref={courseDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                    Select Courses <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCourseSelectionChange(courses.map(c => c.id))}
                      className="text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                    >
                      Select All ({courses.length})
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleCourseSelectionChange([])}
                      className="text-[11px] font-medium text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCourseDropdownOpen(prev => !prev)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white text-left flex items-center justify-between gap-2 text-xs transition"
                  >
                    <div className="flex flex-wrap gap-1 items-center flex-1">
                      {selectedCourseIds.length === 0 ? (
                        <span className="text-gray-400">Click to search and select courses...</span>
                      ) : (
                        <span className="font-bold text-[#8A064D]">
                          {selectedCourseIds.length} Course{selectedCourseIds.length > 1 ? 's' : ''} Selected
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>

                  {/* Dropdown Menu */}
                  {courseDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-30 p-2 space-y-2 max-h-60 overflow-y-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          placeholder="Search courses..."
                          className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                        />
                      </div>

                      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                        {courses
                          .filter(c =>
                            c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
                            (c.code && c.code.toLowerCase().includes(courseSearch.toLowerCase()))
                          )
                          .map(c => {
                            const isSelected = selectedCourseIds.includes(c.id);
                            return (
                              <div
                                key={c.id}
                                onClick={() => {
                                  if (isSelected) {
                                    handleCourseSelectionChange(selectedCourseIds.filter(id => id !== c.id));
                                  } else {
                                    handleCourseSelectionChange([...selectedCourseIds, c.id]);
                                  }
                                }}
                                className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                                  isSelected
                                    ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D] font-bold'
                                    : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="truncate">{c.title}</span>
                                  {c.code && (
                                    <span className="font-mono text-[10px] text-[#8A064D] bg-[#FFF2F8] px-1.5 py-0.5 rounded border border-[#F0D5E4]">
                                      {c.code}
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="accent-[#8A064D]"
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Course Pills */}
                {selectedCourseIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1">
                    {courses
                      .filter(c => selectedCourseIds.includes(c.id))
                      .map(c => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFF2F8] border border-[#F0D5E4] text-[#8A064D] text-[10px] font-bold"
                        >
                          <span>{c.title}</span>
                          {c.code && <span className="font-mono text-[9px] text-[#590231]">({c.code})</span>}
                          <button
                            type="button"
                            onClick={() => handleCourseSelectionChange(selectedCourseIds.filter(id => id !== c.id))}
                            className="hover:text-rose-700 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* MULTI-BATCH SELECTION SEARCHABLE DROPDOWN */}
              <div className="space-y-1.5" ref={batchDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                    Select Batches <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBatchIds(availableBatches.map(b => b.id))}
                      className="text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                    >
                      Select All ({availableBatches.length})
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBatchIds([])}
                      className="text-[11px] font-medium text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBatchDropdownOpen(prev => !prev)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white text-left flex items-center justify-between gap-2 text-xs transition"
                  >
                    <div className="flex flex-wrap gap-1 items-center flex-1">
                      {selectedBatchIds.length === 0 ? (
                        <span className="text-gray-400">Click to search and select batches...</span>
                      ) : (
                        <span className="font-bold text-[#8A064D]">
                          {selectedBatchIds.length} Batch{selectedBatchIds.length > 1 ? 'es' : ''} Selected
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>

                  {/* Dropdown Menu */}
                  {batchDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-30 p-2 space-y-2 max-h-64 overflow-y-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={batchSearch}
                          onChange={(e) => setBatchSearch(e.target.value)}
                          placeholder="Search by batch name, code, guru, or room..."
                          className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                        />
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {availableBatches
                          .filter(b =>
                            b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
                            (b.code && b.code.toLowerCase().includes(batchSearch.toLowerCase())) ||
                            (b.course_title && b.course_title.toLowerCase().includes(batchSearch.toLowerCase())) ||
                            (b.trainer_name && b.trainer_name.toLowerCase().includes(batchSearch.toLowerCase()))
                          )
                          .map(b => {
                            const isSelected = selectedBatchIds.includes(b.id);
                            return (
                              <div
                                key={b.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedBatchIds(prev => prev.filter(id => id !== b.id));
                                  } else {
                                    setSelectedBatchIds(prev => [...prev, b.id]);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                                  isSelected
                                    ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D]'
                                    : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold">{b.name}</span>
                                    {b.code && (
                                      <span className="font-mono text-[10px] text-[#8A064D] bg-[#FFF2F8] px-1.5 py-0.5 rounded border border-[#F0D5E4]">
                                        {b.code}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-500 block truncate">
                                    {b.course_title} • Guru: {b.trainer_name || 'Assigned'} • {b.days_of_week?.join(', ')}
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="accent-[#8A064D] shrink-0"
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* LIVE AUDIENCE & GURU NOTIFICATION IMPACT SUMMARY */}
              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#590231] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Notification Audience Impact</span>
                  </span>
                  <span className="text-xs font-extrabold text-[#8A064D]">
                    ~{affectedStudentsCount} Students • {affectedGurus.length} Gurus
                  </span>
                </div>

                {/* Assigned Gurus Badge Row */}
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Assigned Gurus Getting Holiday Alert:
                  </span>
                  {affectedGurus.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No batches selected yet.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {affectedGurus.map(g => (
                        <div
                          key={g.id}
                          className="px-2.5 py-1 rounded-xl bg-white border border-rose-200 text-xs font-bold text-[#8A064D] flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{g.name}</span>
                          {g.guru_id && (
                            <span className="font-mono text-[9px] text-[#590231] bg-[#FFF2F8] px-1 py-0.5 rounded">
                              {g.guru_id}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery Settings */}
                <div className="pt-2 border-t border-[#F0D5E4]/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={sendInstant}
                      onChange={(e) => setSendInstant(e.target.checked)}
                      className="accent-[#8A064D] rounded"
                    />
                    <span>Instant Realtime Broadcast</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={send12am}
                      onChange={(e) => setSend12am(e.target.checked)}
                      className="accent-[#8A064D] rounded"
                    />
                    <span>Day of Holiday 12:00 AM Alert</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#590231] to-[#8A064D] hover:from-[#470126] hover:to-[#70043E] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Broadcasting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#F9E33A]" />
                      <span>Send Holiday Alert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW HOLIDAY ALERT DETAILS MODAL                                      */}
      {/* ===================================================================== */}
      {viewingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center shrink-0">
                  <CalendarX2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-xl text-gray-900">
                    {viewingAlert.title}
                  </h3>
                  <div className="text-[11px] text-gray-500 font-medium mt-1 flex flex-wrap items-center gap-2">
                    <span>Created: <strong className="text-gray-700">{formatCreatedDateTime(viewingAlert.created_at)}</strong></span>
                    <span>•</span>
                    <span>Status: <span className="font-bold text-[#8A064D]">{viewingAlert.status}</span></span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAlert(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <span className="font-semibold text-gray-500">Holiday Date:</span>
                <span className="font-mono font-bold text-gray-900 text-sm">{viewingAlert.holiday_date}</span>
              </div>

              {/* Banner Image - Fully Visible (object-contain with no cropping) */}
              {viewingAlert.image_url && (
                <div className="w-full rounded-2xl overflow-hidden border border-rose-100 bg-[#FFF9FB] flex items-center justify-center p-2">
                  <img
                    src={viewingAlert.image_url}
                    alt={viewingAlert.title}
                    className="w-full max-h-[380px] object-contain rounded-xl"
                  />
                </div>
              )}

              <div>
                <span className="font-bold text-gray-700 block mb-1">Reason / Description:</span>
                <div className="p-3.5 bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4] text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {viewingAlert.reason}
                </div>
              </div>

              {/* Gurus Notified */}
              <div>
                <span className="font-bold text-gray-700 block mb-1">Assigned Faculty Gurus Notified:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingAlert.affected_guru_names || []).length === 0 ? (
                    <span className="text-gray-400 italic">None specified</span>
                  ) : (
                    (viewingAlert.affected_guru_names || []).map((g, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {g}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* VIEW COURSE AND BATCH LIST BUTTON (TOGGLES TABLE FORMAT) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseBatchTableInDetails(!showCourseBatchTableInDetails)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-[#8A064D]" />
                    <span>{showCourseBatchTableInDetails ? 'Hide Course and Batch List' : 'View Course and Batch List'} ({(viewingAlert.target_batch_ids || []).length} Batches)</span>
                  </span>
                  {showCourseBatchTableInDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {showCourseBatchTableInDetails && (
                  <div className="mt-2.5 overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-100/90 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-600">
                          <th className="py-2.5 px-3">Course</th>
                          <th className="py-2.5 px-3">Batch</th>
                          <th className="py-2.5 px-3">Assigned Faculty Guru</th>
                          <th className="py-2.5 px-3 text-center">Disciples</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(viewingAlert.target_batch_ids || []).map((bId, idx) => {
                          const b = batches.find(x => x.id === bId);
                          const c = courses.find(x => x.id === b?.course_id) || courses.find(x => x.id === viewingAlert.target_course_ids?.[idx]);
                          const guru = (viewingAlert.affected_guru_names && viewingAlert.affected_guru_names[idx]) || b?.trainer_name || 'Assigned Guru';
                          const studentCount = students.filter(s => (s.enrolled_batches || []).some(eb => eb.batch_id === bId)).length;
                          return (
                            <tr key={bId} className="hover:bg-gray-50/70">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-gray-900">{b?.course_title || c?.title || viewingAlert.target_course_titles?.[idx] || 'Course'}</div>
                                <div className="text-[10px] font-mono text-gray-500">{c?.code || b?.course_code || '—'}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-extrabold text-[#590231]">{b?.name || viewingAlert.target_batch_names?.[idx] || 'Batch'}</div>
                                <div className="text-[10px] font-mono text-[#8A064D]">{b?.code || '—'}</div>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-gray-800">
                                {guru}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-900">
                                {studentCount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteAlert(viewingAlert.id, viewingAlert.title)}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
              >
                Delete Alert
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewingAlert;
                    setViewingAlert(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Alert</span>
                </button>

                <Link
                  href={`/tally-classes?holiday_id=${viewingAlert.id}&holiday_date=${viewingAlert.holiday_date}&from=${viewingAlert.holiday_date}&to=${viewingAlert.holiday_date}&title=${encodeURIComponent(viewingAlert.title)}`}
                  className="px-4 py-2 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>Reschedule via Tally Classes</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* EDIT HOLIDAY ALERT MODAL                                              */}
      {/* ===================================================================== */}
      {isEditModalOpen && editingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 shadow-2xl flex flex-col">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center shadow-2xs">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-xl text-gray-900">
                    Edit Holiday Alert
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Modify holiday parameters, reason, affected batches, and banner image
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAlert(null);
                  resetForm();
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateHoliday} className="p-6 sm:p-7 space-y-5">
              {/* Optional Image Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                  Holiday Banner / Circular Image <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {imageUrl ? (
                    <div className="relative w-36 h-20 rounded-2xl overflow-hidden border border-[#F0D5E4] shadow-2xs group shrink-0">
                      <img src={imageUrl} alt="Uploaded circular" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl border-2 border-dashed border-[#F0D5E4] bg-[#FFF9FB] hover:bg-white text-center cursor-pointer transition w-full shadow-2xs group">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#F0D5E4] text-[#8A064D] flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                        <UploadCloud className="w-6 h-6 text-[#8A064D]" />
                      </div>
                      <div className="text-xs font-bold text-[#8A064D]">
                        Click to upload or drag &amp; drop holiday banner / circular flyer
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        PNG, JPG, WEBP up to 5MB (Optional notice banner)
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Date & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Holiday Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8A064D] bg-gray-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Holiday Title / Occasion <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8A064D] bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Reason / Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                    Reason / Description <span className="text-rose-500">*</span>
                  </label>
                  <AiEnhanceButton
                    value={reason}
                    onEnhance={(enhanced: string) => setReason(enhanced)}
                    context="Academy Holiday Announcement Reason"
                  />
                </div>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8A064D] bg-gray-50 focus:bg-white leading-relaxed"
                />
              </div>

              {/* 2-COLUMN GRID FOR COURSES & BATCHES SELECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5" ref={courseDropdownRef}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                      Select Courses <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCourseSelectionChange(courses.map(c => c.id))}
                        className="text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                      >
                        Select All ({courses.length})
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleCourseSelectionChange([])}
                        className="text-[11px] font-medium text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCourseDropdownOpen(prev => !prev)}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white text-left flex items-center justify-between gap-2 text-xs transition"
                    >
                      <div className="flex flex-wrap gap-1 items-center flex-1">
                        {selectedCourseIds.length === 0 ? (
                          <span className="text-gray-400">Click to search and select courses...</span>
                        ) : (
                          <span className="font-bold text-[#8A064D]">
                            {selectedCourseIds.length} Course{selectedCourseIds.length > 1 ? 's' : ''} Selected
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>

                    {courseDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-30 p-2 space-y-2 max-h-60 overflow-y-auto">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={courseSearch}
                            onChange={(e) => setCourseSearch(e.target.value)}
                            placeholder="Search courses..."
                            className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                          />
                        </div>

                        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                          {courses
                            .filter(c =>
                              c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
                              (c.code && c.code.toLowerCase().includes(courseSearch.toLowerCase()))
                            )
                            .map(c => {
                              const isSelected = selectedCourseIds.includes(c.id);
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      handleCourseSelectionChange(selectedCourseIds.filter(id => id !== c.id));
                                    } else {
                                      handleCourseSelectionChange([...selectedCourseIds, c.id]);
                                    }
                                  }}
                                  className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                                    isSelected
                                      ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D] font-bold'
                                      : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="truncate">{c.title}</span>
                                    {c.code && (
                                      <span className="font-mono text-[10px] text-[#8A064D] bg-[#FFF2F8] px-1.5 py-0.5 rounded border border-[#F0D5E4]">
                                        {c.code}
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="accent-[#8A064D]"
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedCourseIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1">
                      {courses
                        .filter(c => selectedCourseIds.includes(c.id))
                        .map(c => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFF2F8] border border-[#F0D5E4] text-[#8A064D] text-[10px] font-bold"
                          >
                            <span>{c.title}</span>
                            <button
                              type="button"
                              onClick={() => handleCourseSelectionChange(selectedCourseIds.filter(id => id !== c.id))}
                              className="hover:text-rose-700 ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* BATCH SELECTION DROPDOWN */}
                <div className="space-y-1.5" ref={batchDropdownRef}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                      Select Batches <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBatchIds(availableBatches.map(b => b.id))}
                        className="text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                      >
                        Select All ({availableBatches.length})
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedBatchIds([])}
                        className="text-[11px] font-medium text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBatchDropdownOpen(prev => !prev)}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white text-left flex items-center justify-between gap-2 text-xs transition"
                    >
                      <div className="flex flex-wrap gap-1 items-center flex-1">
                        {selectedBatchIds.length === 0 ? (
                          <span className="text-gray-400">Click to search and select batches...</span>
                        ) : (
                          <span className="font-bold text-[#8A064D]">
                            {selectedBatchIds.length} Batch{selectedBatchIds.length > 1 ? 'es' : ''} Selected
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>

                    {batchDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-30 p-2 space-y-2 max-h-64 overflow-y-auto">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={batchSearch}
                            onChange={(e) => setBatchSearch(e.target.value)}
                            placeholder="Search batches..."
                            className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
                          />
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {availableBatches
                            .filter(b =>
                              b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
                              (b.code && b.code.toLowerCase().includes(batchSearch.toLowerCase())) ||
                              (b.course_title && b.course_title.toLowerCase().includes(batchSearch.toLowerCase()))
                            )
                            .map(b => {
                              const isSelected = selectedBatchIds.includes(b.id);
                              return (
                                <div
                                  key={b.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedBatchIds(prev => prev.filter(id => id !== b.id));
                                    } else {
                                      setSelectedBatchIds(prev => [...prev, b.id]);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                                    isSelected
                                      ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D]'
                                      : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold">{b.name}</span>
                                      {b.code && (
                                        <span className="font-mono text-[10px] text-[#8A064D] bg-[#FFF2F8] px-1.5 py-0.5 rounded border border-[#F0D5E4]">
                                          {b.code}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 block truncate">
                                      {b.course_title} • Guru: {b.trainer_name || 'Assigned'}
                                    </span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="accent-[#8A064D] shrink-0"
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AUDIENCE IMPACT SUMMARY */}
              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4] space-y-2.5">
                <span className="text-xs font-black text-[#590231] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Notification Audience Impact</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 text-[11px] block">Affected Faculty Gurus:</span>
                    <strong className="text-gray-900 font-extrabold text-sm">{affectedGurus.length} Gurus</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Estimated Batch Disciples:</span>
                    <strong className="text-[#8A064D] font-extrabold text-sm">{affectedStudentsCount} Disciples</strong>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingAlert(null);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#590231] to-[#8A064D] hover:from-[#470126] hover:to-[#70043E] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saving Edits...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#F9E33A]" />
                      <span>Save Edits</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

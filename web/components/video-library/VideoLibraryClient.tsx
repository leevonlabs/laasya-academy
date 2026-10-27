'use client';

import React, { useState, useMemo } from 'react';
import {
  Video,
  FolderPlus,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Users,
  BookOpen,
  Calendar,
  Trash2,
  Edit3,
  X,
  Globe,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  CheckSquare,
  Square,
  Sparkles,
  Link as LinkIcon,
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Play,
  ArrowUpRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import AiEnhanceButton from '@/components/common/AiEnhanceButton';
import MonthPicker from '@/components/common/MonthPicker';
import {
  CourseWithDetails,
  VideoLibraryItem,
  EnrolledStudent,
  GuruComplianceItem,
  GuruComplianceSummary,
  GuruComplianceDisciple,
} from '@/lib/videoLibrary';

const DEFAULT_COURSE_IMAGES: Record<string, string> = {
  'Bharathanatyam': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
  'Bharatanatyam': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
  'Kuchupudi': 'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?auto=format&fit=crop&w=800&q=80',
  'Kuchipudi': 'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?auto=format&fit=crop&w=800&q=80',
  'Mohiniyatam': 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
  'Mohiniyattam': 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
  'Semi Classical': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'Western Dance': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80',
  'Zumba': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  'Gymnastic': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
  'Gymnastics': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
  'Carnatic Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'Violin': 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=800&q=80',
  'Keyboard': 'https://images.unsplash.com/photo-1520523839898-50712140e698?auto=format&fit=crop&w=800&q=80',
  'Guitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  'Ukulele': 'https://images.unsplash.com/photo-1568219656418-15c329312bf1?auto=format&fit=crop&w=800&q=80',
  'Drawing': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'Art and Craft': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
  'Kalari': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  'Kalaripayattu': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  'Karatte': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
  'Karate': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
  'Yoga': 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
  'Chess': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
};

function resolveCourseImage(title?: string | null, category?: string | null, imageUrl?: string | null): string {
  if (imageUrl && imageUrl.trim()) {
    return imageUrl.trim();
  }
  const cleanTitle = (title || '').trim();
  if (DEFAULT_COURSE_IMAGES[cleanTitle]) {
    return DEFAULT_COURSE_IMAGES[cleanTitle];
  }
  const lower = cleanTitle.toLowerCase();
  for (const [key, url] of Object.entries(DEFAULT_COURSE_IMAGES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return url;
    }
  }
  if (lower.includes('bharat')) return DEFAULT_COURSE_IMAGES['Bharatanatyam'];
  if (lower.includes('kuchi')) return DEFAULT_COURSE_IMAGES['Kuchipudi'];
  if (lower.includes('mohini')) return DEFAULT_COURSE_IMAGES['Mohiniyattam'];
  if (lower.includes('guitar')) return DEFAULT_COURSE_IMAGES['Guitar'];
  if (lower.includes('keyboard') || lower.includes('piano')) return DEFAULT_COURSE_IMAGES['Keyboard'];
  if (lower.includes('violin')) return DEFAULT_COURSE_IMAGES['Violin'];
  if (lower.includes('vocal') || lower.includes('music') || lower.includes('carnatic')) return DEFAULT_COURSE_IMAGES['Carnatic Music'];
  if (lower.includes('ukulele')) return DEFAULT_COURSE_IMAGES['Ukulele'];
  if (lower.includes('draw') || lower.includes('paint')) return DEFAULT_COURSE_IMAGES['Drawing'];
  if (lower.includes('craft')) return DEFAULT_COURSE_IMAGES['Art and Craft'];
  if (lower.includes('karat')) return DEFAULT_COURSE_IMAGES['Karate'];
  if (lower.includes('kalari')) return DEFAULT_COURSE_IMAGES['Kalari'];
  if (lower.includes('yoga')) return DEFAULT_COURSE_IMAGES['Yoga'];
  if (lower.includes('chess')) return DEFAULT_COURSE_IMAGES['Chess'];
  if (lower.includes('zumba')) return DEFAULT_COURSE_IMAGES['Zumba'];
  if (lower.includes('gymnast')) return DEFAULT_COURSE_IMAGES['Gymnastic'];
  if (lower.includes('western')) return DEFAULT_COURSE_IMAGES['Western Dance'];
  if (lower.includes('semi')) return DEFAULT_COURSE_IMAGES['Semi Classical'];

  return 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80';
}

interface Props {
  initialCourses: CourseWithDetails[];
  initialItems: VideoLibraryItem[];
  initialCompliance?: {
    month: string;
    year: string;
    summary: GuruComplianceSummary;
    gurus: GuruComplianceItem[];
  };
  canDelete?: boolean;
}

export default function VideoLibraryClient({ initialCourses, initialItems, initialCompliance, canDelete = true }: Props) {

  const [courses, setCourses] = useState<CourseWithDetails[]>(initialCourses);
  const [items, setItems] = useState<VideoLibraryItem[]>(initialItems);

  // Top Tab Switcher: 'course_wise' (default) vs 'all_videos' vs 'guru_share'
  const [activeTab, setActiveTab] = useState<'course_wise' | 'all_videos' | 'guru_share'>('course_wise');

  // Dedicated Course Page View state (when clicked from Course-Wise)
  const [selectedCourseSubpage, setSelectedCourseSubpage] = useState<CourseWithDetails | null>(null);

  // Helper to remove "Guru" prefix from names
  const stripGuruPrefix = (name?: string | null) => {
    if (!name) return '';
    return name.replace(/^Guru\s+/i, '').replace(/^Guru\s+Sri\s+/i, 'Sri ').trim();
  };

  // Subpage Share Modal State
  const [isSubpageShareModalOpen, setIsSubpageShareModalOpen] = useState(false);
  const [subpageShareTitle, setSubpageShareTitle] = useState('');
  const [subpageShareDriveUrl, setSubpageShareDriveUrl] = useState('');
  const [subpageShareYoutubeUrl, setSubpageShareYoutubeUrl] = useState('');
  const [subpageShareDate, setSubpageShareDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subpageShareDesc, setSubpageShareDesc] = useState('');
  const [subpageSelectedBatchIds, setSubpageSelectedBatchIds] = useState<string[]>([]);
  const [isSubmittingSubpageShare, setIsSubmittingSubpageShare] = useState(false);

  // Subpage Previous Shared Links Filters (Month & Year via MonthPicker, Search)
  const [subpageSearch, setSubpageSearch] = useState('');
  const [subpageMonthLabel, setSubpageMonthLabel] = useState('');
  const [subpageYearMonth, setSubpageYearMonth] = useState('');

  // All Videos Tab Filters
  const [allVideosSearch, setAllVideosSearch] = useState('');
  const [allVideosMonthLabel, setAllVideosMonthLabel] = useState('');
  const [allVideosYearMonth, setAllVideosYearMonth] = useState('');

  // Guru Share Tab Filters (General Videos View)
  const [guruShareSearch, setGuruShareSearch] = useState('');
  const [guruGeneralMonthLabel, setGuruGeneralMonthLabel] = useState('');
  const [guruGeneralYearMonth, setGuruGeneralYearMonth] = useState('');
  const [selectedGeneralGurus, setSelectedGeneralGurus] = useState<string[]>([]);
  const [isGuruFilterOpen, setIsGuruFilterOpen] = useState(false);
  const [guruFilterSearch, setGuruFilterSearch] = useState('');

  // GURU PERFORMANCE VIDEO COMPLIANCE TRACKING STATE
  const [complianceMonth, setComplianceMonth] = useState<string>(() => {
    return initialCompliance?.month || (new Date().getMonth() + 1).toString();
  });
  const [complianceYear, setComplianceYear] = useState<string>(() => {
    return initialCompliance?.year || new Date().getFullYear().toString();
  });
  const [complianceData, setComplianceData] = useState<{
    summary: GuruComplianceSummary;
    gurus: GuruComplianceItem[];
  }>(() => ({
    summary: initialCompliance?.summary || {
      total_gurus: 0,
      completed_gurus: 0,
      partial_gurus: 0,
      pending_gurus: 0,
      total_students: 0,
      total_received: 0,
      total_missing: 0,
      overall_compliance_rate: 0,
    },
    gurus: initialCompliance?.gurus || [],
  }));
  const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);
  const [selectedGuruForModal, setSelectedGuruForModal] = useState<GuruComplianceItem | null>(null);
  const [guruModalActiveTab, setGuruModalActiveTab] = useState<'received' | 'missing'>('received');
  const [guruModalBatchFilter, setGuruModalBatchFilter] = useState<string>('all');
  const [guruModalStudentSearch, setGuruModalStudentSearch] = useState<string>('');
  const [guruModalSelectedStudentIds, setGuruModalSelectedStudentIds] = useState<string[]>([]);
  const [isGuruModalStudentDropdownOpen, setIsGuruModalStudentDropdownOpen] = useState(false);
  const [complianceStatusFilter, setComplianceStatusFilter] = useState<'all' | 'needs_attention' | 'completed' | 'no_students'>('all');
  const [complianceSearch, setComplianceSearch] = useState('');
  const [guruShareViewMode, setGuruShareViewMode] = useState<'compliance_grid' | 'media_archive'>('compliance_grid');

  // Video Details Modal States (Item 5)
  const [viewingPerformanceVideo, setViewingPerformanceVideo] = useState<GuruComplianceDisciple | null>(null);
  const [viewingGeneralVideo, setViewingGeneralVideo] = useState<VideoLibraryItem | null>(null);
  const [viewingAllVideoItem, setViewingAllVideoItem] = useState<VideoLibraryItem | null>(null);

  const fetchComplianceData = async (month: string, year: string) => {
    setIsLoadingCompliance(true);
    try {
      const res = await fetch(`/api/video-library?compliance=true&month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setComplianceData({
          summary: data.summary,
          gurus: data.gurus,
        });
        if (selectedGuruForModal) {
          const updated = data.gurus.find((g: any) => g.trainer_id === selectedGuruForModal.trainer_id);
          if (updated) setSelectedGuruForModal(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching guru compliance data:', err);
    } finally {
      setIsLoadingCompliance(false);
    }
  };


  // Search & Filter state for courses grid
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Universal Share Modal State
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState(false);
  const [universalTitle, setUniversalTitle] = useState('');
  const [universalDriveUrl, setUniversalDriveUrl] = useState('');
  const [universalYoutubeUrl, setUniversalYoutubeUrl] = useState('');
  const [universalDate, setUniversalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [universalDesc, setUniversalDesc] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(() => initialCourses.map(c => c.id));
  const [isSubmittingUniversal, setIsSubmittingUniversal] = useState(false);

  // Selected Course Detail Modal State
  const [activeCourse, setActiveCourse] = useState<CourseWithDetails | null>(null);
  const [courseStudents, setCourseStudents] = useState<EnrolledStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState('');

  // Course Share Form inside Course Modal
  const [isCourseShareOpen, setIsCourseShareOpen] = useState(false);
  const [courseShareTitle, setCourseShareTitle] = useState('');
  const [courseShareDriveUrl, setCourseShareDriveUrl] = useState('');
  const [courseShareYoutubeUrl, setCourseShareYoutubeUrl] = useState('');
  const [courseShareDate, setCourseShareDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [courseShareDesc, setCourseShareDesc] = useState('');
  const [targetBatchOption, setTargetBatchOption] = useState<'all' | string>('all');
  const [courseShareSelectedBatchIds, setCourseShareSelectedBatchIds] = useState<string[]>([]);
  const [isSubmittingCourseShare, setIsSubmittingCourseShare] = useState(false);

  // Edit Link State
  const [editingItem, setEditingItem] = useState<VideoLibraryItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDriveUrl, setEditDriveUrl] = useState('');
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const handleOpenEditItem = (item: VideoLibraryItem) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditDriveUrl(item.drive_url || '');
    setEditYoutubeUrl(item.youtube_url || '');
    setEditDate(item.event_date ? item.event_date.substring(0, 10) : new Date().toISOString().split('T')[0]);
    setEditDesc(item.description || '');
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editTitle.trim()) {
      alert('Please enter an event title');
      return;
    }
    if (!editDriveUrl.trim() && !editYoutubeUrl.trim()) {
      alert('Please provide at least a Google Drive link or YouTube link');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/video-library/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          drive_url: editDriveUrl.trim() || null,
          youtube_url: editYoutubeUrl.trim() || null,
          event_name: editTitle.trim(),
          event_date: editDate,
          description: editDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update link details');
      }

      setItems(prev =>
        prev.map(i =>
          i.id === editingItem.id
            ? {
                ...i,
                title: editTitle.trim(),
                drive_url: editDriveUrl.trim() || null,
                youtube_url: editYoutubeUrl.trim() || null,
                event_name: editTitle.trim(),
                event_date: editDate,
                description: editDesc.trim(),
              }
            : i
        )
      );

      setEditingItem(null);
      showToast('Event link details updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error updating link details');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, id: string, label: string = 'Link') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return ['All', ...Array.from(set)];
  }, [courses]);

  // Filtered Courses (Display only existing active courses, searched by title or details)
  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c => {
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [courses, courseSearch]);

  // Month Options for Filter
  const MONTHS = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Available Years: Comprehensive scrollable list of all years up to 2040
  const availableYears = useMemo(() => {
    const maxYear = 2040;
    const minYear = 2018;
    const list: string[] = ['all'];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y.toString());
    }
    return list;
  }, []);

  // Subpage Filtered Items (Specific to selectedCourseSubpage)
  const subpageFilteredItems = useMemo(() => {
    if (!selectedCourseSubpage) return [];

    return items.filter(item => {
      // Must belong to this course
      const isForThisCourse =
        item.target_course_id === selectedCourseSubpage.id ||
        (Array.isArray(item.target_courses) && item.target_courses.some((tc: any) => tc.id === selectedCourseSubpage.id)) ||
        item.access_level === 'All Students';

      if (!isForThisCourse) return false;

      // Text Search
      if (subpageSearch.trim()) {
        const q = subpageSearch.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchBatch = item.target_batch_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchBatch) return false;
      }

      // Month & Year filter via MonthPicker
      if (subpageYearMonth && item.event_date) {
        const d = new Date(item.event_date);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (ym !== subpageYearMonth) return false;
      }

      return true;
    });
  }, [items, selectedCourseSubpage, subpageSearch, subpageYearMonth]);

  // All Videos Tab Filtered Items (Admin Sent Links History Only)
  const allVideosFilteredItems = useMemo(() => {
    return items.filter(item => {
      // Strictly exclude guru shared video links (display only links admin has sent to gurus and students)
      const isGuruShared = item.shared_by_type === 'guru' || item.category === 'guru_share' || Boolean(item.trainer_id);
      if (isGuruShared) return false;

      if (allVideosSearch.trim()) {
        const q = allVideosSearch.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCourse = item.target_course_title?.toLowerCase().includes(q);
        const matchBatch = item.target_batch_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCourse && !matchBatch) return false;
      }

      // Month & Year filter via MonthPicker
      if (allVideosYearMonth && item.event_date) {
        const d = new Date(item.event_date);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (ym !== allVideosYearMonth) return false;
      }

      return true;
    });
  }, [items, allVideosSearch, allVideosYearMonth]);

  // Distinct Gurus who have shared links
  const guruNames = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if ((i.shared_by_type === 'guru' || i.category === 'guru_share') && i.trainer_name) {
        set.add(i.trainer_name);
      }
    });
    if (complianceData.gurus) {
      complianceData.gurus.forEach(g => {
        if (g.full_name) set.add(g.full_name);
      });
    }
    return Array.from(set).sort();
  }, [items, complianceData.gurus]);

  // All Guru Shared items
  const guruSharedItems = useMemo(() => {
    return items.filter(i => i.shared_by_type === 'guru' || i.category === 'guru_share' || Boolean(i.trainer_id));
  }, [items]);

  // General Guru Shared items (ONLY general video links, strictly excludes performance videos)
  const guruGeneralItems = useMemo(() => {
    return guruSharedItems.filter(item => {
      const cat = (item.category || '').toLowerCase();
      // Strictly exclude performance videos
      if (cat === 'performance' || cat === 'student_performance') {
        return false;
      }

      // Filter by selected Gurus (multi-select)
      if (selectedGeneralGurus.length > 0) {
        const itemGuru = item.trainer_name || item.created_by || '';
        const matches = selectedGeneralGurus.some(
          g => g === itemGuru || stripGuruPrefix(g).toLowerCase() === stripGuruPrefix(itemGuru).toLowerCase()
        );
        if (!matches) return false;
      }

      // Filter by Month & Year (from MonthPicker)
      if (guruGeneralYearMonth) {
        const [targetYear, targetMonth] = guruGeneralYearMonth.split('-');
        if (item.event_date) {
          const d = new Date(item.event_date);
          const y = d.getFullYear().toString();
          const m = (d.getMonth() + 1).toString().padStart(2, '0');
          if (y !== targetYear || m !== targetMonth) return false;
        }
      }

      // Filter by search query
      if (guruShareSearch.trim()) {
        const q = guruShareSearch.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchTrainer = item.trainer_name?.toLowerCase().includes(q);
        const matchCourse = item.target_course_title?.toLowerCase().includes(q);
        const matchBatch = item.target_batch_name?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchTrainer && !matchCourse && !matchBatch && !matchDesc) return false;
      }

      return true;
    });
  }, [guruSharedItems, selectedGeneralGurus, guruGeneralYearMonth, guruShareSearch]);

  // Filtered Gurus for dropdown in General view
  const filteredGuruNamesForDropdown = useMemo(() => {
    if (!guruFilterSearch.trim()) return guruNames;
    const q = guruFilterSearch.toLowerCase();
    return guruNames.filter(g => stripGuruPrefix(g).toLowerCase().includes(q) || g.toLowerCase().includes(q));
  }, [guruNames, guruFilterSearch]);

  // Filtered Gurus for Compliance Directory
  const filteredComplianceGurus = useMemo(() => {
    return complianceData.gurus.filter(guru => {
      if (complianceStatusFilter === 'completed') {
        if (guru.compliance_status !== 'completed') return false;
      } else if (complianceStatusFilter === 'needs_attention') {
        if (guru.missing_count === 0 || guru.total_students === 0) return false;
      } else if (complianceStatusFilter === 'no_students') {
        if (guru.total_students > 0) return false;
      }

      if (complianceSearch.trim()) {
        const q = complianceSearch.toLowerCase();
        const matchName = guru.full_name.toLowerCase().includes(q);
        const matchTitle = (guru.display_title || '').toLowerCase().includes(q);
        const matchCourses = guru.courses.some(c => c.title.toLowerCase().includes(q));
        const matchSpecialization = guru.specializations.some(s => s.toLowerCase().includes(q));
        const matchDisciples = [...guru.received_disciples, ...guru.missing_disciples].some(d => 
          d.student_name.toLowerCase().includes(q) || d.roll_number.toLowerCase().includes(q)
        );
        if (!matchName && !matchTitle && !matchCourses && !matchSpecialization && !matchDisciples) {
          return false;
        }
      }
      return true;
    });
  }, [complianceData.gurus, complianceStatusFilter, complianceSearch]);

  // All unique disciples under this Guru for the multi-select filter
  const guruAllDisciplesList = useMemo(() => {
    if (!selectedGuruForModal) return [];
    const map = new Map<string, { student_id: string; student_name: string; roll_number: string; batch_id?: string; batch_name?: string }>();
    selectedGuruForModal.received_disciples.forEach(d => {
      if (!map.has(d.student_id)) {
        map.set(d.student_id, {
          student_id: d.student_id,
          student_name: d.student_name,
          roll_number: d.roll_number,
          batch_id: d.batch_id,
          batch_name: d.batch_name,
        });
      }
    });
    selectedGuruForModal.missing_disciples.forEach(d => {
      if (!map.has(d.student_id)) {
        map.set(d.student_id, {
          student_id: d.student_id,
          student_name: d.student_name,
          roll_number: d.roll_number,
          batch_id: d.batch_id,
          batch_name: d.batch_name,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.student_name.localeCompare(b.student_name));
  }, [selectedGuruForModal]);

  // All enrolled batches for the selected Guru
  const guruModalAvailableBatches = useMemo(() => {
    if (!selectedGuruForModal) return [];
    const map = new Map<string, string>();
    if (Array.isArray(selectedGuruForModal.assigned_batches)) {
      selectedGuruForModal.assigned_batches.forEach(b => {
        map.set(b.id, b.name + (b.course_title ? ` (${b.course_title})` : ''));
      });
    }
    selectedGuruForModal.received_disciples.forEach(d => {
      if (d.batch_id && !map.has(d.batch_id)) {
        map.set(d.batch_id, d.batch_name || 'Batch');
      }
    });
    selectedGuruForModal.missing_disciples.forEach(d => {
      if (d.batch_id && !map.has(d.batch_id)) {
        map.set(d.batch_id, d.batch_name || 'Batch');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [selectedGuruForModal]);

  // Disciples available in the modal student filter (scoped to selected batch)
  const disciplesForFilterList = useMemo(() => {
    return guruAllDisciplesList.filter(d => {
      if (guruModalBatchFilter !== 'all' && d.batch_id !== guruModalBatchFilter) {
        return false;
      }
      if (guruModalStudentSearch.trim()) {
        const q = guruModalStudentSearch.toLowerCase();
        return d.student_name.toLowerCase().includes(q) || d.roll_number.toLowerCase().includes(q);
      }
      return true;
    });
  }, [guruAllDisciplesList, guruModalBatchFilter, guruModalStudentSearch]);

  // Filtered disciples inside Guru Modal based on batch, student selection, and search
  const modalFilteredReceived = useMemo(() => {
    if (!selectedGuruForModal) return [];
    return selectedGuruForModal.received_disciples.filter((d) => {
      if (guruModalBatchFilter !== 'all' && d.batch_id !== guruModalBatchFilter) {
        return false;
      }
      if (guruModalSelectedStudentIds.length > 0 && !guruModalSelectedStudentIds.includes(d.student_id)) {
        return false;
      }
      if (guruModalStudentSearch.trim()) {
        const q = guruModalStudentSearch.toLowerCase();
        const matchName = d.student_name.toLowerCase().includes(q);
        const matchRoll = d.roll_number.toLowerCase().includes(q);
        const matchBatch = (d.batch_name || '').toLowerCase().includes(q);
        const matchTitle = (d.video_title || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchBatch && !matchTitle) return false;
      }
      return true;
    });
  }, [selectedGuruForModal, guruModalBatchFilter, guruModalSelectedStudentIds, guruModalStudentSearch]);

  const modalFilteredMissing = useMemo(() => {
    if (!selectedGuruForModal) return [];
    return selectedGuruForModal.missing_disciples.filter((d) => {
      if (guruModalBatchFilter !== 'all' && d.batch_id !== guruModalBatchFilter) {
        return false;
      }
      if (guruModalSelectedStudentIds.length > 0 && !guruModalSelectedStudentIds.includes(d.student_id)) {
        return false;
      }
      if (guruModalStudentSearch.trim()) {
        const q = guruModalStudentSearch.toLowerCase();
        const matchName = d.student_name.toLowerCase().includes(q);
        const matchRoll = d.roll_number.toLowerCase().includes(q);
        const matchBatch = (d.batch_name || '').toLowerCase().includes(q);
        const matchCourse = (d.course_title || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchBatch && !matchCourse) return false;
      }
      return true;
    });
  }, [selectedGuruForModal, guruModalBatchFilter, guruModalSelectedStudentIds, guruModalStudentSearch]);


  // Handle Subpage Share Link Submit
  const handleSubpageShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseSubpage) return;
    if (!subpageShareTitle.trim()) {
      alert('Please provide the Event Shoot Title.');
      return;
    }
    if (!subpageShareDriveUrl.trim() && !subpageShareYoutubeUrl.trim()) {
      alert('Please provide at least a Google Drive link or YouTube link.');
      return;
    }
    if (subpageSelectedBatchIds.length === 0) {
      alert('Please select at least one batch to share with.');
      return;
    }

    setIsSubmittingSubpageShare(true);
    try {
      const allSelected = subpageSelectedBatchIds.length === selectedCourseSubpage.batches.length;
      const selectedBatches = allSelected
        ? [{ id: 'all', name: 'All Batches', course_id: selectedCourseSubpage.id, course_title: selectedCourseSubpage.title }]
        : selectedCourseSubpage.batches
            .filter(b => subpageSelectedBatchIds.includes(b.id))
            .map(b => ({
              id: b.id,
              name: b.name,
              course_id: selectedCourseSubpage.id,
              course_title: selectedCourseSubpage.title,
            }));

      const res = await fetch('/api/video-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subpageShareTitle.trim(),
          drive_url: subpageShareDriveUrl.trim() || null,
          youtube_url: subpageShareYoutubeUrl.trim() || null,
          event_name: subpageShareTitle.trim(),
          event_date: subpageShareDate,
          description: subpageShareDesc.trim(),
          target_course_id: selectedCourseSubpage.id,
          target_course_title: selectedCourseSubpage.title,
          selected_batches: selectedBatches,
          access_level: allSelected ? 'Course' : 'Batch',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save event link');
      }

      // Refresh items
      const itemsRes = await fetch('/api/video-library');
      const itemsData = await itemsRes.json();
      if (itemsData.success) {
        setItems(itemsData.items);
      }

      // Increment course folder count
      setCourses(prev =>
        prev.map(c => (c.id === selectedCourseSubpage.id ? { ...c, folder_count: c.folder_count + 1 } : c))
      );

      setSubpageShareTitle('');
      setSubpageShareDriveUrl('');
      setSubpageShareYoutubeUrl('');
      setSubpageShareDesc('');
      setIsSubpageShareModalOpen(false);
      showToast(
        `Event link shared with ${allSelected ? 'All Batches' : `${selectedBatches.length} Batches`} successfully!`
      );
    } catch (err: any) {
      alert(err.message || 'Error sharing folder');
    } finally {
      setIsSubmittingSubpageShare(false);
    }
  };

  // Open Course Details
  const handleOpenCourse = async (course: CourseWithDetails) => {
    setActiveCourse(course);
    setSelectedBatchId('all');
    setTargetBatchOption('all');
    setCourseShareSelectedBatchIds(course.batches.map(b => b.id));
    setIsCourseShareOpen(false);
    setStudentSearch('');
    setIsLoadingStudents(true);

    try {
      const res = await fetch(`/api/video-library?courseStudents=${course.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.students)) {
        setCourseStudents(data.students);
      } else {
        setCourseStudents([]);
      }
    } catch (err) {
      console.error('Failed to load course students:', err);
      setCourseStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Filtered Students in Active Course
  const displayedStudents = useMemo(() => {
    return courseStudents.filter(s => {
      const matchBatch = selectedBatchId === 'all' || s.batch_id === selectedBatchId;
      const matchSearch =
        studentSearch === '' ||
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.roll_number.toLowerCase().includes(studentSearch.toLowerCase());
      return matchBatch && matchSearch;
    });
  }, [courseStudents, selectedBatchId, studentSearch]);

  // Items shared for Active Course
  const activeCourseItems = useMemo(() => {
    if (!activeCourse) return [];
    return items.filter(i => {
      if (i.access_level === 'All Students') return true;
      if (i.target_course_id === activeCourse.id) return true;
      if (Array.isArray(i.target_courses) && i.target_courses.some((tc: any) => tc.id === activeCourse.id)) {
        return true;
      }
      return false;
    });
  }, [items, activeCourse]);

  // Handle Universal Share Submit
  const handleUniversalShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universalTitle.trim()) {
      alert('Please provide the Event Title.');
      return;
    }
    if (!universalDriveUrl.trim() && !universalYoutubeUrl.trim()) {
      alert('Please provide at least a Google Drive link or YouTube link.');
      return;
    }
    if (selectedCourseIds.length === 0) {
      alert('Please select at least one course to share with.');
      return;
    }

    setIsSubmittingUniversal(true);
    try {
      const selectedCoursesData = courses
        .filter(c => selectedCourseIds.includes(c.id))
        .map(c => ({ id: c.id, title: c.title }));

      const res = await fetch('/api/video-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: universalTitle.trim(),
          drive_url: universalDriveUrl.trim() || null,
          youtube_url: universalYoutubeUrl.trim() || null,
          event_name: universalTitle.trim(),
          event_date: universalDate,
          description: universalDesc.trim(),
          is_universal: true,
          selected_courses: selectedCoursesData,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to share universal event link');
      }

      // Refresh items list
      const itemsRes = await fetch('/api/video-library');
      const itemsData = await itemsRes.json();
      if (itemsData.success) {
        setItems(itemsData.items);
      }

      // Update folder counts on courses
      setCourses(prev =>
        prev.map(c => {
          if (selectedCourseIds.includes(c.id)) {
            return { ...c, folder_count: c.folder_count + 1 };
          }
          return c;
        })
      );

      setIsUniversalModalOpen(false);
      setUniversalTitle('');
      setUniversalDriveUrl('');
      setUniversalYoutubeUrl('');
      setUniversalDesc('');
      showToast(`Event link successfully shared with ${selectedCourseIds.length} courses!`);
    } catch (err: any) {
      alert(err.message || 'Error sharing event link');
    } finally {
      setIsSubmittingUniversal(false);
    }
  };

  // Handle Course Share Submit
  const handleCourseShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;
    if (!courseShareTitle.trim()) {
      alert('Please provide the Event Title.');
      return;
    }
    if (!courseShareDriveUrl.trim() && !courseShareYoutubeUrl.trim()) {
      alert('Please provide at least a Google Drive link or YouTube link.');
      return;
    }
    if (courseShareSelectedBatchIds.length === 0) {
      alert('Please select at least one batch to share with.');
      return;
    }

    setIsSubmittingCourseShare(true);
    try {
      const allSelected = courseShareSelectedBatchIds.length === activeCourse.batches.length;
      const selectedBatches = allSelected
        ? [{ id: 'all', name: 'All Batches', course_id: activeCourse.id, course_title: activeCourse.title }]
        : activeCourse.batches
            .filter(b => courseShareSelectedBatchIds.includes(b.id))
            .map(b => ({
              id: b.id,
              name: b.name,
              course_id: activeCourse.id,
              course_title: activeCourse.title,
            }));

      const res = await fetch('/api/video-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: courseShareTitle.trim(),
          drive_url: courseShareDriveUrl.trim() || null,
          youtube_url: courseShareYoutubeUrl.trim() || null,
          event_name: courseShareTitle.trim(),
          event_date: courseShareDate,
          description: courseShareDesc.trim(),
          target_course_id: activeCourse.id,
          target_course_title: activeCourse.title,
          selected_batches: selectedBatches,
          access_level: allSelected ? 'Course' : 'Batch',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save course event folder');
      }

      // Refresh items
      const itemsRes = await fetch('/api/video-library');
      const itemsData = await itemsRes.json();
      if (itemsData.success) {
        setItems(itemsData.items);
      }

      // Increment course folder count
      setCourses(prev =>
        prev.map(c => (c.id === activeCourse.id ? { ...c, folder_count: c.folder_count + 1 } : c))
      );

      setIsCourseShareOpen(false);
      setCourseShareTitle('');
      setCourseShareDriveUrl('');
      setCourseShareYoutubeUrl('');
      setCourseShareDesc('');
      showToast(`Event link shared to ${allSelected ? 'All Batches' : `${selectedBatches.length} Batches`} in ${activeCourse.title}!`);
    } catch (err: any) {
      alert(err.message || 'Error sharing folder');
    } finally {
      setIsSubmittingCourseShare(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!canDelete) {
      alert('Delete permission is disabled for your account.');
      return;
    }

    if (!confirm('Are you sure you want to remove this event folder link? Students will no longer see it in their mobile app.')) {
      return;
    }

    try {
      const res = await fetch(`/api/video-library/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.filter(i => i.id !== id));
        showToast('Event folder link removed.');
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting item');
    }
  };

  // Toggle Course in Universal Share
  const toggleSelectCourse = (id: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAllCourses = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(courses.map(c => c.id));
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#03543F] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 text-sm font-semibold animate-in fade-in slide-in-from-bottom-5">
          <Check className="w-5 h-5 text-[#31C48D]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. TOP HEADER & UNIVERSAL ACTION BAR */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-[#590231] via-[#740340] to-[#8A064D] text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-[#D4AF37]/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#D4AF37] text-xs font-bold tracking-wide border border-[#D4AF37]/30">
              <Video className="w-3.5 h-3.5" />
              <span>OFFICIAL EVENT MEDIA DISTRIBUTION</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Event Video Library & Drive Links
            </h1>
            <p className="text-sm md:text-base text-rose-100/90 max-w-2xl leading-relaxed">
              Share Google Drive event shoot folders directly with participating students across courses and batches. Students receive real-time access on their mobile profile.
            </p>
          </div>

          {/* Universal Share Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                setSelectedCourseIds(courses.map(c => c.id));
                setIsUniversalModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#C5A028] hover:to-[#D4AF37] text-[#4A0025] font-bold text-sm shadow-lg hover:shadow-xl transition-all transform active:scale-95"
            >
              <Globe className="w-4 h-4 text-[#4A0025]" />
              <span>Universal Share Event Link</span>
              <span className="px-2 py-0.5 rounded-full bg-[#4A0025]/15 text-[#4A0025] text-xs font-black">
                All Courses
              </span>
            </button>
          </div>
        </div>

        {/* TAB SWITCHER: Course-Wise & All Videos (Replaces Summary Bar) */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex p-1.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('course_wise');
                setSelectedCourseSubpage(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'course_wise'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F9E33A] text-[#2D041A] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Course-Wise</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('all_videos');
                setSelectedCourseSubpage(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'all_videos'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F9E33A] text-[#2D041A] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>All Videos</span>
            </button>

            {/* 3. Guru Share Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('guru_share');
                setSelectedCourseSubpage(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'guru_share'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F9E33A] text-[#2D041A] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Guru Share</span>
            </button>
          </div>

          <div className="text-xs text-rose-100/90 font-medium hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>
              {activeTab === 'course_wise' 
                ? (selectedCourseSubpage ? `Managing: ${selectedCourseSubpage.title}` : 'Select a course to share & view links')
                : activeTab === 'all_videos'
                ? 'Universal broadcast history & all media folders'
                : 'Videos shared by faculty Gurus to their students'}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. TAB CONTENT: COURSE-WISE OR ALL VIDEOS */}
      {/* ===================================================================== */}
      {activeTab === 'course_wise' ? (
        selectedCourseSubpage ? (
          /* =================================================================== */
          /* DEDICATED SEPARATE COURSE SUBPAGE */
          /* =================================================================== */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedCourseSubpage(null)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#F0D5E4] text-[#8A064D] text-xs font-black transition shadow-2xs cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Courses</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  {selectedCourseSubpage.batches.length} Batches • {selectedCourseSubpage.student_count} Enrolled
                </span>
              </div>
            </div>

            {/* Course Header Banner */}
            <div className="relative overflow-hidden text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#D4AF37]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div
                className="absolute inset-0 bg-cover bg-center brightness-40 scale-105"
                style={{
                  backgroundImage: `url('${resolveCourseImage(selectedCourseSubpage.title, selectedCourseSubpage.category, selectedCourseSubpage.image_url)}')`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#590231]/90 via-[#740340]/80 to-[#8A064D]/90" />
              <div className="space-y-2 z-10 relative">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#F9E33A] font-mono text-xs font-bold border border-[#D4AF37]/30 uppercase tracking-wider">
                  Course Subpage • Video Library
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                  {selectedCourseSubpage.title}
                </h2>
                <p className="text-xs sm:text-sm text-rose-100/90 max-w-xl leading-relaxed">
                  {selectedCourseSubpage.batches.length} active batches configured for this course
                </p>
              </div>

              <div className="flex items-center gap-3 z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSubpageSelectedBatchIds(selectedCourseSubpage.batches.map(b => b.id));
                    setIsSubpageShareModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F9E33A] hover:brightness-105 text-[#2D041A] font-black text-xs sm:text-sm shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-[#2D041A]" />
                  <span>Share Link</span>
                </button>
                <div className="bg-black/25 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-200 block">Course Shared Links</span>
                  <span className="text-xl font-black text-[#F9E33A] mt-0.5 block">{subpageFilteredItems.length}</span>
                </div>
              </div>
            </div>

            {/* SUBPAGE SHARE LINK MODAL (EXACT LAYOUT FROM REFERENCE IMAGE WITH MULTI-BATCH SELECTION) */}
            {isSubpageShareModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
                <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
                  {/* Modal Header */}
                  <div className="px-6 py-4.5 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-[#D4AF37]" />
                        <span>Share Event Media Link • {selectedCourseSubpage.title}</span>
                      </h3>
                      <p className="text-xs text-rose-100 mt-0.5">
                        Broadcast Google Drive and/or YouTube performance links to students in this course
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSubpageShareModalOpen(false)}
                      className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Form */}
                  <form onSubmit={handleSubpageShareSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Event Shoot Title */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        EVENT SHOOT TITLE <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Annual Natya Utsav 2026 Stage Shoot"
                        value={subpageShareTitle}
                        onChange={e => setSubpageShareTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    {/* Google Drive & YouTube Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>GOOGLE DRIVE FOLDER LINK</span>
                          <span className="text-[10.5px] text-gray-400 font-normal lowercase">(optional if youtube provided)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            placeholder="https://drive.google.com/drive/folders/..."
                            value={subpageShareDriveUrl}
                            onChange={e => setSubpageShareDriveUrl(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 font-mono text-xs"
                          />
                          <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>YOUTUBE VIDEO / PLAYLIST LINK</span>
                          <span className="text-[10.5px] text-gray-400 font-normal lowercase">(optional if drive provided)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            placeholder="https://youtube.com/watch?v=... or playlist"
                            value={subpageShareYoutubeUrl}
                            onChange={e => setSubpageShareYoutubeUrl(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 font-mono text-xs"
                          />
                          <Video className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 -mt-2">
                      Provide either a Google Drive folder link, a YouTube link, or both. Students will see the corresponding platforms directly in their mobile app.
                    </p>

                    {/* Event Shoot Date */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        EVENT SHOOT DATE
                      </label>
                      <input
                        type="date"
                        value={subpageShareDate}
                        onChange={e => setSubpageShareDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                      />
                    </div>

                    {/* Description / Instructions */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          DESCRIPTION / INSTRUCTIONS FOR STUDENTS
                        </label>
                        <AiEnhanceButton
                          value={subpageShareDesc}
                          onEnhance={(val) => setSubpageShareDesc(val)}
                          context="classical arts choreography video description and practice instructions"
                          size="xs"
                        />
                      </div>
                      <textarea
                        rows={3}
                        placeholder="e.g. Contains multi-cam 4K stage recordings, individual solo clips, and high-res photo gallery."
                        value={subpageShareDesc}
                        onChange={e => setSubpageShareDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 min-h-[85px] resize-y"
                      />
                    </div>

                    {/* SELECT TARGET BATCHES [can select all and multiple] */}
                    <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-extrabold text-[#2D041A] uppercase tracking-wider">
                            SELECT TARGET BATCHES
                          </label>
                          <p className="text-xs text-gray-500 font-medium">
                            Chosen: <strong className="text-[#8A064D] font-black">{subpageSelectedBatchIds.length}</strong> of {selectedCourseSubpage.batches.length} batches
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (subpageSelectedBatchIds.length === selectedCourseSubpage.batches.length) {
                              setSubpageSelectedBatchIds([]);
                            } else {
                              setSubpageSelectedBatchIds(selectedCourseSubpage.batches.map(b => b.id));
                            }
                          }}
                          className="text-xs font-black text-[#8A064D] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          {subpageSelectedBatchIds.length === selectedCourseSubpage.batches.length ? (
                            <>
                              <Square className="w-4 h-4 text-[#8A064D]" />
                              <span>Deselect All</span>
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-4 h-4 text-[#8A064D]" />
                              <span>Select All ({selectedCourseSubpage.batches.length} Batches)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Batches Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                        {selectedCourseSubpage.batches.map((batch) => {
                          const isChecked = subpageSelectedBatchIds.includes(batch.id);
                          return (
                            <button
                              key={`batch-choice-${batch.id}`}
                              type="button"
                              onClick={() => {
                                setSubpageSelectedBatchIds(prev =>
                                  prev.includes(batch.id)
                                    ? prev.filter(id => id !== batch.id)
                                    : [...prev, batch.id]
                                );
                              }}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                                isChecked
                                  ? 'border-[#8A064D] bg-[#FFF2F8] shadow-xs'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                isChecked
                                  ? 'bg-[#1C64F2] border-[#1C64F2] text-white shadow-xs'
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-gray-900 block truncate">
                                  {batch.name}
                                </span>
                                <span className="text-[10.5px] text-gray-500 block truncate mt-0.5 font-medium">
                                  {batch.trainer_name ? stripGuruPrefix(batch.trainer_name) : 'Faculty'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsSubpageShareModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingSubpageShare || subpageSelectedBatchIds.length === 0}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8A064D] to-[#B31267] hover:from-[#740340] hover:to-[#8A064D] active:scale-95 text-white font-black text-xs shadow-md disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-[#F9E33A]" />
                        <span>
                          {isSubmittingSubpageShare
                            ? 'Distributing Link...'
                            : `Share with ${subpageSelectedBatchIds.length} Batches`}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* CARD 2: PREVIOUSLY SHARED LINKS WITH MONTH & YEAR RANGE FILTER + SEARCH BAR */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0D5E4] space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-base text-[#2D041A] flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#8A064D]" />
                    <span>Previously Shared Links for {selectedCourseSubpage.title}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Filter historical event links by month, year, or keywords.
                  </p>
                </div>

                <span className="text-xs font-bold text-gray-500">
                  Showing <strong className="text-[#8A064D] font-extrabold">{subpageFilteredItems.length}</strong> previous links
                </span>
              </div>

              {/* MONTH, YEAR & SEARCH BAR FILTERS */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search link title, batch, or description..."
                    value={subpageSearch}
                    onChange={e => setSubpageSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
                  />
                  {subpageSearch && (
                    <button
                      onClick={() => setSubpageSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-2">
                  <MonthPicker
                    value={subpageMonthLabel}
                    onChange={(label, ym) => {
                      setSubpageMonthLabel(label);
                      setSubpageYearMonth(ym);
                    }}
                    align="right"
                    placeholder="All Months & Years"
                  />

                  {/* Reset Filters button */}
                  {(subpageSearch || subpageYearMonth) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubpageSearch('');
                        setSubpageMonthLabel('');
                        setSubpageYearMonth('');
                      }}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition cursor-pointer"
                      title="Reset filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* LIST OF PREVIOUS SHARED LINKS */}
              {subpageFilteredItems.length === 0 ? (
                <div className="p-8 text-center bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                  <FolderPlus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">No previous shared links match the filters</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Try adjusting the month, year, or search query above, or share a new link using the form.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {subpageFilteredItems.map((item, idx) => {
                    const formattedDate = item.event_date
                      ? new Date(item.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Recent';

                    return (
                      <div
                        key={`subpage-item-${item.id}-${idx}`}
                        className="p-4 bg-white rounded-2xl border border-[#F0D5E4] hover:border-[#8A064D] shadow-2xs space-y-2.5 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DEF7EC] text-[#03543F]">
                                {item.target_batch_name || 'All Batches'}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium">
                                • {formattedDate}
                              </span>
                            </div>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                title="Delete shared link"
                                className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-gray-900 mt-1.5 leading-snug">
                            {item.title}
                          </h4>

                          {item.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons: Support both YouTube and Drive */}
                        <div className="pt-2.5 border-t border-gray-100 space-y-2">
                          {item.youtube_url && (
                            <div className="flex items-center justify-between gap-2 bg-rose-50/50 p-2 rounded-xl border border-rose-100">
                              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                                <span className="truncate">YouTube Video</span>
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.youtube_url!, `${item.id}-yt`, 'YouTube Link')}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 text-[11px] font-bold hover:bg-rose-50 transition cursor-pointer"
                                >
                                  {copiedId === `${item.id}-yt` ? 'Copied!' : 'Copy'}
                                </button>
                                <a
                                  href={item.youtube_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Open</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}

                          {item.drive_url && (
                            <div className="flex items-center justify-between gap-2 bg-[#FFF9FB] p-2 rounded-xl border border-[#F0D5E4]">
                              <span className="text-[11px] font-bold text-[#8A064D] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#8A064D] shrink-0" />
                                <span className="truncate">Google Drive</span>
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.drive_url!, `${item.id}-gd`, 'Drive Link')}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-[11px] font-bold hover:bg-gray-50 transition cursor-pointer"
                                >
                                  {copiedId === `${item.id}-gd` ? 'Copied!' : 'Copy'}
                                </button>
                                <a
                                  href={item.drive_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-[#590231] hover:bg-[#740340] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Open Drive</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =================================================================== */
          /* ALL COURSES GRID (WHEN NO COURSE SUBPAGE IS SELECTED) */
          /* =================================================================== */
          <div className="space-y-6">
            {/* Search & Filter Controls for Courses */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F0D5E4] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Box */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={e => setCourseSearch(e.target.value)}
                    placeholder="Search course title or assigned guru..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#8A064D]/30 focus:border-[#8A064D]"
                  />
                  {courseSearch && (
                    <button
                      onClick={() => setCourseSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-xs md:text-sm font-semibold text-gray-500">
                  Showing <span className="text-[#8A064D] font-bold">{filteredCourses.length}</span> of {courses.length} courses
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#8A064D]" />
                  <span>Select a Course to View Enrolled Students & Share Links</span>
                </h2>
                <span className="text-xs text-gray-500">Click any course to open course page</span>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-700">No courses match your search</h3>
                  <p className="text-xs text-gray-500 mt-1">Try clearing search keywords</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredCourses.map((course, idx) => {
                    const courseImg = resolveCourseImage(course.title, course.category, course.image_url);
                    return (
                      <div
                        key={`course-card-${course.id}-${idx}`}
                        onClick={() => {
                          setSelectedCourseSubpage(course);
                          setSubpageSelectedBatchIds(course.batches.map(b => b.id));
                          setSubpageSearch('');
                          setSubpageMonthLabel('');
                          setSubpageYearMonth('');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group bg-white rounded-2xl overflow-hidden border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                      >
                        {/* Course Image Banner */}
                        <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                          <img
                            src={courseImg}
                            alt={course.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                          {/* Shared Folders Badge */}
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#03543F]/90 backdrop-blur-md text-emerald-200 text-[10.5px] font-bold flex items-center gap-1 border border-emerald-400/30">
                            <Video className="w-3 h-3 text-emerald-300" />
                            <span>{course.folder_count} Shared</span>
                          </span>

                          {/* Course Title on Banner */}
                          <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                            <h3 className="font-bold text-base leading-tight drop-shadow-sm group-hover:text-[#D4AF37] transition-colors">
                              {course.title}
                            </h3>
                          </div>
                        </div>

                        {/* Card Content & Stats */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                            <div className="bg-[#FFF9FB] p-2 rounded-xl border border-[#F0D5E4]/60">
                              <span className="text-[10px] text-gray-500 block font-medium">Batches</span>
                              <span className="font-bold text-gray-800 text-xs flex items-center gap-1 mt-0.5">
                                <Layers className="w-3 h-3 text-[#8A064D]" />
                                {course.batches.length} Batches
                              </span>
                            </div>
                            <div className="bg-[#FFF9FB] p-2 rounded-xl border border-[#F0D5E4]/60">
                              <span className="text-[10px] text-gray-500 block font-medium">Students</span>
                              <span className="font-bold text-gray-800 text-xs flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3 text-[#8A064D]" />
                                {course.student_count} Enrolled
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            type="button"
                            className="w-full py-2.5 px-3 rounded-xl bg-[#FFF2F8] group-hover:bg-[#8A064D] text-[#8A064D] group-hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#F0D5E4] group-hover:border-[#8A064D]"
                          >
                            <span>Open Course Page & Share Links</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      ) : activeTab === 'all_videos' ? (
        /* ===================================================================== */
        /* TAB 2: ALL VIDEOS (SHARED HISTORY & UNIVERSAL SHARE LINK) */
        /* ===================================================================== */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Universal Share Link Action Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0D5E4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#2D041A] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#8A064D]" />
                <span>Universal Event Link Broadcast</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Share an event Google Drive folder or YouTube video across all or multiple selected courses at once.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCourseIds(courses.map(c => c.id));
                setIsUniversalModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#C5A028] hover:to-[#D4AF37] text-[#4A0025] font-bold text-xs shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer shrink-0"
            >
              <Globe className="w-4 h-4 text-[#4A0025]" />
              <span>Universal Share Event Link</span>
            </button>
          </div>

          {/* ALL VIDEOS SHARED HISTORY */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0D5E4] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#8A064D]" />
                  <span>All Active Event Media Folders</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete history of event folders and video links shared across academy disciplines
                </p>
              </div>

              {/* Search & Month/Year Filters for All Videos */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search all event folders..."
                    value={allVideosSearch}
                    onChange={e => setAllVideosSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-[#FFF9FB] focus:outline-hidden focus:ring-1 focus:ring-[#8A064D]"
                  />
                  {allVideosSearch && (
                    <button
                      onClick={() => setAllVideosSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <MonthPicker
                  value={allVideosMonthLabel}
                  onChange={(label, ym) => {
                    setAllVideosMonthLabel(label);
                    setAllVideosYearMonth(ym);
                  }}
                  align="right"
                  placeholder="All Months & Years"
                />

                {(allVideosSearch || allVideosYearMonth) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAllVideosSearch('');
                      setAllVideosMonthLabel('');
                      setAllVideosYearMonth('');
                    }}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition cursor-pointer"
                    title="Reset filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {allVideosFilteredItems.length === 0 ? (
              <div className="p-8 text-center bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                <FolderPlus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No event folders match criteria</p>
                <p className="text-xs text-gray-500 mt-1">
                  Use the Universal Share button or switch to Course-Wise to share new links.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allVideosFilteredItems.map((item, idx) => {
                  const formattedDate = item.event_date
                    ? new Date(item.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Recent Shoot';

                  return (
                    <div
                      key={`all-items-${item.id}-${idx}`}
                      className="bg-white rounded-3xl p-5 border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        {/* Title */}
                        <h4 className="font-bold text-base text-[#2D041A] leading-snug line-clamp-2">
                          {item.title}
                        </h4>

                        {/* Date of Share */}
                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                          <span>Date of share: <strong className="text-gray-700">{formattedDate}</strong></span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-600 bg-[#FFF9FB] p-3 rounded-2xl border border-[#F0D5E4]/60 line-clamp-3 leading-relaxed">
                          {item.description || 'No description provided for this shared video link.'}
                        </p>
                      </div>

                      {/* Action Buttons: View Details, Edit, Delete */}
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setViewingAllVideoItem(item)}
                          className="py-2 px-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs border border-[#48082B] cursor-pointer"
                          title="View Complete Video Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                          <span>Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditItem(item)}
                          className="py-2 px-1.5 rounded-xl bg-[#FFF2F8] hover:bg-[#8A064D] text-[#8A064D] hover:text-white text-xs font-bold transition flex items-center justify-center gap-1 border border-[#F0D5E4] shadow-2xs cursor-pointer"
                          title="Edit Link Info"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="py-2 px-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold transition flex items-center justify-center gap-1 border border-rose-200 shadow-2xs cursor-pointer"
                            title="Delete Link"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* TAB 3: GURU SHARE & MONTHLY PERFORMANCE VIDEO TRACKING HUB           */
        /* ===================================================================== */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Summary Row with View Mode Switcher & Month/Year Filter */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#F0D5E4] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-200 text-[11px] font-bold mb-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>FACULTY VIDEO LIBRARY &amp; AUDITS</span>
              </div>
              <h3 className="font-bold text-lg text-[#2D041A] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8A064D]" />
                <span>Guru Share Hub</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Audit monthly student performance compliance (1 video/student/month) or browse general group video links
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle: Performance Videos (Compliance & Audit) vs General (All Video Links) */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setGuruShareViewMode('compliance_grid')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    guruShareViewMode === 'compliance_grid'
                      ? 'bg-[#590231] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Performance Videos (Compliance &amp; Audit)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuruShareViewMode('media_archive')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    guruShareViewMode === 'media_archive'
                      ? 'bg-[#590231] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>General Videos ({guruGeneralItems.length})</span>
                </button>
              </div>

              {/* Month & Year Filter using MonthPicker */}
              {guruShareViewMode === 'compliance_grid' && (
                <MonthPicker
                  value={complianceMonth !== 'all' && complianceYear ? `${MONTHS.find(m => m.value === complianceMonth)?.label || ''} ${complianceYear}` : ''}
                  onChange={(label, ym) => {
                    if (!ym) {
                      setComplianceMonth('all');
                      setComplianceYear('all');
                      fetchComplianceData('all', 'all');
                    } else {
                      const [y, m] = ym.split('-');
                      const mNum = parseInt(m, 10).toString();
                      setComplianceMonth(mNum);
                      setComplianceYear(y);
                      fetchComplianceData(mNum, y);
                    }
                  }}
                  align="right"
                  placeholder="Select Month & Year"
                />
              )}
            </div>
          </div>

          {guruShareViewMode === 'compliance_grid' ? (
            selectedGuruForModal ? (
              /* =================================================================== */
              /* DEDICATED FULL-PAGE GURU AUDIT VIEW (ROW-WISE TABLES)               */
              /* =================================================================== */
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Back Navigation Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedGuruForModal(null)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFF2F8] hover:bg-[#8A064D] text-[#8A064D] hover:text-white font-bold text-xs transition cursor-pointer border border-[#F0D5E4]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Gurus Directory</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F9E33A] text-[#4A0025]">
                      {complianceMonth !== 'all' ? MONTHS.find((m) => m.value === complianceMonth)?.label : 'All Months'} {complianceYear} Performance Audit
                    </span>
                  </div>
                </div>

                {/* Guru Hero Profile & Metrics */}
                <div className="bg-gradient-to-r from-[#590231] to-[#8A064D] text-white p-6 rounded-3xl shadow-sm space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedGuruForModal.avatar_url ? (
                        <img
                          src={selectedGuruForModal.avatar_url}
                          alt={selectedGuruForModal.full_name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37] shadow-md shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md text-[#F9E33A] flex items-center justify-center font-bold text-xl border border-white/30 shrink-0">
                          {selectedGuruForModal.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-black text-white">
                            {stripGuruPrefix(selectedGuruForModal.full_name)}
                          </h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            selectedGuruForModal.compliance_status === 'completed'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[#D4AF37] text-[#2D041A]'
                          }`}>
                            {selectedGuruForModal.compliance_status === 'completed' ? '100% Completed' : `${selectedGuruForModal.missing_count} Missing`}
                          </span>
                        </div>
                        <p className="text-xs text-rose-100 mt-1 flex flex-wrap items-center gap-3">
                          <span>{stripGuruPrefix(selectedGuruForModal.display_title) || (selectedGuruForModal.specializations.length > 0 ? selectedGuruForModal.specializations.join(', ') : 'Faculty Member')}</span>
                          {selectedGuruForModal.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-[#D4AF37]" />
                              {selectedGuruForModal.phone}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedGuruForModal.courses.map((c) => (
                        <span key={`audit-c-${c.id}`} className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/10 text-white border border-white/20">
                          {c.title}
                        </span>
                      ))}
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/20 text-[#F9E33A]">
                        {selectedGuruForModal.assigned_batches_count} Batches
                      </span>
                    </div>
                  </div>

                  {/* 4 Quick Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                      <span className="text-[11px] text-rose-200 block font-semibold uppercase">Total Students</span>
                      <span className="text-xl sm:text-2xl font-black text-white">{selectedGuruForModal.total_students}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                      <span className="text-[11px] text-emerald-200 block font-semibold uppercase">Received Videos</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-300">{selectedGuruForModal.received_count}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                      <span className="text-[11px] text-rose-200 block font-semibold uppercase">Missing Videos</span>
                      <span className="text-xl sm:text-2xl font-black text-rose-300">{selectedGuruForModal.missing_count}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                      <span className="text-[11px] text-[#F9E33A] block font-semibold uppercase">Compliance Rate</span>
                      <span className="text-xl sm:text-2xl font-black text-[#F9E33A]">{selectedGuruForModal.compliance_rate}%</span>
                    </div>
                  </div>
                </div>

                {/* Subheader: Tabs & Filters */}
                <div className="bg-white rounded-2xl p-4 border border-[#F0D5E4] shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setGuruModalActiveTab('received')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          guruModalActiveTab === 'received'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Received Videos ({modalFilteredReceived.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGuruModalActiveTab('missing')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          guruModalActiveTab === 'missing'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Missing Students ({modalFilteredMissing.length})</span>
                      </button>
                    </div>

                    <div className="text-xs font-bold text-gray-700">
                      Showing: <strong className="text-emerald-700 font-bold">{modalFilteredReceived.length} Received</strong>, <strong className="text-rose-600 font-bold">{modalFilteredMissing.length} Missing</strong>
                    </div>
                  </div>

                  {/* Filter Controls Row */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Batch Filter */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-gray-500 uppercase">Batch:</span>
                        <select
                          value={guruModalBatchFilter}
                          onChange={(e) => {
                            setGuruModalBatchFilter(e.target.value);
                            setGuruModalSelectedStudentIds([]);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#8A064D]/20 cursor-pointer shadow-2xs max-w-[210px] truncate"
                        >
                          <option value="all">All Enrolled Batches ({guruModalAvailableBatches.length})</option>
                          {guruModalAvailableBatches.map((b) => (
                            <option key={`guru-batch-opt-${b.id}`} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Searchable Multi-Select Student Filter */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsGuruModalStudentDropdownOpen(prev => !prev)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                            guruModalSelectedStudentIds.length > 0
                              ? 'bg-[#8A064D] text-white border-[#8A064D]'
                              : 'bg-white text-gray-800 border-gray-200 hover:border-[#8A064D]'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {guruModalSelectedStudentIds.length === 0
                              ? `All Students (${disciplesForFilterList.length})`
                              : `${guruModalSelectedStudentIds.length} Selected`}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isGuruModalStudentDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isGuruModalStudentDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] p-3 z-50 space-y-2 animate-in fade-in zoom-in-95">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Search students..."
                                value={guruModalStudentSearch}
                                onChange={(e) => setGuruModalStudentSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-[#8A064D]"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] px-1 py-0.5 border-b border-gray-100">
                              <span className="text-gray-500 font-semibold">{disciplesForFilterList.length} Students</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setGuruModalSelectedStudentIds(disciplesForFilterList.map(d => d.student_id))}
                                  className="text-[#8A064D] hover:underline font-bold cursor-pointer"
                                >
                                  Select All
                                </button>
                                <span className="text-gray-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => setGuruModalSelectedStudentIds([])}
                                  className="text-gray-500 hover:underline font-semibold cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                              {disciplesForFilterList.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-400">No students match search</div>
                              ) : (
                                disciplesForFilterList.map((disciple) => {
                                  const isChecked = guruModalSelectedStudentIds.includes(disciple.student_id);
                                  return (
                                    <label
                                      key={`modal-student-chk-${disciple.student_id}`}
                                      className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${
                                        isChecked ? 'bg-[#FFF2F8] text-[#8A064D] font-bold' : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          setGuruModalSelectedStudentIds(prev =>
                                            prev.includes(disciple.student_id)
                                              ? prev.filter(id => id !== disciple.student_id)
                                              : [...prev, disciple.student_id]
                                          );
                                        }}
                                        className="w-3.5 h-3.5 rounded-md text-[#8A064D] focus:ring-[#8A064D] border-gray-300 cursor-pointer"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <span className="block truncate">{disciple.student_name}</span>
                                        <span className="text-[10px] text-gray-400 font-normal block truncate">
                                          {disciple.roll_number} {disciple.batch_name ? `• ${disciple.batch_name}` : ''}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                            <div className="pt-1 border-t border-gray-100 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setIsGuruModalStudentDropdownOpen(false)}
                                className="px-3 py-1 rounded-lg bg-[#590231] hover:bg-[#740340] text-white text-[11px] font-bold cursor-pointer"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {(guruModalBatchFilter !== 'all' || guruModalSelectedStudentIds.length > 0 || guruModalStudentSearch.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setGuruModalBatchFilter('all');
                            setGuruModalSelectedStudentIds([]);
                            setGuruModalStudentSearch('');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Clear Filters"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ROW-WISE TABLE SECTION */}
                <div className="bg-white rounded-3xl p-5 border border-[#F0D5E4] shadow-xs">
                  {guruModalActiveTab === 'received' ? (
                    modalFilteredReceived.length === 0 ? (
                      <div className="p-12 text-center bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                        <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-gray-700">No received performance videos match the selected filters</h4>
                        <p className="text-xs text-gray-500 mt-1">Students will appear here once recordings are shared.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 bg-[#FFF9FB] text-[11px] font-black text-gray-600 uppercase tracking-wider">
                              <th className="py-3 px-4">Student</th>
                              <th className="py-3 px-4">Course</th>
                              <th className="py-3 px-4">Batch</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {modalFilteredReceived.map((disciple, idx) => (
                              <tr key={`received-row-${disciple.student_id}-${idx}`} className="hover:bg-emerald-50/30 transition">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-gray-900">{disciple.student_name}</div>
                                  <div className="text-[11px] font-mono text-gray-500">{disciple.roll_number}</div>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-gray-800">
                                  {disciple.course_title || selectedGuruForModal?.courses?.[0]?.title || 'Course'}
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-gray-700">
                                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px]">
                                    {disciple.batch_name}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-gray-600">
                                  {disciple.event_date ? (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-gray-400" />
                                      <span>
                                        {new Date(disciple.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-[#DEF7EC] text-[#03543F] border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Received</span>
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setViewingPerformanceVideo(disciple)}
                                    className="px-3 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] text-white text-[11px] font-bold transition flex items-center justify-center gap-1 mx-auto shadow-2xs border border-[#48082B] cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                                    <span>Details</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    /* MISSING STUDENTS ROW-WISE TABLE */
                    modalFilteredMissing.length === 0 ? (
                      <div className="p-12 text-center bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-gray-900">All students have received their monthly performance videos!</h4>
                        <p className="text-xs text-gray-500 mt-1">No missing student records under the selected filters.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 bg-[#FFF9FB] text-[11px] font-black text-gray-600 uppercase tracking-wider">
                              <th className="py-3 px-4">Student</th>
                              <th className="py-3 px-4">Enrolled Course</th>
                              <th className="py-3 px-4">Pending Batch</th>
                              <th className="py-3 px-4">Parent Contact</th>
                              <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {modalFilteredMissing.map((disciple, idx) => (
                              <tr key={`missing-row-${disciple.student_id}-${idx}`} className="hover:bg-rose-50/30 transition">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-gray-900">{disciple.student_name}</div>
                                  <div className="text-[11px] font-mono text-gray-500">{disciple.roll_number}</div>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-gray-800">
                                  {disciple.course_title || 'Enrolled Course'}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                                    {disciple.batch_name}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-gray-800">{disciple.parent_name || '—'}</div>
                                  {disciple.parent_phone && (
                                    <a
                                      href={`tel:${disciple.parent_phone}`}
                                      className="text-[#8A064D] hover:underline font-mono font-bold text-[11px] flex items-center gap-1 mt-0.5"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>{disciple.parent_phone}</span>
                                    </a>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    <span>Pending Video</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Gurus */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0D5E4] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Gurus</span>
                <div className="w-8 h-8 rounded-xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-[#2D041A]">{complianceData.summary.total_gurus}</span>
                <span className="text-xs text-gray-500 block mt-0.5 font-medium">
                  <strong className="text-emerald-700 font-bold">{complianceData.summary.completed_gurus}</strong> 100% Completed
                </span>
              </div>
            </div>

            {/* Card 2: Total Students */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0D5E4] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enrolled Students</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-[#2D041A]">{complianceData.summary.total_students}</span>
                <span className="text-xs text-gray-500 block mt-0.5 font-medium">
                  Across all Guru Batches
                </span>
              </div>
            </div>

            {/* Card 3: Videos Shared */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0D5E4] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Videos Received</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">{complianceData.summary.total_received}</span>
                  <span className="text-xs font-bold text-emerald-600">({complianceData.summary.overall_compliance_rate}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(complianceData.summary.overall_compliance_rate, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Missing Students */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0D5E4] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Missing This Month</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-600">{complianceData.summary.total_missing}</span>
                <span className="text-xs text-rose-700 font-bold block mt-0.5">
                  {complianceData.summary.total_missing === 0 ? 'All Students Completed!' : 'Pending Performance Videos'}
                </span>
              </div>
            </div>
          </div>

          {/* FACULTY STUDENTS COMPLIANCE DIRECTORY */}
          <div className="space-y-4">
              {/* Filter Pills & Search Bar */}
              <div className="bg-white rounded-2xl p-4 border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Guru name, course, batch, or student..."
                    value={complianceSearch}
                    onChange={(e) => setComplianceSearch(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
                  />
                  {complianceSearch && (
                    <button
                      onClick={() => setComplianceSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setComplianceStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      complianceStatusFilter === 'all'
                        ? 'bg-[#590231] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All Gurus ({complianceData.gurus.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setComplianceStatusFilter('needs_attention')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      complianceStatusFilter === 'needs_attention'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Needs Attention ({complianceData.summary.partial_gurus + complianceData.summary.pending_gurus})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setComplianceStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      complianceStatusFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>100% Completed ({complianceData.summary.completed_gurus})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchComplianceData(complianceMonth, complianceYear)}
                    title="Refresh Data"
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isLoadingCompliance ? 'animate-spin text-[#8A064D]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* ALL GURUS DIRECTORY GRID */}
              {filteredComplianceGurus.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#F0D5E4] shadow-xs">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-gray-700">No Gurus match the selected filters</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Try clearing your search query or selecting a different filter status pill above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                  {filteredComplianceGurus.map((guru) => {
                    const initials = guru.full_name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    const isFullyCompliant = guru.compliance_status === 'completed';
                    const hasMissing = guru.missing_count > 0;
                    const noStudents = guru.total_students === 0;

                    return (
                      <div
                        key={`guru-card-${guru.trainer_id}`}
                        className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 ${
                          isFullyCompliant
                            ? 'border-emerald-200 hover:border-emerald-400'
                            : hasMissing
                            ? 'border-rose-200 hover:border-[#8A064D]'
                            : 'border-[#F0D5E4] hover:border-[#8A064D]'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top Row: Guru Identity & Compliance Pill */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {guru.avatar_url ? (
                                <img
                                  src={guru.avatar_url}
                                  alt={guru.full_name}
                                  className="w-11 h-11 rounded-2xl object-cover border border-[#F0D5E4] shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#590231] to-[#8A064D] text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-[#2D041A] truncate flex items-center gap-1.5">
                                  <span>{stripGuruPrefix(guru.full_name)}</span>
                                </h4>
                                <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                  {stripGuruPrefix(guru.display_title) || (guru.specializations.length > 0 ? guru.specializations.join(', ') : 'Faculty')}
                                </p>
                              </div>
                            </div>

                            {/* Compliance Badge */}
                            {noStudents ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 shrink-0">
                                No Students
                              </span>
                            ) : isFullyCompliant ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DEF7EC] text-[#03543F] border border-emerald-300 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>100% Done</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>{guru.missing_count} Missing</span>
                              </span>
                            )}
                          </div>

                          {/* Courses & Batches Pills */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {guru.courses.map((c) => (
                              <span
                                key={`guru-c-${guru.trainer_id}-${c.id}`}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#FFF2F8] text-[#8A064D] border border-rose-100"
                              >
                                {c.title}
                              </span>
                            ))}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600">
                              {guru.assigned_batches_count} {guru.assigned_batches_count === 1 ? 'Batch' : 'Batches'}
                            </span>
                          </div>

                          {/* Compliance Progress Bar & Metrics */}
                          <div className="bg-[#FFF9FB] p-3 rounded-2xl border border-[#F0D5E4]/60 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-gray-700">
                                Monthly Video Status
                              </span>
                              <span className="font-extrabold text-[#2D041A]">
                                {guru.received_count} / {guru.total_students}{' '}
                                <span className="text-[11px] text-gray-500 font-semibold">({guru.compliance_rate}%)</span>
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isFullyCompliant
                                    ? 'bg-emerald-500'
                                    : guru.received_count > 0
                                    ? 'bg-[#D4AF37]'
                                    : 'bg-rose-400'
                                }`}
                                style={{ width: `${Math.min(guru.compliance_rate, 100)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {guru.received_count} Received
                              </span>
                              <span className={`font-bold flex items-center gap-1 ${guru.missing_count > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                                <AlertCircle className="w-3 h-3" />
                                {guru.missing_count} Missing
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Button: Open Inspector Modal */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGuruForModal(guru);
                            setGuruModalActiveTab(guru.missing_count > 0 ? 'missing' : 'received');
                            setGuruModalBatchFilter('all');
                            setGuruModalStudentSearch('');
                            setGuruModalSelectedStudentIds([]);
                            setIsGuruModalStudentDropdownOpen(false);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#590231] hover:bg-[#740340] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-4 h-4 text-[#D4AF37]" />
                          <span>Audit Students & Video Links</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
          )
        ) : (
            /* =================================================================== */
            /* VIEW MODE: GENERAL VIDEO LINKS ONLY (MEDIA ARCHIVE)                 */
            /* =================================================================== */
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#F0D5E4] space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10.5px] font-bold mb-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span>GENERAL GROUP REPOSITORIES</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#8A064D]" />
                    <span>General Faculty Video Links ({guruGeneralItems.length})</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    General reference recordings, group practice videos, and syllabus materials shared by Gurus for entire batches
                  </p>
                </div>

                {/* Search & Multi-Filter Control Deck */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* 1. Search Bar */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search title, course, batch..."
                      value={guruShareSearch}
                      onChange={(e) => setGuruShareSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-[#8A064D]"
                    />
                    {guruShareSearch && (
                      <button
                        type="button"
                        onClick={() => setGuruShareSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 2. Guru Multi-Selection Searchable Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsGuruFilterOpen(prev => !prev)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                        selectedGeneralGurus.length > 0
                          ? 'bg-[#8A064D] text-white border-[#8A064D]'
                          : 'bg-[#FFF9FB] text-gray-800 border-gray-200 hover:border-[#8A064D]'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {selectedGeneralGurus.length === 0
                          ? `All Gurus (${guruNames.length})`
                          : `${selectedGeneralGurus.length} Gurus Selected`}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isGuruFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isGuruFilterOpen && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] p-3 z-40 space-y-2 animate-in fade-in zoom-in-95">
                        {/* Search Input inside Dropdown */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search Guru name..."
                            value={guruFilterSearch}
                            onChange={(e) => setGuruFilterSearch(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-medium text-gray-900 focus:outline-hidden focus:border-[#8A064D]"
                          />
                          {guruFilterSearch && (
                            <button
                              type="button"
                              onClick={() => setGuruFilterSearch('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Quick Selection Shortcuts */}
                        <div className="flex items-center justify-between text-[11px] font-bold px-1 text-[#8A064D]">
                          <button
                            type="button"
                            onClick={() => setSelectedGeneralGurus([...guruNames])}
                            className="hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedGeneralGurus([])}
                            className="text-gray-500 hover:text-gray-800 cursor-pointer"
                          >
                            Clear Selection
                          </button>
                        </div>

                        {/* Scrollable Checkbox List of Gurus */}
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                          {filteredGuruNamesForDropdown.length === 0 ? (
                            <p className="text-[11px] text-gray-400 text-center py-2">No matching Gurus</p>
                          ) : (
                            filteredGuruNamesForDropdown.map((gName) => {
                              const isChecked = selectedGeneralGurus.includes(gName);
                              return (
                                <label
                                  key={`guru-multi-opt-${gName}`}
                                  className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${
                                    isChecked ? 'bg-[#FFF2F8] text-[#8A064D] font-bold' : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedGeneralGurus(prev =>
                                        prev.includes(gName)
                                          ? prev.filter(g => g !== gName)
                                          : [...prev, gName]
                                      );
                                    }}
                                    className="w-3.5 h-3.5 rounded-md text-[#8A064D] focus:ring-[#8A064D] border-gray-300 cursor-pointer"
                                  />
                                  <span className="truncate">{stripGuruPrefix(gName)}</span>
                                </label>
                              );
                            })
                          )}
                        </div>

                        {/* Done Button */}
                        <div className="pt-1.5 border-t border-gray-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsGuruFilterOpen(false)}
                            className="px-3 py-1 rounded-lg bg-[#590231] hover:bg-[#740340] text-white text-[11px] font-bold cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Standard MonthPicker Filter */}
                  <MonthPicker
                    value={guruGeneralMonthLabel}
                    onChange={(label, ym) => {
                      setGuruGeneralMonthLabel(label);
                      setGuruGeneralYearMonth(ym);
                    }}
                    placeholder="All Dates / Month"
                    align="right"
                  />

                  {/* 4. Reset Filters Button */}
                  {(guruShareSearch || selectedGeneralGurus.length > 0 || guruGeneralYearMonth) && (
                    <button
                      type="button"
                      onClick={() => {
                        setGuruShareSearch('');
                        setSelectedGeneralGurus([]);
                        setGuruGeneralMonthLabel('');
                        setGuruGeneralYearMonth('');
                      }}
                      className="px-2.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Reset all filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {guruGeneralItems.length === 0 ? (
                <div className="p-12 text-center bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                  <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">No general faculty video links match the selected criteria</p>
                  <p className="text-xs text-gray-500 mt-1">Try clearing your search query, adjusting your Guru selection, or resetting the date filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#FFF9FB] text-[11px] font-black text-gray-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Guru</th>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Batch</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {guruGeneralItems.map((item, idx) => {
                        const formattedDate = item.event_date
                          ? new Date(item.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Recent';

                        return (
                          <tr key={`guru-gen-row-${item.id}-${idx}`} className="hover:bg-rose-50/20 transition">
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF2F8] text-[#8A064D] border border-rose-200 shadow-2xs inline-block">
                                {stripGuruPrefix(item.trainer_name || item.created_by || 'Faculty Guru')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-gray-800">
                              {item.target_course_title || 'General Course'}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-gray-700">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px]">
                                {item.target_batch_name || 'All Batches'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span>{formattedDate}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-[#DEF7EC] text-[#03543F] border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Shared</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setViewingGeneralVideo(item)}
                                className="px-3 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] text-white text-[11px] font-bold transition flex items-center justify-center gap-1 mx-auto shadow-2xs border border-[#48082B] cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* ===================================================================== */}
      {/* 5. UNIVERSAL SHARE MODAL (SELECT MULTIPLE OR ALL COURSES) */}
      {/* ===================================================================== */}
      {isUniversalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#D4AF37]" />
                  <span>Universal Share Event Drive Link</span>
                </h3>
                <p className="text-xs text-rose-100">
                  Broadcast an event shoot folder to multiple or all 18 academy courses at once
                </p>
              </div>
              <button
                onClick={() => setIsUniversalModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUniversalShareSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Event Shoot Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Natya Utsav 2026 Stage Shoot"
                  value={universalTitle}
                  onChange={e => setUniversalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                />
              </div>

              {/* Google Drive & YouTube Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Google Drive URL */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Google Drive Folder Link</span>
                    <span className="text-[10.5px] text-gray-400 font-normal lowercase">(Optional if YouTube provided)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={universalDriveUrl}
                      onChange={e => setUniversalDriveUrl(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 font-mono text-xs"
                    />
                    <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* YouTube URL */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>YouTube Video / Playlist Link</span>
                    <span className="text-[10.5px] text-gray-400 font-normal lowercase">(Optional if Drive provided)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=... or playlist"
                      value={universalYoutubeUrl}
                      onChange={e => setUniversalYoutubeUrl(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 font-mono text-xs"
                    />
                    <Video className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 -mt-2">
                Provide either a Google Drive folder link, a YouTube link, or both. Students will see the corresponding platforms directly in their mobile app.
              </p>

              {/* Event Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Event Shoot Date
                </label>
                <input
                  type="date"
                  value={universalDate}
                  onChange={e => setUniversalDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                />
              </div>

              {/* Description / Instructions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Description / Instructions for Students
                  </label>
                  <AiEnhanceButton
                    value={universalDesc}
                    onEnhance={(val) => setUniversalDesc(val)}
                    context="classical arts choreography video description and practice instructions for students"
                    size="xs"
                  />
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. Contains multi-cam 4K stage recordings, individual solo clips, and high-res photo gallery."
                  value={universalDesc}
                  onChange={e => {
                    setUniversalDesc(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onFocus={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 min-h-[90px] overflow-hidden resize-y transition-all"
                />
              </div>

              {/* Select Target Courses */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Select Target Courses
                    </label>
                    <p className="text-xs text-gray-500">
                      Chosen: <span className="text-[#8A064D] font-bold">{selectedCourseIds.length}</span> of {courses.length} courses
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSelectAllCourses}
                    className="text-xs font-bold text-[#8A064D] hover:underline flex items-center gap-1"
                  >
                    {selectedCourseIds.length === courses.length ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Select All (18 Courses)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-[#FFF9FB] rounded-xl border border-[#F0D5E4]">
                  {courses.map(course => {
                    const isChecked = selectedCourseIds.includes(course.id);
                    return (
                      <label
                        key={course.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                          isChecked
                            ? 'bg-white border-[#8A064D] font-semibold text-gray-900 shadow-2xs'
                            : 'bg-transparent border-transparent text-gray-600 hover:bg-white/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectCourse(course.id)}
                          className="w-4 h-4 rounded-md text-[#8A064D] focus:ring-[#8A064D] border-gray-300"
                        />
                        <span className="truncate">{course.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUniversalModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUniversal || (!universalDriveUrl.trim() && !universalYoutubeUrl.trim()) || selectedCourseIds.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#590231] hover:bg-[#740340] text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmittingUniversal ? (
                    <span>Broadcasting Links...</span>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share with {selectedCourseIds.length} Courses</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5.5. EDIT SHARED VIDEO / LINK MODAL */}
      {/* ===================================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#D4AF37]" />
                  <span>Edit Shared Video / Drive Link</span>
                </h3>
                <p className="text-xs text-rose-100">
                  Update link titles, URLs, shoot date, and student instructions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditItem} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Event / Video Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Natya Utsav 2026 Stage Shoot"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 font-semibold"
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Google Drive Folder Link</span>
                    <span className="text-[10px] text-gray-400 font-normal lowercase">(Optional if YouTube provided)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={editDriveUrl}
                      onChange={e => setEditDriveUrl(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                    />
                    <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>YouTube Link</span>
                    <span className="text-[10px] text-gray-400 font-normal lowercase">(Optional if Drive provided)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={editYoutubeUrl}
                      onChange={e => setEditYoutubeUrl(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                    />
                    <Video className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Shoot Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Event Shoot Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                />
              </div>

              {/* Description with AI Enhance & auto expansion */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Description / Instructions for Students
                  </label>
                  <AiEnhanceButton
                    value={editDesc}
                    onEnhance={(val) => setEditDesc(val)}
                    context="classical arts choreography video description and practice instructions for students"
                    size="xs"
                  />
                </div>
                <textarea
                  rows={4}
                  placeholder="e.g. Masterclass choreography notes, costume details, rehearsal guidelines."
                  value={editDesc}
                  onChange={e => {
                    setEditDesc(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onFocus={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 min-h-[100px] overflow-hidden resize-y transition-all"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || (!editDriveUrl.trim() && !editYoutubeUrl.trim()) || !editTitle.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#590231] hover:bg-[#740340] text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmittingEdit ? (
                    <span>Saving Changes...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. COURSE DETAIL MODAL (STUDENTS ROSTER, BATCH FILTER & SHARE) */}
      {/* ===================================================================== */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 md:p-6 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-start justify-between relative overflow-hidden">
              <div className="space-y-1.5 z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#D4AF37] text-[11px] font-bold border border-[#D4AF37]/30">
                    {activeCourse.category}
                  </span>
                  <span className="text-xs text-rose-200">
                    {activeCourse.batches.length} Batches • {activeCourse.student_count} Enrolled Students
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold">{activeCourse.title}</h3>
                <p className="text-xs text-rose-100 max-w-xl">
                  Faculty: {stripGuruPrefix(activeCourse.batches[0]?.trainer_name) || 'Assigned Faculty'} • Room: {activeCourse.batches[0]?.room || 'Mandapam'}
                </p>
              </div>

              <button
                onClick={() => setActiveCourse(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 z-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
              
              {/* ACTION: SHARE DRIVE LINK TO THIS COURSE / BATCH */}
              <div className="bg-[#FFF9FB] rounded-2xl p-4 md:p-5 border border-[#F0D5E4]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-[#8A064D]" />
                      <span>Share Event Drive Folder with {activeCourse.title}</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Distribute an event shoot folder to everyone in this course or a specific batch
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCourseShareOpen(prev => !prev)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#590231] hover:bg-[#740340] text-white font-bold text-xs shadow-xs transition-all self-start sm:self-auto"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isCourseShareOpen ? 'Close Form' : '+ Share New Drive Link'}</span>
                  </button>
                </div>

                {/* Inline Share Form */}
                {isCourseShareOpen && (
                  <form onSubmit={handleCourseShareSubmit} className="mt-4 pt-4 border-t border-[#F0D5E4] space-y-4">
                    {/* Event Shoot Title */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Event Shoot Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Navaratri Mandapam Showcase 2026"
                        value={courseShareTitle}
                        onChange={e => setCourseShareTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 font-semibold"
                      />
                    </div>

                    {/* SELECT TARGET BATCHES [can select all and multiple] */}
                    <div className="p-4 rounded-2xl border-2 border-[#E02424] bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-extrabold text-[#2D041A] uppercase tracking-wider">
                            SELECT TARGET BATCHES
                          </label>
                          <p className="text-xs text-gray-500 font-medium">
                            Chosen: <strong className="text-[#8A064D] font-black">{courseShareSelectedBatchIds.length}</strong> of {activeCourse.batches.length} batches
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (courseShareSelectedBatchIds.length === activeCourse.batches.length) {
                              setCourseShareSelectedBatchIds([]);
                            } else {
                              setCourseShareSelectedBatchIds(activeCourse.batches.map(b => b.id));
                            }
                          }}
                          className="text-xs font-black text-[#8A064D] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          {courseShareSelectedBatchIds.length === activeCourse.batches.length ? (
                            <>
                              <Square className="w-4 h-4 text-[#8A064D]" />
                              <span>Deselect All</span>
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-4 h-4 text-[#8A064D]" />
                              <span>Select All ({activeCourse.batches.length} Batches)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Batches Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                        {activeCourse.batches.map((batch) => {
                          const isChecked = courseShareSelectedBatchIds.includes(batch.id);
                          return (
                            <button
                              key={`active-course-batch-${batch.id}`}
                              type="button"
                              onClick={() => {
                                setCourseShareSelectedBatchIds(prev =>
                                  prev.includes(batch.id)
                                    ? prev.filter(id => id !== batch.id)
                                    : [...prev, batch.id]
                                );
                              }}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                                isChecked
                                  ? 'border-[#8A064D] bg-[#FFF2F8] shadow-xs'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                isChecked
                                  ? 'bg-[#1C64F2] border-[#1C64F2] text-white shadow-xs'
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-gray-900 block truncate">
                                  {batch.name}
                                </span>
                                <span className="text-[10.5px] text-gray-500 block truncate mt-0.5 font-medium">
                                  {batch.trainer_name ? stripGuruPrefix(batch.trainer_name) : 'Faculty'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Google Drive Link */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Google Drive Link</span>
                          <span className="text-[10px] text-gray-400 font-normal lowercase">(Optional if YouTube provided)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={courseShareDriveUrl}
                          onChange={e => setCourseShareDriveUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                        />
                      </div>

                      {/* YouTube Link */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>YouTube Link</span>
                          <span className="text-[10px] text-gray-400 font-normal lowercase">(Optional if Drive provided)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://youtube.com/watch?v=..."
                          value={courseShareYoutubeUrl}
                          onChange={e => setCourseShareYoutubeUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Shoot Date */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Shoot Date
                        </label>
                        <input
                          type="date"
                          value={courseShareDate}
                          onChange={e => setCourseShareDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Instructions / Description
                          </label>
                          <AiEnhanceButton
                            value={courseShareDesc}
                            onEnhance={(val) => setCourseShareDesc(val)}
                            context="classical arts choreography video description and practice instructions"
                            size="xs"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="e.g. Stage rehearsals, masterclass footages."
                          value={courseShareDesc}
                          onChange={e => {
                            setCourseShareDesc(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onFocus={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 min-h-[60px] overflow-hidden resize-y transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCourseShareOpen(false)}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingCourseShare || (!courseShareDriveUrl.trim() && !courseShareYoutubeUrl.trim())}
                        className="px-4 py-1.5 rounded-lg bg-[#590231] hover:bg-[#740340] text-white font-bold text-xs shadow-xs disabled:opacity-50"
                      >
                        {isSubmittingCourseShare ? 'Saving...' : 'Share Event Links'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* EXISTING SHARED EVENT FOLDERS FOR THIS COURSE */}
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#8A064D]" />
                    <span>Shared Event Folders for this Course ({activeCourseItems.length})</span>
                  </span>
                  <span className="text-xs text-gray-500 font-normal">Visible in student mobile app</span>
                </h4>

                {activeCourseItems.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500 border border-gray-200">
                    No event folders shared for this course yet. Use the share button above!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCourseItems.map(item => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white rounded-xl border border-[#F0D5E4] shadow-2xs space-y-2 hover:border-[#8A064D] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#DEF7EC] text-[#03543F]">
                              {item.target_batch_name || 'All Batches'}
                            </span>
                            <h5 className="font-bold text-xs md:text-sm text-gray-900 mt-1 line-clamp-1">
                              {item.title}
                            </h5>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              title="Edit link details"
                              className="text-gray-400 hover:text-[#8A064D] p-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                title="Delete link"
                                className="text-gray-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-gray-600 line-clamp-1">{item.description}</p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-[11px]">
                          {item.drive_url && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(item.drive_url!, `${item.id}-drive`, 'Drive Link')}
                                className="text-[#8A064D] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedId === `${item.id}-drive` ? 'Copied!' : 'Copy Drive'}</span>
                              </button>
                              <a
                                href={item.drive_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium"
                              >
                                <span>Drive</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {item.youtube_url && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(item.youtube_url!, `${item.id}-yt`, 'YouTube Link')}
                                className="text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedId === `${item.id}-yt` ? 'Copied!' : 'Copy YouTube'}</span>
                              </button>
                              <a
                                href={item.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-600 hover:text-red-800 flex items-center gap-1 font-medium"
                              >
                                <span>YouTube</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STUDENTS ROSTER WITH BATCH FILTER */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#8A064D]" />
                      <span>Enrolled Students in {activeCourse.title}</span>
                    </h4>
                    <p className="text-xs text-gray-500">
                      Students who automatically receive Drive link access in their mobile app
                    </p>
                  </div>

                  {/* Student Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student or roll no..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-[#FFF9FB] focus:outline-hidden focus:ring-1 focus:ring-[#8A064D]"
                    />
                  </div>
                </div>

                {/* BATCH FILTER PILLS */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSelectedBatchId('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      selectedBatchId === 'all'
                        ? 'bg-[#590231] text-white shadow-2xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    All Batches ({courseStudents.length})
                  </button>
                  {activeCourse.batches.map(batch => {
                    const count = courseStudents.filter(s => s.batch_id === batch.id).length;
                    const isSelected = selectedBatchId === batch.id;
                    return (
                      <button
                        key={batch.id}
                        onClick={() => setSelectedBatchId(batch.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-[#590231] text-white font-bold shadow-2xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {batch.name} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Students Table */}
                {isLoadingStudents ? (
                  <div className="py-8 text-center text-xs text-gray-500">Loading enrolled students...</div>
                ) : displayedStudents.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 rounded-xl text-xs text-gray-500 border border-gray-200">
                    No enrolled students found for the selected batch filter.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FFF9FB] text-gray-700 font-bold sticky top-0 border-b border-gray-200 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Roll No</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Assigned Batch</th>
                          <th className="py-2.5 px-3">Contact</th>
                          <th className="py-2.5 px-3 text-right">Mobile Drive Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {displayedStudents.map((student, idx) => (
                          <tr key={`${student.student_id}-${student.batch_id || ''}-${idx}`} className="hover:bg-gray-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#8A064D]">
                              {student.roll_number}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-gray-900">
                              {student.full_name}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600 font-medium">
                              <span className="px-2 py-0.5 rounded-md bg-[#F3E8EE] text-[#8A064D] text-[10.5px] font-bold">
                                {student.batch_name}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                              {student.phone || '--'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DEF7EC] text-[#03543F] font-bold text-[10.5px]">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Drive Enabled</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>
                Total Students in view: <strong className="text-gray-900">{displayedStudents.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveCourse(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. PERFORMANCE VIDEO DETAILS MODAL (STUDENT SPECIFIC RECORDING)       */}
      {/* ===================================================================== */}
      {viewingPerformanceVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#D4AF37] text-[10.5px] font-bold border border-[#D4AF37]/30 uppercase tracking-wider inline-block mb-1">
                  Performance Recording Details
                </span>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#D4AF37]" />
                  <span>{viewingPerformanceVideo.student_name}</span>
                </h3>
                <p className="text-xs text-rose-100">
                  Monthly performance video submitted for student review & archiving
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPerformanceVideo(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Key Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Student Roll No</span>
                  <span className="text-xs font-mono font-bold text-[#8A064D] block mt-0.5">{viewingPerformanceVideo.roll_number}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Course</span>
                  <span className="text-xs font-bold text-gray-900 block mt-0.5 truncate">{viewingPerformanceVideo.course_title || selectedGuruForModal?.courses?.[0]?.title || 'Enrolled Course'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Batch</span>
                  <span className="text-xs font-bold text-gray-900 block mt-0.5 truncate">{viewingPerformanceVideo.batch_name}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#DEF7EC] border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#03543F] block">Status</span>
                  <span className="text-xs font-bold text-emerald-800 block mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Received</span>
                  </span>
                </div>
              </div>

              {/* Video Title & Date */}
              <div className="space-y-1 bg-white p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-bold text-gray-600 uppercase text-[10px] tracking-wider">Video Title</span>
                  {viewingPerformanceVideo.event_date && (
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                      <span>{new Date(viewingPerformanceVideo.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#2D041A]">
                  {viewingPerformanceVideo.video_title || 'Untitled Performance Video'}
                </h4>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  Description & Student Feedback
                </span>
                <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4] text-xs text-gray-700 leading-relaxed min-h-[60px]">
                  {viewingPerformanceVideo.description || 'No additional notes or description provided.'}
                </div>
              </div>

              {/* Media Links Card */}
              <div className="p-4 rounded-2xl border border-[#F0D5E4] bg-white space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block">
                  Shared Media Links
                </span>
                <div className="space-y-2.5">
                  {viewingPerformanceVideo.drive_url ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <LinkIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="font-mono text-gray-700 truncate">{viewingPerformanceVideo.drive_url}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(viewingPerformanceVideo.drive_url!, `modal-perf-drive`, 'Drive Link')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 transition cursor-pointer shadow-2xs"
                        >
                          {copiedId === `modal-perf-drive` ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={viewingPerformanceVideo.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-[#03543F] hover:bg-[#023e2f] text-white font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {viewingPerformanceVideo.youtube_url ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Video className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-mono text-gray-700 truncate">{viewingPerformanceVideo.youtube_url}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(viewingPerformanceVideo.youtube_url!, `modal-perf-yt`, 'YouTube Link')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 font-bold hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                        >
                          {copiedId === `modal-perf-yt` ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={viewingPerformanceVideo.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {!viewingPerformanceVideo.drive_url && !viewingPerformanceVideo.youtube_url && (
                    <p className="text-xs text-gray-500 italic">No media URLs attached to this entry.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingPerformanceVideo(null)}
                className="px-5 py-2 rounded-xl bg-[#590231] hover:bg-[#740340] text-white text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. GENERAL GURU VIDEO DETAILS MODAL                                   */}
      {/* ===================================================================== */}
      {viewingGeneralVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#D4AF37] text-[10.5px] font-bold border border-[#D4AF37]/30 uppercase tracking-wider inline-block mb-1">
                  General Video Details
                </span>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#D4AF37]" />
                  <span>{viewingGeneralVideo.title}</span>
                </h3>
                <p className="text-xs text-rose-100">
                  Shared by Faculty Guru for batch practice and reference
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingGeneralVideo(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Key Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Guru</span>
                  <span className="text-xs font-bold text-[#8A064D] block mt-0.5 truncate">
                    {stripGuruPrefix(viewingGeneralVideo.trainer_name || viewingGeneralVideo.created_by || 'Faculty Guru')}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Course</span>
                  <span className="text-xs font-bold text-gray-900 block mt-0.5 truncate">
                    {viewingGeneralVideo.target_course_title || 'General Course'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Batch</span>
                  <span className="text-xs font-bold text-gray-900 block mt-0.5 truncate">
                    {viewingGeneralVideo.target_batch_name || 'All Batches'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#DEF7EC] border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#03543F] block">Status</span>
                  <span className="text-xs font-bold text-emerald-800 block mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Shared</span>
                  </span>
                </div>
              </div>

              {/* Title & Date */}
              <div className="space-y-1 bg-white p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-bold text-gray-600 uppercase text-[10px] tracking-wider">Video Title</span>
                  {viewingGeneralVideo.event_date && (
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                      <span>{new Date(viewingGeneralVideo.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#2D041A]">
                  {viewingGeneralVideo.title}
                </h4>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  Description & Instructions
                </span>
                <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4] text-xs text-gray-700 leading-relaxed min-h-[60px]">
                  {viewingGeneralVideo.description || 'No description provided.'}
                </div>
              </div>

              {/* Media Links Card */}
              <div className="p-4 rounded-2xl border border-[#F0D5E4] bg-white space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block">
                  Shared Media Links
                </span>
                <div className="space-y-2.5">
                  {viewingGeneralVideo.drive_url ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <LinkIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="font-mono text-gray-700 truncate">{viewingGeneralVideo.drive_url}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(viewingGeneralVideo.drive_url!, `modal-gen-drive`, 'Drive Link')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 transition cursor-pointer shadow-2xs"
                        >
                          {copiedId === `modal-gen-drive` ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={viewingGeneralVideo.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-[#03543F] hover:bg-[#023e2f] text-white font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {viewingGeneralVideo.youtube_url ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Video className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-mono text-gray-700 truncate">{viewingGeneralVideo.youtube_url}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(viewingGeneralVideo.youtube_url!, `modal-gen-yt`, 'YouTube Link')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 font-bold hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                        >
                          {copiedId === `modal-gen-yt` ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={viewingGeneralVideo.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {!viewingGeneralVideo.drive_url && !viewingGeneralVideo.youtube_url && (
                    <p className="text-xs text-gray-500 italic">No media URLs attached to this entry.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingGeneralVideo(null)}
                className="px-5 py-2 rounded-xl bg-[#590231] hover:bg-[#740340] text-white text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. ALL VIDEOS (ADMIN BROADCAST) DETAILS MODAL                         */}
      {/* ===================================================================== */}
      {viewingAllVideoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#D4AF37] text-[10.5px] font-bold border border-[#D4AF37]/30 uppercase tracking-wider inline-block mb-1">
                  Universal Shared Link Details
                </span>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#D4AF37]" />
                  <span>{viewingAllVideoItem.title}</span>
                </h3>
                <p className="text-xs text-rose-100">
                  Admin distributed link record accessible across courses and batches
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAllVideoItem(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Key Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Date of Share</span>
                  <span className="text-xs font-bold text-gray-900 block mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>
                      {viewingAllVideoItem.event_date
                        ? new Date(viewingAllVideoItem.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Recent Shoot'}
                    </span>
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Target Course</span>
                  <span className="text-xs font-bold text-gray-900 block mt-0.5 truncate">
                    {viewingAllVideoItem.target_course_title || 'Universal Broadcast'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Target Batch</span>
                  <span className="text-xs font-bold text-gray-900 block mt-0.5 truncate">
                    {viewingAllVideoItem.target_batch_name || 'All Batches'}
                  </span>
                </div>
              </div>

              {/* Title Card */}
              <div className="space-y-1 bg-white p-4 rounded-2xl border border-gray-200">
                <span className="font-bold text-gray-600 uppercase text-[10px] tracking-wider block">
                  Event Shoot Title
                </span>
                <h4 className="text-sm sm:text-base font-bold text-[#2D041A]">
                  {viewingAllVideoItem.title}
                </h4>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  Description & Student Instructions
                </span>
                <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4] text-xs text-gray-700 leading-relaxed min-h-[60px]">
                  {viewingAllVideoItem.description || 'No description provided.'}
                </div>
              </div>

              {/* Media Links Card */}
              <div className="p-4 rounded-2xl border border-[#F0D5E4] bg-white space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block">
                  Shared Media Links
                </span>
                <div className="space-y-2.5">
                  {viewingAllVideoItem.drive_url ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <LinkIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="font-mono text-gray-700 truncate">{viewingAllVideoItem.drive_url}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(viewingAllVideoItem.drive_url!, `modal-all-drive`, 'Drive Link')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 transition cursor-pointer shadow-2xs"
                        >
                          {copiedId === `modal-all-drive` ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={viewingAllVideoItem.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-[#03543F] hover:bg-[#023e2f] text-white font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {viewingAllVideoItem.youtube_url ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Video className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-mono text-gray-700 truncate">{viewingAllVideoItem.youtube_url}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(viewingAllVideoItem.youtube_url!, `modal-all-yt`, 'YouTube Link')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 font-bold hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                        >
                          {copiedId === `modal-all-yt` ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={viewingAllVideoItem.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {!viewingAllVideoItem.drive_url && !viewingAllVideoItem.youtube_url && (
                    <p className="text-xs text-gray-500 italic">No media URLs attached to this entry.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer with Edit, Delete, Close */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = viewingAllVideoItem;
                    setViewingAllVideoItem(null);
                    handleOpenEditItem(item);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#FFF2F8] hover:bg-[#8A064D] text-[#8A064D] hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-[#F0D5E4] cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingAllVideoItem.id;
                      setViewingAllVideoItem(null);
                      handleDeleteItem(id);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200 cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingAllVideoItem(null)}
                className="px-5 py-2 rounded-xl bg-[#590231] hover:bg-[#740340] text-white text-xs font-bold transition cursor-pointer shadow-2xs"
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

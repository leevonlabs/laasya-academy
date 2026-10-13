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
import {
  CourseWithDetails,
  VideoLibraryItem,
  EnrolledStudent,
  GuruComplianceItem,
  GuruComplianceSummary,
  GuruComplianceDisciple,
} from '@/lib/videoLibrary';

interface Props {
  initialCourses: CourseWithDetails[];
  initialItems: VideoLibraryItem[];
  initialCompliance?: {
    month: string;
    year: string;
    summary: GuruComplianceSummary;
    gurus: GuruComplianceItem[];
  };
}

export default function VideoLibraryClient({ initialCourses, initialItems, initialCompliance }: Props) {

  const [courses, setCourses] = useState<CourseWithDetails[]>(initialCourses);
  const [items, setItems] = useState<VideoLibraryItem[]>(initialItems);

  // Top Tab Switcher: 'course_wise' (default) vs 'all_videos' vs 'guru_share'
  const [activeTab, setActiveTab] = useState<'course_wise' | 'all_videos' | 'guru_share'>('course_wise');

  // Dedicated Course Page View state (when clicked from Course-Wise)
  const [selectedCourseSubpage, setSelectedCourseSubpage] = useState<CourseWithDetails | null>(null);

  // Subpage Share Form State
  const [subpageShareTitle, setSubpageShareTitle] = useState('');
  const [subpageShareDriveUrl, setSubpageShareDriveUrl] = useState('');
  const [subpageShareYoutubeUrl, setSubpageShareYoutubeUrl] = useState('');
  const [subpageShareDate, setSubpageShareDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subpageShareDesc, setSubpageShareDesc] = useState('');
  const [subpageTargetBatch, setSubpageTargetBatch] = useState<'all' | string>('all');
  const [isSubmittingSubpageShare, setIsSubmittingSubpageShare] = useState(false);

  // Subpage Previous Shared Links Filters (Month, Year, Search)
  const [subpageSearch, setSubpageSearch] = useState('');
  const [subpageMonthFilter, setSubpageMonthFilter] = useState('all');
  const [subpageYearFilter, setSubpageYearFilter] = useState('all');

  // All Videos Tab Filters
  const [allVideosSearch, setAllVideosSearch] = useState('');
  const [allVideosMonthFilter, setAllVideosMonthFilter] = useState('all');
  const [allVideosYearFilter, setAllVideosYearFilter] = useState('all');

  // Guru Share Tab Filters
  const [guruShareSearch, setGuruShareSearch] = useState('');
  const [guruShareTrainerFilter, setGuruShareTrainerFilter] = useState('all');
  const [guruShareCourseFilter, setGuruShareCourseFilter] = useState('all');
  const [guruShareMonthFilter, setGuruShareMonthFilter] = useState('all');
  const [guruShareYearFilter, setGuruShareYearFilter] = useState('all');

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
  const [guruModalActiveTab, setGuruModalActiveTab] = useState<'received' | 'missing' | 'all_videos'>('received');
  const [complianceStatusFilter, setComplianceStatusFilter] = useState<'all' | 'needs_attention' | 'completed' | 'no_students'>('all');
  const [complianceSearch, setComplianceSearch] = useState('');
  const [guruShareViewMode, setGuruShareViewMode] = useState<'compliance_grid' | 'media_archive'>('compliance_grid');

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

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
      const matchSearch =
        courseSearch === '' ||
        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.batches.some(b => b.trainer_name?.toLowerCase().includes(courseSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [courses, selectedCategory, courseSearch]);

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

  // Available Years dynamically gathered from event items
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.event_date) {
        const y = new Date(i.event_date).getFullYear().toString();
        if (y && !isNaN(parseInt(y, 10))) set.add(y);
      }
    });
    set.add(new Date().getFullYear().toString());
    return ['all', ...Array.from(set).sort((a, b) => b.localeCompare(a))];
  }, [items]);

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

      // Month filter
      if (subpageMonthFilter !== 'all' && item.event_date) {
        const m = (new Date(item.event_date).getMonth() + 1).toString();
        if (m !== subpageMonthFilter) return false;
      }

      // Year filter
      if (subpageYearFilter !== 'all' && item.event_date) {
        const y = new Date(item.event_date).getFullYear().toString();
        if (y !== subpageYearFilter) return false;
      }

      return true;
    });
  }, [items, selectedCourseSubpage, subpageSearch, subpageMonthFilter, subpageYearFilter]);

  // All Videos Tab Filtered Items
  const allVideosFilteredItems = useMemo(() => {
    return items.filter(item => {
      if (allVideosSearch.trim()) {
        const q = allVideosSearch.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCourse = item.target_course_title?.toLowerCase().includes(q);
        const matchBatch = item.target_batch_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCourse && !matchBatch) return false;
      }

      if (allVideosMonthFilter !== 'all' && item.event_date) {
        const m = (new Date(item.event_date).getMonth() + 1).toString();
        if (m !== allVideosMonthFilter) return false;
      }

      if (allVideosYearFilter !== 'all' && item.event_date) {
        const y = new Date(item.event_date).getFullYear().toString();
        if (y !== allVideosYearFilter) return false;
      }

      return true;
    });
  }, [items, allVideosSearch, allVideosMonthFilter, allVideosYearFilter]);

  // Distinct Gurus who have shared links
  const guruNames = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if ((i.shared_by_type === 'guru' || i.category === 'guru_share') && i.trainer_name) {
        set.add(i.trainer_name);
      }
    });
    return Array.from(set).sort();
  }, [items]);

  // All Guru Shared items
  const guruSharedItems = useMemo(() => {
    return items.filter(i => i.shared_by_type === 'guru' || i.category === 'guru_share' || Boolean(i.trainer_id));
  }, [items]);

  // Filtered Guru Shared items
  const guruFilteredItems = useMemo(() => {
    return guruSharedItems.filter(item => {
      if (guruShareTrainerFilter !== 'all' && item.trainer_name !== guruShareTrainerFilter) {
        return false;
      }
      if (guruShareCourseFilter !== 'all' && item.target_course_id !== guruShareCourseFilter && item.target_course_title !== guruShareCourseFilter) {
        return false;
      }
      if (guruShareMonthFilter !== 'all' && item.event_date) {
        const m = (new Date(item.event_date).getMonth() + 1).toString();
        if (m !== guruShareMonthFilter) return false;
      }
      if (guruShareYearFilter !== 'all' && item.event_date) {
        const y = new Date(item.event_date).getFullYear().toString();
        if (y !== guruShareYearFilter) return false;
      }
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
  }, [guruSharedItems, guruShareTrainerFilter, guruShareCourseFilter, guruShareMonthFilter, guruShareYearFilter, guruShareSearch]);

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


  // Handle Subpage Share Link Submit
  const handleSubpageShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseSubpage) return;
    if (!subpageShareTitle.trim()) {
      alert('Please provide the Event Title.');
      return;
    }
    if (!subpageShareDriveUrl.trim() && !subpageShareYoutubeUrl.trim()) {
      alert('Please provide at least a Google Drive link or YouTube link.');
      return;
    }

    setIsSubmittingSubpageShare(true);
    try {
      const isBatchSpecific = subpageTargetBatch !== 'all';
      const selectedBatch = isBatchSpecific
        ? selectedCourseSubpage.batches.find(b => b.id === subpageTargetBatch)
        : null;

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
          target_batch_id: selectedBatch ? selectedBatch.id : null,
          target_batch_name: selectedBatch ? selectedBatch.name : 'All Batches',
          access_level: selectedBatch ? 'Batch' : 'Course',
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
      showToast(`Event link shared with ${selectedBatch ? selectedBatch.name : 'All Batches'}!`);
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

    setIsSubmittingCourseShare(true);
    try {
      const isBatchSpecific = targetBatchOption !== 'all';
      const selectedBatch = isBatchSpecific
        ? activeCourse.batches.find(b => b.id === targetBatchOption)
        : null;

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
          target_batch_id: selectedBatch ? selectedBatch.id : null,
          target_batch_name: selectedBatch ? selectedBatch.name : 'All Batches',
          access_level: selectedBatch ? 'Batch' : 'Course',
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
      showToast(`Event link shared to ${activeCourse.title}!`);
    } catch (err: any) {
      alert(err.message || 'Error sharing folder');
    } finally {
      setIsSubmittingCourseShare(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
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
              Share Google Drive event shoot folders directly with participating disciples across courses and batches. Disciples receive real-time access on their mobile profile.
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
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'course_wise'
                  ? 'bg-[#2D041A] text-[#F9E33A]'
                  : 'bg-white/20 text-white'
              }`}>
                {courses.length} Courses
              </span>
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
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'all_videos'
                  ? 'bg-[#2D041A] text-[#F9E33A]'
                  : 'bg-white/20 text-white'
              }`}>
                {items.length} Links
              </span>
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
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'guru_share'
                  ? 'bg-[#2D041A] text-[#F9E33A]'
                  : 'bg-white/20 text-white'
              }`}>
                {guruSharedItems.length} Shared
              </span>
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
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FFF2F8] text-[#8A064D] border border-rose-200">
                  {selectedCourseSubpage.category}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {selectedCourseSubpage.batches.length} Batches • {selectedCourseSubpage.student_count} Enrolled
                </span>
              </div>
            </div>

            {/* Course Header Banner */}
            <div className="bg-gradient-to-r from-[#590231] via-[#740340] to-[#8A064D] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#D4AF37]/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#F9E33A] font-mono text-xs font-bold border border-[#D4AF37]/30 uppercase tracking-wider">
                  Course Subpage • {selectedCourseSubpage.category || 'Classical Discipline'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                  {selectedCourseSubpage.title}
                </h2>
                <p className="text-xs sm:text-sm text-rose-100/90 max-w-xl leading-relaxed">
                  Guru: <strong>{selectedCourseSubpage.batches[0]?.trainer_name || 'Assigned Faculty Master'}</strong> • Hall: {selectedCourseSubpage.batches[0]?.room || 'Mandapam'}
                </p>
              </div>

              <div className="flex items-center gap-3 z-10 shrink-0">
                <div className="bg-black/25 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-200 block">Course Shared Links</span>
                  <span className="text-xl font-black text-[#F9E33A] mt-0.5 block">{subpageFilteredItems.length}</span>
                </div>
              </div>
            </div>

            {/* CARD 1: SHARE DRIVE LINK FORM FOR THIS COURSE */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0D5E4] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-base text-[#2D041A] flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-[#8A064D]" />
                    <span>Share Event Google Drive Link</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select a batch or all batches in this course, enter link, and distribute instantly.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubpageShareSubmit} className="space-y-4">
                {/* 1. Target Batch Selector */}
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-2">
                    Select Target Batch <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSubpageTargetBatch('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        subpageTargetBatch === 'all'
                          ? 'bg-[#590231] text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Batches in Course ({selectedCourseSubpage.student_count} Disciples)</span>
                    </button>

                    {selectedCourseSubpage.batches.map((b, idx) => {
                      const isSelected = subpageTargetBatch === b.id;
                      return (
                        <button
                          key={`subpage-batch-${b.id}-${idx}`}
                          type="button"
                          onClick={() => setSubpageTargetBatch(b.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#8A064D] text-white shadow-xs'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <span>{b.name}</span>
                          <span className="text-[10px] opacity-75 font-normal">({b.trainer_name || 'Guru'})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Event Title & Shoot Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                      Event Shoot Title / Session Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Navaratri Recital 2026 - Mandapam Showcase"
                      value={subpageShareTitle}
                      onChange={e => setSubpageShareTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#8A064D]/30 focus:border-[#8A064D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                      Event Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={subpageShareDate}
                      onChange={e => setSubpageShareDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#8A064D]/30 focus:border-[#8A064D]"
                    />
                  </div>
                </div>

                {/* 3. Media Links: Google Drive & YouTube */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>Google Drive Link</span>
                      <span className="text-[10px] text-gray-400 font-normal">Optional if YouTube is provided</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={subpageShareDriveUrl}
                      onChange={e => setSubpageShareDriveUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-mono font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#8A064D]/30 focus:border-[#8A064D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-rose-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>YouTube Video Link</span>
                      <span className="text-[10px] text-gray-400 font-normal">Optional if Drive is provided</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                      value={subpageShareYoutubeUrl}
                      onChange={e => setSubpageShareYoutubeUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/30 text-xs font-mono font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600"
                    />
                  </div>
                </div>

                {/* 4. Instructions / Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                      Event Description / Instructions <span className="text-[11px] font-normal text-gray-400 capitalize">(Optional)</span>
                    </label>
                    <AiEnhanceButton
                      value={subpageShareDesc}
                      onEnhance={(val) => setSubpageShareDesc(val)}
                      context="classical arts choreography video description and practice instructions"
                      size="xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Masterclass choreography recordings, costume trial videos, high-res photos"
                    value={subpageShareDesc}
                    onChange={e => setSubpageShareDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#8A064D]/30 focus:border-[#8A064D]"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingSubpageShare}
                    className="px-6 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#70043E] active:scale-95 text-white font-bold text-xs shadow-md disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingSubpageShare ? (
                      <span>Distributing Drive Link...</span>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-[#F9E33A]" />
                        <span>Share Drive Link with Selected Batch(es)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

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
                  <select
                    value={subpageMonthFilter}
                    onChange={e => setSubpageMonthFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-bold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-[#8A064D]/20 cursor-pointer"
                  >
                    {MONTHS.map(m => (
                      <option key={`month-${m.value}`} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  {/* Year Filter */}
                  <select
                    value={subpageYearFilter}
                    onChange={e => setSubpageYearFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-bold text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-[#8A064D]/20 cursor-pointer"
                  >
                    <option value="all">All Years</option>
                    {availableYears.filter(y => y !== 'all').map(y => (
                      <option key={`year-${y}`} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>

                  {/* Reset Filters button */}
                  {(subpageSearch || subpageMonthFilter !== 'all' || subpageYearFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubpageSearch('');
                        setSubpageMonthFilter('all');
                        setSubpageYearFilter('all');
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

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete shared link"
                              className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat, idx) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={`cat-pill-${cat}-${idx}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-[#590231] text-white shadow-sm font-bold'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
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
                  <p className="text-xs text-gray-500 mt-1">Try clearing filters or search keywords</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredCourses.map((course, idx) => {
                    const primaryTrainer = course.batches[0]?.trainer_name || 'Assigned Guru';
                    return (
                      <div
                        key={`course-card-${course.id}-${idx}`}
                        onClick={() => {
                          setSelectedCourseSubpage(course);
                          setSubpageTargetBatch('all');
                          setSubpageSearch('');
                          setSubpageMonthFilter('all');
                          setSubpageYearFilter('all');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group bg-white rounded-2xl overflow-hidden border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                      >
                        {/* Course Image Banner */}
                        <div className="relative h-36 w-full bg-gray-100 overflow-hidden">
                          {course.image_url ? (
                            <img
                              src={course.image_url}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#FFF2F8] text-[#8A064D]">
                              <BookOpen className="w-12 h-12 opacity-40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          
                          {/* Category Tag */}
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#590231]/90 backdrop-blur-md text-white text-[10.5px] font-bold tracking-wide">
                            {course.category}
                          </span>

                          {/* Shared Folders Badge */}
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#03543F]/90 backdrop-blur-md text-emerald-200 text-[10.5px] font-bold flex items-center gap-1 border border-emerald-400/30">
                            <Video className="w-3 h-3 text-emerald-300" />
                            <span>{course.folder_count} Shared</span>
                          </span>

                          {/* Course Title on Banner */}
                          <div className="absolute bottom-2.5 left-3 right-3 text-white">
                            <h3 className="font-bold text-base leading-tight drop-shadow-sm group-hover:text-[#D4AF37] transition-colors">
                              {course.title}
                            </h3>
                            <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                              Guru: {primaryTrainer}
                            </p>
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
                              <span className="text-[10px] text-gray-500 block font-medium">Disciples</span>
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
                  <span>All Active Event Media Folders ({allVideosFilteredItems.length})</span>
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

                <select
                  value={allVideosMonthFilter}
                  onChange={e => setAllVideosMonthFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-bold text-gray-700 cursor-pointer"
                >
                  {MONTHS.map(m => (
                    <option key={`all-month-${m.value}`} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <select
                  value={allVideosYearFilter}
                  onChange={e => setAllVideosYearFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-bold text-gray-700 cursor-pointer"
                >
                  <option value="all">All Years</option>
                  {availableYears.filter(y => y !== 'all').map(y => (
                    <option key={`all-year-${y}`} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {allVideosFilteredItems.map((item, idx) => {
                  const formattedDate = item.event_date
                    ? new Date(item.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Recent Shoot';

                  return (
                    <div
                      key={`all-items-${item.id}-${idx}`}
                      className="bg-white rounded-3xl p-5 border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Top Badges & Actions */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DEF7EC] text-[#03543F] border border-emerald-200">
                              EVENT MEDIA
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-[#FFF2F8] text-[#8A064D] border border-rose-100">
                              {item.access_level === 'All Students'
                                ? 'All 18 Courses'
                                : item.target_course_title || 'Universal Shoot'}
                            </span>
                            {item.target_batch_name && item.target_batch_name !== 'All Batches' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                                {item.target_batch_name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {formattedDate}
                            </span>
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              title="Edit Link Info"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#8A064D] hover:bg-[#FFF2F8] transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete Link"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-base text-[#2D041A] leading-snug pt-1">
                          {item.title}
                        </h4>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-gray-600 bg-[#FFF9FB] p-2.5 rounded-xl border border-[#F0D5E4]/60 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Interactive Media Links Deck */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        {item.drive_url && (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <LinkIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] font-bold text-emerald-900 block truncate">Google Drive Media Folder</span>
                                <span className="text-[10px] text-emerald-700 font-mono truncate block max-w-xs">{item.drive_url}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.drive_url!, `${item.id}-drive`, 'Drive Link')}
                                className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-[11px] font-bold hover:bg-emerald-50 transition cursor-pointer shadow-2xs"
                              >
                                {copiedId === `${item.id}-drive` ? 'Copied' : 'Copy'}
                              </button>
                              <a
                                href={item.drive_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-[#03543F] hover:bg-[#023e2f] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <span>Open Drive</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        {item.youtube_url && (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Video className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] font-bold text-rose-950 block truncate">YouTube Recording Broadcast</span>
                                <span className="text-[10px] text-rose-700 font-mono truncate block max-w-xs">{item.youtube_url}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.youtube_url!, `${item.id}-yt`, 'YouTube Link')}
                                className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-[11px] font-bold hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                              >
                                {copiedId === `${item.id}-yt` ? 'Copied' : 'Copy'}
                              </button>
                              <a
                                href={item.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <span>Open YouTube</span>
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
        /* ===================================================================== */
        /* TAB 3: GURU SHARE & MONTHLY PERFORMANCE VIDEO TRACKING HUB           */
        /* ===================================================================== */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-r from-[#2D041A] via-[#590231] to-[#8A064D] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#D4AF37]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#F9E33A] font-mono text-xs font-bold border border-[#D4AF37]/30 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-[#F9E33A]" />
                Faculty Disciples Audit • Monthly Performance Videos
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                Guru Performance Video Tracking & Hub
              </h2>
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
                Faculty Gurus must share at least 1 performance video link (Google Drive / YouTube) for every disciple per month. Track compliance across all Gurus, identify missing disciples, and view video recordings.
              </p>
            </div>

            {/* Audit Period & View Toggle Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 shrink-0">
              {/* Month Picker */}
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/15 px-3 py-2 rounded-2xl">
                <Calendar className="w-4 h-4 text-[#F9E33A] shrink-0" />
                <div className="flex items-center gap-1.5">
                  <select
                    value={complianceMonth}
                    onChange={(e) => {
                      const newM = e.target.value;
                      setComplianceMonth(newM);
                      fetchComplianceData(newM, complianceYear);
                    }}
                    className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
                  >
                    {MONTHS.map((m) => (
                      <option key={`audit-month-${m.value}`} value={m.value} className="text-gray-900 bg-white">
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={complianceYear}
                    onChange={(e) => {
                      const newY = e.target.value;
                      setComplianceYear(newY);
                      fetchComplianceData(complianceMonth, newY);
                    }}
                    className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="all" className="text-gray-900 bg-white">All Years</option>
                    {availableYears.filter((y) => y !== 'all').map((y) => (
                      <option key={`audit-year-${y}`} value={y} className="text-gray-900 bg-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View Switcher: Compliance Directory vs Media Archive */}
              <div className="flex p-1 bg-black/30 backdrop-blur-md rounded-2xl border border-white/15">
                <button
                  type="button"
                  onClick={() => setGuruShareViewMode('compliance_grid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    guruShareViewMode === 'compliance_grid'
                      ? 'bg-[#D4AF37] text-[#4A0025] shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>All Gurus ({complianceData.gurus.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuruShareViewMode('media_archive')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    guruShareViewMode === 'media_archive'
                      ? 'bg-[#D4AF37] text-[#4A0025] shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Media Archive ({guruSharedItems.length})</span>
                </button>
              </div>
            </div>
          </div>

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

            {/* Card 2: Total Disciples */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0D5E4] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enrolled Disciples</span>
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

            {/* Card 4: Missing Disciples */}
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
                  {complianceData.summary.total_missing === 0 ? 'All Disciples Completed!' : 'Pending Performance Videos'}
                </span>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: ALL GURUS COMPLIANCE DIRECTORY */}
          {guruShareViewMode === 'compliance_grid' ? (
            <div className="space-y-4">
              {/* Filter Pills & Search Bar */}
              <div className="bg-white rounded-2xl p-4 border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Guru name, course, batch, or disciple..."
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
                                  <span>Guru {guru.full_name}</span>
                                </h4>
                                <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                  {guru.display_title || (guru.specializations.length > 0 ? guru.specializations.join(', ') : 'Faculty Guru')}
                                </p>
                              </div>
                            </div>

                            {/* Compliance Badge */}
                            {noStudents ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 shrink-0">
                                No Disciples
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
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#590231] hover:bg-[#740340] active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-4 h-4 text-[#D4AF37]" />
                          <span>Audit Disciples & Video Links</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE 2: SHARED RESOURCE MEDIA ARCHIVE */
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0D5E4] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#8A064D]" />
                    <span>Shared Resource Archive ({guruFilteredItems.length})</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Filter by Guru, enrolled course, or search resource titles
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search guru links..."
                      value={guruShareSearch}
                      onChange={(e) => setGuruShareSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-[#FFF9FB] focus:outline-hidden focus:ring-1 focus:ring-[#8A064D]"
                    />
                    {guruShareSearch && (
                      <button
                        onClick={() => setGuruShareSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <select
                    value={guruShareTrainerFilter}
                    onChange={(e) => setGuruShareTrainerFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="all">All Gurus ({guruNames.length})</option>
                    {guruNames.map((name) => (
                      <option key={`guru-filter-${name}`} value={name}>
                        Guru {name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={guruShareCourseFilter}
                    onChange={(e) => setGuruShareCourseFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-bold text-gray-700 cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="all">All Courses</option>
                    {courses.map((c) => (
                      <option key={`guru-course-${c.id}`} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {guruFilteredItems.length === 0 ? (
                <div className="p-12 text-center bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">No resources shared by Gurus yet</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    When faculty Gurus share video or Google Drive links with their enrolled batches via the Guru mobile app, all links will automatically be cataloged and manageable here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {guruFilteredItems.map((item, idx) => {
                    const formattedDate = item.event_date
                      ? new Date(item.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Recent Share';
                    const guruInitials = (item.trainer_name || 'G').charAt(0).toUpperCase();

                    return (
                      <div
                        key={`guru-item-${item.id}-${idx}`}
                        className="bg-white rounded-3xl p-5 border border-[#F0D5E4] hover:border-[#8A064D] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                {guruInitials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-[#2D041A] truncate">
                                    Guru {item.trainer_name || 'Faculty Member'}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase border border-emerald-200">
                                    Verified
                                  </span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  {formattedDate}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                title="Edit Link Info"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#8A064D] hover:bg-[#FFF2F8] transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                title="Remove Link (Admin Moderation)"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-[#FFF2F8] text-[#8A064D] border border-rose-100">
                              {item.target_course_title || 'Enrolled Course'}
                            </span>
                            {item.target_batch_name && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                                {item.target_batch_name}
                              </span>
                            )}
                            {item.target_student_names && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-xs truncate" title={item.target_student_names}>
                                Disciples: {item.target_student_names}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-base text-[#2D041A] leading-snug">
                            {item.title}
                          </h4>

                          {item.description && (
                            <p className="text-xs text-gray-600 bg-[#FFF9FB] p-2.5 rounded-xl border border-[#F0D5E4]/60 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Interactive Media Links Deck */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          {item.drive_url && (
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <LinkIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[11px] font-bold text-emerald-900 block truncate">Google Drive Media Folder</span>
                                  <span className="text-[10px] text-emerald-700 font-mono truncate block max-w-xs">{item.drive_url}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.drive_url!, `${item.id}-drive`, 'Drive Link')}
                                  className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-[11px] font-bold hover:bg-emerald-50 transition cursor-pointer shadow-2xs"
                                >
                                  {copiedId === `${item.id}-drive` ? 'Copied' : 'Copy'}
                                </button>
                                <a
                                  href={item.drive_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-[#03543F] hover:bg-[#023e2f] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                  <span>Open Drive</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}

                          {item.youtube_url && (
                            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <Video className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[11px] font-bold text-rose-950 block truncate">YouTube Recording Broadcast</span>
                                  <span className="text-[10px] text-rose-700 font-mono truncate block max-w-xs">{item.youtube_url}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.youtube_url!, `${item.id}-yt`, 'YouTube Link')}
                                  className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-[11px] font-bold hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                                >
                                  {copiedId === `${item.id}-yt` ? 'Copied' : 'Copy'}
                                </button>
                                <a
                                  href={item.youtube_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                  <span>Open YouTube</span>
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
          )}

          {/* =================================================================== */}
          {/* GURU PERFORMANCE INSPECTOR MODAL                                   */}
          {/* =================================================================== */}
          {selectedGuruForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {selectedGuruForModal.avatar_url ? (
                      <img
                        src={selectedGuruForModal.avatar_url}
                        alt={selectedGuruForModal.full_name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-[#D4AF37] shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-[#F9E33A] flex items-center justify-center font-bold text-base border border-white/30">
                        {selectedGuruForModal.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-white">
                          Guru {selectedGuruForModal.full_name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F9E33A] text-[#4A0025]">
                          {complianceMonth !== 'all' ? MONTHS.find((m) => m.value === complianceMonth)?.label : 'All Months'} {complianceYear} Audit
                        </span>
                      </div>
                      <p className="text-xs text-rose-100 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>{selectedGuruForModal.display_title || 'Faculty Guru'}</span>
                        {selectedGuruForModal.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-[#D4AF37]" />
                            {selectedGuruForModal.phone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedGuruForModal(null)}
                    className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Subheader & Tab Switcher */}
                <div className="px-6 py-3 bg-[#FFF9FB] border-b border-[#F0D5E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setGuruModalActiveTab('received')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        guruModalActiveTab === 'received'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Received Videos ({selectedGuruForModal.received_count})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGuruModalActiveTab('missing')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        guruModalActiveTab === 'missing'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Missing Disciples ({selectedGuruForModal.missing_count})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGuruModalActiveTab('all_videos')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        guruModalActiveTab === 'all_videos'
                          ? 'bg-[#590231] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>All Media ({selectedGuruForModal.shared_videos_count})</span>
                    </button>
                  </div>

                  <div className="text-xs font-bold text-gray-700">
                    Compliance: <span className={selectedGuruForModal.compliance_status === 'completed' ? 'text-emerald-700' : 'text-[#8A064D]'}>
                      {selectedGuruForModal.received_count} / {selectedGuruForModal.total_students} ({selectedGuruForModal.compliance_rate}%)
                    </span>
                  </div>
                </div>

                {/* Modal Tab Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* TAB A: RECEIVED VIDEOS */}
                  {guruModalActiveTab === 'received' && (
                    <div className="space-y-4">
                      {selectedGuruForModal.received_disciples.length === 0 ? (
                        <div className="p-8 text-center bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                          <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-gray-700">No performance videos received yet for this month</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Disciples will appear here once Guru {selectedGuruForModal.full_name} shares their monthly performance recordings.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedGuruForModal.received_disciples.map((disciple, idx) => (
                            <div
                              key={`received-disciple-${disciple.student_id}-${idx}`}
                              className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs hover:border-emerald-400 transition space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h5 className="font-bold text-sm text-[#2D041A]">
                                      {disciple.student_name}
                                    </h5>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium mt-0.5">
                                      <span className="font-mono font-bold text-gray-700">{disciple.roll_number}</span>
                                      <span>•</span>
                                      <span>{disciple.batch_name}</span>
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#DEF7EC] text-[#03543F]">
                                    Received
                                  </span>
                                </div>

                                {/* Video Info Card */}
                                <div className="p-2.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4]/60 space-y-1">
                                  <div className="text-xs font-bold text-gray-900 truncate">
                                    {disciple.video_title}
                                  </div>
                                  {disciple.event_date && (
                                    <div className="text-[10.5px] text-gray-500 flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-gray-400" />
                                      <span>
                                        {new Date(disciple.event_date).toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {disciple.description && (
                                    <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
                                      {disciple.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Clickable Action Links */}
                              <div className="pt-2 border-t border-gray-100 space-y-2">
                                {disciple.drive_url && (
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                                    <span className="text-[11px] font-bold text-emerald-900 truncate">
                                      Google Drive Link
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(disciple.drive_url!, `${disciple.student_id}-gd`, 'Drive Link')}
                                        className="px-2 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-[10.5px] font-bold hover:bg-emerald-50 transition cursor-pointer"
                                      >
                                        {copiedId === `${disciple.student_id}-gd` ? 'Copied' : 'Copy'}
                                      </button>
                                      <a
                                        href={disciple.drive_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded-lg bg-[#03543F] hover:bg-[#023e2f] text-white text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>Open</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {disciple.youtube_url && (
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-50 border border-rose-200">
                                    <span className="text-[11px] font-bold text-rose-950 truncate">
                                      YouTube Video Link
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(disciple.youtube_url!, `${disciple.student_id}-yt`, 'YouTube Link')}
                                        className="px-2 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 text-[10.5px] font-bold hover:bg-rose-50 transition cursor-pointer"
                                      >
                                        {copiedId === `${disciple.student_id}-yt` ? 'Copied' : 'Copy'}
                                      </button>
                                      <a
                                        href={disciple.youtube_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>Open</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB B: MISSING DISCIPLES */}
                  {guruModalActiveTab === 'missing' && (
                    <div className="space-y-4">
                      {selectedGuruForModal.missing_disciples.length === 0 ? (
                        <div className="p-8 text-center bg-emerald-50/60 rounded-2xl border border-emerald-200">
                          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-emerald-900">
                            All Disciples Completed!
                          </h4>
                          <p className="text-xs text-emerald-700 mt-1">
                            Guru {selectedGuruForModal.full_name} has shared a monthly performance video for every assigned disciple in this period.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <p className="text-xs text-rose-900 font-medium">
                              <strong>{selectedGuruForModal.missing_disciples.length} disciples</strong> are currently missing their monthly performance video link. Follow up with Guru {selectedGuruForModal.full_name} to ensure every disciple receives their performance video.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {selectedGuruForModal.missing_disciples.map((disciple, idx) => (
                              <div
                                key={`missing-disciple-${disciple.student_id}-${idx}`}
                                className="p-4 bg-white rounded-2xl border border-rose-200 hover:border-rose-400 transition shadow-2xs space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h5 className="font-bold text-sm text-[#2D041A]">
                                      {disciple.student_name}
                                    </h5>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium mt-0.5">
                                      <span className="font-mono font-bold text-gray-700">{disciple.roll_number}</span>
                                      <span>•</span>
                                      <span>{disciple.batch_name}</span>
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-100 text-rose-800">
                                    Missing Video
                                  </span>
                                </div>

                                <div className="text-xs text-gray-600 bg-[#FFF9FB] p-2.5 rounded-xl border border-[#F0D5E4]/60 space-y-1">
                                  <div className="text-[11px] text-gray-500">
                                    Course: <strong className="text-gray-800 font-bold">{disciple.course_title}</strong>
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex items-center justify-between">
                                    <span>Parent: <strong className="text-gray-800 font-semibold">{disciple.parent_name || 'Parent'}</strong></span>
                                    {disciple.parent_phone && (
                                      <a
                                        href={`tel:${disciple.parent_phone}`}
                                        className="text-[#8A064D] hover:underline font-mono font-bold text-[10.5px] flex items-center gap-1"
                                      >
                                        <Phone className="w-3 h-3" />
                                        <span>{disciple.parent_phone}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB C: ALL SHARED VIDEOS BY THIS GURU */}
                  {guruModalActiveTab === 'all_videos' && (
                    <div className="space-y-4">
                      {selectedGuruForModal.shared_videos.length === 0 ? (
                        <div className="p-8 text-center bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                          <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-gray-700">No media links recorded yet</h4>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedGuruForModal.shared_videos.map((vid, idx) => (
                            <div
                              key={`guru-modal-vid-${vid.id}-${idx}`}
                              className="p-4 bg-white rounded-2xl border border-[#F0D5E4] shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-bold text-sm text-[#2D041A]">{vid.title}</h5>
                                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                    <span className="font-semibold text-[#8A064D]">{vid.target_course_title}</span>
                                    <span>•</span>
                                    <span>{vid.target_batch_name}</span>
                                  </div>
                                </div>
                                {vid.event_date && (
                                  <span className="text-[11px] text-gray-400 font-medium">
                                    {new Date(vid.event_date).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>

                              {vid.description && (
                                <p className="text-xs text-gray-600 bg-[#FFF9FB] p-2 rounded-xl border border-[#F0D5E4]/60">
                                  {vid.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                                {vid.drive_url && (
                                  <a
                                    href={vid.drive_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-[#03543F] hover:bg-[#023e2f] text-white text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    <span>Open Google Drive</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {vid.youtube_url && (
                                  <a
                                    href={vid.youtube_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Open YouTube</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
                Provide either a Google Drive folder link, a YouTube link, or both. Disciples will see the corresponding platforms directly in their mobile app.
              </p>

              {/* Event Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Sharing Category
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-[#DEF7EC] text-[#03543F] font-bold text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Event Folder (Universal Shoot)</span>
                  </div>
                </div>
              </div>

              {/* Description / Instructions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Description / Instructions for Disciples
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
                  Update link titles, URLs, shoot date, and disciple instructions
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
                    Description / Instructions for Disciples
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
                    {activeCourse.batches.length} Batches • {activeCourse.student_count} Enrolled Disciples
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold">{activeCourse.title}</h3>
                <p className="text-xs text-rose-100 max-w-xl">
                  Guru: {activeCourse.batches[0]?.trainer_name || 'Assigned Guru'} • Room: {activeCourse.batches[0]?.room || 'Mandapam'}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Target Batch Selector */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Target Participants
                        </label>
                        <select
                          value={targetBatchOption}
                          onChange={e => setTargetBatchOption(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 font-semibold"
                        >
                          <option value="all">Everyone in this Course (All Batches - {courseStudents.length} students)</option>
                          {activeCourse.batches.map(b => (
                            <option key={b.id} value={b.id}>
                              Only {b.name} ({b.trainer_name || 'Guru'})
                            </option>
                          ))}
                        </select>
                      </div>

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
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                        />
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
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete link"
                              className="text-gray-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                      <span>Enrolled Disciples in {activeCourse.title}</span>
                    </h4>
                    <p className="text-xs text-gray-500">
                      Disciples who automatically receive Drive link access in their mobile app
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
                Total Disciples in view: <strong className="text-gray-900">{displayedStudents.length}</strong>
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
    </div>
  );
}

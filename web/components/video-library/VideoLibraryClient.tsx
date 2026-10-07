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
  RotateCcw
} from 'lucide-react';
import { CourseWithDetails, VideoLibraryItem, EnrolledStudent } from '@/lib/videoLibrary';

interface Props {
  initialCourses: CourseWithDetails[];
  initialItems: VideoLibraryItem[];
}

export default function VideoLibraryClient({ initialCourses, initialItems }: Props) {
  const [courses, setCourses] = useState<CourseWithDetails[]>(initialCourses);
  const [items, setItems] = useState<VideoLibraryItem[]>(initialItems);

  // Top Tab Switcher: 'course_wise' (default) vs 'all_videos'
  const [activeTab, setActiveTab] = useState<'course_wise' | 'all_videos'>('course_wise');

  // Dedicated Course Page View state (when clicked from Course-Wise)
  const [selectedCourseSubpage, setSelectedCourseSubpage] = useState<CourseWithDetails | null>(null);

  // Subpage Share Form State
  const [subpageShareTitle, setSubpageShareTitle] = useState('');
  const [subpageShareDriveUrl, setSubpageShareDriveUrl] = useState('');
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

  // Search & Filter state for courses grid
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Universal Share Modal State
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState(false);
  const [universalTitle, setUniversalTitle] = useState('');
  const [universalDriveUrl, setUniversalDriveUrl] = useState('');
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
  const [courseShareDate, setCourseShareDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [courseShareDesc, setCourseShareDesc] = useState('');
  const [targetBatchOption, setTargetBatchOption] = useState<'all' | string>('all');
  const [isSubmittingCourseShare, setIsSubmittingCourseShare] = useState(false);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Google Drive link copied to clipboard!');
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

  // Handle Subpage Share Link Submit
  const handleSubpageShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseSubpage) return;
    if (!subpageShareTitle.trim() || !subpageShareDriveUrl.trim()) {
      alert('Please provide both the Event Title and Google Drive folder link.');
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
          drive_url: subpageShareDriveUrl.trim(),
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
      setSubpageShareDesc('');
      showToast(`Event Drive link shared with ${selectedBatch ? selectedBatch.name : 'All Batches'}!`);
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
    if (!universalTitle.trim() || !universalDriveUrl.trim()) {
      alert('Please provide both the Event Title and Google Drive folder link.');
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
          drive_url: universalDriveUrl.trim(),
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
      setUniversalDesc('');
      showToast(`Event Drive link successfully shared with ${selectedCourseIds.length} courses!`);
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
    if (!courseShareTitle.trim() || !courseShareDriveUrl.trim()) {
      alert('Please provide both the Event Title and Google Drive folder link.');
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
          drive_url: courseShareDriveUrl.trim(),
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
      setCourseShareDesc('');
      showToast(`Event Drive folder shared to ${activeCourse.title}!`);
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
          </div>

          <div className="text-xs text-rose-100/90 font-medium hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>
              {activeTab === 'course_wise' 
                ? (selectedCourseSubpage ? `Managing: ${selectedCourseSubpage.title}` : 'Select a course to share & view links')
                : 'Universal broadcast history & all drive folders'}
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

                {/* 3. Google Drive Folder Link */}
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Google Drive Folder Link (URL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={subpageShareDriveUrl}
                    onChange={e => setSubpageShareDriveUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-mono font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#8A064D]/30 focus:border-[#8A064D]"
                  />
                </div>

                {/* 4. Instructions / Description */}
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Event Description / Instructions <span className="text-[11px] font-normal text-gray-400 capitalize">(Optional)</span>
                  </label>
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

                        {/* Two simple buttons: Copy Drive Link & Open in Google Drive */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.drive_url, item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#8A064D] text-gray-700 hover:text-[#8A064D] text-xs font-bold bg-white transition shadow-2xs cursor-pointer active:scale-95"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-gray-500" />
                                <span>Copy Drive Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={item.drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#590231] hover:bg-[#740340] text-white text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95"
                          >
                            <span>Open in Google Drive</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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
      ) : (
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
                Share a single event Google Drive folder across all or multiple selected courses at once.
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
                  <span>All Active Event Drive Folders ({allVideosFilteredItems.length})</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete history of event folders shared across academy disciplines
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
                <p className="text-sm font-bold text-gray-700">No event drive folders match criteria</p>
                <p className="text-xs text-gray-500 mt-1">
                  Use the Universal Share button or switch to Course-Wise to share new links.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {allVideosFilteredItems.map((item, idx) => {
                  const formattedDate = item.event_date
                    ? new Date(item.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Recent Shoot';

                  return (
                    <div
                      key={`all-items-${item.id}-${idx}`}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FFF9FB] px-3 rounded-xl transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#DEF7EC] text-[#03543F]">
                            EVENT FOLDER
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-gray-100 text-gray-600">
                            {item.access_level === 'All Students'
                              ? 'All 18 Courses'
                              : item.target_course_title || 'Universal Shoot'}
                          </span>
                          {item.target_batch_name && item.target_batch_name !== 'All Batches' && (
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#F3E8EE] text-[#8A064D]">
                              Batch: {item.target_batch_name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">• {formattedDate}</span>
                        </div>

                        <h4 className="font-bold text-sm md:text-base text-gray-900">{item.title}</h4>

                        {item.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 max-w-3xl">{item.description}</p>
                        )}

                        <div className="flex items-center gap-2 pt-1 text-xs text-[#8A064D]">
                          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono text-[11px] truncate max-w-md text-gray-500">
                            {item.drive_url}
                          </span>
                        </div>
                      </div>

                      {/* Actions: Copy & Open */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyToClipboard(item.drive_url, item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#8A064D] text-gray-700 hover:text-[#8A064D] text-xs font-semibold bg-white transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={item.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#590231] hover:bg-[#740340] text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                          <span>Open Drive</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          title="Remove Event Folder"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {/* 5. UNIVERSAL SHARE MODAL (SELECT MULTIPLE OR ALL COURSES) */}
      {/* ===================================================================== */}
      {isUniversalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#F0D5E4] overflow-hidden">
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

              {/* Google Drive URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Google Drive Folder Link <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={universalDriveUrl}
                    onChange={e => setUniversalDriveUrl(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900 font-mono text-xs"
                  />
                  <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Ensure the Drive folder link sharing permission is set to &quot;Anyone with the link can view&quot;.
                </p>
              </div>

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
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description / Instructions for Disciples
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Contains multi-cam 4K stage recordings, individual solo clips, and high-res photo gallery."
                  value={universalDesc}
                  onChange={e => setUniversalDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
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
                  disabled={isSubmittingUniversal || selectedCourseIds.length === 0}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Google Drive Link */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Google Drive Folder Link <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={courseShareDriveUrl}
                          onChange={e => setCourseShareDriveUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                        />
                      </div>

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
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Instructions / Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Stage rehearsals, masterclass footages, and group photo album."
                        value={courseShareDesc}
                        onChange={e => setCourseShareDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] text-gray-900"
                      />
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
                        disabled={isSubmittingCourseShare}
                        className="px-4 py-1.5 rounded-lg bg-[#590231] hover:bg-[#740340] text-white font-bold text-xs shadow-xs disabled:opacity-50"
                      >
                        {isSubmittingCourseShare ? 'Saving...' : 'Share Event Folder'}
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
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            title="Delete link"
                            className="text-gray-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-gray-600 line-clamp-1">{item.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
                          <button
                            onClick={() => copyToClipboard(item.drive_url, item.id)}
                            className="text-[#8A064D] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedId === item.id ? 'Copied!' : 'Copy Drive Link'}</span>
                          </button>
                          <a
                            href={item.drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
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

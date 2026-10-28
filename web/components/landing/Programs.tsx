'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  X,
  Search,
  MapPin,
  
  Clock,
  IndianRupee,
  BookOpen,
  Info,
  Check,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';
import { useEnquiry } from './EnquiryContext';

export interface BatchItem {
  id: string;
  name: string;
  code?: string;
  course_id: string;
  course_title: string;
  trainer_id?: string;
  trainer_name?: string;
  days_of_week: string[] | string;
  start_time?: string;
  end_time?: string;
  room_or_hall?: string;
  description?: string;
  monthly_fee?: string | number;
  max_capacity?: number;
  enrolled_count?: number;
  is_active?: boolean;
}

export interface CourseItem {
  id: string;
  title: string;
  code: string;
  category: string;
  description: string;
  monthly_fee?: string | number;
  is_active?: boolean;
  batch_count?: number;
  image_url?: string;
}

interface ProgramsProps {
  initialCourses?: CourseItem[];
  initialBatches?: BatchItem[];
}

// EXACT MATCH with Admin Login default course images for 100% visual parity
const DEFAULT_COURSE_IMAGES: Record<string, string> = {
  'Bharathanatyam': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
  'Kuchupudi': 'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?auto=format&fit=crop&w=800&q=80',
  'Mohiniyatam': 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
  'Semi Classical': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'Western Dance': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80',
  'Zumba': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  'Gymnastic': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
  'Carnatic Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'Violin': 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=800&q=80',
  'Keyboard': 'https://images.unsplash.com/photo-1520523839898-50712140e698?auto=format&fit=crop&w=800&q=80',
  'Guitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  'Ukulele': 'https://images.unsplash.com/photo-1568219656418-15c329312bf1?auto=format&fit=crop&w=800&q=80',
  'Drawing': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'Art and Craft': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
  'Kalari': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  'Karatte': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
  'Yoga': 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
  'Chess': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
};

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'Classical Dance': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
  'Modern Dance & Fitness': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80',
  'Vocal & Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'Musical Instruments': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  'Martial Arts': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
  'Fine Arts': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'Mind Sports': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
};

function getCourseImage(course: CourseItem): string {
  // 1. If admin uploaded an image in admin login, ALWAYS use that first!
  if (course.image_url && course.image_url.trim()) {
    return course.image_url.trim();
  }

  // 2. Exact course title match with admin default images
  if (DEFAULT_COURSE_IMAGES[course.title]) {
    return DEFAULT_COURSE_IMAGES[course.title];
  }

  // 3. Category match from admin default images
  if (course.category && CATEGORY_DEFAULT_IMAGES[course.category]) {
    return CATEGORY_DEFAULT_IMAGES[course.category];
  }

  // 4. Fallback search by title substring
  const title = (course.title || '').toLowerCase();
  for (const [key, url] of Object.entries(DEFAULT_COURSE_IMAGES)) {
    if (title.includes(key.toLowerCase())) return url;
  }

  return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';
}

function normalizeDayName(d: string): string {
  const lower = d.toLowerCase().trim();
  if (lower.startsWith('mon')) return 'Monday';
  if (lower.startsWith('tue')) return 'Tuesday';
  if (lower.startsWith('wed')) return 'Wednesday';
  if (lower.startsWith('thu')) return 'Thursday';
  if (lower.startsWith('fri')) return 'Friday';
  if (lower.startsWith('sat')) return 'Saturday';
  if (lower.startsWith('sun')) return 'Sunday';
  return d;
}

function format12h(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.trim().split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const paddedHrs = hours < 10 ? `0${hours}` : `${hours}`;
    return `${paddedHrs}:${minutes} ${ampm}`;
  }
  return timeStr;
}

function formatTiming(startTime?: string, endTime?: string): string {
  if (!startTime && !endTime) return 'Regular Scheduled Slot';
  const s = format12h(startTime);
  const e = format12h(endTime);
  if (s && e) return `${s} – ${e}`;
  return s || e || 'Regular Scheduled Slot';
}

interface ScheduleRow {
  day: string;
  timing: string;
  room: string;
}

function parseBatchScheduleRows(batch: BatchItem): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  const room = batch.room_or_hall || 'Academy Studio (Kannamangala)';

  if (batch.days_of_week) {
    let days: string[] = [];
    if (Array.isArray(batch.days_of_week)) {
      days = batch.days_of_week;
    } else if (typeof batch.days_of_week === 'string') {
      const raw = batch.days_of_week.replace(/,/g, ' ').trim();
      days = raw.split(/\s+/).filter(Boolean);
    }

    const timingStr = formatTiming(batch.start_time, batch.end_time);

    days.forEach((d) => {
      rows.push({
        day: normalizeDayName(d),
        timing: timingStr,
        room: room,
      });
    });
  }

  if (rows.length === 0) {
    rows.push({
      day: 'Flexible Days (Weekdays / Weekend)',
      timing: formatTiming(batch.start_time, batch.end_time),
      room: room,
    });
  }

  return rows;
}

export function Programs({ initialCourses, initialBatches }: ProgramsProps) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses || []);
  const [batches, setBatches] = useState<BatchItem[]>(initialBatches || []);
  const [tab, setTab] = useState<string>('All Programs');
  const [search, setSearch] = useState('');

  // Course modal state
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // Detailed batch modal state
  const [detailedBatch, setDetailedBatch] = useState<BatchItem | null>(null);

  // Enquiry Context integration
  let selectedBatchesList: any[] = [];
  let isBatchSelected = (_id: string) => false;
  let toggleBatchSelection = (_b: any) => {};
  let openEnquiryModal = () => {};

  try {
    const enquiry = useEnquiry();
    selectedBatchesList = enquiry.selectedBatches;
    isBatchSelected = enquiry.isBatchSelected;
    toggleBatchSelection = enquiry.toggleBatchSelection;
    openEnquiryModal = enquiry.openEnquiryModal;
  } catch (_) {}

  useEffect(() => {
    if (!initialCourses || initialCourses.length === 0) {
      fetch('/api/courses')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCourses(data);
        })
        .catch(() => {});
    }
    if (!initialBatches || initialBatches.length === 0) {
      fetch('/api/batches')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setBatches(data);
        })
        .catch(() => {});
    }
  }, [initialCourses, initialBatches]);

  // Extract all distinct categories dynamically from admin login
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.category && c.category.trim()) {
        set.add(c.category.trim());
      }
    });
    return ['All Programs', ...Array.from(set).sort()];
  }, [courses]);

  // Map batches to each course
  const courseBatchesMap = useMemo(() => {
    const map = new Map<string, BatchItem[]>();
    courses.forEach((c) => map.set(c.id, []));

    batches.forEach((b) => {
      let matchedCourseId = b.course_id;
      if (!matchedCourseId || !map.has(matchedCourseId)) {
        const found = courses.find(
          (c) => c.title.toLowerCase().trim() === (b.course_title || '').toLowerCase().trim()
        );
        if (found) matchedCourseId = found.id;
      }
      if (matchedCourseId && map.has(matchedCourseId)) {
        map.get(matchedCourseId)!.push(b);
      }
    });
    return map;
  }, [courses, batches]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const categoryMatch = tab === 'All Programs' || c.category === tab;
      const courseBatches = courseBatchesMap.get(c.id) || [];
      const searchLower = search.toLowerCase().trim();

      const searchMatch =
        !searchLower ||
        c.title.toLowerCase().includes(searchLower) ||
        (c.description && c.description.toLowerCase().includes(searchLower)) ||
        (c.category && c.category.toLowerCase().includes(searchLower)) ||
        courseBatches.some(
          (b) =>
            b.name.toLowerCase().includes(searchLower) ||
            (b.trainer_name && b.trainer_name.toLowerCase().includes(searchLower)) ||
            (b.room_or_hall && b.room_or_hall.toLowerCase().includes(searchLower))
        );

      return categoryMatch && searchMatch;
    });
  }, [courses, tab, search, courseBatchesMap]);

  const activeSelectedBatches = selectedCourse
    ? courseBatchesMap.get(selectedCourse.id) || []
    : [];

  return (
    <section id="programs" className="scroll-mt-20 py-8 sm:py-20 lg:py-24 bg-[#FAF5F7]">
      {/* Utilized full container width (max-w-[1650px]) */}
      <div className="mx-auto max-w-[1650px] px-3 sm:px-8 lg:px-12 xl:px-16">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[0.65rem] sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#8A064D]">
              Our Programs · Academy Curriculum
            </p>
            <h2 className="mt-1.5 sm:mt-3 font-display text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#220314]">
              Curated Courses &amp; Available Batches
            </h2>
            <p className="mt-2 sm:mt-4 text-xs sm:text-base text-[#6E3955]">
              Explore classical dance, vocal &amp; instrumental music, visual arts,
              karate, yoga, and chess directly from our academy roster.
            </p>
          </div>
        </Reveal>

        {/* Search Bar */}
        <Reveal delay={100}>
          <div className="mx-auto mt-6 sm:mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E3955]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses, martial arts, instruments, batches..."
                className="w-full rounded-full border border-[#D4BAC7] bg-white py-2.5 sm:py-3 pl-11 pr-5 text-xs sm:text-sm text-[#220314] shadow-sm placeholder:text-[#6E3955]/70 focus:border-[#8A064D] focus:outline-none focus:ring-2 focus:ring-[#8A064D]/30"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6E3955] hover:text-[#220314]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* Course Categories from Admin Login (Mobile Horizontal Scrollable Chips) */}
        <Reveal delay={150}>
          <div className="mt-6 sm:mt-8 flex overflow-x-auto sm:flex-wrap justify-start sm:justify-center gap-2 pb-2 sm:pb-0 no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTab(cat)}
                className={cn(
                  'shrink-0 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap',
                  tab === cat
                    ? 'bg-gold-gradient text-[#220314] shadow-gold'
                    : 'border border-[#D4BAC7] bg-white text-[#6E3955] hover:border-[#8A064D]/50 hover:text-[#220314]'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-5 text-center text-xs font-semibold text-[#6E3955]">
          Showing <span className="font-bold text-[#220314]">{filteredCourses.length}</span> course
          {filteredCourses.length === 1 ? '' : 's'}
        </div>

        {/* 2 GRIDS IN EACH ROW ON MOBILE, 3-4 on Tablet/Desktop */}
        <div className="mt-6 sm:mt-10 grid gap-2.5 sm:gap-6 xl:gap-7 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredCourses.map((course, i) => {
            const courseBatches = courseBatchesMap.get(course.id) || [];
            const imageSrc = getCourseImage(course);

            return (
              <Reveal key={course.id} delay={(i % 4) * 60}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white shadow-warm transition-transform hover:-translate-y-1.5">
                  {/* Uniform Aspect Ratio Container */}
                  <div className="relative aspect-[16/11] sm:aspect-[16/10] w-full overflow-hidden bg-[#FAF5F7]">
                    <img
                      src={imageSrc}
                      alt={course.title}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 sm:left-3.5 sm:top-3.5 rounded-full bg-[#3d0c34]/90 px-1.5 py-0.5 sm:px-3 sm:py-1 text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-wider text-[#fbf0b9] backdrop-blur-sm shadow truncate max-w-[85%]">
                      {course.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-2.5 sm:p-5 sm:pt-4">
                    {/* Course Title and Batch Count */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                      <h3 className="font-display text-xs sm:text-xl font-bold text-[#220314] leading-tight line-clamp-1 sm:line-clamp-2">
                        {course.title}
                      </h3>
                      <span className="self-start shrink-0 rounded-full bg-[#8A064D]/10 px-1.5 py-0.5 text-[0.55rem] sm:text-xs font-bold text-[#8A064D] whitespace-nowrap">
                        {courseBatches.length > 0
                          ? `${courseBatches.length} Batch${courseBatches.length > 1 ? 'es' : ''}`
                          : 'Open'}
                      </span>
                    </div>

                    <p className="mt-1 text-[0.65rem] sm:text-sm leading-relaxed text-[#59424F] line-clamp-2 sm:line-clamp-3">
                      {course.description ||
                        'Comprehensive training designed for beginners, intermediate learners, and advanced disciples.'}
                    </p>

                    {/* Monthly Fee Indicator */}
                    {course.monthly_fee && (
                      <p className="mt-1 sm:mt-2 text-[0.62rem] sm:text-xs font-bold text-[#8A064D]">
                        From ₹{course.monthly_fee}/mo
                      </p>
                    )}

                    {/* View Batches Action */}
                    <div className="mt-auto pt-2 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse(course);
                          setDetailedBatch(null);
                        }}
                        className="flex w-full items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-full bg-stage-gradient px-2 sm:px-4 py-1.5 sm:py-2.5 text-[0.65rem] sm:text-xs font-semibold text-white shadow-warm transition-transform hover:scale-[1.02] cursor-pointer"
                      >
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                        <span className="truncate">
                          {courseBatches.length > 0
                            ? `Batches (${courseBatches.length})`
                            : 'Inquire'}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="my-16 text-center">
            <p className="text-lg font-semibold text-[#220314]">
              No courses found matching "{search}"
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setTab('All Programs');
              }}
              className="mt-3 text-sm font-medium text-[#8A064D] underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Redesigned Batches Modal Dialog (Warm Landing Palette, Highlighted View Details) */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-in fade-in"
          onClick={() => {
            setSelectedCourse(null);
            setDetailedBatch(null);
          }}
        >
          <div
            className="relative max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#FAF2F6] via-[#FDF8FA] to-[#F5EBF1] p-5 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedCourse(null);
                setDetailedBatch(null);
              }}
              className="absolute right-4 top-4 sm:right-6 sm:top-6 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#EBD6E3] text-[#220314] hover:bg-[#8A064D] hover:text-white cursor-pointer transition-colors shadow-sm"
              aria-label="Close batches dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="pr-10">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="rounded-full bg-[#8A064D]/15 border border-[#8A064D]/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#8A064D]">
                  {selectedCourse.category}
                </span>
                <span className="text-xs font-semibold text-[#6E3955]">
                  · Total Batches: <span className="font-bold text-[#220314]">{activeSelectedBatches.length}</span>
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#220314]">
                {selectedCourse.title} · Batches
              </h3>
            </div>

            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#59424F] max-w-4xl">
              {selectedCourse.description ||
                'Join structured classes mentored by certified gurus at Laasya Cultural Academy. Select batches below to send an admission enquiry directly to our WhatsApp desk.'}
            </p>

            {/* Batch List Section */}
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A064D]">
                  Available Batch Rosters ({activeSelectedBatches.length})
                </h4>
                <span className="text-[0.75rem] text-[#6E3955]">
                  Select batches to include in your admission enquiry
                </span>
              </div>

              {activeSelectedBatches.length > 0 ? (
                /* Grid display: 3 columns on desktop, 1-2 on mobile */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSelectedBatches.map((batch) => {
                    const selected = isBatchSelected(batch.id);
                    const feeDisplay = batch.monthly_fee || selectedCourse.monthly_fee;

                    return (
                      <div
                        key={batch.id}
                        className={cn(
                          'flex flex-col justify-between rounded-2xl p-4 sm:p-5 transition-all shadow-sm',
                          selected
                            ? 'border-2 border-[#8A064D] bg-[#F1D7E6] shadow-md ring-2 ring-[#8A064D]/25'
                            : 'border border-[#DFC8D7] bg-[#FFF6FB] hover:border-[#8A064D]/60 hover:bg-[#FCEEF6] hover:shadow-md'
                        )}
                      >
                        <div>
                          {/* Batch Name & Code */}
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-display text-lg font-bold text-[#220314]">
                              {batch.name}
                            </h5>
                            {batch.code && (
                              <span className="rounded bg-[#E7D0DF] px-2 py-0.5 text-[0.65rem] font-bold text-[#8A064D]">
                                {batch.code}
                              </span>
                            )}
                          </div>

                          {/* Course Name */}
                          <p className="mt-1 text-xs font-medium text-[#6E3955]">
                            Course:{' '}
                            <span className="font-semibold text-[#220314]">
                              {batch.course_title || selectedCourse.title}
                            </span>
                          </p>

                          {/* Guru Assigned */}
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#8A064D]">
                            <Users className="h-4 w-4 shrink-0" />
                            <span className="font-semibold truncate">
                              Guru: {batch.trainer_name || 'Faculty Mentor'}
                            </span>
                          </div>

                          {/* Monthly Fee */}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#220314]">
                            <IndianRupee className="h-3.5 w-3.5 text-[#8A064D] shrink-0" />
                            <span className="font-bold">
                              {feeDisplay ? `₹${feeDisplay} / Month` : 'Academy Standard'}
                            </span>
                          </div>
                        </div>

                        {/* Actions Row: Select Button + HIGHLIGHTED View Details Button */}
                        <div className="mt-5 pt-3 border-t border-[#DEC4D4] flex items-center justify-between gap-2.5">
                          {/* Select for enquiry */}
                          <button
                            type="button"
                            onClick={() =>
                              toggleBatchSelection({
                                id: batch.id,
                                name: batch.name,
                                courseTitle: batch.course_title || selectedCourse.title,
                                trainerName: batch.trainer_name,
                                monthlyFee: feeDisplay,
                                days: batch.days_of_week,
                                room: batch.room_or_hall,
                              })
                            }
                            className={cn(
                              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                              selected
                                ? 'bg-[#8A064D] text-white shadow-sm'
                                : 'border border-[#8A064D] text-[#8A064D] hover:bg-[#8A064D] hover:text-white'
                            )}
                          >
                            {selected ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Select</span>
                              </>
                            )}
                          </button>

                          {/* HIGHLIGHTED VIEW DETAILS BUTTON (Gold Gradient + Shadow) */}
                          <button
                            type="button"
                            onClick={() => setDetailedBatch(batch)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-xs font-extrabold text-[#220314] shadow-gold hover:scale-[1.04] active:scale-[0.98] transition-all cursor-pointer ring-1 ring-[#D4AF37]/60 shrink-0"
                          >
                            <Info className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DFC8D7] bg-[#FFF8FB] p-8 text-center text-sm text-[#6E3955]">
                  <Calendar className="mx-auto h-7 w-7 text-[#8A064D] mb-2" />
                  <p className="font-semibold text-[#220314]">
                    Batches are forming for {selectedCourse.title}
                  </p>
                  <p className="mt-1 text-xs">
                    Please get in touch to reserve your preferred schedule and slots.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Modal Actions */}
            <div className="mt-8 rounded-2xl border border-[#D4AF37]/50 bg-[#F5E6EF] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-bold text-[#220314] text-xs sm:text-sm">
                  {selectedBatchesList.length > 0 ? (
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      {selectedBatchesList.length} Batch{selectedBatchesList.length > 1 ? 'es' : ''} Selected in Your Enquiry Roster
                    </span>
                  ) : (
                    `Ready to start learning ${selectedCourse.title}?`
                  )}
                </p>
                <p className="text-[0.7rem] sm:text-xs text-[#6E3955] mt-0.5">
                  Select your batches and submit your details to WhatsApp desk (+91 8151 998 899).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourse(null);
                    openEnquiryModal();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold text-[#220314] shadow-gold hover:scale-[1.03] transition-transform cursor-pointer"
                >
                  <span>Send Enquiry Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Batch Sub-Modal with Tabular Schedule (Day & Timings of that Day in a Table) */}
      {detailedBatch && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in zoom-in-95"
          onClick={() => setDetailedBatch(null)}
        >
          <div
            className="relative max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-3xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#FAF2F6] via-[#FDF8FA] to-[#F5EBF1] p-5 sm:p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setDetailedBatch(null)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EBD6E3] text-[#220314] hover:bg-[#8A064D] hover:text-white cursor-pointer transition-colors shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 pr-8">
              <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-stage-gradient text-white shadow-warm shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div>
                <span className="rounded-full bg-[#8A064D]/15 border border-[#8A064D]/30 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase text-[#8A064D]">
                  Active Batch Schedule
                </span>
                <h4 className="font-display text-xl sm:text-2xl font-bold text-[#220314] mt-1">
                  {detailedBatch.name}
                </h4>
                <p className="text-xs font-semibold text-[#8A064D]">
                  {detailedBatch.course_title || (selectedCourse ? selectedCourse.title : '')}
                </p>
              </div>
            </div>

            {/* All Details Displayed Here */}
            <div className="mt-5 space-y-4 text-xs text-[#220314]">
              {/* Guru & Fee Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-[#FFF6FB] p-3 border border-[#DFC8D7]">
                  <Users className="h-4 w-4 text-[#8A064D] shrink-0" />
                  <div>
                    <span className="text-[0.65rem] uppercase font-bold text-[#6E3955] block">
                      Guru Assigned
                    </span>
                    <span className="font-bold text-sm text-[#220314]">
                      {detailedBatch.trainer_name || 'Faculty Master'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-[#FFF6FB] p-3 border border-[#DFC8D7]">
                  <IndianRupee className="h-4 w-4 text-[#8A064D] shrink-0" />
                  <div>
                    <span className="text-[0.65rem] uppercase font-bold text-[#6E3955] block">
                      Monthly Tuition Fee
                    </span>
                    <span className="font-bold text-sm text-[#8A064D]">
                      {detailedBatch.monthly_fee || (selectedCourse && selectedCourse.monthly_fee)
                        ? `₹${detailedBatch.monthly_fee || selectedCourse?.monthly_fee} / Month`
                        : 'Academy Standard Fee'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TABULAR FORM FOR SCHEDULE: Mention Day & Timings of that particular day */}
              <div className="rounded-2xl border border-[#DFC8D7] overflow-hidden bg-[#FFF6FB] shadow-sm">
                <div className="bg-[#3d0c34] px-4 py-2.5 text-white flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#fbf0b9] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Day-Wise Class Timings Table
                  </span>
                  <span className="text-[0.7rem] text-white/80">
                    Live Roster
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[340px]">
                    <thead>
                      <tr className="border-b border-[#DFC8D7] bg-[#F5E6EF] text-[#8A064D] font-bold">
                        <th className="py-2.5 px-3.5">Schedule Day</th>
                        <th className="py-2.5 px-3.5">Class Timings</th>
                        <th className="py-2.5 px-3.5">Studio / Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAD6E2]">
                      {parseBatchScheduleRows(detailedBatch).map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F2DEEC] transition-colors">
                          <td className="py-3 px-3.5 font-bold text-[#220314]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[#8A064D]" />
                              <span>{row.day}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 font-bold text-[#8A064D]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-[#8A064D]" />
                              <span>{row.timing}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-[#59424F]">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-[#8A064D]" />
                              <span className="truncate">{row.room}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="rounded-xl bg-[#FFF6FB] p-3.5 border border-[#DFC8D7]">
                <span className="text-[0.65rem] uppercase font-bold text-[#6E3955] block mb-1">
                  Detailed Batch Curriculum &amp; Pedagogy
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-[#59424F]">
                  {detailedBatch.description ||
                    'Comprehensive practical and theory training conducted under the direct supervision of certified master faculty. Focuses on foundational shastras, tala, mudras, stage presence, and regular assessments.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-[#DFC8D7]">
              <button
                type="button"
                onClick={() => {
                  toggleBatchSelection({
                    id: detailedBatch.id,
                    name: detailedBatch.name,
                    courseTitle: detailedBatch.course_title || (selectedCourse ? selectedCourse.title : ''),
                    trainerName: detailedBatch.trainer_name,
                    monthlyFee: detailedBatch.monthly_fee || (selectedCourse ? selectedCourse.monthly_fee : undefined),
                    days: detailedBatch.days_of_week,
                    room: detailedBatch.room_or_hall,
                  });
                }}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 px-4 text-xs font-bold transition-all cursor-pointer',
                  isBatchSelected(detailedBatch.id)
                    ? 'bg-[#8A064D] text-white shadow-sm'
                    : 'border border-[#8A064D] text-[#8A064D] hover:bg-[#8A064D] hover:text-white'
                )}
              >
                {isBatchSelected(detailedBatch.id) ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Included in Enquiry</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add to Admission Enquiry</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isBatchSelected(detailedBatch.id)) {
                    toggleBatchSelection({
                      id: detailedBatch.id,
                      name: detailedBatch.name,
                      courseTitle: detailedBatch.course_title || (selectedCourse ? selectedCourse.title : ''),
                      trainerName: detailedBatch.trainer_name,
                      monthlyFee: detailedBatch.monthly_fee || (selectedCourse ? selectedCourse.monthly_fee : undefined),
                      days: detailedBatch.days_of_week,
                      room: detailedBatch.room_or_hall,
                    });
                  }
                  setDetailedBatch(null);
                  setSelectedCourse(null);
                  openEnquiryModal();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold text-[#220314] shadow-gold hover:scale-[1.03] transition-transform cursor-pointer"
              >
                <span>Proceed to Enquiry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

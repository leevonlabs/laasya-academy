'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Download, 
DoorOpen, 
  User, 
  Layers,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Batch } from '@/lib/academy';

interface Props {
  onBack?: () => void;
  batches?: Batch[];
  tallyClasses?: any[];
  showBackLink?: boolean;
}

interface TimetableSlot {
  course: string;
  batch: string;
  trainer: string;
  asterisk?: boolean;
  isRescheduled?: boolean;
  room?: string;
}

const COURSES_THEME: Record<string, {
  label: string;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
}> = {
  'BHARATANATYAM': {
    label: 'BHARATANATYAM',
    bg: 'bg-[#FCE7F3]',
    border: 'border-[#FBCFE8]',
    text: 'text-[#9D174D]',
    badgeBg: 'bg-[#FDF2F8]'
  },
  'KUCHIPUDI': {
    label: 'KUCHIPUDI',
    bg: 'bg-[#F3E8FF]',
    border: 'border-[#E9D5FF]',
    text: 'text-[#7E22CE]',
    badgeBg: 'bg-[#FAF5FF]'
  },
  'KUCHUPUDI': {
    label: 'KUCHUPUDI',
    bg: 'bg-[#F3E8FF]',
    border: 'border-[#E9D5FF]',
    text: 'text-[#7E22CE]',
    badgeBg: 'bg-[#FAF5FF]'
  },
  'MOHINIYATTAM': {
    label: 'MOHINIYATTAM',
    bg: 'bg-[#F5F3FF]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#6D28D9]',
    badgeBg: 'bg-[#FAF5FF]'
  },
  'MOHINIYATAM': {
    label: 'MOHINIYATAM',
    bg: 'bg-[#F5F3FF]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#6D28D9]',
    badgeBg: 'bg-[#FAF5FF]'
  },
  'SEMI CLASSICAL': {
    label: 'SEMI CLASSICAL',
    bg: 'bg-[#FFF1F2]',
    border: 'border-[#FECDD3]',
    text: 'text-[#BE123C]',
    badgeBg: 'bg-[#FFF5F5]'
  },
  'INSTRUMENT CLASSES': {
    label: 'INSTRUMENTS',
    bg: 'bg-[#E0F2FE]',
    border: 'border-[#BAE6FD]',
    text: 'text-[#0369A1]',
    badgeBg: 'bg-[#F0F9FF]'
  },
  'CARNATIC MUSIC': {
    label: 'CARNATIC MUSIC',
    bg: 'bg-[#FEF3C7]',
    border: 'border-[#FDE68A]',
    text: 'text-[#B45309]',
    badgeBg: 'bg-[#FFFBEB]'
  },
  'HINDUSTANI CLASSICAL VOCAL': {
    label: 'HINDUSTANI MUSIC',
    bg: 'bg-[#FEF3C7]',
    border: 'border-[#FDE68A]',
    text: 'text-[#92400E]',
    badgeBg: 'bg-[#FFFBEB]'
  },
  'KEYBOARD': {
    label: 'KEYBOARD',
    bg: 'bg-[#E0F2FE]',
    border: 'border-[#BAE6FD]',
    text: 'text-[#0284C7]',
    badgeBg: 'bg-[#F0F9FF]'
  },
  'GUITAR': {
    label: 'GUITAR',
    bg: 'bg-[#E0E7FF]',
    border: 'border-[#C7D2FE]',
    text: 'text-[#4338CA]',
    badgeBg: 'bg-[#EEF2FF]'
  },
  'VIOLIN': {
    label: 'VIOLIN',
    bg: 'bg-[#CFFAFE]',
    border: 'border-[#A5F3FC]',
    text: 'text-[#0E7490]',
    badgeBg: 'bg-[#ECFEFF]'
  },
  'UKULELE': {
    label: 'UKULELE',
    bg: 'bg-[#D1FAE5]',
    border: 'border-[#A7F3D0]',
    text: 'text-[#047857]',
    badgeBg: 'bg-[#ECFDF5]'
  },
  'DRAWING': {
    label: 'DRAWING',
    bg: 'bg-[#DCFCE7]',
    border: 'border-[#BBF7D0]',
    text: 'text-[#15803D]',
    badgeBg: 'bg-[#F0FDF4]'
  },
  'ART AND CRAFT': {
    label: 'ART & CRAFT',
    bg: 'bg-[#DCFCE7]',
    border: 'border-[#BBF7D0]',
    text: 'text-[#15803D]',
    badgeBg: 'bg-[#F0FDF4]'
  },
  'CHESS': {
    label: 'CHESS',
    bg: 'bg-[#F1F5F9]',
    border: 'border-[#CBD5E1]',
    text: 'text-[#334155]',
    badgeBg: 'bg-[#F8FAFC]'
  },
  'WESTERN DANCE': {
    label: 'WESTERN DANCE',
    bg: 'bg-[#EDE9FE]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#6D28D9]',
    badgeBg: 'bg-[#F5F3FF]'
  },
  'KALARIPAYATTU': {
    label: 'KALARIPAYATTU',
    bg: 'bg-[#FFEDD5]',
    border: 'border-[#FED7AA]',
    text: 'text-[#C2410C]',
    badgeBg: 'bg-[#FFF7ED]'
  },
  'KARATE': {
    label: 'KARATE',
    bg: 'bg-[#CCFBF1]',
    border: 'border-[#99F6E4]',
    text: 'text-[#0F766E]',
    badgeBg: 'bg-[#F0FDFA]'
  },
  'YOGA': {
    label: 'YOGA',
    bg: 'bg-[#FEF9C3]',
    border: 'border-[#FEF08A]',
    text: 'text-[#A16207]',
    badgeBg: 'bg-[#FEFCE8]'
  },
  'GYMNASTIC': {
    label: 'GYMNASTICS',
    bg: 'bg-[#FEE2E2]',
    border: 'border-[#FECACA]',
    text: 'text-[#B91C1C]',
    badgeBg: 'bg-[#FEF2F2]'
  },
  'ZUMBA': {
    label: 'ZUMBA',
    bg: 'bg-[#FDF2F8]',
    border: 'border-[#FBCFE8]',
    text: 'text-[#BE185D]',
    badgeBg: 'bg-[#FFF1F2]'
  }
};

const getCourseTheme = (courseName: string) => {
  const upper = (courseName || '').toUpperCase().trim();
  if (COURSES_THEME[upper]) return COURSES_THEME[upper];
  for (const [key, val] of Object.entries(COURSES_THEME)) {
    if (upper.includes(key) || key.includes(upper)) return val;
  }
  return {
    label: courseName,
    bg: 'bg-[#F3E8EE]',
    border: 'border-[#F0D5E4]',
    text: 'text-[#8A064D]',
    badgeBg: 'bg-[#FFF2F8]'
  };
};

function formatTime12(timeStr?: string): string {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  if (clean.includes('AM') || clean.includes('PM') || clean.includes('am') || clean.includes('pm')) {
    return clean;
  }
  const parts = clean.split(':');
  if (parts.length >= 2) {
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return clean;
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m} ${ampm}`;
  }
  return clean;
}

const TIME_ROWS: Array<{
  time: string;
  slots: Record<string, TimetableSlot[]>;
}> = [
  {
    time: '5:00 AM – 6:00 AM',
    slots: {
      Monday: [{ course: 'YOGA', batch: 'Batch 1', trainer: 'Satish Kale' }],
      Tuesday: [{ course: 'YOGA', batch: 'Batch 1', trainer: 'Satish Kale' }],
      Wednesday: [{ course: 'YOGA', batch: 'Batch 1', trainer: 'Satish Kale' }],
      Thursday: [{ course: 'YOGA', batch: 'Batch 1', trainer: 'Satish Kale' }],
      Friday: [{ course: 'YOGA', batch: 'Batch 1', trainer: 'Satish Kale' }],
      Saturday: [],
      Sunday: []
    }
  },
  {
    time: '6:00 AM – 7:00 AM',
    slots: {
      Monday: [{ course: 'YOGA', batch: 'Batch 2', trainer: 'Satish Kale' }],
      Tuesday: [{ course: 'YOGA', batch: 'Batch 2', trainer: 'Satish Kale' }],
      Wednesday: [{ course: 'YOGA', batch: 'Batch 2', trainer: 'Satish Kale' }],
      Thursday: [{ course: 'YOGA', batch: 'Batch 2', trainer: 'Satish Kale' }],
      Friday: [{ course: 'YOGA', batch: 'Batch 2', trainer: 'Satish Kale' }],
      Saturday: [],
      Sunday: []
    }
  },
  {
    time: '7:00 AM – 8:00 AM',
    slots: {
      Monday: [{ course: 'YOGA', batch: 'Batch 3', trainer: 'Satish Kale' }],
      Tuesday: [{ course: 'YOGA', batch: 'Batch 3', trainer: 'Satish Kale' }],
      Wednesday: [{ course: 'YOGA', batch: 'Batch 3', trainer: 'Satish Kale' }],
      Thursday: [{ course: 'YOGA', batch: 'Batch 3', trainer: 'Satish Kale' }],
      Friday: [{ course: 'YOGA', batch: 'Batch 3', trainer: 'Satish Kale' }],
      Saturday: [],
      Sunday: []
    }
  },
  {
    time: '8:30 AM – 9:30 AM',
    slots: {
      Monday: [],
      Tuesday: [{ course: 'BHARATANATYAM', batch: 'Semi-Classical', trainer: 'Nandana' }],
      Wednesday: [],
      Thursday: [{ course: 'BHARATANATYAM', batch: 'Semi-Classical', trainer: 'Nandana' }],
      Friday: [{ course: 'BHARATANATYAM', batch: 'Semi-Classical', trainer: 'Nandana' }],
      Saturday: [],
      Sunday: []
    }
  },
  {
    time: '9:30 AM – 10:30 AM',
    slots: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [{ course: 'BHARATANATYAM', batch: 'Nrityam', trainer: 'Nandana' }],
      Sunday: [{ course: 'BHARATANATYAM', batch: 'Nrityam', trainer: 'Nandana' }]
    }
  },
  {
    time: '10:30 AM – 11:30 AM',
    slots: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [
        { course: 'BHARATANATYAM', batch: 'Kartari Mukham', trainer: 'Nandana' },
        { course: 'BHARATANATYAM', batch: 'Spanda', trainer: 'Vismaya' }
      ],
      Sunday: [
        { course: 'BHARATANATYAM', batch: 'Kartari Mukham', trainer: 'Nandana' },
        { course: 'BHARATANATYAM', batch: 'Spanda', trainer: 'Vismaya' }
      ]
    }
  },
  {
    time: '11:30 AM – 12:30 PM',
    slots: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [
        { course: 'BHARATANATYAM', batch: 'Shikharam', trainer: 'Kavya' },
        { course: 'BHARATANATYAM', batch: 'Blossom', trainer: 'Amrutha' }
      ],
      Sunday: [
        { course: 'BHARATANATYAM', batch: 'Shikharam', trainer: 'Kavya' },
        { course: 'BHARATANATYAM', batch: 'Blossom', trainer: 'Amrutha' }
      ]
    }
  },
  {
    time: '2:00 PM – 3:00 PM',
    slots: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [{ course: 'BHARATANATYAM', batch: 'Ladies Bharatanatyam', trainer: 'Kavya' }],
      Sunday: [{ course: 'BHARATANATYAM', batch: 'Ladies Bharatanatyam', trainer: 'Kavya' }]
    }
  },
  {
    time: '3:30 PM – 4:30 PM',
    slots: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [{ course: 'WESTERN DANCE', batch: 'Weekend Batch', trainer: 'Manjunath' }],
      Sunday: [{ course: 'WESTERN DANCE', batch: 'Weekend Batch', trainer: 'Manjunath' }]
    }
  },
  {
    time: '4:00 PM – 5:00 PM',
    slots: {
      Monday: [],
      Tuesday: [{ course: 'BHARATANATYAM', batch: 'Ragam', trainer: 'Nandana' }],
      Wednesday: [{ course: 'INSTRUMENT CLASSES', batch: 'Weekday Batch', trainer: 'Amos' }],
      Thursday: [{ course: 'BHARATANATYAM', batch: 'Ragam', trainer: 'Nandana' }],
      Friday: [{ course: 'INSTRUMENT CLASSES', batch: 'Weekday Batch', trainer: 'Amos' }],
      Saturday: [],
      Sunday: []
    }
  },
  {
    time: '4:30 PM – 5:30 PM',
    slots: {
      Monday: [{ course: 'BHARATANATYAM', batch: 'Anjali', trainer: 'Kavya' }],
      Tuesday: [{ course: 'KARATE', batch: 'Karate', trainer: 'Balraj' }],
      Wednesday: [],
      Thursday: [{ course: 'KARATE', batch: 'Karate', trainer: 'Balraj' }],
      Friday: [{ course: 'BHARATANATYAM', batch: 'Anjali', trainer: 'Kavya' }],
      Saturday: [{ course: 'BHARATANATYAM', batch: 'Alapadma', trainer: 'Vismaya', asterisk: true }],
      Sunday: [{ course: 'BHARATANATYAM', batch: 'Thalam', trainer: 'Amrutha', asterisk: true }]
    }
  },
  {
    time: '5:00 PM – 6:00 PM',
    slots: {
      Monday: [{ course: 'BHARATANATYAM', batch: 'Mudra', trainer: 'Amrutha' }],
      Tuesday: [{ course: 'BHARATANATYAM', batch: 'Pataka', trainer: 'Vismaya' }],
      Wednesday: [
        { course: 'BHARATANATYAM', batch: 'Mudra', trainer: 'Amrutha' },
        { course: 'INSTRUMENT CLASSES', batch: 'Weekday Batch', trainer: 'Amos' }
      ],
      Thursday: [],
      Friday: [{ course: 'INSTRUMENT CLASSES', batch: 'Weekday Batch', trainer: 'Amos' }],
      Saturday: [],
      Sunday: []
    }
  },
  {
    time: '5:30 PM – 6:30 PM',
    slots: {
      Monday: [
        { course: 'WESTERN DANCE', batch: 'Kids Batch', trainer: 'Karthik and Uday' },
        { course: 'WESTERN DANCE', batch: 'Senior Kids Batch', trainer: 'Manjunath and Karthik', asterisk: true }
      ],
      Tuesday: [
        { course: 'BHARATANATYAM', batch: 'Pataka Varnam', trainer: 'Amrutha' },
        { course: 'KALARIPAYATTU', batch: 'Kalari', trainer: 'Vrushhabh Prakash' }
      ],
      Wednesday: [{ course: 'WESTERN DANCE', batch: 'Kids Batch', trainer: 'Karthik and Uday' }],
      Thursday: [{ course: 'KALARIPAYATTU', batch: 'Kalari', trainer: 'Vrushhabh Prakash' }],
      Friday: [
        { course: 'BHARATANATYAM', batch: 'Pataka', trainer: 'Vismaya' },
        { course: 'BHARATANATYAM', batch: 'Pataka Varnam', trainer: 'Amrutha' }
      ],
      Saturday: [
        { course: 'BHARATANATYAM', batch: 'Brahmaram', trainer: 'Nandana' },
        { course: 'BHARATANATYAM', batch: 'Chandrachooda', trainer: 'Kavya' },
        { course: 'CARNATIC MUSIC', batch: 'Kids/Senior Batch', trainer: 'H Manikandan' }
      ],
      Sunday: [
        { course: 'BHARATANATYAM', batch: 'Brahmaram', trainer: 'Nandana' },
        { course: 'BHARATANATYAM', batch: 'Chandrachooda', trainer: 'Kavya' }
      ]
    }
  },
  {
    time: '6:30 PM – 7:30 PM',
    slots: {
      Monday: [
        { course: 'BHARATANATYAM', batch: 'Padam', trainer: 'Vismaya' },
        { course: 'CARNATIC MUSIC', batch: 'Adult Batch', trainer: 'H Manikandan' },
        { course: 'DRAWING', batch: 'Junior Batch', trainer: 'Dipanyan Sarkar', asterisk: true }
      ],
      Tuesday: [
        { course: 'CARNATIC MUSIC', batch: 'Kids/Senior Batch', trainer: 'H Manikandan' },
        { course: 'WESTERN DANCE', batch: 'Senior Kids Batch', trainer: 'Manjunath and Karthik', asterisk: true }
      ],
      Wednesday: [{ course: 'CARNATIC MUSIC', batch: 'Adult Batch', trainer: 'H Manikandan' }],
      Thursday: [{ course: 'CARNATIC MUSIC', batch: 'Kids Junior Batch', trainer: 'H Manikandan' }],
      Friday: [{ course: 'BHARATANATYAM', batch: 'Padam', trainer: 'Vismaya' }],
      Saturday: [
        { course: 'BHARATANATYAM', batch: 'Thalam', trainer: 'Amrutha', asterisk: true },
        { course: 'CARNATIC MUSIC', batch: 'Kids Junior Batch', trainer: 'H Manikandan' }
      ],
      Sunday: [{ course: 'BHARATANATYAM', batch: 'Alapadma', trainer: 'Vismaya', asterisk: true }]
    }
  },
  {
    time: '6:45 PM – 7:45 PM',
    slots: {
      Monday: [],
      Tuesday: [],
      Wednesday: [{ course: 'DRAWING', batch: 'Senior Batch', trainer: 'Dipanyan Sarkar', asterisk: true }],
      Thursday: [{ course: 'DRAWING', batch: 'Junior Batch', trainer: 'Dipanyan Sarkar', asterisk: true }],
      Friday: [{ course: 'DRAWING', batch: 'Senior Batch', trainer: 'Dipanyan Sarkar', asterisk: true }],
      Saturday: [],
      Sunday: []
    }
  },
  {
    time: '7:30 PM – 8:30 PM',
    slots: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [{ course: 'INSTRUMENT CLASSES', batch: 'Weekend Batch', trainer: 'Sahil', asterisk: true }],
      Sunday: []
    }
  },
  {
    time: '7:45 PM – 8:45 PM',
    slots: {
      Monday: [{ course: 'WESTERN DANCE', batch: 'Adult Batch', trainer: 'Uday' }],
      Tuesday: [{ course: 'WESTERN DANCE', batch: 'Adult Batch', trainer: 'Uday' }],
      Wednesday: [],
      Thursday: [{ course: 'WESTERN DANCE', batch: 'Adult Batch', trainer: 'Uday' }],
      Friday: [],
      Saturday: [],
      Sunday: []
    }
  }
];


const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableView({ onBack, batches, tallyClasses: initialTallyClasses, showBackLink = true }: Props) {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [liveTallyClasses, setLiveTallyClasses] = useState<any[]>(initialTallyClasses || []);
  const [liveBatches, setLiveBatches] = useState<Batch[]>(batches || []);

  // Sync or fetch live batches from API so any change to room name or schedule is reactive immediately
  React.useEffect(() => {
    if (batches && batches.length > 0) {
      setLiveBatches(batches);
      return;
    }
    fetch('/api/batches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLiveBatches(data);
        }
      })
      .catch(err => {
        console.error('Notice: Could not fetch live batches for timetable:', err);
      });
  }, [batches]);

  // Dynamic batch matching helper
  const findMatchingBatch = (slotBatch: string, slotCourse?: string): Batch | undefined => {
    const normSlot = (slotBatch || '').toLowerCase().trim();
    if (!normSlot) return undefined;

    // 1. Exact batch name match
    let match = liveBatches.find(b => b.name?.toLowerCase().trim() === normSlot);
    if (match) return match;

    // 2. Substring match (e.g. "Alapadma" matching "Alapadma (Kids Foundation)" or "Junior Batch")
    match = liveBatches.find(b => {
      const bName = (b.name || '').toLowerCase().trim();
      return bName.includes(normSlot) || normSlot.includes(bName);
    });
    if (match) return match;

    // 3. Combined course title + batch match
    if (slotCourse) {
      const normCourse = slotCourse.toLowerCase().trim();
      match = liveBatches.find(b => {
        const bCourse = (b.course_title || '').toLowerCase().trim();
        const bName = (b.name || '').toLowerCase().trim();
        return (bCourse.includes(normCourse) || normCourse.includes(bCourse)) &&
               (bName.includes(normSlot) || normSlot.includes(bName));
      });
      if (match) return match;
    }

    return undefined;
  };

  // Dynamic room resolution: Reads live database room_or_hall
  const getSlotRoom = (slot: TimetableSlot): string => {
    // A. Explicit room from slot (e.g. rescheduled tally classes)
    if (slot.room && slot.room.trim().length > 0) return slot.room.trim();

    // B. Match with live batches in database
    const match = findMatchingBatch(slot.batch, slot.course);
    if (match && (match.room_or_hall || match.room)) {
      return (match.room_or_hall || match.room || '').trim();
    }

    // C. Fallback room based on course category
    const courseUpper = (slot.course || '').toUpperCase();
    if (courseUpper.includes('YOGA')) return 'Room 1 (Yoga Shala)';
    if (courseUpper.includes('WESTERN')) return 'Room 1 (Dance Studio)';
    if (courseUpper.includes('BHARATANATYAM') || courseUpper.includes('KALARI') || courseUpper.includes('KUCHIPUDI') || courseUpper.includes('MOHINI')) return 'Room 2 (Natya Mandapam)';
    if (courseUpper.includes('MUSIC') || courseUpper.includes('INSTRUMENT') || courseUpper.includes('VIOLIN') || courseUpper.includes('KEYBOARD') || courseUpper.includes('GUITAR') || courseUpper.includes('UKULELE')) return 'Room 3 (Sangeetha Hall)';
    if (courseUpper.includes('DRAWING') || courseUpper.includes('ART') || courseUpper.includes('CHESS') || courseUpper.includes('KARATE')) return 'Room 4 (Chitrakala Studio)';
    return 'Room 2 (Main Hall)';
  };

  // Dynamic trainer resolution: Reads live database faculty assignment
  const getSlotTrainer = (slot: TimetableSlot): string => {
    if (slot.isRescheduled && slot.trainer) return slot.trainer;
    const match = findMatchingBatch(slot.batch, slot.course);
    if (match && match.trainer_name && match.trainer_name.trim().length > 0) {
      return match.trainer_name.trim();
    }
    return slot.trainer;
  };

  // Synthesize dynamic time rows from TIME_ROWS + any active live batches
  const dynamicTimeRows = useMemo(() => {
    const rows = TIME_ROWS.map(r => ({
      time: r.time,
      slots: Object.fromEntries(
        DAYS.map(day => [day, [...(r.slots[day] || [])]])
      ) as Record<string, TimetableSlot[]>
    }));

    if (!liveBatches || liveBatches.length === 0) return rows;

    const placedBatchNames = new Set<string>();
    rows.forEach(r => {
      DAYS.forEach(day => {
        r.slots[day]?.forEach(s => {
          placedBatchNames.add(s.batch.toLowerCase().trim());
        });
      });
    });

    const activeBatches = liveBatches.filter(b => b.is_active !== false);

    activeBatches.forEach(b => {
      const bNameLower = (b.name || '').toLowerCase().trim();
      if (!bNameLower || placedBatchNames.has(bNameLower)) return;

      const start12 = formatTime12(b.start_time);
      const end12 = formatTime12(b.end_time);
      const timeLabel = (start12 && end12) ? `${start12} – ${end12}` : '5:00 PM – 6:00 PM';
      const days = Array.isArray(b.days_of_week) && b.days_of_week.length > 0
        ? b.days_of_week
        : ['Monday', 'Wednesday'];

      let targetRow = rows.find(r => {
        const rNorm = r.time.replace(/[-–]/g, '–').replace(/\s+/g, ' ').trim().toLowerCase();
        const tNorm = timeLabel.replace(/[-–]/g, '–').replace(/\s+/g, ' ').trim().toLowerCase();
        return rNorm === tNorm || (start12 && rNorm.startsWith(start12.toLowerCase()));
      });

      if (!targetRow) {
        targetRow = {
          time: timeLabel,
          slots: Object.fromEntries(DAYS.map(day => [day, []])) as Record<string, TimetableSlot[]>
        };
        rows.push(targetRow);
      }

      days.forEach(day => {
        const cleanDay = day.trim();
        if (targetRow && targetRow.slots[cleanDay]) {
          const alreadyInCell = targetRow.slots[cleanDay].some(s => s.batch.toLowerCase().trim() === bNameLower);
          if (!alreadyInCell) {
            targetRow.slots[cleanDay].push({
              course: (b.course_title || 'CLASSICAL').toUpperCase().trim(),
              batch: b.name.trim(),
              trainer: b.trainer_name || 'Assigned Guru',
              room: (b.room_or_hall || b.room || '').trim()
            });
          }
        }
      });
    });

    return rows;
  }, [liveBatches]);

  // Fetch rescheduled tally classes if not passed in props
  React.useEffect(() => {
    if (initialTallyClasses && initialTallyClasses.length > 0) {
      setLiveTallyClasses(initialTallyClasses);
      return;
    }
    fetch('/api/tally-classes')
      .then(res => res.json())
      .then(data => {
        if (data && data.classes) {
          setLiveTallyClasses(data.classes);
        } else if (Array.isArray(data)) {
          setLiveTallyClasses(data);
        }
      })
      .catch(() => {});
  }, [initialTallyClasses]);

  // Dynamic current week dates & Month/Year calculation
  const { currentMonthYear, weekDates } = useMemo(() => {
    const now = new Date();
    const currentMonthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dates = weekDays.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateFormatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        day: dayName,
        dateFormatted,
        isoDate
      };
    });

    return { currentMonthYear, weekDates: dates };
  }, []);

  const inactiveBatchNames = useMemo(() => {
    return new Set(
      liveBatches
        .filter(b => b.is_active === false)
        .map(b => (b.name || '').toLowerCase().trim())
    );
  }, [liveBatches]);

  const activeBatchesCount = useMemo(() => {
    if (liveBatches && liveBatches.length > 0) {
      return liveBatches.filter(b => b.is_active !== false).length;
    }
    return 33;
  }, [liveBatches]);

  const availableCourseFilters = useMemo(() => {
    const list: string[] = [];
    Object.keys(COURSES_THEME).forEach(k => {
      if (!list.includes(k)) list.push(k);
    });
    return list;
  }, []);

  const [isExporting, setIsExporting] = useState(false);
  const timetableRef = useRef<HTMLDivElement>(null);

  const handleDownloadPng = async () => {
    if (!timetableRef.current) return;
    setIsExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(timetableRef.current, {
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `laasya-weekly-master-timetable-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting timetable to PNG with html-to-image:', err);
      try {
        // Fallback to html2canvas if available
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(timetableRef.current, {
          scale: 2,
          backgroundColor: '#FFFFFF',
          useCORS: true,
          logging: false,
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `laasya-weekly-master-timetable-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      } catch (fallbackErr) {
        console.error('Fallback export also failed:', fallbackErr);
        alert('Failed to download PNG. Please try again or use browser print.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-3">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] hover:bg-[#FFE5F0] border border-[#F0D5E4] px-3.5 py-1.5 rounded-xl transition cursor-pointer mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Batches</span>
            </button>
          ) : (
            <Link
              href="/batches"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] hover:bg-[#FFE5F0] border border-[#F0D5E4] px-3.5 py-1.5 rounded-xl transition cursor-pointer mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Batches</span>
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#2A0418] tracking-tight">
            Laasya Cultural Academy: Weekly Timetable
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Grid view with start and end time. Every class runs for 1 hour. Each colour is one course; in each box the small label is the course, the bold name is the batch and the last line is the trainer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadPng}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white border border-[#F9E33A]/40 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting PNG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#F9E33A]" />
                <span>Download PNG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Exportable Timetable Wrapper */}
      <div ref={timetableRef} className="space-y-6 bg-white p-4 sm:p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">

      {/* Course Badges Legend */}
      <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 mr-1">
          Courses:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCourseFilter('ALL')}
          className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-xl border transition cursor-pointer ${
            selectedCourseFilter === 'ALL'
              ? 'bg-[#590231] text-white border-[#590231] shadow-2xs'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
          }`}
        >
          All Courses (${activeBatchesCount} Batches)
        </button>
        {availableCourseFilters.map(name => {
          const theme = getCourseTheme(name);
          const isSelected = selectedCourseFilter === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedCourseFilter(isSelected ? 'ALL' : name)}
              className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                theme.bg
              } ${theme.border} ${theme.text} ${
                isSelected ? 'ring-2 ring-[#8A064D] shadow-xs' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{name}</span>
            </button>
          );
        })}
      </div>

      {/* Weekly Timetable Grid Table */}
      <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden print:shadow-none print:border-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              {/* Current Month & Year Master Banner */}
              <tr className="bg-[#1A010F] text-white border-b border-[#3E3438]">
                <th colSpan={8} className="py-2.5 px-4 text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-widest uppercase text-[#F9E33A] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#F9E33A]" />
                      <span>{currentMonthYear}</span>
                      <span className="text-white/60 font-normal">| Weekly Master Timetable</span>
                    </span>
                    <span className="text-xs font-bold text-amber-300 bg-amber-900/60 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="text-base text-amber-400 font-black leading-none drop-shadow-xs animate-pulse">★</span>
                      <span>Rescheduled / Extra Classes</span>
                    </span>
                  </div>
                </th>
              </tr>
              <tr className="bg-[#2D2427] text-white text-[11px] font-black uppercase tracking-wider border-b border-[#2D2427]">
                <th className="py-3 px-3 w-32 border-r border-[#3E3438] text-center font-bold align-middle">
                  <div>Time</div>
                  <div className="text-[9.5px] text-gray-400 font-normal mt-0.5 font-mono">1 Hr Slots</div>
                </th>
                {weekDates.map(({ day, dateFormatted }) => (
                  <th key={day} className="py-3 px-3 text-center border-r border-[#3E3438] last:border-r-0 font-bold min-w-[130px]">
                    <div className="text-[11px] font-black uppercase text-white tracking-wide">{day}</div>
                    <div className="text-[10px] font-bold text-[#F9E33A] bg-white/10 px-2.5 py-0.5 rounded-md inline-block mt-1 font-mono">
                      {dateFormatted}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0D5E4]/80">
              {dynamicTimeRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  {/* Time Column */}
                  <td className="py-3 px-2 text-center text-[10px] font-bold text-gray-700 bg-[#FDFBFB] border-r border-[#F0D5E4] whitespace-nowrap align-middle">
                    {row.time}
                  </td>

                  {/* Day Columns */}
                  {weekDates.map(({ day, isoDate }) => {
                    const rawSlots = [...(row.slots[day] || [])];

                    // Inject any rescheduled tally classes that match this day's ISO date & time
                    const dayRescheduled = liveTallyClasses.filter(tc => {
                      if (!tc.rescheduled_date) return false;
                      const dateMatches = tc.rescheduled_date.startsWith(isoDate);
                      if (!dateMatches) return false;
                      // Match approximate start hour or time slot
                      const tcStart = tc.start_time?.substring(0, 5) || '';
                      return row.time.includes(tcStart) || row.time.toLowerCase().includes(tc.start_time?.toLowerCase() || '');
                    });

                    dayRescheduled.forEach(tc => {
                      rawSlots.push({
                        course: (tc.course_title || 'CLASSICAL DANCE').toUpperCase(),
                        batch: tc.batch_name || 'Rescheduled Batch',
                        trainer: tc.trainer_name || 'Assigned Guru',
                        isRescheduled: true,
                        asterisk: true,
                        room: tc.room_or_hall
                      });
                    });

                    const activeSlots = rawSlots.filter(s => !inactiveBatchNames.has(s.batch.toLowerCase().trim()));
                    const filteredSlots = selectedCourseFilter === 'ALL'
                      ? activeSlots
                      : activeSlots.filter(s => s.course === selectedCourseFilter);

                    return (
                      <td key={day} className="p-1.5 border-r border-[#F0D5E4]/80 last:border-r-0 align-top min-w-[130px]">
                        <div className="space-y-1.5">
                          {filteredSlots.map((slot, sIdx) => {
                            const theme = getCourseTheme(slot.course);

                            return (
                              <div
                                key={sIdx}
                                className={`p-2 rounded-xl border transition-all text-left shadow-2xs hover:shadow-xs ${
                                  slot.isRescheduled
                                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                                    : `${theme.bg} ${theme.border}`
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[8.5px] font-black uppercase tracking-wider opacity-90 leading-tight ${theme.text}`}>
                                    {slot.course}
                                  </span>
                                  {slot.isRescheduled && (
                                    <span className="text-[9.5px] font-black text-amber-950 bg-amber-200/90 border border-amber-400 px-1.5 py-0.5 rounded-md font-mono shrink-0 inline-flex items-center gap-1 shadow-2xs">
                                      <span className="text-base text-amber-600 font-black leading-none animate-pulse">★</span>
                                      <span>Rescheduled</span>
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[11px] font-extrabold leading-snug mt-0.5 text-gray-900 flex items-center gap-1`}>
                                  <span>{slot.batch}</span>
                                  {slot.asterisk && !slot.isRescheduled && <span className="text-gray-500">*</span>}
                                </div>
                                <div className={`text-[9.5px] font-medium leading-tight mt-0.5 text-gray-600 flex items-center gap-1`}>
                                  <User className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                  <span>{getSlotTrainer(slot)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-700 mt-1 bg-white/80 px-1.5 py-0.5 rounded border border-gray-200/80 w-fit">
                                  <DoorOpen className="w-2.5 h-2.5 text-[#8A064D] shrink-0" />
                                  <span>{getSlotRoom(slot)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Schedule Notes & Room Allocation Guarantee */}
      <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-2 text-xs text-gray-600 leading-relaxed">
        <p className="flex items-start gap-2">
          <span className="text-[#8A064D] font-bold text-sm leading-none">*</span>
          <span>End time was not given in the original schedule and is filled in as start time + 1 hour.</span>
        </p>
        <p className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#8A064D] shrink-0 mt-0.5" />
          <span>
            <strong>Rooms:</strong> the academy has 4 rooms. At most 3 classes run at the same time (around 6:30 PM on Monday, Tuesday, Wednesday, Friday and Saturday), so there is no room clash anywhere in the week.
          </span>
        </p>
      </div>
      </div>
    </div>
  );
}

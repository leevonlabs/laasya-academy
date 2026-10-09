'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Printer, 
  Sparkles, 
  DoorOpen, 
  User, 
  Layers,
  Info,
  CheckCircle2
} from 'lucide-react';

interface Props {
  onBack?: () => void;
}

interface TimetableSlot {
  course: string;
  batch: string;
  trainer: string;
  asterisk?: boolean;
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
  'INSTRUMENT CLASSES': {
    label: 'INSTRUMENT CLASSES',
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
  'DRAWING': {
    label: 'DRAWING',
    bg: 'bg-[#DCFCE7]',
    border: 'border-[#BBF7D0]',
    text: 'text-[#15803D]',
    badgeBg: 'bg-[#F0FDF4]'
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
  }
};

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

export default function TimetableView({ onBack }: Props) {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');

  const handlePrint = () => {
    window.print();
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
            onClick={handlePrint}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-[#F0D5E4] px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xs transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-[#8A064D]" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

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
          All Courses (33 Batches)
        </button>
        {Object.entries(COURSES_THEME).map(([name, theme]) => {
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
              <tr className="bg-[#2D2427] text-white text-[11px] font-black uppercase tracking-wider border-b border-[#2D2427]">
                <th className="py-3 px-3 w-32 border-r border-[#3E3438] text-center font-bold">
                  Time
                </th>
                {DAYS.map(day => (
                  <th key={day} className="py-3 px-3 text-center border-r border-[#3E3438] last:border-r-0 font-bold min-w-[130px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0D5E4]/80">
              {TIME_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  {/* Time Column */}
                  <td className="py-3 px-2 text-center text-[10px] font-bold text-gray-700 bg-[#FDFBFB] border-r border-[#F0D5E4] whitespace-nowrap align-middle">
                    {row.time}
                  </td>

                  {/* Day Columns */}
                  {DAYS.map(day => {
                    const slots = row.slots[day] || [];
                    const filteredSlots = selectedCourseFilter === 'ALL'
                      ? slots
                      : slots.filter(s => s.course === selectedCourseFilter);

                    return (
                      <td key={day} className="p-1.5 border-r border-[#F0D5E4]/80 last:border-r-0 align-top min-w-[130px]">
                        <div className="space-y-1.5">
                          {filteredSlots.map((slot, sIdx) => {
                            const theme = COURSES_THEME[slot.course] || {
                              bg: 'bg-rose-50',
                              border: 'border-rose-200',
                              text: 'text-rose-900',
                              badgeBg: 'bg-white'
                            };

                            return (
                              <div
                                key={sIdx}
                                className={`p-2 rounded-xl border transition-all text-left shadow-2xs hover:shadow-xs ${theme.bg} ${theme.border}`}
                              >
                                <div className={`text-[8.5px] font-black uppercase tracking-wider opacity-85 leading-tight ${theme.text}`}>
                                  {slot.course}
                                </div>
                                <div className={`text-[11px] font-extrabold leading-snug mt-0.5 text-gray-900`}>
                                  {slot.batch} {slot.asterisk && <span className="text-gray-500">*</span>}
                                </div>
                                <div className={`text-[9.5px] font-medium leading-tight mt-0.5 text-gray-600`}>
                                  {slot.trainer}
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
  );
}

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  DoorOpen, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Layers,
  RotateCcw
} from 'lucide-react';
import { Batch, Room } from '@/lib/academy';

interface Props {
  batches: Batch[];
  rooms: Room[];
  onBack: () => void;
}

const STANDARD_TIME_BLOCKS = [
  { start: '05:00', end: '06:00', label: '05:00 AM – 06:00 AM' },
  { start: '06:00', end: '07:00', label: '06:00 AM – 07:00 AM' },
  { start: '07:00', end: '08:00', label: '07:00 AM – 08:00 AM' },
  { start: '08:30', end: '09:30', label: '08:30 AM – 09:30 AM' },
  { start: '09:30', end: '10:30', label: '09:30 AM – 10:30 AM' },
  { start: '10:30', end: '11:30', label: '10:30 AM – 11:30 AM' },
  { start: '11:30', end: '12:30', label: '11:30 AM – 12:30 PM' },
  { start: '14:00', end: '15:00', label: '02:00 PM – 03:00 PM' },
  { start: '15:30', end: '16:30', label: '03:30 PM – 04:30 PM' },
  { start: '16:00', end: '17:00', label: '04:00 PM – 05:00 PM' },
  { start: '16:30', end: '17:30', label: '04:30 PM – 05:30 PM' },
  { start: '17:00', end: '18:00', label: '05:00 PM – 06:00 PM' },
  { start: '17:30', end: '18:30', label: '05:30 PM – 06:30 PM' },
  { start: '18:00', end: '19:00', label: '06:00 PM – 07:00 PM' },
  { start: '18:30', end: '19:30', label: '06:30 PM – 07:30 PM' },
  { start: '19:30', end: '20:30', label: '07:30 PM – 08:30 PM' },
  { start: '19:45', end: '20:45', label: '07:45 PM – 08:45 PM' },
];

const DAYS_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const YEARS_LIST = [2024, 2025, 2026, 2027, 2028];

const FALLBACK_ROOMS: Room[] = [
  { id: 'r1', name: 'Natya Mandapam (Room 101)', capacity: 25 },
  { id: 'r2', name: 'Sangeetha Shala (Room 102)', capacity: 25 },
  { id: 'r3', name: 'Chitra Kuteera (Room 103)', capacity: 25 },
  { id: 'r4', name: 'Yogasana Shala (Room 104)', capacity: 25 }
];

export default function VacantRoomsView({ batches, rooms, onBack }: Props) {
  // Today's real date
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth(); // 0 - 11
  const todayDay = today.getDate();
  const todayDateStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

  // Month & Year state (defaults to current month and year)
  const [selectedYear, setSelectedYear] = useState<number>(todayYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayMonth);
  // Selected day number (1 - 31)
  const [selectedDay, setSelectedDay] = useState<number>(todayDay);

  const [filterRoom, setFilterRoom] = useState<string>('all');
  const dayCarouselRef = useRef<HTMLDivElement>(null);

  // Compute number of days in selected month & year
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Ensure selectedDay stays within month bounds when month changes
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  // Effective selected date string YYYY-MM-DD
  const effectiveDateStr = useMemo(() => {
    const d = Math.min(selectedDay, daysInMonth);
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }, [selectedYear, selectedMonth, selectedDay, daysInMonth]);

  // Derive day of week from selected date
  const selectedDayInfo = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, selectedDay);
    const dayName = DAYS_NAMES[d.getDay()];
    const fullDateString = d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const isToday = effectiveDateStr === todayDateStr;
    return { dayName, dayNum: selectedDay, fullDateString, isToday };
  }, [selectedYear, selectedMonth, selectedDay, effectiveDateStr, todayDateStr]);

  // Scroll active day chip into view when selectedDay changes
  useEffect(() => {
    if (dayCarouselRef.current) {
      const activeBtn = dayCarouselRef.current.querySelector('[data-selected="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  // Helper to check if two time ranges overlap
  const timesOverlap = (startA: string, endA: string, startB: string, endB: string) => {
    const toMinutes = (t: string) => {
      const parts = t.split(':').map(Number);
      return parts[0] * 60 + (parts[1] || 0);
    };
    const sA = toMinutes(startA);
    const eA = toMinutes(endA);
    const sB = toMinutes(startB);
    const eB = toMinutes(endB);
    return Math.max(sA, sB) < Math.min(eA, eB);
  };

  const effectiveRooms = useMemo(() => {
    return rooms && rooms.length > 0 ? rooms : FALLBACK_ROOMS;
  }, [rooms]);

  // Find all classes scheduled in each room for the selected date's day of week
  const roomSchedules = useMemo(() => {
    const targetDay = selectedDayInfo.dayName.toLowerCase();
    const result: Record<string, Array<{
      batch: Batch;
      startTime: string;
      endTime: string;
      room: string;
    }>> = {};

    effectiveRooms.forEach(r => {
      result[r.name] = [];
    });

    batches.forEach(b => {
      if (b.schedules && b.schedules.length > 0) {
        b.schedules.forEach(slot => {
          if (slot.day && slot.day.toLowerCase() === targetDay) {
            const rawRoom = slot.room || b.room_or_hall;
            const matchedRoom = effectiveRooms.find(r => 
              r.name.toLowerCase() === rawRoom.toLowerCase() ||
              r.name.toLowerCase().includes(rawRoom.toLowerCase()) ||
              rawRoom.toLowerCase().includes(r.name.toLowerCase())
            );
            const targetKey = matchedRoom ? matchedRoom.name : rawRoom;
            if (result[targetKey]) {
              result[targetKey].push({
                batch: b,
                startTime: slot.startTime,
                endTime: slot.endTime,
                room: targetKey
              });
            }
          }
        });
      } else if (b.days_of_week && b.days_of_week.some(d => d.toLowerCase() === targetDay)) {
        const rawRoom = b.room_or_hall;
        const matchedRoom = effectiveRooms.find(r => 
          r.name.toLowerCase() === rawRoom.toLowerCase() ||
          r.name.toLowerCase().includes(rawRoom.toLowerCase()) ||
          rawRoom.toLowerCase().includes(r.name.toLowerCase())
        );
        const targetKey = matchedRoom ? matchedRoom.name : rawRoom;
        if (result[targetKey]) {
          result[targetKey].push({
            batch: b,
            startTime: b.start_time?.substring(0, 5) || '09:00',
            endTime: b.end_time?.substring(0, 5) || '10:00',
            room: targetKey
          });
        }
      }
    });

    return result;
  }, [batches, effectiveRooms, selectedDayInfo.dayName]);

  // Compute vacancy matrix for each room
  const roomVacancyCards = useMemo(() => {
    return effectiveRooms.map(room => {
      const bookedSlots = roomSchedules[room.name] || [];
      
      const timeSlotsStatus = STANDARD_TIME_BLOCKS.map(block => {
        const matchingBooking = bookedSlots.find(bs => timesOverlap(bs.startTime, bs.endTime, block.start, block.end));
        return {
          block,
          isVacant: !matchingBooking,
          booking: matchingBooking || null
        };
      });

      const vacantCount = timeSlotsStatus.filter(s => s.isVacant).length;
      const bookedCount = timeSlotsStatus.length - vacantCount;
      const vacancyRate = Math.round((vacantCount / timeSlotsStatus.length) * 100);

      return {
        room,
        timeSlotsStatus,
        vacantCount,
        bookedCount,
        vacancyRate
      };
    });
  }, [effectiveRooms, roomSchedules]);

  // Navigate day by day
  const handlePrevDay = () => {
    if (selectedDay > 1) {
      setSelectedDay(selectedDay - 1);
    } else {
      // Go to previous month's last day
      let prevMonth = selectedMonth - 1;
      let prevYear = selectedYear;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
      }
      const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
      setSelectedYear(prevYear);
      setSelectedMonth(prevMonth);
      setSelectedDay(daysInPrev);
    }
  };

  const handleNextDay = () => {
    if (selectedDay < daysInMonth) {
      setSelectedDay(selectedDay + 1);
    } else {
      // Go to next month's day 1
      let nextMonth = selectedMonth + 1;
      let nextYear = selectedYear;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      setSelectedYear(nextYear);
      setSelectedMonth(nextMonth);
      setSelectedDay(1);
    }
  };

  const handleResetToToday = () => {
    setSelectedYear(todayYear);
    setSelectedMonth(todayMonth);
    setSelectedDay(todayDay);
  };

  const filteredCards = filterRoom === 'all' 
    ? roomVacancyCards 
    : roomVacancyCards.filter(c => c.room.id === filterRoom || c.room.name === filterRoom);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] hover:bg-[#FFE5F0] border border-[#F0D5E4] px-3.5 py-1.5 rounded-xl transition cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Batches</span>
          </button>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700">
              <DoorOpen className="w-6 h-6" />
            </div>
            <span>Room Vacancies & Availability</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Live day-wise room vacancy overview across academy halls. Review open slots for scheduling trial classes, masterclasses, or batch adjustments.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl border border-[#F0D5E4] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Vacant / Free</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A064D]">
            <span className="w-3 h-3 rounded-full bg-[#8A064D]" />
            <span>Class in Session</span>
          </div>
        </div>
      </div>

      {/* 1. ABOVE DAY NAVIGATOR: Month and Year Selection Filter */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#FFF2F8] border border-[#F0D5E4] rounded-xl text-[#8A064D]">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#8A064D]">
                Month & Year Selection Filter
              </span>
              <p className="text-[11px] text-gray-500 font-medium">
                Select target month and year to browse daily hall availability
              </p>
            </div>
          </div>

          {/* Quick jump to current month / today */}
          <button
            type="button"
            onClick={handleResetToToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 ${
              selectedYear === todayYear && selectedMonth === todayMonth && selectedDay === todayDay
                ? 'bg-[#8A064D] text-white border-[#8A064D] shadow-xs'
                : 'bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border-[#F0D5E4]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Current Month & Today</span>
          </button>
        </div>

        {/* Dropdowns row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-700">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-[#F0D5E4] rounded-xl px-3 py-1.5 text-xs font-bold text-[#2D041A] focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20 cursor-pointer shadow-2xs hover:border-[#8A064D]"
            >
              {MONTHS_LIST.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-[#F0D5E4] rounded-xl px-3 py-1.5 text-xs font-bold text-[#2D041A] focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20 cursor-pointer shadow-2xs hover:border-[#8A064D]"
            >
              {YEARS_LIST.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Room Filter Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span>Room:</span>
            </label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20 cursor-pointer shadow-2xs hover:border-[#8A064D]"
            >
              <option value="all">All Academy Rooms</option>
              {effectiveRooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. ON TOP OF ROOMS: Day-by-Day Vacancy Navigator */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
        {/* Navigation Bar: Prev Day, Date Display, Next Day */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-[#FFF2F8] hover:border-[#F0D5E4] text-[#8A064D] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev Day</span>
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-[#FFF2F8] hover:border-[#F0D5E4] text-[#8A064D] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Next Day"
            >
              <span>Next Day</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Currently Selected Day Banner */}
          <div className="flex items-center gap-2 bg-[#FFF2F8] px-4 py-2 rounded-2xl border border-[#F0D5E4]">
            <Clock className="w-4 h-4 text-[#8A064D]" />
            <span className="text-xs font-black text-[#8A064D]">
              {selectedDayInfo.fullDateString}
            </span>
            {selectedDayInfo.isToday && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 uppercase tracking-wider ml-1">
                Today
              </span>
            )}
          </div>
        </div>

        {/* Horizontal Day-by-Day Carousel / Strip */}
        <div className="relative">
          <div 
            ref={dayCarouselRef}
            className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scroll-smooth"
          >
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const d = new Date(selectedYear, selectedMonth, dayNum);
              const dayOfWeek = DAYS_NAMES[d.getDay()].substring(0, 3);
              const isSelected = dayNum === selectedDay;
              const isTodayChip = (
                selectedYear === todayYear &&
                selectedMonth === todayMonth &&
                dayNum === todayDay
              );

              return (
                <button
                  key={dayNum}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`min-w-[62px] p-2 rounded-2xl text-xs font-semibold transition-all duration-150 border cursor-pointer flex flex-col items-center justify-center gap-0.5 shrink-0 select-none ${
                    isSelected
                      ? 'bg-[#8A064D] text-white border-[#8A064D] shadow-md scale-105 ring-2 ring-[#8A064D]/30'
                      : isTodayChip
                      ? 'bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border-[#8A064D]/60 font-bold'
                      : 'bg-gray-50/80 hover:bg-white hover:border-[#F0D5E4] text-gray-700 border-gray-200'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${
                    isSelected ? 'text-rose-100' : isTodayChip ? 'text-[#8A064D]' : 'text-gray-400'
                  }`}>
                    {dayOfWeek}
                  </span>
                  <span className="text-sm font-black leading-tight">
                    {dayNum}
                  </span>
                  {isTodayChip && (
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase leading-none mt-0.5 ${
                      isSelected ? 'bg-white text-[#8A064D]' : 'bg-[#8A064D] text-white'
                    }`}>
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Rooms Vacancy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredCards.map(({ room, timeSlotsStatus, vacantCount, bookedCount, vacancyRate }) => (
          <div
            key={room.id}
            className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-[#8A064D]/40 transition"
          >
            <div>
              {/* Room Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-sm text-[#2D041A] truncate">{room.name}</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Capacity: {room.capacity || 25} students</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  vacancyRate >= 50
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {vacancyRate}% Free
                </span>
              </div>

              {/* Status Pill Summary */}
              <div className="my-3 flex items-center justify-between text-[11px] font-semibold text-gray-600 bg-gray-50/70 p-2 rounded-xl">
                <span>{bookedCount} Booked</span>
                <span className="text-gray-300">•</span>
                <span className="text-emerald-700 font-bold">{vacantCount} Vacant Slots</span>
              </div>

              {/* Time Slots Timeline */}
              <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
                {timeSlotsStatus.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl text-xs transition border ${
                      slot.isVacant
                        ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50'
                        : 'bg-[#FFF2F8] border-[#F0D5E4] hover:bg-[#FFE5F0]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-gray-700">
                        {slot.block.label}
                      </span>
                      {slot.isVacant ? (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">
                          Vacant
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#8A064D] bg-[#FFE5F0] px-1.5 py-0.5 rounded uppercase">
                          Occupied
                        </span>
                      )}
                    </div>

                    {!slot.isVacant && slot.booking && (
                      <div className="mt-1 pt-1 border-t border-[#F0D5E4]/60">
                        <p className="text-[11px] font-bold text-[#2D041A] truncate">
                          {slot.booking.batch.name} • {slot.booking.batch.course_title}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium truncate">
                          Guru: {slot.booking.batch.trainer_name}
                        </p>
                      </div>
                    )}

                    {slot.isVacant && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        Available for booking
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center font-medium">
              Classroom sanitized & available
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

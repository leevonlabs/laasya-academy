'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClassSession, Room } from '@/lib/academy';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';
import { 
  Clock, 
  CheckCircle, 
  Calendar as CalendarIcon, 
  Building2, 
  X, 
  Search,
  Activity,
  Layers,
  DoorOpen
} from 'lucide-react';

interface Props {
  initialSessions: ClassSession[];
  initialRooms?: Room[];
}

// 30-minute interval slots from 12:00 AM to 11:30 PM, plus 11:59 PM
const TIME_SLOTS = [
  { value: 'all', label: 'Any Time' },
  { value: '00:00', label: '12:00 AM' },
  { value: '00:30', label: '12:30 AM' },
  { value: '01:00', label: '01:00 AM' },
  { value: '01:30', label: '01:30 AM' },
  { value: '02:00', label: '02:00 AM' },
  { value: '02:30', label: '02:30 AM' },
  { value: '03:00', label: '03:00 AM' },
  { value: '03:30', label: '03:30 AM' },
  { value: '04:00', label: '04:00 AM' },
  { value: '04:30', label: '04:30 AM' },
  { value: '05:00', label: '05:00 AM' },
  { value: '05:30', label: '05:30 AM' },
  { value: '06:00', label: '06:00 AM' },
  { value: '06:30', label: '06:30 AM' },
  { value: '07:00', label: '07:00 AM' },
  { value: '07:30', label: '07:30 AM' },
  { value: '08:00', label: '08:00 AM' },
  { value: '08:30', label: '08:30 AM' },
  { value: '09:00', label: '09:00 AM' },
  { value: '09:30', label: '09:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM (Noon)' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '13:30', label: '01:30 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '14:30', label: '02:30 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '15:30', label: '03:30 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '16:30', label: '04:30 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '17:30', label: '05:30 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '18:30', label: '06:30 PM' },
  { value: '19:00', label: '07:00 PM' },
  { value: '19:30', label: '07:30 PM' },
  { value: '20:00', label: '08:00 PM' },
  { value: '20:30', label: '08:30 PM' },
  { value: '21:00', label: '09:00 PM' },
  { value: '21:30', label: '09:30 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '22:30', label: '10:30 PM' },
  { value: '23:00', label: '11:00 PM' },
  { value: '23:30', label: '11:30 PM' },
  { value: '23:59', label: '11:59 PM' },
];

function formatTime12(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${ampm}`;
}

function timeToMinutes(timeStr?: string): number {
  if (!timeStr || timeStr === 'all') return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr || '0', 10) || 0;
  return h * 60 + m;
}

export default function ScheduleListClient({ initialSessions, initialRooms }: Props) {
  const [sessions, setSessions] = useState<ClassSession[]>(initialSessions);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Interactive Status Filter: 'all' | 'scheduled' (pending) | 'in_progress' (on going) | 'completed'
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Other Filters
  const [selectedRoom, setSelectedRoom] = useState<string>('All');
  const [checkInTime, setCheckInTime] = useState<string>('all'); // From time
  const [checkOutTime, setCheckOutTime] = useState<string>('all'); // To time
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Live real-time Clock & Date
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatted date: "dd-month name- year" (e.g. "05-October-2026")
  const dayStr = String(currentTime.getDate()).padStart(2, '0');
  const monthName = currentTime.toLocaleString('en-US', { month: 'long' });
  const yearStr = currentTime.getFullYear();
  const liveDateFormatted = `${dayStr}-${monthName}-${yearStr}`;
  const liveTimeFormatted = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Unique rooms list
  const availableRooms = useMemo(() => {
    const roomSet = new Set<string>();
    if (initialRooms && initialRooms.length > 0) {
      initialRooms.forEach(r => {
        if (r.name && r.name.trim()) roomSet.add(r.name.trim());
      });
    }
    sessions.forEach(s => {
      if (s.room_or_hall && s.room_or_hall.trim()) roomSet.add(s.room_or_hall.trim());
    });
    return Array.from(roomSet).sort();
  }, [initialRooms, sessions]);

  // Session count per room
  const roomSessionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.room_or_hall) {
        const r = s.room_or_hall.trim();
        counts[r] = (counts[r] || 0) + 1;
      }
    });
    return counts;
  }, [sessions]);

  // Room occupancy calculation
  const totalRoomsCount = availableRooms.length > 0 ? availableRooms.length : 20;
  const occupiedRoomsSet = useMemo(() => {
    return new Set(sessions.map(s => s.room_or_hall).filter(Boolean));
  }, [sessions]);
  const roomsOccupiedCount = occupiedRoomsSet.size;
  const roomsVacantCount = Math.max(0, totalRoomsCount - roomsOccupiedCount);

  // Status counts for current filters (independent of selectedStatus) so cards show totals accurately
  const statusCounts = useMemo(() => {
    let list = sessions;
    if (selectedRoom !== 'All') {
      list = list.filter(s => s.room_or_hall && s.room_or_hall.toLowerCase().trim() === selectedRoom.toLowerCase().trim());
    }
    const inMins = checkInTime !== 'all' ? timeToMinutes(checkInTime) : null;
    const outMins = checkOutTime !== 'all' ? timeToMinutes(checkOutTime) : null;
    if (inMins !== null || outMins !== null) {
      list = list.filter(s => {
        const startMins = timeToMinutes(s.start_time);
        if (inMins !== null && startMins < inMins) return false;
        if (outMins !== null && startMins > outMins) return false;
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        s.course_title?.toLowerCase().includes(q) ||
        s.batch_name?.toLowerCase().includes(q) ||
        s.trainer_name?.toLowerCase().includes(q) ||
        s.room_or_hall?.toLowerCase().includes(q)
      );
    }
    return {
      completed: list.filter(s => s.status === 'completed').length,
      onGoing: list.filter(s => s.status === 'in_progress').length,
      pending: list.filter(s => s.status === 'scheduled').length,
      total: list.length
    };
  }, [sessions, selectedRoom, checkInTime, checkOutTime, searchQuery]);

  // Filter sessions by Room, interactive Status, Check-in/Check-out Timing, and Search Query
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // 1. Room Filter
      if (selectedRoom !== 'All') {
        if (!s.room_or_hall || s.room_or_hall.toLowerCase().trim() !== selectedRoom.toLowerCase().trim()) {
          return false;
        }
      }

      // 2. Interactive Status Filter ('scheduled' -> pending, 'in_progress' -> on going, 'completed' -> completed)
      if (selectedStatus !== 'all') {
        if (s.status !== selectedStatus) {
          return false;
        }
      }

      // 3. Timing Filter: Check-in (From) and Check-out (To)
      const startMins = timeToMinutes(s.start_time);
      if (checkInTime !== 'all') {
        const inMins = timeToMinutes(checkInTime);
        if (startMins < inMins) return false;
      }
      if (checkOutTime !== 'all') {
        const outMins = timeToMinutes(checkOutTime);
        if (startMins > outMins) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCourse = s.course_title?.toLowerCase().includes(q);
        const matchBatch = s.batch_name?.toLowerCase().includes(q);
        const matchGuru = s.trainer_name?.toLowerCase().includes(q);
        const matchRoom = s.room_or_hall?.toLowerCase().includes(q);
        if (!matchCourse && !matchBatch && !matchGuru && !matchRoom) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, selectedRoom, selectedStatus, checkInTime, checkOutTime, searchQuery]);

  const handleRangeApply = async (sDate: string, eDate: string) => {
    setStartDate(sDate);
    setEndDate(eDate);
    setLoading(true);
    try {
      let url = `/api/sessions?startDate=${sDate}&endDate=${eDate}`;
      if (sDate === eDate) {
        url = `/api/sessions?date=${sDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = 
    selectedRoom !== 'All' || 
    selectedStatus !== 'all' || 
    checkInTime !== 'all' || 
    checkOutTime !== 'all' || 
    searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setSelectedRoom('All');
    setSelectedStatus('all');
    setCheckInTime('all');
    setCheckOutTime('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP LIVE TIME & DATE BANNER (dd-month name- year) */}
      <div className="bg-gradient-to-r from-[#8A064D] via-[#6B043C] to-[#2D041A] rounded-3xl p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-[#F9E33A]/25">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-[#F9E33A] shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#F9E33A] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Academy Live Time</span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-white mt-0.5">
              {mounted ? liveTimeFormatted : '12:00:00 PM'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 sm:self-center">
          <CalendarIcon className="w-5 h-5 text-[#F9E33A] shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-rose-200">Date</div>
            <div className="text-base sm:text-lg font-mono font-black tracking-wide text-white">
              {mounted ? liveDateFormatted : '05-October-2026'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Header & Quick Date Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Today&apos;s Class Schedule & Sessions</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Filter classes by Check-in / Check-out timing, interactive status cards, hall room, and track real-time faculty attendance.
          </p>
        </div>

        {/* DateRangeQuickFilter: preserved exactly as requested */}
        <div className="flex items-center gap-3">
          <DateRangeQuickFilter
            startDate={startDate}
            endDate={endDate}
            align="right"
            onApply={({ startDate, endDate }) => handleRangeApply(startDate, endDate)}
            placeholder="Select Date or Period"
          />
        </div>
      </div>

      {/* 3. Filter Controls Bar (Status filter removed as requested - handled by interactive summary cards) */}
      <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Timing: Check-in Time (From) */}
          <div className="flex items-center gap-2 bg-[#FFF9FB] px-3.5 py-2 rounded-xl border border-[#F0D5E4] text-xs">
            <Clock className="w-4 h-4 text-[#8A064D] shrink-0" />
            <span className="font-bold text-gray-700 whitespace-nowrap">Check-in:</span>
            <select
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="font-semibold text-[#2D041A] bg-transparent outline-none cursor-pointer"
            >
              <option value="all">Any Check-in</option>
              {TIME_SLOTS.filter(t => t.value !== 'all').map(t => (
                <option key={`in-${t.value}`} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Timing: Check-out Time (To) */}
          <div className="flex items-center gap-2 bg-[#FFF9FB] px-3.5 py-2 rounded-xl border border-[#F0D5E4] text-xs">
            <Clock className="w-4 h-4 text-[#8A064D] shrink-0" />
            <span className="font-bold text-gray-700 whitespace-nowrap">Check-out:</span>
            <select
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="font-semibold text-[#2D041A] bg-transparent outline-none cursor-pointer"
            >
              <option value="all">Any Check-out</option>
              {TIME_SLOTS.filter(t => t.value !== 'all').map(t => (
                <option key={`out-${t.value}`} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Room Filter */}
          <div className="flex items-center gap-2 bg-[#FFF9FB] px-3.5 py-2 rounded-xl border border-[#F0D5E4] text-xs">
            <Building2 className="w-4 h-4 text-[#8A064D] shrink-0" />
            <span className="font-bold text-gray-700 whitespace-nowrap">Room:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="font-semibold text-[#2D041A] bg-transparent outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="All">All Rooms ({sessions.length} classes)</option>
              {availableRooms.map(r => (
                <option key={r} value={r}>
                  {r} ({roomSessionCounts[r] || 0} classes)
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-[#FFF9FB] px-3.5 py-2 rounded-xl border border-[#F0D5E4] text-xs flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search course, batch, or Guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[#2D041A] placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-[#8A064D] hover:text-[#590231] hover:underline px-2.5 py-1.5 flex items-center gap-1 cursor-pointer ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}

        </div>

        {/* Quick Timing Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 text-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quick Timing Presets:</span>
          
          <button
            onClick={() => { setCheckInTime('all'); setCheckOutTime('all'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              checkInTime === 'all' && checkOutTime === 'all'
                ? 'bg-[#8A064D] text-white shadow-2xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            All Day
          </button>

          <button
            onClick={() => { setCheckInTime('00:00'); setCheckOutTime('12:00'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              checkInTime === '00:00' && checkOutTime === '12:00'
                ? 'bg-[#8A064D] text-white shadow-2xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            🌅 12:00 AM to 12:00 PM (Morning)
          </button>

          <button
            onClick={() => { setCheckInTime('12:00'); setCheckOutTime('17:00'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              checkInTime === '12:00' && checkOutTime === '17:00'
                ? 'bg-[#8A064D] text-white shadow-2xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            ☀️ 12:00 PM to 05:00 PM (Afternoon)
          </button>

          <button
            onClick={() => { setCheckInTime('17:00'); setCheckOutTime('23:59'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              checkInTime === '17:00' && checkOutTime === '23:59'
                ? 'bg-[#8A064D] text-white shadow-2xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            🌆 05:00 PM to 11:59 PM (Evening)
          </button>

          <span className="text-gray-400 text-[11px] ml-auto">
            Showing <strong>{filteredSessions.length}</strong> of {sessions.length} sessions
          </span>
        </div>
      </div>

      {/* 4. REPLACED SUMMARY ROW: Completed, On Going, Pending (Clickable Filters) + Rooms Occupied, Rooms Vacant (Only Numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Completed (Interactive Filter) */}
        <button
          type="button"
          onClick={() => setSelectedStatus(prev => prev === 'completed' ? 'all' : 'completed')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedStatus === 'completed'
              ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-gray-50/80 border-[#F0D5E4] shadow-xs hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Completed
            </span>
            <CheckCircle className={`w-4 h-4 ${selectedStatus === 'completed' ? 'text-emerald-600' : 'text-emerald-500/70'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1.5 tabular-nums">
            {statusCounts.completed}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700/90 mt-1">
            {selectedStatus === 'completed' ? '● Filter Active (tap to clear)' : 'Tap to filter'}
          </div>
        </button>

        {/* Card 2: On Going (Interactive Filter) */}
        <button
          type="button"
          onClick={() => setSelectedStatus(prev => prev === 'in_progress' ? 'all' : 'in_progress')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedStatus === 'in_progress'
              ? 'bg-amber-50/90 border-amber-500 shadow-sm ring-2 ring-amber-500/30'
              : 'bg-white hover:bg-gray-50/80 border-[#F0D5E4] shadow-xs hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              On Going
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-1.5 tabular-nums">
            {statusCounts.onGoing}
          </div>
          <div className="text-[11px] font-semibold text-amber-700/90 mt-1">
            {selectedStatus === 'in_progress' ? '● Filter Active (tap to clear)' : 'Tap to filter'}
          </div>
        </button>

        {/* Card 3: Pending (Interactive Filter) */}
        <button
          type="button"
          onClick={() => setSelectedStatus(prev => prev === 'scheduled' ? 'all' : 'scheduled')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedStatus === 'scheduled'
              ? 'bg-rose-50/90 border-[#8A064D] shadow-sm ring-2 ring-[#8A064D]/30'
              : 'bg-white hover:bg-gray-50/80 border-[#F0D5E4] shadow-xs hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
              Pending
            </span>
            <Clock className={`w-4 h-4 ${selectedStatus === 'scheduled' ? 'text-[#8A064D]' : 'text-rose-400'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2D041A] mt-1.5 tabular-nums">
            {statusCounts.pending}
          </div>
          <div className="text-[11px] font-semibold text-rose-700/90 mt-1">
            {selectedStatus === 'scheduled' ? '● Filter Active (tap to clear)' : 'Tap to filter'}
          </div>
        </button>

        {/* Card 4: Rooms Occupied (Only Display Number) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[#F0D5E4] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
              Rooms Occupied
            </span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 mt-1.5 tabular-nums">
            {roomsOccupiedCount}
          </div>
        </div>

        {/* Card 5: Rooms Vacant (Only Display Number) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[#F0D5E4] bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Rooms Vacant
            </span>
            <DoorOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-950 mt-1.5 tabular-nums">
            {roomsVacantCount}
          </div>
        </div>

      </div>

      {/* Active Status Filter Indicator Banner */}
      {selectedStatus !== 'all' && (
        <div className="flex items-center justify-between bg-[#FFF2F8] border border-[#F0D5E4] px-4 py-2.5 rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#8A064D]">Active Status Filter:</span>
            <span className={`px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider text-[11px] ${
              selectedStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
              selectedStatus === 'in_progress' ? 'bg-amber-100 text-amber-800' :
              'bg-rose-100 text-[#8A064D]'
            }`}>
              {selectedStatus === 'completed' ? 'Completed' : selectedStatus === 'in_progress' ? 'On Going' : 'Pending'}
            </span>
          </div>
          <button
            onClick={() => setSelectedStatus('all')}
            className="text-xs font-bold text-[#8A064D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Show All Statuses</span>
          </button>
        </div>
      )}

      {/* 5. Sessions Rows List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-[#8A064D]/20 border-t-[#8A064D] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-3">Loading sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#F0D5E4] shadow-xs">
          <Clock className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#2D041A]">
            No Classes Found Matching Filters
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            Try clicking another status card, adjusting your Check-in / Check-out timing, room selection, or date range.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-[#8A064D] text-white text-xs font-semibold rounded-xl hover:bg-[#70043E] transition cursor-pointer"
            >
              Clear Filters to View All Classes
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F0D5E4] shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#8A064D]/40"
            >
              {/* Left Details: Time Stamp + Main Highlight (Course Name & Batch) + Guru, Room, Timings below */}
              <div className="flex items-start gap-4">
                
                {/* Time Stamp Avatar */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[11px] sm:text-xs font-black text-white mt-0.5 tracking-tight">
                    {formatTime12(s.start_time).split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-[#F9E33A] uppercase tracking-wider">
                    {formatTime12(s.start_time).split(' ')[1]}
                  </span>
                </div>

                {/* Details Container */}
                <div className="space-y-2">
                  
                  {/* MAIN HIGHLIGHT: Course Name with Batch beside it */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-[#2D041A] tracking-tight">
                      {s.course_title}
                    </h2>
                    <span className="inline-flex items-center text-xs font-black bg-[#8A064D] text-[#F9E33A] px-3 py-1 rounded-xl shadow-xs border border-[#8A064D]">
                      {s.batch_name}
                    </span>
                  </div>

                  {/* CLEARLY VISIBLE DETAILS BELOW: Guru Name, Room Name, Timings */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                    
                    {/* Guru Name */}
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <span className="font-semibold text-gray-500">Guru:</span>
                      <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                        {s.trainer_name}
                      </span>
                    </div>

                    {/* Room Name */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-500">Room:</span>
                      <span className="font-bold text-purple-950 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                        <span>🏛️</span>
                        <span>{s.room_or_hall || 'Room Unassigned'}</span>
                      </span>
                    </div>

                    {/* Timings */}
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <span className="font-semibold text-gray-500">Timings:</span>
                      <span className="font-bold text-rose-950 bg-rose-50/80 px-2.5 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 font-mono">
                        <span>🕒</span>
                        <span>{formatTime12(s.start_time)} - {formatTime12(s.end_time)}</span>
                        <span className="text-gray-400 font-sans text-[11px] ml-1">
                          ({s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)})
                        </span>
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* Right Side: Attendance + ONLY STATUS DISPLAYED (NO ACTION BUTTONS) */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                
                {/* Attendance Count */}
                <div className="text-left md:text-right px-2 min-w-[100px]">
                  <div className="text-xs font-semibold text-gray-500">Attendance</div>
                  <div className="text-sm font-black text-emerald-700 tabular-nums">
                    {s.present_count || 0} / {s.total_enrolled || 0} Present
                  </div>
                </div>

                {/* Only Display Status (Completed, On Going, Pending) */}
                <div>
                  {s.status === 'completed' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-800 border border-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Completed</span>
                    </span>
                  )}
                  {s.status === 'in_progress' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      <span>On Going</span>
                    </span>
                  )}
                  {s.status === 'scheduled' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Pending</span>
                    </span>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { ClassSession } from '@/lib/academy';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';
import { 
  Clock, 
  KeyRound, 
  Play, 
  CheckCircle, 
  Calendar as CalendarIcon, 
  Users, 
  Sparkles,
  BookOpen
} from 'lucide-react';

interface Props {
  initialSessions: ClassSession[];
}

export default function ScheduleListClient({ initialSessions }: Props) {
  const [sessions, setSessions] = useState<ClassSession[]>(initialSessions);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

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

  const handleUpdateStatus = async (sessionId: string, newStatus: string) => {
    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: newStatus,
          checkInCode: newStatus === 'in_progress' ? pin : undefined
        })
      });

      if (res.ok) {
        setSessions(prev =>
          prev.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  status: newStatus as any,
                  checkInCode: newStatus === 'in_progress' ? pin : s.check_in_code
                }
              : s
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Date Picker (Reference Image 2) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Daily Class Schedule & Sessions</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Activate class sessions, view the 6-digit student check-in PIN, and track real-time attendance.
          </p>
        </div>

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

      {/* Sessions Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-[#8A064D]/20 border-t-[#8A064D] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-3">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#F0D5E4] shadow-sm">
          <Clock className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#2D041A]">
            No Sessions Scheduled For {startDate === endDate ? startDate : `${startDate} to ${endDate}`}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            Classes run according to their weekly batch days. You can create batches or select another date from the picker above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-sm hover:shadow-md transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left Details */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] flex flex-col items-center justify-center shrink-0 shadow-md">
                  <Clock className="w-6 h-6" />
                  <span className="text-[10px] font-bold text-white mt-0.5">
                    {s.start_time.substring(0, 5)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#2D041A]">{s.batch_name}</h3>
                    <span className="text-[10px] font-semibold bg-[#FFF2F8] text-[#8A064D] border border-rose-100 px-2.5 py-0.5 rounded-full">
                      {s.course_title}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-1">
                    Guru: <strong className="text-gray-800">{s.trainer_name}</strong>
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF2F8] text-[#8A064D] border border-rose-100">
                      📅 {s.session_date}
                    </span>
                    <span>Scheduled Time: <strong className="text-gray-700">{s.start_time} - {s.end_time}</strong></span>
                  </p>

                  {s.session_topic_notes && (
                    <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 p-2 rounded-xl border border-gray-100">
                      Topic: &quot;{s.session_topic_notes}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: PIN, Status & Controls */}
              <div className="flex flex-wrap items-center gap-4 lg:self-center">
                
                {/* 6-Digit Check-in PIN */}
                {s.check_in_code ? (
                  <div className="bg-gradient-to-br from-[#FFFDF7] to-[#FFF8E7] border-2 border-[#F9E33A] rounded-2xl px-5 py-2.5 text-center shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-amber-900/80 flex items-center gap-1 justify-center">
                      <KeyRound className="w-3.5 h-3.5 text-[#8A064D]" />
                      <span>Student Check-in PIN</span>
                    </div>
                    <div className="text-2xl font-mono font-black text-[#8A064D] tracking-widest mt-0.5">
                      {s.check_in_code}
                    </div>
                  </div>
                ) : (
                  <div className="text-center px-4 py-2 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-400">
                    PIN generates on start
                  </div>
                )}

                {/* Present Count */}
                <div className="text-center px-4">
                  <div className="text-xs font-bold text-emerald-600">
                    {s.present_count || 0} / {s.total_enrolled || 0} Present
                  </div>
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    s.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                    s.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Action Button */}
                <div>
                  {s.status === 'scheduled' && (
                    <button
                      onClick={() => handleUpdateStatus(s.id, 'in_progress')}
                      className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-[#F9E33A] fill-current" />
                      <span>Start Class Session</span>
                    </button>
                  )}

                  {s.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(s.id, 'completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                      <span>Finish Class Session</span>
                    </button>
                  )}

                  {s.status === 'completed' && (
                    <div className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Session Closed</span>
                    </div>
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

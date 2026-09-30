'use client';

import React, { useState } from 'react';
import { Batch, Course, Trainer } from '@/lib/academy';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  X,
  Search,
  Check
} from 'lucide-react';

interface Props {
  initialBatches: Batch[];
  courses: Course[];
  trainers: Trainer[];
}

export default function BatchesListClient({ initialBatches, courses, trainers }: Props) {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [trainerId, setTrainerId] = useState(trainers[0]?.id || '');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:30');
  const [room, setRoom] = useState('Natya Mandapam (Room 101)');
  const [capacity, setCapacity] = useState(25);

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const filteredBatches = batches.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.trainer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          course_id: courseId,
          trainer_id: trainerId,
          days_of_week: selectedDays,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          room_or_hall: room,
          max_capacity: capacity
        })
      });

      if (res.ok) {
        const added = await res.json();
        const crs = courses.find(c => c.id === courseId);
        const trn = trainers.find(t => t.id === trainerId);
        setBatches(prev => [...prev, {
          ...added,
          course_title: crs?.title || 'Course',
          course_category: crs?.category || 'Category',
          trainer_name: trn?.full_name || 'Revered Guru',
          enrolled_count: 0
        }]);
        setIsAddOpen(false);
        setName('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Class Batches & Slots</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-semibold">
              {batches.length} Active Batches
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure weekly recurring class batches, assigned halls, and seating capacity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search batches by name, course, guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#F0D5E4] rounded-xl text-xs w-72 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((b) => {
          const fillPercentage = Math.round((b.enrolled_count / b.max_capacity) * 100);
          return (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Course Category Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-0.5 rounded-full">
                    {b.course_category}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active Slot
                  </span>
                </div>

                {/* Batch Name & Course */}
                <h3 className="font-bold text-base text-[#2D041A] leading-tight">
                  {b.name}
                </h3>
                <p className="text-xs font-medium text-[#8A064D] mt-0.5">
                  Course: {b.course_title}
                </p>

                {/* Trainer & Room */}
                <div className="mt-4 space-y-2 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Guru: <strong className="text-gray-800">{b.trainer_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Time: <strong className="text-gray-800">{b.start_time} - {b.end_time}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span className="truncate">{b.room_or_hall || 'Main Hall'}</span>
                  </div>
                </div>

                {/* Days of Week Badges */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {b.days_of_week.map((day, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] font-semibold bg-[#FFF9FB] text-gray-700 border border-rose-100 px-2 py-0.5 rounded-md"
                    >
                      {day.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">Batch Enrollment</span>
                  <span className="font-bold text-[#8A064D]">
                    {b.enrolled_count} / {b.max_capacity} Students
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      fillPercentage >= 90 ? 'bg-rose-500' :
                      fillPercentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Create Batch Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Create Recurring Class Batch</h3>
                <p className="text-xs text-gray-500">Assign a course, instructor, schedule days, and hall.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kuchupudi Beginners - Batch B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Academy Course (18 Available)</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.code}) - {c.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Guru / Faculty Master</label>
                  <select
                    value={trainerId}
                    onChange={(e) => setTrainerId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Days of Week selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Weekly Class Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {daysList.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#8A064D] text-white shadow-sm ring-1 ring-[#F9E33A]'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sangeetha Shala (Room 202)"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Maximum Capacity</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { 
  getDashboardMetrics, 
  getSessions, 
  getCourses, 
  getBatches 
} from '@/lib/academy';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles,
  MapPin,
  KeyRound,
  PlayCircle
} from 'lucide-react';

export const revalidate = 0; // Fresh dynamic data

export default async function OverviewPage() {
  const metrics = await getDashboardMetrics();
  const todaySessions = await getSessions();
  const allCourses = await getCourses();
  const allBatches = await getBatches();

  // Categories count
  const categories = [
    { name: 'Classical Dance', count: allCourses.filter(c => c.category === 'Classical Dance').length, color: 'bg-rose-500' },
    { name: 'Modern Dance & Fitness', count: allCourses.filter(c => c.category === 'Modern Dance & Fitness').length, color: 'bg-pink-500' },
    { name: 'Vocal & Music', count: allCourses.filter(c => c.category === 'Vocal & Music').length, color: 'bg-amber-500' },
    { name: 'Musical Instruments', count: allCourses.filter(c => c.category === 'Musical Instruments').length, color: 'bg-indigo-500' },
    { name: 'Martial Arts', count: allCourses.filter(c => c.category === 'Martial Arts').length, color: 'bg-orange-500' },
    { name: 'Fine Arts & Mind Sports', count: allCourses.filter(c => c.category === 'Fine Arts' || c.category === 'Mind Sports').length, color: 'bg-emerald-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-[#8A064D] via-[#750441] to-[#590231] rounded-3xl p-8 text-white relative shadow-xl overflow-hidden border border-[#F9E33A]/30">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#F9E33A] to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#590231]/80 px-3 py-1 rounded-full text-xs text-[#F9E33A] border border-[#F9E33A]/40 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academy Control Center</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Namaste, Director!
            </h1>
            <p className="text-rose-100 text-sm mt-1 max-w-xl">
              Welcome to the Laasya Cultural Academy management dashboard. All 18 performing, musical, martial, and fine arts disciplines are active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/batches"
              className="bg-[#F9E33A] hover:bg-[#E5A812] text-[#2D041A] font-semibold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span>+ Create Batch</span>
            </Link>
            <Link
              href="/trainers"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl text-xs border border-white/20 transition flex items-center gap-1.5"
            >
              <span>+ Add Guru</span>
            </Link>
            <Link
              href="/students"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl text-xs border border-white/20 transition flex items-center gap-1.5"
            >
              <span>+ Enroll Student</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Available Courses</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#2D041A]">{metrics.totalCourses}</span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">All Active</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Faculty & Revered Gurus</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#2D041A]">{metrics.totalTrainers}</span>
            <span className="text-[10px] text-gray-400">Masters</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Enrolled Students</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#2D041A]">{metrics.totalStudents}</span>
            <span className="text-[10px] text-gray-400">Active</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Active Batches</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#2D041A]">{metrics.activeBatches}</span>
            <span className="text-[10px] text-gray-400">Slots</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Today Sessions</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#2D041A]">{metrics.todaySessionsCount}</span>
            <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Today</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-sm hover:shadow-md transition">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-gray-500">Present Today</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#2D041A]">{metrics.presentTodayCount}</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Checked in</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Today's Schedule & Disciplines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Today's Classes */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-[#2D041A]">Today's Class Schedule & Live Attendance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Real-time attendance monitor & student check-in PIN status</p>
            </div>
            <Link 
              href="/schedule" 
              className="text-xs font-semibold text-[#8A064D] hover:underline flex items-center gap-1"
            >
              <span>Full Schedule</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No class sessions scheduled for today</p>
              <p className="text-xs text-gray-400 mt-1">Sessions can be scheduled from the Schedule tab or Batches view.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {todaySessions.map((session) => (
                <div 
                  key={session.id}
                  className="p-4 rounded-2xl border border-gray-100 hover:border-[#F0D5E4] bg-gradient-to-r from-white to-[#FFF9FB] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#8A064D] text-white flex flex-col items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#F9E33A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2D041A]">{session.batch_name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-[#8A064D] border border-rose-100">
                          {session.course_title}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-0.5">
                        Guru: <span className="font-medium text-gray-800">{session.trainer_name}</span>
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Timing: <span className="font-semibold text-gray-700">{session.start_time} - {session.end_time}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status, PIN and Attendance */}
                  <div className="flex items-center gap-3 sm:self-center">
                    {session.check_in_code && (
                      <div className="bg-[#FFF2F8] border border-[#F0D5E4] px-3 py-1.5 rounded-xl text-center">
                        <div className="text-[9px] uppercase font-bold text-gray-400 flex items-center gap-1 justify-center">
                          <KeyRound className="w-3 h-3 text-[#8A064D]" />
                          <span>Student PIN</span>
                        </div>
                        <div className="text-sm font-mono font-bold text-[#8A064D] tracking-widest">
                          {session.check_in_code}
                        </div>
                      </div>
                    )}

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600">
                        {session.present_count || 0} / {session.total_enrolled || 0} Present
                      </div>
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        session.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                        session.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {session.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Disciplines & Quick Stats */}
        <div className="space-y-6">
          
          {/* Disciplines Breakdown Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-sm">
            <h2 className="text-base font-bold text-[#2D041A] mb-1">Academy Disciplines</h2>
            <p className="text-xs text-gray-500 mb-4">Catalog distribution of 18 courses</p>

            <div className="space-y-3.5">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{cat.name}</span>
                    <span className="font-bold text-[#8A064D]">{cat.count} Courses</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${cat.color}`} 
                      style={{ width: `${(cat.count / 18) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link
                href="/courses"
                className="w-full bg-[#FFF9FB] hover:bg-[#FDF2F7] text-[#8A064D] border border-[#F0D5E4] font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>Manage Course Fees & Catalog</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Academy Location & Branch Card */}
          <div className="bg-[#590231] text-white rounded-3xl p-6 border border-[#F9E33A]/30 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#8A064D] flex items-center justify-center text-[#F9E33A]">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Main Cultural Campus</h3>
                <p className="text-[11px] text-[#F9E33A]">Hyderabad, Telangana</p>
              </div>
            </div>
            <p className="text-xs text-rose-100/80 leading-relaxed">
              Official center for Kuchupudi, Bharathanatyam, Carnatic Vocal, Kalaripayattu, and Mind Arts examinations.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

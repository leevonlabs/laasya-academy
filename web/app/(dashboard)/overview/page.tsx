import React from 'react';
import Link from 'next/link';
import { 
  getDashboardMetrics, 
  getSessions, 
  getCourses, 
  getBatches 
} from '@/lib/academy';
import { getFinancialSummary } from '@/lib/finance';
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
  Receipt,
  Banknote,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const revalidate = 0; // Fresh dynamic data

export default async function OverviewPage() {
  const [metrics, finance, todaySessions, allCourses, allBatches] = await Promise.all([
    getDashboardMetrics(),
    getFinancialSummary(),
    getSessions(),
    getCourses(),
    getBatches()
  ]);

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
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-[#590231]/90 px-3.5 py-1 rounded-full text-xs font-bold text-[#F9E33A] border border-[#F9E33A]/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F9E33A]" />
              <span>Academy Control Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Namaste, Director!
            </h1>
            <p className="text-rose-100/90 text-sm max-w-xl font-medium leading-relaxed">
              Welcome to the Laasya Cultural Academy management dashboard. All 18 performing, musical, martial, and fine arts disciplines are active and running.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/batches"
              className="bg-[#F9E33A] hover:bg-[#E5A812] active:scale-[0.98] text-[#2D041A] font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>+ Create Batch</span>
            </Link>
            <Link
              href="/trainers"
              className="bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm border border-white/30 transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>+ Add Guru</span>
            </Link>
            <Link
              href="/students"
              className="bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm border border-white/30 transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>+ Enroll Student</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-[#8A064D]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6E3955]">Courses</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black text-[#2D041A] tabular-nums">{metrics.totalCourses}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">All Active</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5 text-amber-700" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6E3955]">Faculty Gurus</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black text-[#2D041A] tabular-nums">{metrics.totalTrainers}</span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Masters</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-purple-700" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6E3955]">Students</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black text-[#2D041A] tabular-nums">{metrics.totalStudents}</span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">Active</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6E3955]">Active Batches</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black text-[#2D041A] tabular-nums">{metrics.activeBatches}</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Slots</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5 text-rose-700" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6E3955]">Today Sessions</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black text-[#2D041A] tabular-nums">{metrics.todaySessionsCount}</span>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Today</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6E3955]">Present Today</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black text-[#2D041A] tabular-nums">{metrics.presentTodayCount}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Checked in</span>
          </div>
        </div>

      </div>

      {/* Financial Health & Cash Flow Overview (Owner Exclusive) */}
      <div className="bg-white rounded-3xl p-7 border border-[#F0D5E4] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F0D5E4]/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] flex items-center justify-center shadow-sm shrink-0">
              <Banknote className="w-6 h-6 text-[#F9E33A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#2D041A]">Academy Financial Health & Cash Flow</h2>
                <span className="text-[10px] font-extrabold uppercase bg-[#F9E33A] text-[#2D041A] px-2.5 py-0.5 rounded-full shadow-2xs">
                  Owner Confidential
                </span>
              </div>
              <p className="text-xs text-[#6E3955] mt-0.5 font-semibold">
                Real-time tracking of student fee collections, overdue invoices, Guru salary disbursements, and operational cash flow.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/fees"
              className="px-4 py-2.5 bg-[#FFF2F8] hover:bg-[#FFE3EF] text-[#8A064D] border border-[#F0D5E4] rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-[#8A064D]" />
              <span>Student Fees</span>
            </Link>
            <Link
              href="/salaries"
              className="px-4 py-2.5 bg-[#8A064D] hover:bg-[#70043E] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Banknote className="w-4 h-4 text-[#F9E33A]" />
              <span>Guru Payroll</span>
            </Link>
          </div>
        </div>

        {/* 4 Financial Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Fee Collections */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Fee Collections</span>
              <span className="text-xs font-bold bg-emerald-200/70 text-emerald-900 px-2.5 py-0.5 rounded-full tabular-nums">
                {finance.collectionRate}% Collected
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-emerald-950 tabular-nums">
                ₹{finance.totalFeeCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-emerald-800/90 mt-1.5 font-medium tabular-nums">
              ₹{finance.totalFeeBilled.toLocaleString('en-IN')} billed • {finance.totalStudentsBilled} students
            </p>
          </div>

          {/* Card 2: Pending Fees */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/90 to-rose-50/40 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Pending Fees</span>
              <span className="text-xs font-bold bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded-full tabular-nums">
                {finance.overdueInvoicesCount} Overdue
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-amber-950 tabular-nums">
                ₹{finance.totalFeePending.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-amber-900/90 mt-1.5 font-medium tabular-nums">
              {finance.partialInvoicesCount} partial accounts • WhatsApp reminders active
            </p>
          </div>

          {/* Card 3: Salaries Paid */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FFF2F8] to-rose-50/60 border border-[#F0D5E4]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A064D]">Salaries Paid</span>
              <span className="text-xs font-bold bg-rose-100 text-[#8A064D] px-2.5 py-0.5 rounded-full">
                Disbursed
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-[#2D041A] tabular-nums">
                ₹{finance.totalSalariesPaid.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-[#6E3955] mt-1.5 font-medium">
              Net payroll credited to revered Gurus
            </p>
          </div>

          {/* Card 4: Pending Salaries */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-blue-50/40 border border-indigo-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Pending Salaries</span>
              <span className="text-xs font-bold bg-indigo-200/80 text-indigo-950 px-2.5 py-0.5 rounded-full">
                Awaiting Payout
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-indigo-950 tabular-nums">
                ₹{finance.totalSalariesPending.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-indigo-900/90 mt-1.5 font-medium tabular-nums">
              Active Advances: ₹{finance.totalAdvancesActive.toLocaleString('en-IN')}
            </p>
          </div>

        </div>

        {/* Operational Cash Flow Footer Strip */}
        <div className="pt-4 border-t border-[#F0D5E4]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-semibold text-xs sm:text-sm">Operating Cash Flow (Fees Collected - Salaries Paid):</span>
            <span className={`font-black px-3.5 py-1 rounded-full text-xs sm:text-sm tabular-nums ${
              finance.netOperatingCashFlow >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {finance.netOperatingCashFlow >= 0 ? '+' : ''}₹{finance.netOperatingCashFlow.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/fees" className="text-[#8A064D] hover:underline flex items-center gap-1">
              <span>View Invoices & Receipts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/salaries" className="text-[#8A064D] hover:underline flex items-center gap-1">
              <span>Manage Guru Payroll</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Main Grid: Today's Schedule & Disciplines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Today's Classes */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-7 border border-[#F0D5E4] shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#F0D5E4]/60">
            <div>
              <h2 className="text-xl font-black text-[#2D041A]">Today's Class Schedule & Live Attendance</h2>
              <p className="text-xs text-[#6E3955] mt-1 font-semibold">Real-time attendance monitor & Guru verified sessions</p>
            </div>
            <Link 
              href="/schedule" 
              className="text-xs font-bold text-[#8A064D] hover:underline flex items-center gap-1.5 cursor-pointer bg-[#FFF2F8] px-3 py-1.5 rounded-xl border border-[#F0D5E4]"
            >
              <span>Full Schedule</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-14 bg-gray-50/70 rounded-2xl border border-dashed border-[#F0D5E4]">
              <Clock className="w-9 h-9 text-gray-400 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-700">No class sessions scheduled for today</p>
              <p className="text-xs text-gray-500 mt-1">Sessions can be scheduled from the Schedule tab or Batches view.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {todaySessions.map((session) => (
                <div 
                  key={session.id}
                  className="p-4 rounded-2xl border border-[#F0D5E4] hover:border-[#8A064D]/40 bg-white hover:bg-[#FFF9FB]/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#8A064D] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <Clock className="w-5 h-5 text-[#F9E33A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-base text-[#2D041A]">{session.batch_name}</span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#8A064D] border border-rose-200">
                          {session.course_title}
                        </span>
                        {session.room_or_hall && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
                            <span>🏛️</span>
                            <span>{session.room_or_hall}</span>
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-700 mt-1">
                        Guru: <span className="font-bold text-[#2D041A]">{session.trainer_name}</span>
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5 font-medium tabular-nums">
                        Timing: <span className="font-semibold text-gray-800">{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status & Attendance */}
                  <div className="flex items-center gap-3.5 sm:self-center">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-700 tabular-nums">
                        {session.present_count || 0} / {session.total_enrolled || 0} Present
                      </div>
                      <span className={`inline-block mt-1 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
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

        {/* Right Column: Disciplines & Campus Details */}
        <div className="space-y-6">
          
          {/* Disciplines Breakdown Card */}
          <div className="bg-white rounded-3xl p-7 border border-[#F0D5E4] shadow-xs">
            <h2 className="text-lg font-black text-[#2D041A] mb-1">Academy Disciplines</h2>
            <p className="text-xs text-[#6E3955] mb-5 font-semibold">Catalog distribution of 18 courses</p>

            <div className="space-y-3.5">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-gray-800">{cat.name}</span>
                    <span className="font-black text-[#8A064D] tabular-nums">{cat.count} Courses</span>
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

            <div className="mt-7 pt-5 border-t border-[#F0D5E4]/60">
              <Link
                href="/courses"
                className="w-full bg-[#FFF9FB] hover:bg-[#FDF2F7] active:scale-[0.98] text-[#8A064D] border border-[#F0D5E4] font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Manage Course Fees & Catalog</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8A064D]" />
              </Link>
            </div>
          </div>

          {/* Academy Location & Branch Card */}
          <div className="bg-[#590231] text-white rounded-3xl p-7 border border-[#F9E33A]/40 shadow-md space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#8A064D] flex items-center justify-center text-[#F9E33A] shadow-xs">
                <MapPin className="w-4 h-4 text-[#F9E33A]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Main Cultural Campus</h3>
                <p className="text-[11px] text-[#F9E33A] font-bold">Vindhyagiri, Bangalore</p>
              </div>
            </div>
            <p className="text-xs text-rose-100/90 leading-relaxed font-medium">
              Official center for Kuchipudi, Bharatanatyam, Carnatic Vocal, Kalaripayattu, and Fine Arts certification.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-[#F9E33A]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>State Board Certified Cultural Curriculum</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

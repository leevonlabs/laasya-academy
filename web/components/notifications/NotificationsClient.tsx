'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  CreditCard, 
  Banknote, 
  MessageSquare, 
  Video, 
  Check, 
  CheckCheck, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  IndianRupee,
  Layers,
  GraduationCap
} from 'lucide-react';

export interface AcademyNotification {
  id: string;
  category: 'payment' | 'salary' | 'message' | 'video';
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  amount?: number;
  actorName: string;
  actorRole: string;
  actionUrl: string;
  actionLabel: string;
  metadata?: {
    course?: string;
    batch?: string;
    invoiceNo?: string;
    receiptNo?: string;
    videoDuration?: string;
  };
}

const INITIAL_NOTIFICATIONS: AcademyNotification[] = [
  // 1. Student Payments
  {
    id: 'notif-pay-1',
    category: 'payment',
    title: 'Student Tuition Fee Received',
    description: 'Aditi Sundaram paid ₹2,000 for October 2026 tuition fee via UPI. Receipt #LCA-REC-2026-10-006 generated.',
    timestamp: '10 minutes ago',
    unread: true,
    amount: 2000,
    actorName: 'Aditi Sundaram',
    actorRole: 'Disciple (LCA-6)',
    actionUrl: '/finance/fees',
    actionLabel: 'View Payment Receipt',
    metadata: {
      course: 'Bharatanatyam',
      batch: 'Batch A (Beginners)',
      receiptNo: 'LCA-REC-2026-10-006'
    }
  },
  {
    id: 'notif-pay-2',
    category: 'payment',
    title: 'Advance Fee Payment Credited',
    description: 'Rohan Mehra deposited ₹4,500 advance tuition. Balance credit of ₹500 applied for upcoming month cycle.',
    timestamp: '2 hours ago',
    unread: true,
    amount: 4500,
    actorName: 'Rohan Mehra',
    actorRole: 'Disciple (LCA-12)',
    actionUrl: '/finance/fees',
    actionLabel: 'View Invoice Record',
    metadata: {
      course: 'Carnatic Music',
      batch: 'Vocal Intermediate',
      receiptNo: 'LCA-REC-2026-10-019'
    }
  },
  {
    id: 'notif-pay-3',
    category: 'payment',
    title: 'New Admission Fee Confirmed',
    description: 'Ananya Sharma completed registration and paid initial admission fee of ₹3,000 for Kuchipudi Foundation.',
    timestamp: 'Yesterday at 5:15 PM',
    unread: false,
    amount: 3000,
    actorName: 'Ananya Sharma',
    actorRole: 'New Disciple (LCA-34)',
    actionUrl: '/students',
    actionLabel: 'Inspect Disciple Profile',
    metadata: {
      course: 'Kuchipudi',
      batch: 'Foundation Batch 1',
      receiptNo: 'LCA-REC-2026-10-022'
    }
  },

  // 2. Guru Salary Credits
  {
    id: 'notif-sal-1',
    category: 'salary',
    title: 'Guru Monthly Salary Disbursed',
    description: 'October honorarium of ₹42,500 successfully transferred to Guru Nandana (Senior Bharatanatyam Faculty). Payslip ready for download.',
    timestamp: '3 hours ago',
    unread: true,
    amount: 42500,
    actorName: 'Guru Nandana',
    actorRole: 'Senior Dance Faculty',
    actionUrl: '/finance/salaries',
    actionLabel: 'View Salary Payslip',
    metadata: {
      course: 'Bharatanatyam',
      invoiceNo: 'LCA-SAL-2026-10-01'
    }
  },
  {
    id: 'notif-sal-2',
    category: 'salary',
    title: 'Tally Class Honorarium Credited',
    description: 'Rescheduled compensation class honorarium of ₹3,500 approved for Acharya Vidyashankar for Hall 2 extra sessions.',
    timestamp: 'Yesterday at 3:30 PM',
    unread: false,
    amount: 3500,
    actorName: 'Acharya Vidyashankar',
    actorRole: 'Carnatic Vocal Faculty',
    actionUrl: '/finance/salaries',
    actionLabel: 'Review Disbursal Details',
    metadata: {
      course: 'Carnatic Music',
      invoiceNo: 'LCA-SAL-2026-10-02'
    }
  },

  // 3. Messages & Inquiries from Gurus
  {
    id: 'notif-msg-1',
    category: 'message',
    title: 'Guru Message: Repertoire Practice Request',
    description: 'Guru Amrutha sent a broadcast notice for students of Mudra Batch regarding upcoming Navarasa recital rehearsals on Saturday.',
    timestamp: '25 minutes ago',
    unread: true,
    actorName: 'Guru Amrutha',
    actorRole: 'Bharatanatyam Faculty',
    actionUrl: '/messages',
    actionLabel: 'Open Academy Messages',
    metadata: {
      course: 'Bharatanatyam',
      batch: 'Mudra Batch'
    }
  },
  {
    id: 'notif-msg-2',
    category: 'message',
    title: 'Guru Leave Notice & Substitution Request',
    description: 'Guru Manjunath requested substitution coverage for Western Dance Kids Batch on Thursday due to interstate dance adjudication.',
    timestamp: '5 hours ago',
    unread: false,
    actorName: 'Guru Manjunath',
    actorRole: 'Western Dance Faculty',
    actionUrl: '/tally-classes',
    actionLabel: 'Manage Class Reschedule',
    metadata: {
      course: 'Western Dance',
      batch: 'Kids Batch'
    }
  },

  // 4. Video Shares from Gurus
  {
    id: 'notif-vid-1',
    category: 'video',
    title: 'New Choreography Video Shared',
    description: 'Guru Vismaya uploaded a new practice recording: "Alarippu - Tisra Eka Tala Demonstrations & Adavu Breakdowns" for batch students.',
    timestamp: '45 minutes ago',
    unread: true,
    actorName: 'Guru Vismaya',
    actorRole: 'Bharatanatyam Faculty',
    actionUrl: '/videos',
    actionLabel: 'Watch Video & Curriculum',
    metadata: {
      course: 'Bharatanatyam',
      batch: 'Spanda Batch',
      videoDuration: '14 mins 20 secs'
    }
  },
  {
    id: 'notif-vid-2',
    category: 'video',
    title: 'Riyaz Warmup Tutorial Uploaded',
    description: 'Acharya Vidyashankar uploaded high-fidelity riyaz audio-video exercise: "Akaram & Sarali Varisai Scales in Mayamalavagowla".',
    timestamp: '4 hours ago',
    unread: true,
    actorName: 'Acharya Vidyashankar',
    actorRole: 'Vocal Department Head',
    actionUrl: '/videos',
    actionLabel: 'Play Academy Tutorial',
    metadata: {
      course: 'Carnatic Music',
      batch: 'All Vocal Disciples',
      videoDuration: '22 mins 10 secs'
    }
  },
  {
    id: 'notif-vid-3',
    category: 'video',
    title: 'Kalaripayattu Footwork Drill Shared',
    description: 'Guru Vrushhabh Prakash uploaded "Meippayattu Stances & Chuvadukal Level 2" for martial arts weekend students.',
    timestamp: '2 days ago',
    unread: false,
    actorName: 'Guru Vrushhabh Prakash',
    actorRole: 'Kalaripayattu Master',
    actionUrl: '/videos',
    actionLabel: 'View Video Archive',
    metadata: {
      course: 'Kalaripayattu',
      batch: 'Kalari Batch',
      videoDuration: '18 mins 45 secs'
    }
  }
];

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<AcademyNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'payment' | 'salary' | 'message' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const unreadCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);
  const paymentCount = useMemo(() => notifications.filter(n => n.category === 'payment').length, [notifications]);
  const salaryCount = useMemo(() => notifications.filter(n => n.category === 'salary').length, [notifications]);
  const messageCount = useMemo(() => notifications.filter(n => n.category === 'message').length, [notifications]);
  const videoCount = useMemo(() => notifications.filter(n => n.category === 'video').length, [notifications]);

  // Mark all as read
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Toggle single item
  const handleToggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab !== 'all' && n.category !== activeTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.actorName.toLowerCase().includes(q) ||
        (n.metadata?.course && n.metadata.course.toLowerCase().includes(q)) ||
        (n.metadata?.batch && n.metadata.batch.toLowerCase().includes(q))
      );
    });
  }, [notifications, activeTab, searchQuery]);

  const getCategoryConfig = (cat: AcademyNotification['category']) => {
    switch (cat) {
      case 'payment':
        return {
          icon: CreditCard,
          label: 'Student Payment',
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-800',
          badgeBorder: 'border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-800'
        };
      case 'salary':
        return {
          icon: Banknote,
          label: 'Guru Salary Credit',
          badgeBg: 'bg-indigo-50',
          badgeText: 'text-indigo-800',
          badgeBorder: 'border-indigo-200',
          iconBg: 'bg-indigo-100 text-indigo-800'
        };
      case 'message':
        return {
          icon: MessageSquare,
          label: 'Guru Message',
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-800',
          badgeBorder: 'border-amber-200',
          iconBg: 'bg-amber-100 text-amber-800'
        };
      case 'video':
        return {
          icon: Video,
          label: 'Guru Video Share',
          badgeBg: 'bg-[#FFF2F8]',
          badgeText: 'text-[#8A064D]',
          badgeBorder: 'border-[#F0D5E4]',
          iconBg: 'bg-rose-100 text-[#8A064D]'
        };
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D] shrink-0 shadow-2xs">
            <Bell className="w-6 h-6 text-[#8A064D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-full border border-rose-100">
                Live Academy Activity Feed
              </span>
              {unreadCount > 0 ? (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {unreadCount} Unread
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  All Caught Up
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-[#2D041A] tracking-tight mt-1">
              Academy Notifications &amp; Alerts
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Real-time feed of student fee collections, guru salary disbursements, incoming faculty messages, and shared tutorial videos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-4 py-2.5 rounded-2xl bg-[#FFF2F8] hover:bg-rose-100 border border-[#F0D5E4] text-[#8A064D] text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 text-[#8A064D]" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Payments Card */}
        <div 
          onClick={() => setActiveTab('payment')}
          className={`p-4 rounded-3xl border transition cursor-pointer flex items-center gap-3.5 shadow-xs ${
            activeTab === 'payment' ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-white border-[#F0D5E4] hover:border-emerald-300'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Student Payments</p>
            <p className="text-xl font-black text-emerald-800 leading-tight">{paymentCount} Alerts</p>
          </div>
        </div>

        {/* Salary Credits Card */}
        <div 
          onClick={() => setActiveTab('salary')}
          className={`p-4 rounded-3xl border transition cursor-pointer flex items-center gap-3.5 shadow-xs ${
            activeTab === 'salary' ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20' : 'bg-white border-[#F0D5E4] hover:border-indigo-300'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Guru Salary Credits</p>
            <p className="text-xl font-black text-indigo-800 leading-tight">{salaryCount} Credits</p>
          </div>
        </div>

        {/* Messages Card */}
        <div 
          onClick={() => setActiveTab('message')}
          className={`p-4 rounded-3xl border transition cursor-pointer flex items-center gap-3.5 shadow-xs ${
            activeTab === 'message' ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20' : 'bg-white border-[#F0D5E4] hover:border-amber-300'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Guru Messages</p>
            <p className="text-xl font-black text-amber-800 leading-tight">{messageCount} Notices</p>
          </div>
        </div>

        {/* Video Shares Card */}
        <div 
          onClick={() => setActiveTab('video')}
          className={`p-4 rounded-3xl border transition cursor-pointer flex items-center gap-3.5 shadow-xs ${
            activeTab === 'video' ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-500/20' : 'bg-white border-[#F0D5E4] hover:border-rose-300'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FFF2F8] text-[#8A064D] border border-rose-200 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Guru Video Shares</p>
            <p className="text-xl font-black text-[#8A064D] leading-tight">{videoCount} Uploads</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#8A064D] text-white shadow-xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'payment'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Student Payments ({paymentCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('salary')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'salary'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Guru Salary ({salaryCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('message')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'message'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Guru Messages ({messageCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-[#8A064D] text-white shadow-xs'
                  : 'bg-[#FFF2F8] text-[#8A064D] hover:bg-rose-100 border border-[#F0D5E4]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Shares ({videoCount})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-[#F0D5E4] shadow-xs">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#2D041A]">No Notifications Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              There are no notifications matching your selected category or filter query.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const config = getCategoryConfig(notif.category);
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-3xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                  notif.unread
                    ? 'bg-white border-[#F0D5E4] ring-1 ring-[#8A064D]/15'
                    : 'bg-white/70 border-gray-100 hover:bg-white'
                }`}
              >
                {/* Left: Icon & Content */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${config.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                        {config.label}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.timestamp}
                      </span>
                      {notif.unread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Unread notification" />
                      )}
                    </div>

                    <h3 className="text-sm font-black text-[#2D041A]">
                      {notif.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed font-normal">
                      {notif.description}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                      <span className="font-bold text-gray-800">
                        {notif.actorName} <span className="font-normal text-gray-500">({notif.actorRole})</span>
                      </span>
                      {notif.amount !== undefined && (
                        <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ₹{notif.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                      {notif.metadata?.course && (
                        <span className="font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                          {notif.metadata.course}
                        </span>
                      )}
                      {notif.metadata?.batch && (
                        <span className="font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                          {notif.metadata.batch}
                        </span>
                      )}
                      {notif.metadata?.videoDuration && (
                        <span className="font-semibold text-[#8A064D] bg-[#FFF2F8] px-2 py-0.5 rounded-md border border-rose-100">
                          Duration: {notif.metadata.videoDuration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleToggleRead(notif.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer text-xs font-semibold"
                    title={notif.unread ? 'Mark as read' : 'Mark as unread'}
                  >
                    {notif.unread ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-gray-400" />}
                  </button>

                  <Link
                    href={notif.actionUrl}
                    className="px-4 py-2 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>{notif.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

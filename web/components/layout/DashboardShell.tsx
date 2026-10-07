'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  Clock, 
  ClipboardCheck, 
  Settings, 
  Receipt, 
  Banknote,
  TrendingDown,
  Megaphone,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Calendar as CalendarIcon,
  Sparkles,
  Video
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

interface Props {
  user: {
    fullName?: string;
    email?: string;
    role?: string;
  };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: Props) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('laasya_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('laasya_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    { label: 'Overview', href: '/overview', icon: LayoutDashboard },
    { label: 'Student Fees', href: '/fees', icon: Receipt },
    { label: 'Guru Salaries', href: '/salaries', icon: Banknote },
    { label: 'Expenses', href: '/expenses', icon: TrendingDown },
    { label: 'Announcements', href: '/announcements', icon: Megaphone },
    { label: 'Reports & Audits', href: '/reports', icon: BarChart3 },
    { label: 'Courses (18)', href: '/courses', icon: BookOpen },
    { label: 'Gurus (14)', href: '/trainers', icon: Users },
    { label: 'Students', href: '/students', icon: GraduationCap },
    { label: 'Batches', href: '/batches', icon: Calendar },
    { label: 'Video Library', href: '/video-library', icon: Video },
    { label: 'Today Schedule', href: '/schedule', icon: Clock },
    { label: 'Attendance Audit', href: '/attendance', icon: ClipboardCheck },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const currentNavItem = navItems.find(item => 
    pathname === item.href || (item.href !== '/overview' && pathname.startsWith(`${item.href}/`))
  ) || navItems[0];

  return (
    <div className="min-h-screen flex bg-[#FFF9FB]" suppressHydrationWarning>
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        suppressHydrationWarning
        className={`fixed md:sticky top-0 h-screen bg-[#590231] text-white flex flex-col shrink-0 border-r border-[#8A064D]/50 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        
        {/* Minimize / Close Arrow Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3.5 top-6 z-30 w-7 h-7 rounded-full bg-[#590231] hover:bg-[#8A064D] text-[#F9E33A] border-2 border-[#F9E33A] shadow-xl items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar (Full View)" : "Minimize / Close Sidebar (Icon View)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[#F9E33A]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#F9E33A]" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute right-3 top-3 p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-[#8A064D]"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Brand Header */}
        <div className="px-3 pt-3 pb-3 border-b border-[#8A064D]/60 bg-[#3F0123]/80 shrink-0">
          <div className="flex flex-col items-center text-center overflow-hidden">
            {!isCollapsed ? (
              <div className="flex flex-col items-center gap-1 w-full">
                <div className="w-full relative flex items-center justify-center">
                  <Image 
                    src="/academy_illustration.png" 
                    alt="Laasya Cultural Academy Arts" 
                    width={220} 
                    height={100} 
                    className="w-full max-w-[210px] h-auto object-contain drop-shadow-md transition-all duration-200"
                    priority
                  />
                </div>
                <div className="w-full flex items-center justify-center px-1">
                  <Image 
                    src="/header_logo.png" 
                    alt="Laasya Cultural Academy Logo" 
                    width={210} 
                    height={70} 
                    className="w-full max-w-[200px] h-auto object-contain drop-shadow-md transition-all duration-200"
                    priority
                  />
                </div>
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#2D041A] border-2 border-[#F9E33A] flex items-center justify-center shadow-md">
                <span className="font-serif font-black text-base text-[#F9E33A]">LC</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <div className="px-3 pt-1 pb-2 text-[11px] font-black uppercase tracking-wider text-[#F9E33A]/90 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#F9E33A]" />
              <span>Academy Management</span>
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/overview' && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5'} rounded-xl text-[15px] font-bold transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-[#8A064D] text-white shadow-sm ring-1 ring-[#F9E33A]/50 font-black'
                    : 'text-rose-100/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && !isCollapsed && (
                  <span className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-[#F9E33A] rounded-full" />
                )}

                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 pl-1.5'} min-w-0`}>
                  <Icon className={`w-5 h-5 text-[#F9E33A] shrink-0 ${isActive ? 'scale-110 drop-shadow-xs' : 'group-hover:scale-110'} transition-transform`} />
                  {!isCollapsed && (
                    <span className="truncate tracking-wide">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Director Profile & Logout Footer */}
        <div className="p-3 border-t border-[#8A064D]/60 bg-[#3F0123]/90 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8A064D] to-[#73023E] border border-[#F9E33A] flex items-center justify-center font-black text-xs text-[#F9E33A] shadow-xs shrink-0">
                AD
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {user.fullName || 'Academy Director'}
                  </p>
                  <p className="text-[11px] text-[#F9E33A] truncate font-semibold">
                    Owner & Director
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && <LogoutButton />}
          </div>
        </div>

      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#F0D5E4] px-4 md:px-8 flex items-center justify-between shrink-0 shadow-xs sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#8A064D] hover:bg-rose-50"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Toggle Button in Header */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-[#8A064D] bg-[#FFF2F8] hover:bg-[#FCE7F3] border border-[#F0D5E4] transition cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isCollapsed ? "Expand Menu" : "Minimize Menu"}</span>
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-gray-500 uppercase tracking-wider">
                Laasya Portal
              </span>
              <span className="text-gray-300">/</span>
              <span className="font-bold text-[#590231] uppercase tracking-wider">
                {currentNavItem.label.replace(/\s*\(\d+\)/, '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Date Chip */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF2F8] border border-[#F0D5E4] text-[#6E3955] text-xs font-bold tabular-nums">
              <CalendarIcon className="w-3.5 h-3.5 text-[#8A064D]" />
              <span>Oct 2026 • Term II</span>
            </div>

            {/* Online Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Director Active</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>

    </div>
  );
}

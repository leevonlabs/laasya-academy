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
  ChevronLeft,
  ChevronRight,
  Menu,
  X
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
    { label: 'Student Fees', href: '/fees', icon: Receipt, badge: 'Finance' },
    { label: 'Guru Salaries', href: '/salaries', icon: Banknote, badge: 'Payroll' },
    { label: 'Courses (18)', href: '/courses', icon: BookOpen },
    { label: 'Gurus (14)', href: '/trainers', icon: Users },
    { label: 'Students', href: '/students', icon: GraduationCap },
    { label: 'Batches', href: '/batches', icon: Calendar },
    { label: 'Today Schedule', href: '/schedule', icon: Clock },
    { label: 'Attendance Audit', href: '/attendance', icon: ClipboardCheck },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#FFF9FB]">
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed md:sticky top-0 h-screen bg-[#590231] text-white flex flex-col shrink-0 border-r border-[#8A064D]/40 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-76'
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
        <div className="p-4 border-b border-[#8A064D]/50 bg-[#3F0123]/70 shrink-0">
          <div className="flex flex-col items-center text-center overflow-hidden">
            {!isCollapsed ? (
              <>
                <Image 
                  src="/header_logo.png" 
                  alt="Laasya Cultural Academy Logo" 
                  width={210} 
                  height={58} 
                  className="object-contain drop-shadow-md transition-all duration-200"
                  priority
                />
                <p className="text-[#F9E33A] text-[9.5px] font-bold tracking-widest uppercase mt-1.5 whitespace-nowrap">
                  Unlock Your Talent
                </p>
              </>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8A064D] to-[#2D041A] border-2 border-[#F9E33A] flex items-center justify-center shadow-md">
                <span className="font-serif font-black text-base text-[#F9E33A]">LC</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#F9E33A]">
              Academy Management
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'} rounded-2xl text-[14px] font-semibold transition group border ${
                  isActive
                    ? 'bg-[#8A064D] text-white border-[#F9E33A] shadow-md'
                    : 'text-rose-100/90 hover:bg-[#740340] hover:text-white border-transparent hover:border-[#F9E33A]/30'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} min-w-0`}>
                  <Icon className={`w-5 h-5 text-[#F9E33A] shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-[#F9E33A] text-[#2D041A] shrink-0">
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F9E33A] absolute top-2 right-2" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Director Profile & Logout Footer */}
        <div className="p-3 border-t border-[#8A064D]/50 bg-[#3F0123]/90 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-[#8A064D] border border-[#F9E33A] flex items-center justify-center font-bold text-xs text-white shrink-0">
                AD
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.fullName || 'Academy Director'}
                  </p>
                  <p className="text-[10px] text-[#F9E33A] truncate font-medium">
                    Owner / Administrator
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
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#8A064D] bg-[#FFF2F8] hover:bg-[#FCE7F3] border border-[#F0D5E4] transition cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              <span>{isCollapsed ? "Expand Menu" : "Minimize Menu"}</span>
            </button>

            <div className="hidden sm:block">
              <span className="text-xs font-bold text-[#8A064D] uppercase tracking-wider">
                Laasya Cultural Academy Portal
              </span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-xs text-gray-500 font-medium">
                Vindhyagiri, Bangalore
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#FFF9FB] px-3 py-1.5 rounded-full border border-[#F0D5E4] text-xs font-semibold text-[#8A064D]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Supabase Cloud Connected</span>
              <span className="sm:hidden">Online</span>
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

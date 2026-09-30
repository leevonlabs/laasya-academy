import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar, 
  Clock, 
  ClipboardCheck, 
  Settings, 
  LogOut,
  Sparkles,
  ExternalLink,
  Receipt,
  Banknote
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Route protection: If not logged in as owner, redirect to login
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

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
      
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-[#590231] text-white flex flex-col shrink-0 border-r border-[#8A064D]/40 shadow-2xl relative z-20">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-[#8A064D]/50 bg-[#3F0123]/70">
          <div className="flex flex-col items-center text-center">
            <Image 
              src="/header_logo.png" 
              alt="Laasya Cultural Academy Logo" 
              width={220} 
              height={62} 
              className="object-contain drop-shadow-md"
              priority
            />
            <p className="text-[#F9E33A] text-[10px] font-bold tracking-widest uppercase mt-2">
              Unlock Your Talent
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-[#F9E33A]">
            Academy Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-[14.5px] font-semibold text-rose-50 hover:bg-[#8A064D] hover:text-white transition group border border-transparent hover:border-[#F9E33A]/40 shadow-xs hover:shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5 text-[#F9E33A] group-hover:scale-110 transition-transform shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9.5px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-[#F9E33A] text-[#2D041A]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Director Profile & Logout Footer */}
        <div className="p-4 border-t border-[#8A064D]/50 bg-[#3F0123]/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-[#8A064D] border border-[#F9E33A] flex items-center justify-center font-bold text-xs text-white shrink-0">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {user.fullName || 'Academy Director'}
                </p>
                <p className="text-[10px] text-[#F9E33A] truncate font-medium">
                  Owner / Administrator
                </p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>

      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#F0D5E4] px-8 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-10">
          <div>
            <span className="text-xs font-semibold text-[#8A064D] uppercase tracking-wider">
              Laasya Cultural Academy Portal
            </span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-xs text-gray-500">
              Hyderabad, India
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#FFF9FB] px-3 py-1.5 rounded-full border border-[#F0D5E4] text-xs font-medium text-[#8A064D]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Cloud Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>

    </div>
  );
}

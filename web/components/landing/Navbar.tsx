'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Send,
  LogIn,
  ChevronDown,
  GraduationCap,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnquiry } from './EnquiryContext';

const links = [
  { label: 'Home', href: '/#home' },
  { label: 'About Us', href: '/#story' },
  { label: 'Student App', href: '/#mobile-app' },
  { label: 'Courses & Batches', href: '/#programs' },
  { label: 'Our Gurus', href: '/#faculty' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement>(null);

  // Safe enquiry hook consumption
  let selectedBatchesCount = 0;
  let openEnquiryModal = () => {};
  try {
    const enquiry = useEnquiry();
    selectedBatchesCount = enquiry.selectedBatches.length;
    openEnquiryModal = enquiry.openEnquiryModal;
  } catch (_) {
    // If rendered without provider
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close login dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target as Node)) {
        setLoginMenuOpen(false);
      }
    }
    if (loginMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [loginMenuOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLoginMenuOpen(false);
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300 w-full',
        scrolled
          ? 'bg-[#3d0c34]/95 shadow-warm backdrop-blur-md py-2 sm:py-2.5'
          : 'bg-[#3d0c34]/85 backdrop-blur-sm sm:bg-transparent py-2 sm:py-4'
      )}
    >
      <div className="w-full max-w-[1650px] mx-auto flex items-center justify-between px-2.5 sm:px-8 lg:px-12 xl:px-16">
        {/* Brand Logo & Name - Responsive to prevent overlapping on mobile */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink mr-1 sm:mr-0">
          <img
            src="/images/laasya_logo.png"
            alt="Laasya Cultural Academy logo"
            className="h-8 w-8 sm:h-11 sm:w-11 shrink-0 object-contain drop-shadow"
          />
          <span className="leading-tight min-w-0">
            <span className="block font-display text-[13px] sm:text-base md:text-lg lg:text-xl font-bold text-[#fbf0b9] tracking-tight sm:tracking-wide whitespace-nowrap truncate">
              <span className="sm:hidden">Laasya Academy</span>
              <span className="hidden sm:inline">Laasya Cultural Academy</span>
            </span>
            <span className="hidden sm:block text-[0.48rem] sm:text-[0.62rem] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.28em] text-white/80 whitespace-nowrap">
              Unleash Your Talent
            </span>
          </span>
        </Link>

        {/* Desktop Single-Line Navigation */}
        <nav className="hidden items-center gap-1 xl:gap-2 lg:flex shrink-0">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white/95 whitespace-nowrap transition-colors hover:bg-white/10 hover:text-[#fbf0b9] shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons: Login (Desktop + Mobile top-right) & Enquiry & Menu */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Universal Login Button with Dropdown (Visible on Desktop AND Mobile top-right) */}
          <div ref={loginMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setLoginMenuOpen((v) => !v)}
              aria-expanded={loginMenuOpen}
              aria-haspopup="true"
              className="inline-flex items-center gap-0.5 sm:gap-1.5 rounded-full bg-gold-gradient px-2 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs md:text-sm font-bold text-[#220314] shadow-gold transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>Login</span>
              <ChevronDown
                className={cn(
                  'h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 transition-transform duration-200',
                  loginMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* 3 Login Options Dropdown */}
            {loginMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#2E051D]/98 border border-[#F9E33A]/50 shadow-2xl backdrop-blur-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-[#F9E33A]">
                    Select Portal (3 Types)
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-white/70 bg-white/10 px-1.5 py-0.5 rounded-full">
                    Academy Login
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {/* 1. Student / Parent Login */}
                  <Link
                    href="/login?role=student"
                    onClick={() => setLoginMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#590231] border border-[#F9E33A]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#F9E33A]">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#F9E33A] transition-colors truncate">
                          Student / Parent Login
                        </p>
                        <span className="text-[9px] font-semibold bg-[#DEF7EC] text-[#03543F] px-1.5 py-0.5 rounded-full">
                          Portal
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-[11px] text-white/70 line-clamp-1 mt-0.5">
                        Timetable, fee receipts & attendance
                      </p>
                    </div>
                  </Link>

                  {/* 2. Guru Login */}
                  <Link
                    href="/login?role=guru"
                    onClick={() => setLoginMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#590231] border border-[#F9E33A]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#F9E33A]">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#F9E33A] transition-colors truncate">
                          Guru Login
                        </p>
                        <span className="text-[9px] font-semibold bg-[#DEF7EC] text-[#03543F] px-1.5 py-0.5 rounded-full">
                          Portal
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-[11px] text-white/70 line-clamp-1 mt-0.5">
                        Mark attendance, batches & salary slips
                      </p>
                    </div>
                  </Link>

                  {/* 3. Admin Login */}
                  <Link
                    href="/login?role=admin"
                    onClick={() => setLoginMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#8A064D] border border-[#F9E33A]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-[#F9E33A]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#F9E33A] transition-colors truncate">
                          Admin Login
                        </p>
                        <span className="text-[9px] font-semibold bg-amber-200/90 text-amber-900 px-1.5 py-0.5 rounded-full">
                          ERP
                        </span>
                      </div>
                      <p className="text-[10.5px] sm:text-[11px] text-white/70 line-clamp-1 mt-0.5">
                        Director & Staff Management ERP
                      </p>
                    </div>
                  </Link>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 text-center">
                  <Link
                    href="/login"
                    onClick={() => setLoginMenuOpen(false)}
                    className="text-[11px] font-bold text-[#F9E33A] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Academy Sign-In Portal</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Send Enquiry Button - Compact on mobile */}
          <button
            type="button"
            onClick={openEnquiryModal}
            className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/80 bg-[#3d0c34]/70 px-2 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs md:text-sm font-semibold text-[#fbf0b9] transition-all hover:bg-[#D4AF37] hover:text-[#220314] hover:shadow-gold whitespace-nowrap cursor-pointer shrink-0"
          >
            <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden xs:inline sm:inline">Enquire</span>
            {selectedBatchesCount > 0 && (
              <span className="ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gold-gradient px-1 text-[0.6rem] font-extrabold text-[#220314] shadow">
                {selectedBatchesCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden text-xs sm:text-sm shrink-0"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {open && (
        <nav className="border-t border-[#D4AF37]/20 bg-[#3d0c34]/98 px-4 sm:px-5 py-4 backdrop-blur-md lg:hidden shadow-2xl animate-in slide-in-from-top duration-200 max-h-[85vh] overflow-y-auto">
          {/* 3 Portal Options Prominently Displayed on Mobile Drawer */}
          <div className="mb-4 bg-[#260317] p-3 rounded-2xl border border-[#D4AF37]/30 shadow-inner">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#F9E33A] mb-2 px-1">
              Portal Logins (3 Options)
            </p>
            <div className="flex flex-col gap-1.5">
              <Link
                href="/login?role=student"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#590231] border border-[#F9E33A]/50 flex items-center justify-center text-[#F9E33A]">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-[#F9E33A]">Student / Parent Login</span>
                    <span className="text-[10px] text-white/70 block">Mobile Web Portal & Timetable</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#F9E33A]" />
              </Link>

              <Link
                href="/login?role=guru"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#590231] border border-[#F9E33A]/50 flex items-center justify-center text-[#F9E33A]">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-[#F9E33A]">Guru Login</span>
                    <span className="text-[10px] text-white/70 block">Faculty Attendance & Pay Slips</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#F9E33A]" />
              </Link>

              <Link
                href="/login?role=admin"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#8A064D] border border-[#F9E33A]/50 flex items-center justify-center text-[#F9E33A]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Admin Login</span>
                    <span className="text-[10px] text-white/70 block">Director ERP & Front Desk</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-white/70" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-white/10 pt-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-white/95 transition-colors hover:bg-white/10 hover:text-[#fbf0b9]"
              >
                {link.label}
              </a>
            ))}

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openEnquiryModal();
                }}
                className="flex items-center justify-center gap-2 rounded-full border border-[#D4AF37] px-4 py-2.5 text-center text-sm font-bold text-[#fbf0b9] bg-white/5 hover:bg-white/10 transition"
              >
                <Send className="h-4 w-4" />
                <span>Send Admission Enquiry</span>
                {selectedBatchesCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold-gradient px-1.5 text-xs font-bold text-[#220314]">
                    {selectedBatchesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

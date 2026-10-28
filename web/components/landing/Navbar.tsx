'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Send } from 'lucide-react';
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

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300 w-full',
        scrolled
          ? 'bg-[#3d0c34]/95 shadow-warm backdrop-blur-md py-2 sm:py-2.5'
          : 'bg-[#3d0c34]/85 backdrop-blur-sm sm:bg-transparent py-2.5 sm:py-4'
      )}
    >
      <div className="w-full max-w-[1650px] mx-auto flex items-center justify-between px-3 sm:px-8 lg:px-12 xl:px-16">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-3 shrink-0 whitespace-nowrap">
          <img
            src="/images/laasya_logo.png"
            alt="Laasya Cultural Academy logo"
            className="h-8 w-8 sm:h-12 sm:w-12 shrink-0 object-contain drop-shadow"
          />
          <span className="leading-tight">
            <span className="block font-display text-[13px] sm:text-base md:text-lg lg:text-xl font-bold text-[#fbf0b9] tracking-tight sm:tracking-wide whitespace-nowrap">
              Laasya Cultural Academy
            </span>
            <span className="block text-[0.48rem] sm:text-[0.62rem] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.28em] text-white/80 whitespace-nowrap">
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Admin Portal Button - Strictly hidden on mobile per user requirements */}
          <Link
            href="/login"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-[#220314] shadow-gold transition-transform hover:scale-[1.03] whitespace-nowrap"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Admin Portal</span>
          </Link>

          {/* Send Enquiry Button - Compact on mobile */}
          <button
            type="button"
            onClick={openEnquiryModal}
            className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/80 bg-[#3d0c34]/70 px-2.5 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold text-[#fbf0b9] transition-all hover:bg-[#D4AF37] hover:text-[#220314] hover:shadow-gold whitespace-nowrap cursor-pointer"
          >
            <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Send Enquiry</span>
            <span className="inline sm:hidden">Enquire</span>
            {selectedBatchesCount > 0 && (
              <span className="ml-0.5 sm:ml-1 inline-flex h-4 sm:h-5 min-w-[1rem] sm:min-w-[1.25rem] items-center justify-center rounded-full bg-gold-gradient px-1 text-[0.6rem] sm:text-[0.7rem] font-extrabold text-[#220314] shadow">
                {selectedBatchesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Admin Portal button excluded from mobile per instructions) */}
      {open && (
        <nav className="border-t border-[#D4AF37]/20 bg-[#3d0c34]/98 px-5 py-5 backdrop-blur-md lg:hidden shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-1.5">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-white/95 transition-colors hover:bg-white/10 hover:text-[#fbf0b9]"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
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

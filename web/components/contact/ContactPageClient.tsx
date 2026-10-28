'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  MessageCircle, 
  ExternalLink, 
  Navigation, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Sections';
import { EnquiryProvider, useEnquiry } from '@/components/landing/EnquiryContext';
import { EnquiryModal } from '@/components/landing/EnquiryModal';
import { AiChatWidget } from '@/components/landing/AiChatWidget';
import type { PublicAcademyProfile } from '@/lib/academy';

interface ContactPageClientProps {
  contactProfile?: PublicAcademyProfile;
}

function ContactContent({ contactProfile }: ContactPageClientProps) {
  const { openEnquiryModal } = useEnquiry();

  const wa = contactProfile?.whatsapp_number || '+91 8151 998 899';
  const cleanWa = wa.replace(/\D/g, '');
  const campusAddress =
    contactProfile?.campus_address ||
    'VV Maple Hub, 2nd Floor above Mayura Bakery, Doddabanahalli Kannamangala, Bangalore 560115';
  const addressLines = campusAddress.split(',').map((s) => s.trim()).filter(Boolean);

  const otherContacts = (contactProfile?.contacts || []).filter(
    (c: any) => c && c.phone && !c.phone.includes('7780763121') && !c.phone.includes(wa)
  );

  const emailList = (contactProfile?.emails || []).map((e) => e.email).filter(Boolean);
  const displayEmails = emailList.length > 0 ? emailList : ['admin@laasyaacademy.com', 'admissions@laasyaacademy.com'];
  const mapUrl = contactProfile?.map_url || 'https://maps.app.goo.gl/BXwHcSPeUzExxR6V7';

  return (
    <div className="min-h-screen bg-[#FAF5F7] text-[#220314] selection:bg-[#8A064D] selection:text-white">
      <Navbar />

      <main className="pt-20 sm:pt-32 pb-8 sm:pb-16">
        <div className="mx-auto max-w-[1500px] px-3 sm:px-8 lg:px-12">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-[#8A064D] font-medium mb-3 sm:mb-6">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 font-bold">Contact &amp; Campus Location</span>
          </div>

          {/* Hero Header Banner: Compact on mobile, spacious on desktop */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-gradient-to-br from-[#3d0c34] via-[#590231] to-[#2D041A] p-4 sm:p-12 text-white shadow-warm">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#D4AF37]/60 bg-white/10 px-3 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#fbf0b9]">
                • Academy Admissions &amp; Visitor Desk
              </span>
              <h1 className="mt-2.5 sm:mt-4 font-display text-2xl sm:text-5xl font-bold leading-tight text-white">
                Contact &amp; Visit <span className="bg-gold-text italic">Laasya Cultural Academy</span>
              </h1>
              <p className="mt-2 sm:mt-3 text-xs sm:text-base text-white/85 leading-relaxed">
                We warmly invite parents, aspiring students, and art lovers to tour our academy studios, interact with our master gurus, and begin a classical journey.
              </p>

              {/* Primary Action Row with Send Enquiry Button */}
              <div className="mt-5 sm:mt-8 flex flex-wrap items-center gap-2.5 sm:gap-4">
                <button
                  type="button"
                  onClick={openEnquiryModal}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-[#220314] shadow-gold transition-transform hover:scale-[1.04] cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Send Admission Enquiry</span>
                </button>

                <a
                  href={`https://wa.me/${cleanWa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] px-5 sm:px-7 py-2.5 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.04] cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>WhatsApp Admissions</span>
                </a>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MOBILE VIEW (< md): Dedicated Native-feel Mobile Hub       */}
          {/* ========================================================= */}
          <div className="block md:hidden mt-4 space-y-3.5">
            {/* 1. Quick Tap Actions (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${wa.replace(/\s+/g, '')}`}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#D4BAC7]/70 shadow-sm active:scale-95 transition-transform"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold text-[#220314] shrink-0">
                  <Phone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Call Us</p>
                  <p className="text-xs font-bold text-[#8A064D] truncate">Direct Dial</p>
                </div>
              </a>

              <a
                href={`https://wa.me/${cleanWa}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm active:scale-95 transition-transform"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white shrink-0 shadow">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">WhatsApp</p>
                  <p className="text-xs font-bold text-emerald-900 truncate">Chat Now</p>
                </div>
              </a>

              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#D4BAC7]/70 shadow-sm active:scale-95 transition-transform"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold text-[#220314] shrink-0">
                  <Navigation className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Directions</p>
                  <p className="text-xs font-bold text-[#8A064D] truncate">Maps GPS</p>
                </div>
              </a>

              <a
                href="mailto:admin@laasyaacademy.com"
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-[#D4BAC7]/70 shadow-sm active:scale-95 transition-transform"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold text-[#220314] shrink-0">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email Us</p>
                  <p className="text-xs font-bold text-[#8A064D] truncate">Admissions</p>
                </div>
              </a>
            </div>

            {/* 2. Unified Mobile Campus Info & Studio Hours Card */}
            <div className="rounded-2xl border border-[#D4BAC7]/80 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-gradient shadow-gold text-[#220314] shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold text-[#220314]">Academy Location &amp; Hours</h3>
                  <p className="text-xs text-[#59424F] mt-1 leading-snug">{campusAddress}</p>
                  <p className="text-[11px] text-[#8A064D] font-medium mt-1">Landmark: Above Mayura Bakery, Kannamangala</p>
                </div>
              </div>

              <div className="rounded-xl bg-[#FAF5F7] p-2.5 border border-[#F0D5E4] text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#F0D5E4]">
                  <span className="text-gray-600 font-medium">Mon – Fri</span>
                  <span className="font-bold text-[#8A064D]">08:30 AM – 08:30 PM</span>
                </div>
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-gray-600 font-medium">Sat – Sun</span>
                  <span className="font-bold text-[#8A064D]">07:30 AM – 08:30 PM</span>
                </div>
              </div>
            </div>

            {/* 3. Compact Mobile Map */}
            <div className="relative rounded-2xl overflow-hidden border border-[#D4BAC7] shadow-md bg-white">
              <div className="h-48 w-full">
                <iframe
                  title="Laasya Cultural Academy Campus Google Map Mobile"
                  src="https://maps.google.com/maps?q=Laasya+Cultural+Academy,+VV+Maple+Hub,+Kannamangala,+Bangalore+560115&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-2.5 bg-[#3d0c34] flex items-center justify-between text-white">
                <span className="text-xs font-bold text-[#fbf0b9]">Kannamangala Studio</span>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold-gradient text-[11px] font-bold text-[#220314] shadow"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP VIEW (>= md): Full 3-Card Bento & Wide Map        */}
          {/* ========================================================= */}
          <div className="hidden md:block">
            {/* 3 Core Contact Cards */}
            <div className="mt-12 grid gap-6 grid-cols-3">
              {/* Card 1: Campus Address */}
              <div className="rounded-3xl border border-[#D4BAC7]/70 bg-white p-8 shadow-warm flex flex-col justify-between">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold text-[#220314]">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-[#220314]">Campus Address</h3>
                  <div className="mt-2.5 space-y-1">
                    {addressLines.map((line, idx) => (
                      <p key={idx} className="text-sm text-[#59424F]">{line}</p>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Landmark</span>
                  <p className="text-xs text-gray-500 mt-0.5">Above Mayura Bakery, Kannamangala Main Road</p>
                </div>
              </div>

              {/* Card 2: Phone & WhatsApp */}
              <div className="rounded-3xl border border-[#D4BAC7]/70 bg-white p-8 shadow-warm flex flex-col justify-between">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold text-[#220314]">
                    <Phone className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-[#220314]">Phone &amp; WhatsApp</h3>
                  <div className="mt-3 space-y-2.5">
                    <a
                      href={`https://wa.me/${cleanWa}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-sm transition-colors border border-emerald-300"
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                      <span>WhatsApp: {wa}</span>
                    </a>
                    {otherContacts.map((c: any, idx: number) => (
                      <div key={idx} className="text-sm text-[#59424F] p-1">
                        <span className="font-bold text-[#8A064D]">{c.title}:</span>{' '}
                        <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="hover:underline font-mono font-semibold">
                          {c.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Office Line</span>
                  <p className="text-xs text-gray-500 mt-0.5">Direct phone support during active academy hours</p>
                </div>
              </div>

              {/* Card 3: Email Inquiries & Timings */}
              <div className="rounded-3xl border border-[#D4BAC7]/70 bg-white p-8 shadow-warm flex flex-col justify-between">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold text-[#220314]">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-[#220314]">Email Inquiries</h3>
                  <div className="mt-3 space-y-1.5">
                    {displayEmails.map((emailStr, idx) => (
                      <a
                        key={idx}
                        href={`mailto:${emailStr}`}
                        className="block p-2 rounded-xl bg-gray-50 text-sm font-semibold text-[#8A064D] hover:bg-rose-50 hover:underline"
                      >
                        {emailStr}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Response Time</span>
                  <p className="text-xs text-gray-500 mt-0.5">Written responses sent within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Visiting Hours & Campus Schedule Box */}
            <div className="mt-8 rounded-3xl border border-[#D4BAC7]/70 bg-white p-8 shadow-warm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold text-[#220314]">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#220314]">Studio Hours &amp; Admissions Desk</h3>
                  <p className="text-xs text-[#6E3955]">Walk-in tours and admissions consultations available throughout the week</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <strong className="text-sm text-[#8A064D] block mb-1">Weekday Schedule (Mon – Fri)</strong>
                  <p className="text-[#220314] font-bold text-base">08:30 AM – 08:30 PM</p>
                  <p className="text-gray-500 mt-1">Evening batch classes, private sessions, and office desk</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                  <strong className="text-sm text-[#8A064D] block mb-1">Weekend Schedule (Sat &amp; Sun)</strong>
                  <p className="text-[#220314] font-bold text-base">07:30 AM – 08:30 PM</p>
                  <p className="text-gray-500 mt-1">Full classical dance, vocal music, instruments, and trial sessions</p>
                </div>
              </div>
            </div>

            {/* Google Maps Section */}
            <div className="mt-8 overflow-hidden rounded-3xl border-2 border-[#D4BAC7] bg-white shadow-xl">
              <div className="flex items-center justify-between gap-3 p-6 bg-[#3d0c34] text-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold shrink-0">
                    <Navigation className="h-5 w-5 text-[#220314]" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#fbf0b9]">Interactive Campus Map · Bengaluru</h3>
                    <p className="text-xs text-white/80">{campusAddress}</p>
                  </div>
                </div>

                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold text-[#220314] shadow-gold hover:scale-[1.03] transition-transform shrink-0 cursor-pointer"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="relative aspect-[21/9] w-full min-h-[420px] bg-[#FAF5F7]">
                <iframe
                  title="Laasya Cultural Academy Campus Google Map Desktop"
                  src="https://maps.google.com/maps?q=Laasya+Cultural+Academy,+VV+Maple+Hub,+Kannamangala,+Bangalore+560115&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer contactProfile={contactProfile} />
      <EnquiryModal whatsappNumber={contactProfile?.whatsapp_number} />
      <AiChatWidget 
        whatsappNumber={contactProfile?.whatsapp_number} 
        campusAddress={contactProfile?.campus_address} 
      />
    </div>
  );
}

export function ContactPageClient({ contactProfile }: ContactPageClientProps) {
  return (
    <EnquiryProvider>
      <ContactContent contactProfile={contactProfile} />
    </EnquiryProvider>
  );
}

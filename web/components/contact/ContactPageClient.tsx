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

          {/* 3 Core Contact Cards: Compact on mobile */}
          <div className="mt-5 sm:mt-12 grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-3">
            
            {/* Card 1: Campus Address */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white p-4 sm:p-8 shadow-warm flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gold-gradient shadow-gold text-[#220314]">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-3 sm:mt-4 font-display text-base sm:text-xl font-bold text-[#220314]">
                  Campus Address
                </h3>
                <div className="mt-2 space-y-0.5 sm:space-y-1">
                  {addressLines.map((line, idx) => (
                    <p key={idx} className="text-xs sm:text-sm text-[#59424F]">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Landmark</span>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Above Mayura Bakery, Kannamangala Main Road</p>
              </div>
            </div>

            {/* Card 2: Phone & WhatsApp */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white p-4 sm:p-8 shadow-warm flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gold-gradient shadow-gold text-[#220314]">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-3 sm:mt-4 font-display text-base sm:text-xl font-bold text-[#220314]">
                  Phone &amp; WhatsApp
                </h3>
                <div className="mt-2.5 sm:mt-3 space-y-2">
                  <a
                    href={`https://wa.me/${cleanWa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs sm:text-sm transition-colors border border-emerald-300"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366] shrink-0" />
                    <span>WhatsApp: {wa}</span>
                  </a>
                  {otherContacts.map((c: any, idx: number) => (
                    <div key={idx} className="text-xs sm:text-sm text-[#59424F] p-0.5 sm:p-1">
                      <span className="font-bold text-[#8A064D]">{c.title}:</span>{' '}
                      <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="hover:underline font-mono font-semibold">
                        {c.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Office Line</span>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Direct phone support during active academy hours</p>
              </div>
            </div>

            {/* Card 3: Email Inquiries & Timings */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white p-4 sm:p-8 shadow-warm flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gold-gradient shadow-gold text-[#220314]">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-3 sm:mt-4 font-display text-base sm:text-xl font-bold text-[#220314]">
                  Email Inquiries
                </h3>
                <div className="mt-2.5 sm:mt-3 space-y-1 sm:space-y-1.5">
                  {displayEmails.map((emailStr, idx) => (
                    <a
                      key={idx}
                      href={`mailto:${emailStr}`}
                      className="block p-1.5 sm:p-2 rounded-xl bg-gray-50 text-xs sm:text-sm font-semibold text-[#8A064D] hover:bg-rose-50 hover:underline"
                    >
                      {emailStr}
                    </a>
                  ))}
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A064D] uppercase tracking-wider block">Response Time</span>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Written responses sent within 24 hours</p>
              </div>
            </div>

          </div>

          {/* Visiting Hours & Campus Schedule Box: Compact on mobile */}
          <div className="mt-4 sm:mt-8 rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white p-4 sm:p-8 shadow-warm">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-gold-gradient shadow-gold text-[#220314]">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div>
                <h3 className="font-display text-base sm:text-xl font-bold text-[#220314]">
                  Studio Hours &amp; Admissions Desk
                </h3>
                <p className="text-[11px] sm:text-xs text-[#6E3955]">
                  Walk-in tours and admissions consultations available throughout the week
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 text-xs sm:text-sm">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                <strong className="text-xs sm:text-sm text-[#8A064D] block mb-0.5 sm:mb-1">Weekday Schedule (Mon – Fri)</strong>
                <p className="text-[#220314] font-bold text-sm sm:text-base">08:30 AM – 08:30 PM</p>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Evening batch classes, private sessions, and office desk</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]">
                <strong className="text-xs sm:text-sm text-[#8A064D] block mb-0.5 sm:mb-1">Weekend Schedule (Sat &amp; Sun)</strong>
                <p className="text-[#220314] font-bold text-sm sm:text-base">07:30 AM – 08:30 PM</p>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Full classical dance, vocal music, instruments, and trial sessions</p>
              </div>
            </div>
          </div>

          {/* Google Maps Section: Mobile responsive */}
          <div className="mt-4 sm:mt-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4BAC7] sm:border-2 bg-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-6 bg-[#3d0c34] text-white">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gold-gradient shadow-gold shrink-0">
                  <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-[#220314]" />
                </span>
                <div>
                  <h3 className="font-display text-sm sm:text-xl font-bold text-[#fbf0b9]">
                    Interactive Campus Map · Bengaluru
                  </h3>
                  <p className="text-[0.68rem] sm:text-xs text-white/80 line-clamp-1 sm:line-clamp-none">
                    {campusAddress}
                  </p>
                </div>
              </div>

              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-gold-gradient px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-[#220314] shadow-gold hover:scale-[1.03] transition-transform shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </a>
            </div>

            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full min-h-[220px] sm:min-h-[420px] bg-[#FAF5F7]">
              <iframe
                title="Laasya Cultural Academy Campus Google Map"
                src="https://maps.google.com/maps?q=Laasya+Cultural+Academy,+VV+Maple+Hub,+Kannamangala,+Bangalore+560115&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
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

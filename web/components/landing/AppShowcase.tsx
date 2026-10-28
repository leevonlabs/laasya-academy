'use client';

import React, { useState } from 'react';
import { 
  BellRing, 
  Video, 
  Award, 
  Bot, 
  Film, 
  Receipt, 
  Smartphone, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { Reveal } from './Reveal';

export function AppShowcase() {
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);

  const screens = [
    {
      id: 'dashboard',
      title: 'Student Dashboard',
      subtitle: 'Attendance & Announcements',
      image: '/images/mockups/dashboard_screen.png',
      badge: 'Home View',
    },
    {
      id: 'videos',
      title: 'Event Video Vault',
      subtitle: 'HD Performance Recordings',
      image: '/images/mockups/video_library_screen.png',
      badge: 'Video Archive',
    },
    {
      id: 'login',
      title: 'Mobile Sign-In',
      subtitle: 'Secure Contact & Password Login',
      image: '/images/mockups/login_screen.png',
      badge: 'Access Portal',
    },
  ];

  const highlights = [
    {
      icon: BellRing,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Live Attendance Alerts',
      desc: 'Instant notifications to parents when disciple checks in with Guru.',
    },
    {
      icon: Video,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Monthly Performance Vault',
      desc: 'HD practice & recital recordings archived for home review and analysis.',
    },
    {
      icon: Award,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Certified Guru Feedback',
      desc: 'Expert remarks on mudras, laya, aramandi, and shruti accuracy.',
    },
    {
      icon: Bot,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      title: '24/7 AI Practice Assistant',
      desc: 'Instant in-app guidance for warm-ups, theory, and batch schedules.',
    },
    {
      icon: Film,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: '4K Stage & Event Media',
      desc: 'High-res photos and videos from academy showcases and arangetrams.',
    },
    {
      icon: Receipt,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      title: 'Digital Receipts & Notices',
      desc: 'Instant paperless receipts, holiday alerts, and official circulars.',
    },
  ];

  return (
    <section id="mobile-app" className="scroll-mt-20 py-4 sm:py-14 lg:py-18 bg-gradient-to-b from-[#FAF5F7] via-white to-[#FAF5F7]">
      <div className="mx-auto max-w-[1500px] px-3 sm:px-6 lg:px-10">
        
        {/* Main 2-Column Showcase in 1 Page */}
        <div className="rounded-3xl border border-[#D4BAC7]/70 bg-gradient-to-br from-white via-[#FAF5F7]/80 to-white p-4 sm:p-10 lg:p-12 shadow-warm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Phone Mockup with 3 Screens */}
            <div className="lg:col-span-5 flex flex-col items-center">
              
              {/* Screen Tab Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#E3D5DC]/70 border border-[#D4BAC7] mb-3 sm:mb-5 shadow-inner">
                {screens.map((screen, idx) => (
                  <button
                    key={screen.id}
                    onClick={() => setActiveScreenIndex(idx)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activeScreenIndex === idx
                        ? 'bg-[#8A064D] text-white shadow-md'
                        : 'text-[#6E3955] hover:text-[#220314]'
                    }`}
                  >
                    {screen.title.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Realistic Phone Bezel - Compact on Mobile */}
              <div className="relative w-full max-w-[210px] sm:max-w-[330px] rounded-[36px] sm:rounded-[48px] border-[6px] sm:border-[9px] border-[#220314] bg-[#220314] p-1 sm:p-1.5 shadow-xl sm:shadow-2xl transition-all duration-300">
                {/* Speaker / Dynamic Island */}
                <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 h-3 sm:h-4 w-16 sm:w-24 bg-black rounded-full z-20 flex items-center justify-end pr-1.5 sm:pr-2">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500/80 animate-pulse" />
                </div>

                {/* Display Screen */}
                <div className="relative w-full aspect-[9/19.5] rounded-[28px] sm:rounded-[38px] overflow-hidden bg-black">
                  <img
                    src={screens[activeScreenIndex].image}
                    alt={screens[activeScreenIndex].title}
                    className="w-full h-full object-cover object-top transition-opacity duration-300"
                  />
                  
                  {/* Subtle screen bottom indicator */}
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 w-20 sm:w-32 h-1 bg-white/40 rounded-full pointer-events-none" />
                </div>
              </div>

              {/* Mini Caption under mockup */}
              <div className="mt-2.5 sm:mt-4 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#6E3955] font-medium">
                <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#8A064D]" />
                <span className="font-bold text-[#220314]">{screens[activeScreenIndex].title}</span>
                <span>•</span>
                <span>{screens[activeScreenIndex].subtitle}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Information & Store Badges (No Long Texts) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-4 sm:space-y-6">
              
              {/* Header */}
              <div>
                <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#D4AF37]/60 bg-[#FAF2F6] px-3 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#8A064D]">
                  <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#8A064D]" />
                  Dedicated Student &amp; Parent App
                </span>
                <h2 className="mt-2 sm:mt-3 font-display text-xl sm:text-3xl lg:text-4xl font-bold leading-tight text-[#220314]">
                  Laasya Cultural Academy Mobile App
                </h2>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#6E3955] leading-relaxed">
                  Real-time connectivity between students, parents, and certified Gurus on iOS &amp; Android.
                </p>
              </div>

              {/* 6 Concise Feature Cards (2 columns on both mobile & desktop) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-xl sm:rounded-2xl border border-[#D4BAC7]/80 bg-white p-2.5 sm:p-3.5 shadow-xs hover:border-[#8A064D]/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className={`flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border ${item.color}`}>
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-[11px] sm:text-sm text-[#220314] leading-snug">
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-[9.5px] sm:text-[11px] text-[#6E3955] leading-snug line-clamp-2">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* App Store & Play Store Download Badges */}
              <div className="pt-2 border-t border-[#D4BAC7]/50">
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8A064D] mb-2 sm:mb-3">
                  Available On Mobile
                </p>
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {/* Google Play */}
                  <a
                    href="https://play.google.com/store/apps/details?id=com.laasya.culturalacademy"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-black hover:bg-neutral-900 px-3.5 py-2 sm:px-4 sm:py-2.5 text-white shadow-md transition-transform hover:scale-105"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a2.008 2.008 0 0 1-.61-1.45V3.264c0-.573.224-1.1.609-1.45zm11.235 11.236l2.164-2.164-12.06-6.953 9.896 9.117zm0 1.898L4.948 24.065l12.06-6.953-2.164-2.164zm1.052-1.052l3.41-1.965c1.236-.712 1.236-1.87 0-2.582l-3.41-1.965-2.072 2.072 2.072 2.44z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/70">GET IT ON</p>
                      <p className="font-display text-[11px] sm:text-xs font-bold text-white leading-tight">Google Play</p>
                    </div>
                  </a>

                  {/* Apple App Store */}
                  <a
                    href="https://apps.apple.com/app/laasya-cultural-academy/id6478912345"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-black hover:bg-neutral-900 px-3.5 py-2 sm:px-4 sm:py-2.5 text-white shadow-md transition-transform hover:scale-105"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.9.04-2.01.6-2.66 1.36-.57.65-1.07 1.73-.93 2.77 1.01.08 2.06-.51 2.58-1.26z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/70">Download on the</p>
                      <p className="font-display text-[11px] sm:text-xs font-bold text-white leading-tight">App Store</p>
                    </div>
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, CalendarX2, CalendarCheck, Sparkles } from 'lucide-react';

interface Props {
  activeCount?: {
    announcements?: number;
    holidays?: number;
    tally?: number;
  };
}

export default function AnnouncementsNavTabs({ activeCount }: Props) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'announcements',
      label: 'Announcements Feed',
      href: '/announcements',
      icon: Megaphone,
      badge: activeCount?.announcements,
      description: 'Official Broadcasts & Guru Messages'
    },
    {
      id: 'holiday-alert',
      label: 'Holiday Alert',
      href: '/announcements/holiday-alert',
      icon: CalendarX2,
      badge: activeCount?.holidays,
      description: 'Multi-Batch & Guru Holiday Notifications'
    }
  ];

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 border border-gray-200/90 shadow-2xs mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== '/announcements' && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all flex items-start gap-3 border ${
                isActive
                  ? 'bg-gradient-to-r from-[#590231] to-[#8A064D] text-white border-[#590231] shadow-md ring-2 ring-[#8A064D]/20'
                  : 'bg-gray-50/70 hover:bg-white text-gray-700 hover:text-[#8A064D] border-gray-200/70 hover:border-rose-200 shadow-2xs'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                  isActive
                    ? 'bg-white/15 text-[#F9E33A]'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs sm:text-sm font-black truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {tab.label}
                  </span>
                  {typeof tab.badge === 'number' && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums shrink-0 ${
                        isActive
                          ? 'bg-[#F9E33A] text-[#2D041A]'
                          : 'bg-rose-100 text-[#8A064D]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] truncate mt-0.5 ${
                    isActive ? 'text-rose-100/90 font-medium' : 'text-gray-500'
                  }`}
                >
                  {tab.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

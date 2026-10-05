'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar as CalendarIcon, Check } from 'lucide-react';

export interface DateRangeResult {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  presetLabel?: string;
}

interface DateRangeQuickFilterProps {
  startDate: string;
  endDate: string;
  onApply: (result: DateRangeResult) => void;
  className?: string;
  placeholder?: string;
  align?: 'left' | 'right';
}

const MONTHS = [
  { short: 'Jan', full: 'January', num: 0 },
  { short: 'Feb', full: 'February', num: 1 },
  { short: 'Mar', full: 'March', num: 2 },
  { short: 'Apr', full: 'April', num: 3 },
  { short: 'May', full: 'May', num: 4 },
  { short: 'Jun', full: 'June', num: 5 },
  { short: 'Jul', full: 'July', num: 6 },
  { short: 'Aug', full: 'August', num: 7 },
  { short: 'Sep', full: 'September', num: 8 },
  { short: 'Oct', full: 'October', num: 9 },
  { short: 'Nov', full: 'November', num: 10 },
  { short: 'Dec', full: 'December', num: 11 },
];

function formatDateYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  const monthName = MONTHS[monthIdx]?.short || parts[1];
  return `${day} ${monthName} ${year}`;
}

export default function DateRangeQuickFilter({
  startDate,
  endDate,
  onApply,
  className = '',
  placeholder = 'Select Date Range',
  align = 'right'
}: DateRangeQuickFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>(align);

  // Temporary selected dates before clicking Apply
  const [tempStart, setTempStart] = useState<string>(startDate || formatDateYMD(new Date()));
  const [tempEnd, setTempEnd] = useState<string>(endDate || formatDateYMD(new Date()));
  const [activePreset, setActivePreset] = useState<string>('This Month');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(() => {
    if (startDate) {
      const parts = startDate.split('-');
      if (parts.length >= 2) return parseInt(parts[1], 10) - 1;
    }
    return new Date().getMonth();
  });

  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (startDate) {
      const match = startDate.match(/^(20\d\d)/);
      if (match) return parseInt(match[1], 10);
    }
    return 2026;
  });

  // Sync temp dates when props change
  useEffect(() => {
    if (startDate) setTempStart(startDate);
    if (endDate) setTempEnd(endDate);
  }, [startDate, endDate]);

  // Viewport boundary adjustment when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      // If right edge has less than 520px, align right so it opens leftward into screen
      if (windowWidth - rect.left < 520 || align === 'right') {
        setEffectiveAlign('right');
      } else {
        setEffectiveAlign('left');
      }
    }
  }, [isOpen, align]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Quick Select Presets
  const handleQuickSelect = (preset: string) => {
    setActivePreset(preset);
    const now = new Date(currentYear, new Date().getMonth(), new Date().getDate());

    let sDate = new Date();
    let eDate = new Date();

    switch (preset) {
      case 'Today': {
        sDate = new Date(now);
        eDate = new Date(now);
        break;
      }
      case 'Yesterday': {
        sDate = new Date(now);
        sDate.setDate(now.getDate() - 1);
        eDate = new Date(sDate);
        break;
      }
      case 'Last 7 Days': {
        eDate = new Date(now);
        sDate = new Date(now);
        sDate.setDate(now.getDate() - 6);
        break;
      }
      case 'Last 30 Days': {
        eDate = new Date(now);
        sDate = new Date(now);
        sDate.setDate(now.getDate() - 29);
        break;
      }
      case 'This Month': {
        sDate = new Date(currentYear, now.getMonth(), 1);
        eDate = new Date(currentYear, now.getMonth() + 1, 0);
        setSelectedMonthIdx(now.getMonth());
        break;
      }
      case 'Last Month': {
        sDate = new Date(currentYear, now.getMonth() - 1, 1);
        eDate = new Date(currentYear, now.getMonth(), 0);
        setSelectedMonthIdx(sDate.getMonth());
        break;
      }
      case 'This FY': {
        // Indian FY: April 1 to March 31
        const fyYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
        sDate = new Date(fyYear, 3, 1);
        eDate = new Date(fyYear + 1, 2, 31);
        break;
      }
      case 'All Time / Clear': {
        setTempStart('');
        setTempEnd('');
        return;
      }
      default:
        break;
    }

    setTempStart(formatDateYMD(sDate));
    setTempEnd(formatDateYMD(eDate));
  };

  // Month Grid Selection (Reference Image 2 requirement: default start to end of month)
  const handleMonthSelect = (monthNum: number) => {
    setSelectedMonthIdx(monthNum);
    setActivePreset(MONTHS[monthNum].full);

    // Month starting date
    const firstDay = new Date(currentYear, monthNum, 1);
    // Month ending date (day 0 of next month is the last day of this month)
    const lastDay = new Date(currentYear, monthNum + 1, 0);

    setTempStart(formatDateYMD(firstDay));
    setTempEnd(formatDateYMD(lastDay));
  };

  const handleApply = () => {
    onApply({
      startDate: tempStart,
      endDate: tempEnd,
      presetLabel: activePreset
    });
    setIsOpen(false);
  };

  // Label to display on trigger button
  const getTriggerLabel = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate === endDate && startDate) {
      return formatDisplayDate(startDate);
    }
    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
    }
    return startDate ? `From ${formatDisplayDate(startDate)}` : `Until ${formatDisplayDate(endDate)}`;
  };

  const quickSelectOptions = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'This Month',
    'Last Month',
    'This FY',
    'All Time / Clear'
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef} suppressHydrationWarning>
      {/* Trigger Button */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2.5 bg-white hover:bg-gray-50 border border-[#F0D5E4] rounded-2xl text-xs font-bold text-gray-800 transition flex items-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#8A064D] ${
          isOpen ? 'ring-2 ring-[#8A064D]/20 border-[#8A064D]' : ''
        } cursor-pointer`}
      >
        <CalendarIcon className="w-4 h-4 text-[#8A064D]" />
        <span className="truncate max-w-[260px]">{getTriggerLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
      </button>

      {/* Popover Dropdown matching Reference Image 2 */}
      {isOpen && (
        <div className={`absolute ${effectiveAlign === 'right' ? 'right-0' : 'left-0'} top-full mt-2 bg-white rounded-3xl shadow-2xl border border-[#F0D5E4] p-5 z-50 animate-in fade-in zoom-in-95 duration-150 w-[500px] max-w-[calc(100vw-2rem)]`}>
          
          <div className="flex divide-x divide-gray-100">
            
            {/* LEFT COLUMN: QUICK SELECT */}
            <div className="w-44 pr-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-3 py-1 block">
                Quick Select
              </span>

              {quickSelectOptions.map((opt) => {
                const isSelected = activePreset === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleQuickSelect(opt)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 text-[#E11D48]'
                        : 'text-[#E11D48] hover:bg-rose-50/50'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#E11D48] stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            {/* RIGHT COLUMN: YEAR HEADER & MONTHS GRID */}
            <div className="flex-1 pl-5">
              {/* Year Navigation */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentYear(prev => prev - 1)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  title="Previous Year"
                >
                  <span className="text-sm font-bold tracking-tighter">«</span>
                </button>

                <div className="flex items-center gap-2 text-base font-black text-gray-900">
                  <span>{currentYear}</span>
                  <CalendarIcon className="w-4 h-4 text-gray-400 stroke-[2.5]" />
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentYear(prev => prev + 1)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  title="Next Year"
                >
                  <span className="text-sm font-bold tracking-tighter">»</span>
                </button>
              </div>

              {/* Months Grid */}
              <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 pt-4">
                {MONTHS.map((m) => {
                  const isSelected = (selectedMonthIdx === m.num);
                  return (
                    <button
                      key={m.short}
                      type="button"
                      onClick={() => handleMonthSelect(m.num)}
                      className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#E11D48] text-white shadow-md shadow-rose-500/25 scale-105'
                          : 'text-gray-700 hover:bg-rose-50/70 hover:text-[#8A064D]'
                      }`}
                    >
                      {m.short}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* BOTTOM SECTION: CLEAN DATE RANGE DISPLAY & REFINED APPLY BUTTON */}
          <div className="mt-4 pt-3.5 border-t border-[#F0D5E4] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFF9FB] p-3 rounded-2xl border border-[#F0D5E4]/80">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#F0D5E4] shadow-2xs">
                <span className="text-[10px] font-black text-gray-400 uppercase">From:</span>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => {
                    setTempStart(e.target.value);
                    setActivePreset('Custom');
                  }}
                  className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                />
              </div>

              <span className="text-gray-400 font-bold text-xs hidden sm:inline">➔</span>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#F0D5E4] shadow-2xs">
                <span className="text-[10px] font-black text-gray-400 uppercase">To:</span>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => {
                    setTempEnd(e.target.value);
                    setActivePreset('Custom');
                  }}
                  className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2.5 rounded-xl text-xs font-black tracking-wide bg-[#590231] hover:bg-[#8A064D] text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5 text-[#F9E33A] stroke-[3]" />
                <span>Apply Range</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

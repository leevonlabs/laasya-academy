'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export interface MonthYearRangeResult {
  startMonth: number; // 1-12
  startYear: number;
  endMonth: number;   // 1-12
  endYear: number;
  startDate: string;  // YYYY-MM-01
  endDate: string;    // YYYY-MM-DD
  label?: string;
}

interface MonthYearRangeFilterProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onApply: (result: MonthYearRangeResult) => void;
  className?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027];

function parseDateToMonthYear(dateStr: string, fallbackMonth: number, fallbackYear: number) {
  if (!dateStr) return { month: fallbackMonth, year: fallbackYear };
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(y) && !isNaN(m)) {
      return { month: m, year: y };
    }
  }
  return { month: fallbackMonth, year: fallbackYear };
}

function computeLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function MonthYearRangeFilter({
  startDate,
  endDate,
  onApply,
  className = '',
  align = 'right'
}: MonthYearRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = 2026; // matches academic calendar

  // Parse initial dates
  const initialStart = parseDateToMonthYear(startDate, currentMonth, currentYear);
  const initialEnd = parseDateToMonthYear(endDate, currentMonth, currentYear);

  const [fromMonth, setFromMonth] = useState<number>(initialStart.month);
  const [fromYear, setFromYear] = useState<number>(initialStart.year);
  const [toMonth, setToMonth] = useState<number>(initialEnd.month);
  const [toYear, setToYear] = useState<number>(initialEnd.year);
  const [activePreset, setActivePreset] = useState<string>('This Month');

  // Sync when props change
  useEffect(() => {
    if (startDate) {
      const p = parseDateToMonthYear(startDate, currentMonth, currentYear);
      setFromMonth(p.month);
      setFromYear(p.year);
    }
    if (endDate) {
      const p = parseDateToMonthYear(endDate, currentMonth, currentYear);
      setToMonth(p.month);
      setToYear(p.year);
    }
  }, [startDate, endDate]);

  // Click outside to close
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

  const handleApply = () => {
    // Ensure from date is not after to date
    let fM = fromMonth;
    let fY = fromYear;
    let tM = toMonth;
    let tY = toYear;

    if (fY > tY || (fY === tY && fM > tM)) {
      // Swap or equalize
      tM = fM;
      tY = fY;
    }

    const sDate = `${fY}-${String(fM).padStart(2, '0')}-01`;
    const lastDay = computeLastDayOfMonth(tY, tM);
    const eDate = `${tY}-${String(tM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    onApply({
      startMonth: fM,
      startYear: fY,
      endMonth: tM,
      endYear: tY,
      startDate: sDate,
      endDate: eDate,
      label: activePreset
    });
    setIsOpen(false);
  };

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    let fM = currentMonth;
    let fY = currentYear;
    let tM = currentMonth;
    let tY = currentYear;

    switch (preset) {
      case 'This Month': {
        fM = currentMonth;
        fY = currentYear;
        tM = currentMonth;
        tY = currentYear;
        break;
      }
      case 'Last Month': {
        if (currentMonth === 1) {
          fM = 12;
          fY = currentYear - 1;
        } else {
          fM = currentMonth - 1;
          fY = currentYear;
        }
        tM = fM;
        tY = fY;
        break;
      }
      case 'Last 3 Months': {
        tM = currentMonth;
        tY = currentYear;
        const past = new Date(currentYear, currentMonth - 3, 1);
        fM = past.getMonth() + 1;
        fY = past.getFullYear();
        break;
      }
      case 'This Year (2026)': {
        fM = 1;
        fY = 2026;
        tM = 12;
        tY = 2026;
        break;
      }
      case 'All Time': {
        fM = 1;
        fY = 2025;
        tM = 12;
        tY = 2026;
        break;
      }
    }

    setFromMonth(fM);
    setFromYear(fY);
    setToMonth(tM);
    setToYear(tY);
  };

  // Display label on trigger button
  const getTriggerLabel = () => {
    const sMonthName = SHORT_MONTHS[fromMonth - 1] || 'Jan';
    const eMonthName = SHORT_MONTHS[toMonth - 1] || 'Dec';
    if (fromYear === toYear && fromMonth === toMonth) {
      return `${sMonthName} ${fromYear}`;
    }
    return `${sMonthName} ${fromYear} – ${eMonthName} ${toYear}`;
  };

  const presets = [
    'This Month',
    'Last Month',
    'Last 3 Months',
    'This Year (2026)',
    'All Time'
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef} suppressHydrationWarning>
      {/* Trigger Button */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 bg-[#FFF9FB] hover:bg-[#FFF2F8] border border-[#F0D5E4] rounded-xl text-xs font-semibold text-gray-800 transition flex items-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#8A064D] ${
          isOpen ? 'ring-2 ring-[#8A064D]/20 border-[#8A064D] bg-white' : ''
        } cursor-pointer`}
      >
        <Calendar className="w-4 h-4 text-[#8A064D]" />
        <span className="font-bold text-[#590231] truncate">{getTriggerLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] p-4 z-50 animate-in fade-in zoom-in-95 duration-100`}>
          
          <div className="flex gap-4 divide-x divide-[#F0D5E4]/60">
            {/* Quick Presets */}
            <div className="w-36 space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block px-2 pb-1">
                Presets
              </span>
              {presets.map((p) => {
                const isSelected = activePreset === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected ? 'bg-[#FFF2F8] text-[#8A064D]' : 'text-gray-700 hover:bg-[#FFF9FB]'
                    }`}
                  >
                    <span>{p}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#8A064D]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Selectors */}
            <div className="flex-1 pl-4 space-y-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Select Range
              </span>

              {/* FROM */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">From Month & Year</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={fromMonth}
                    onChange={(e) => {
                      setFromMonth(parseInt(e.target.value, 10));
                      setActivePreset('Custom');
                    }}
                    className="w-full px-2 py-1.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-lg text-xs font-bold text-gray-800"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i + 1}>{name}</option>
                    ))}
                  </select>

                  <select
                    value={fromYear}
                    onChange={(e) => {
                      setFromYear(parseInt(e.target.value, 10));
                      setActivePreset('Custom');
                    }}
                    className="w-full px-2 py-1.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-lg text-xs font-bold text-gray-800"
                  >
                    {AVAILABLE_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TO */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">To Month & Year</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={toMonth}
                    onChange={(e) => {
                      setToMonth(parseInt(e.target.value, 10));
                      setActivePreset('Custom');
                    }}
                    className="w-full px-2 py-1.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-lg text-xs font-bold text-gray-800"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i + 1}>{name}</option>
                    ))}
                  </select>

                  <select
                    value={toYear}
                    onChange={(e) => {
                      setToYear(parseInt(e.target.value, 10));
                      setActivePreset('Custom');
                    }}
                    className="w-full px-2 py-1.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-lg text-xs font-bold text-gray-800"
                  >
                    {AVAILABLE_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3 mt-3 border-t border-[#F0D5E4]/60 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
            >
              Apply Range
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

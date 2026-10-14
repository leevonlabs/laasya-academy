'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

interface MonthPickerProps {
  value: string; // e.g. "September 2026" or "March 2026" or "2026-09"
  onChange: (monthLabel: string, yearMonthKey: string, startDate: string, endDate: string) => void;
  className?: string;
  triggerClassName?: string;
  triggerLabel?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  placeholder?: string;
}

const MONTHS = [
  { short: 'Jan', full: 'January', num: '01' },
  { short: 'Feb', full: 'February', num: '02' },
  { short: 'Mar', num: '03', full: 'March' },
  { short: 'Apr', full: 'April', num: '04' },
  { short: 'May', full: 'May', num: '05' },
  { short: 'Jun', full: 'June', num: '06' },
  { short: 'Jul', full: 'July', num: '07' },
  { short: 'Aug', full: 'August', num: '08' },
  { short: 'Sep', full: 'September', num: '09' },
  { short: 'Oct', full: 'October', num: '10' },
  { short: 'Nov', full: 'November', num: '11' },
  { short: 'Dec', full: 'December', num: '12' },
];

export default function MonthPicker({
  value,
  onChange,
  className = '',
  triggerClassName = '',
  triggerLabel,
  disabled = false,
  align = 'right',
  placeholder = 'Select Month & Year'
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial year from value
  const parseYearFromValue = (val: string): number => {
    if (!val) return 2026;
    const match = val.match(/\b(20\d\d)\b/);
    return match ? parseInt(match[1], 10) : 2026;
  };

  const parseMonthIndexFromValue = (val: string): number => {
    if (!val) return -1;
    const lower = val.toLowerCase();
    for (let i = 0; i < MONTHS.length; i++) {
      if (lower.includes(MONTHS[i].short.toLowerCase()) || lower.includes(MONTHS[i].full.toLowerCase())) {
        return i;
      }
    }
    // Check if ISO format YYYY-MM
    const mMatch = val.match(/20\d\d-(\d\d)/);
    if (mMatch) {
      return parseInt(mMatch[1], 10) - 1;
    }
    return -1;
  };

  const [currentYear, setCurrentYear] = useState<number>(() => parseYearFromValue(value));
  const selectedMonthIndex = parseMonthIndexFromValue(value);
  const selectedYear = parseYearFromValue(value);

  // Sync year when value prop changes externally
  useEffect(() => {
    if (value) {
      setCurrentYear(parseYearFromValue(value));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSelectMonth = (monthObj: typeof MONTHS[0]) => {
    const monthLabel = `${monthObj.full} ${currentYear}`;
    const yearMonthKey = `${currentYear}-${monthObj.num}`;
    const monthNum = parseInt(monthObj.num, 10);
    const lastDay = new Date(currentYear, monthNum, 0).getDate();
    const startDate = `${currentYear}-${monthObj.num}-01`;
    const endDate = `${currentYear}-${monthObj.num}-${String(lastDay).padStart(2, '0')}`;
    onChange(monthLabel, yearMonthKey, startDate, endDate);
    setIsOpen(false);
  };

  const displayLabel = triggerLabel || value || placeholder;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2 bg-white hover:bg-gray-50 border border-[#F0D5E4] rounded-2xl text-xs font-bold text-gray-800 transition flex items-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#8A064D] ${
          isOpen ? 'ring-2 ring-[#8A064D]/20 border-[#8A064D]' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${triggerClassName}`}
      >
        <CalendarIcon className="w-4 h-4 text-[#8A064D] shrink-0" />
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
      </button>

      {/* Popover Dropdown matching Reference Image 2 */}
      {isOpen && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-[#F0D5E4] p-5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
          
          {/* Header: << Year 📅 >> */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setCurrentYear(prev => prev - 1)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
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
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              title="Next Year"
            >
              <span className="text-sm font-bold tracking-tighter">»</span>
            </button>
          </div>

          {/* 3 x 4 Months Grid */}
          <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 pt-4">
            {MONTHS.map((m, idx) => {
              const isSelected = (currentYear === selectedYear) && (idx === selectedMonthIndex);
              return (
                <button
                  key={m.short}
                  type="button"
                  onClick={() => handleSelectMonth(m)}
                  className={`py-3 px-2 rounded-2xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
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

          {/* Bottom Action Footer: Clear / All and This Month */}
          <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onChange('', '', '', '');
                setIsOpen(false);
              }}
              className="text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
            >
              Clear / All
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const mIdx = now.getMonth();
                const mObj = MONTHS[mIdx];
                setCurrentYear(now.getFullYear());
                const monthLabel = `${mObj.full} ${now.getFullYear()}`;
                const yearMonthKey = `${now.getFullYear()}-${mObj.num}`;
                const lastDay = new Date(now.getFullYear(), mIdx + 1, 0).getDate();
                const startDate = `${now.getFullYear()}-${mObj.num}-01`;
                const endDate = `${now.getFullYear()}-${mObj.num}-${String(lastDay).padStart(2, '0')}`;
                onChange(monthLabel, yearMonthKey, startDate, endDate);
                setIsOpen(false);
              }}
              className="text-[#8A064D] hover:underline font-bold cursor-pointer"
            >
              This Month
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

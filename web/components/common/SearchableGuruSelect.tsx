'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Trainer } from '@/lib/academy';
import { Search, ChevronDown, Check, User, X, Phone } from 'lucide-react';

interface Props {
  trainers: Trainer[];
  value: string;
  onChange: (trainerId: string) => void;
  placeholder?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  label?: string;
  required?: boolean;
  align?: 'left' | 'right';
  size?: 'normal' | 'lg' | 'xl';
  className?: string;
  triggerClassName?: string;
}

export default function SearchableGuruSelect({
  trainers,
  value,
  onChange,
  placeholder = '-- Select Guru --',
  includeAllOption = false,
  allOptionLabel = 'All Gurus',
  label,
  required = false,
  align = 'left',
  size = 'normal',
  className = '',
  triggerClassName = ''
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTrainer = trainers.find((t) => t.id === value);

  // Filter trainers based on search query
  const filteredTrainers = trainers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = t.full_name?.toLowerCase().includes(q);
    const idMatch = (t.guru_id || t.code || '').toLowerCase().includes(q);
    const phoneMatch = (t.phone || '').includes(q);
    return nameMatch || idMatch || phoneMatch;
  });

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
          <User className="w-4 h-4 text-[#8A064D]" />
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}

      {/* Selected Box Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left transition flex items-center justify-between gap-3 cursor-pointer ${
          size === 'lg' || size === 'xl'
            ? 'px-5 py-3.5 min-h-[54px] rounded-2xl text-base'
            : 'px-4 py-3 min-h-[48px] rounded-2xl text-sm'
        } ${
          isOpen
            ? 'border-[#8A064D] ring-2 ring-[#8A064D]/25 bg-white shadow-sm'
            : 'border-[#F0D5E4] bg-white hover:border-[#8A064D] hover:shadow-xs'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {value === 'all' && includeAllOption ? (
            <span className={`font-extrabold text-gray-900 ${size === 'lg' || size === 'xl' ? 'text-base' : 'text-sm'}`}>
              {allOptionLabel}
            </span>
          ) : selectedTrainer ? (
            <div className={`flex items-center gap-2.5 flex-wrap ${size === 'lg' || size === 'xl' ? 'text-base' : 'text-sm'}`}>
              <span className="font-extrabold text-gray-900">{selectedTrainer.full_name}</span>
              <span className={`px-2.5 py-0.5 rounded-md font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 ${size === 'lg' || size === 'xl' ? 'text-xs' : 'text-xs'}`}>
                {selectedTrainer.guru_id || selectedTrainer.code || `ID: ${selectedTrainer.id.slice(0, 5)}`}
              </span>
              {selectedTrainer.phone && (
                <span className={`px-2.5 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 ${size === 'lg' || size === 'xl' ? 'text-xs' : 'text-xs'}`}>
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedTrainer.phone}</span>
                </span>
              )}
            </div>
          ) : (
            <span className={`text-gray-400 font-medium ${size === 'lg' || size === 'xl' ? 'text-base' : 'text-sm'}`}>
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4.5 h-4.5 text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white rounded-3xl shadow-2xl border border-[#F0D5E4] overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right'
              ? size === 'lg' || size === 'xl' ? 'right-0 w-[380px] sm:w-[480px] max-w-[95vw]' : 'right-0 w-[340px] sm:w-[400px] max-w-[95vw]'
              : size === 'lg' || size === 'xl' ? 'left-0 w-full sm:w-[460px] max-w-[95vw]' : 'left-0 w-full sm:w-[380px] max-w-[95vw]'
          }`}
        >
          {/* Search Input Box */}
          <div className="p-3 border-b border-gray-100 bg-[#FFF9FB]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Guru Name, ID, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-[#F0D5E4] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* List of Gurus */}
          <div className="max-h-72 overflow-y-auto divide-y divide-[#F0D5E4]/40 p-1.5">
            {includeAllOption && (
              <button
                type="button"
                onClick={() => handleSelect('all')}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition flex items-center justify-between cursor-pointer ${
                  value === 'all'
                    ? 'bg-[#FCE7F3] text-[#8A064D]'
                    : 'text-gray-700 hover:bg-[#FFF9FB]'
                }`}
              >
                <span>{allOptionLabel}</span>
                {value === 'all' && <Check className="w-4 h-4 text-[#8A064D]" />}
              </button>
            )}

            {filteredTrainers.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No Gurus found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredTrainers.map((t) => {
                const isSelected = value === t.id;
                const initials = (t.full_name || 'Guru')
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'G';

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t.id)}
                    className={`w-full text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                      size === 'lg' || size === 'xl' ? 'px-4.5 py-3.5 rounded-2xl' : 'px-4 py-3 rounded-2xl'
                    } ${
                      isSelected
                        ? 'bg-[#FCE7F3] text-[#8A064D]'
                        : 'hover:bg-[#FFF9FB]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`rounded-xl bg-gradient-to-br from-[#8A064D] to-[#430928] text-white flex items-center justify-center font-black shrink-0 shadow-2xs ${
                        size === 'lg' || size === 'xl' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
                      }`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        {/* Guru Name in dark bold */}
                        <div className={`font-extrabold text-gray-900 leading-snug ${size === 'lg' || size === 'xl' ? 'text-[15px]' : 'text-sm'}`}>
                          {t.full_name}
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {/* Guru ID in blue badge */}
                          <span className={`rounded-md font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 ${
                            size === 'lg' || size === 'xl' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[11px]'
                          }`}>
                            {t.guru_id || t.code || `ID: ${t.id.slice(0, 5)}`}
                          </span>

                          {/* Phone Number in emerald badge */}
                          {t.phone && (
                            <span className={`rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 ${
                              size === 'lg' || size === 'xl' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[11px]'
                            }`}>
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{t.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-5 h-5 text-[#8A064D] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

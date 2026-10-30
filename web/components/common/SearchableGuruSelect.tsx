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
}

export default function SearchableGuruSelect({
  trainers,
  value,
  onChange,
  placeholder = '-- Select Guru --',
  includeAllOption = false,
  allOptionLabel = 'All Gurus',
  label,
  required = false
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
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#8A064D]" />
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}

      {/* Selected Box Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
          isOpen
            ? 'border-[#8A064D] ring-2 ring-[#8A064D]/20 bg-white'
            : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-[#8A064D]'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {value === 'all' && includeAllOption ? (
            <span className="font-bold text-gray-800 text-xs">{allOptionLabel}</span>
          ) : selectedTrainer ? (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-gray-900">{selectedTrainer.full_name}</span>
              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {selectedTrainer.guru_id || selectedTrainer.code || `ID: ${selectedTrainer.id.slice(0, 5)}`}
              </span>
              {selectedTrainer.phone && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{selectedTrainer.phone}</span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-xs font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Search Input Box */}
          <div className="p-2.5 border-b border-gray-100 bg-[#FFF9FB]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Guru Name, ID, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-7 py-2 bg-white border border-[#F0D5E4] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Gurus */}
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 p-1">
            {includeAllOption && (
              <button
                type="button"
                onClick={() => handleSelect('all')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  value === 'all'
                    ? 'bg-[#FCE7F3] text-[#8A064D]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{allOptionLabel}</span>
                {value === 'all' && <Check className="w-4 h-4 text-[#8A064D]" />}
              </button>
            )}

            {filteredTrainers.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No Gurus found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredTrainers.map((t) => {
                const isSelected = value === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FCE7F3]/70 text-[#8A064D]'
                        : 'hover:bg-[#FFFDFC]'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {/* Guru Name in dark bold */}
                      <span className="font-bold text-gray-900 text-xs">
                        {t.full_name}
                      </span>

                      {/* Guru ID in blue badge */}
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {t.guru_id || t.code || `ID: ${t.id.slice(0, 5)}`}
                      </span>

                      {/* Phone Number in emerald badge */}
                      {t.phone && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{t.phone}</span>
                        </span>
                      )}
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-[#8A064D] shrink-0" />}
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

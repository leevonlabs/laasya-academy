'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Search, ChevronDown, Check, X } from 'lucide-react';

export interface TrainerOption {
  id: string;
  full_name: string;
  display_title?: string;
  specialization?: string;
}

interface TrainerSearchSelectProps {
  trainers: TrainerOption[];
  value: string; // trainerId or '' for all
  onChange: (trainerId: string, trainerName?: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TrainerSearchSelect({
  trainers,
  value,
  onChange,
  placeholder = 'All Gurus / Trainers',
  className = ''
}: TrainerSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const selectedTrainer = trainers.find(t => t.id === value || t.full_name.toLowerCase() === value.toLowerCase());

  const filteredTrainers = trainers.filter(t =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.display_title && t.display_title.toLowerCase().includes(search.toLowerCase())) ||
    (t.specialization && t.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef} suppressHydrationWarning>
      {/* Trigger Button */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-[#FFF9FB] hover:bg-[#FFF2F8] border border-[#F0D5E4] rounded-xl text-xs font-bold flex items-center justify-between text-left transition focus:outline-none focus:ring-2 focus:ring-[#8A064D] ${
          isOpen ? 'ring-2 ring-[#8A064D]/20 border-[#8A064D] bg-white' : ''
        } cursor-pointer`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <User className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
          <span className="truncate text-gray-800">
            {selectedTrainer ? (
              <span>
                <strong className="text-[#590231]">{selectedTrainer.full_name}</strong>
                {selectedTrainer.display_title && (
                  <span className="text-gray-500 font-medium ml-1">({selectedTrainer.display_title})</span>
                )}
              </span>
            ) : (
              <span className="text-gray-600 font-semibold">{placeholder}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('', '');
              }}
              className="p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-2xl shadow-2xl border border-[#F0D5E4] p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search guru by name or discipline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
            />
          </div>

          {/* Trainer List */}
          <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
            {/* Option to clear / show all */}
            <button
              type="button"
              onClick={() => {
                onChange('', '');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                !value ? 'bg-[#FFF2F8] text-[#8A064D]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>All Gurus / Faculty ({trainers.length})</span>
              {!value && <Check className="w-3.5 h-3.5 text-[#8A064D]" />}
            </button>

            {filteredTrainers.map((t) => {
              const isSelected = value === t.id || value.toLowerCase() === t.full_name.toLowerCase();
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onChange(t.id, t.full_name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                    isSelected ? 'bg-[#FFF2F8] text-[#8A064D] font-black' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="block truncate font-bold">{t.full_name}</span>
                    {t.display_title && (
                      <span className="text-[10px] text-gray-500 block truncate">{t.display_title}</span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#8A064D] shrink-0 stroke-[2.5]" />}
                </button>
              );
            })}

            {filteredTrainers.length === 0 && (
              <div className="py-4 text-center text-xs text-gray-400 font-semibold">
                No gurus found matching &quot;{search}&quot;
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

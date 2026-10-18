'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Search, ChevronDown, Check, X } from 'lucide-react';

export interface TrainerOption {
  id: string;
  full_name: string;
  display_title?: string;
  specialization?: string;
  specializations?: string[];
}

interface TrainerMultiSearchSelectProps {
  trainers: TrainerOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function TrainerMultiSearchSelect({
  trainers,
  selectedIds,
  onChange,
  placeholder = 'All Gurus (Multi-select)',
  className = ''
}: TrainerMultiSearchSelectProps) {
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

  const filteredTrainers = useMemo(() => {
    if (!search.trim()) return trainers;
    const q = search.toLowerCase();
    return trainers.filter(t =>
      t.full_name.toLowerCase().includes(q) ||
      (t.display_title && t.display_title.toLowerCase().includes(q)) ||
      (t.specialization && t.specialization.toLowerCase().includes(q)) ||
      (t.specializations && t.specializations.some(s => s.toLowerCase().includes(q)))
    );
  }, [trainers, search]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleTrainer = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedIds);
    filteredTrainers.forEach(t => newSelected.add(t.id));
    onChange(Array.from(newSelected));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef} suppressHydrationWarning>
      {/* Trigger Button */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2 bg-[#FFF9FB] hover:bg-[#FFF2F8] border border-[#F0D5E4] rounded-xl text-xs font-semibold flex items-center justify-between text-left transition focus:outline-none focus:ring-2 focus:ring-[#8A064D] ${
          isOpen ? 'ring-2 ring-[#8A064D]/20 border-[#8A064D] bg-white' : ''
        } cursor-pointer`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <User className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
          <div className="truncate">
            {selectedIds.length === 0 ? (
              <span className="text-gray-600 font-bold">{placeholder}</span>
            ) : selectedIds.length === 1 ? (
              <span className="text-[#590231] font-bold">
                {trainers.find(t => t.id === selectedIds[0])?.full_name || '1 Guru Selected'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-[#590231]">
                <span>{selectedIds.length} Gurus Selected</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#8A064D] text-white font-black">
                  {selectedIds.length}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedIds.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="p-1 hover:bg-[#F0D5E4]/60 rounded-lg text-gray-400 hover:text-[#8A064D] cursor-pointer"
              title="Clear all selected"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search faculty guru..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between px-1 py-1 border-b border-gray-100 text-[11px] mb-1">
            <span className="text-gray-500 font-medium">
              {selectedIds.length === 0 ? 'All gurus' : `${selectedIds.length} selected`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[#8A064D] font-bold hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-gray-500 hover:text-rose-600 font-medium hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Trainers List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 py-1 scrollbar-thin">
            {filteredTrainers.map((t) => {
              const isSelected = selectedSet.has(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggleTrainer(t.id)}
                  className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer select-none border ${
                    isSelected
                      ? 'bg-[#FFF2F8] border-[#F0D5E4]'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition ${
                      isSelected
                        ? 'bg-[#8A064D] border-[#8A064D] text-white'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isSelected ? 'font-bold text-[#8A064D]' : 'font-semibold text-gray-800'}`}>
                        {t.full_name}
                      </p>
                      {t.display_title && (
                        <p className="text-[10px] text-gray-500 truncate">
                          {t.display_title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTrainers.length === 0 && (
              <div className="py-4 text-center text-xs text-gray-400">
                No gurus match &quot;{search}&quot;
              </div>
            )}
          </div>

          {/* Apply Button */}
          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

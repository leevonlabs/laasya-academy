'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface MultiSelectOption {
  id: string;
  label: string;
  subtitle?: string;
  badge?: string;
}

interface MultiSelectComboboxProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  badgeColor?: string;
}

export default function MultiSelectCombobox({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select options...',
  label,
  className = '',
  badgeColor = 'bg-[#FFF2F8] text-[#8A064D]'
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
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

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(opt =>
      opt.label.toLowerCase().includes(q) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, search]);

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredOptions.map(o => o.id);
    const combined = Array.from(new Set([...selectedIds, ...allFilteredIds]));
    onChange(combined);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Find label of single selection if 1 item is selected
  const singleSelectedOption = selectedIds.length === 1 ? options.find(o => o.id === selectedIds[0]) : null;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`px-3 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
          selectedIds.length > 0
            ? 'bg-[#8A064D] text-white border-[#8A064D]'
            : 'bg-white text-gray-800 border-[#F0D5E4] hover:border-[#8A064D]'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 max-w-[200px] truncate">
          {label && (
            <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 ${
              selectedIds.length > 0 ? 'text-[#F9E33A]' : 'text-[#8A064D]'
            }`}>
              {label}:
            </span>
          )}
          <span className="truncate">
            {selectedIds.length === 0
              ? `All (${options.length})`
              : selectedIds.length === 1 && singleSelectedOption
              ? singleSelectedOption.label
              : `${selectedIds.length} Selected`}
          </span>
        </div>

        {selectedIds.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleClearAll();
            }}
            title="Clear filter"
            className="p-0.5 rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-3 h-3" />
          </span>
        )}

        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] p-3 z-50 space-y-2 animate-in fade-in zoom-in-95">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${label || 'options'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-gray-200 bg-[#FFF9FB] text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-[#8A064D]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selection Shortcuts */}
          <div className="flex items-center justify-between text-[11px] font-bold px-1 border-b border-gray-100 pb-1.5">
            <span className="text-gray-500 font-semibold">
              {filteredOptions.length} of {options.length} {label || 'Options'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#8A064D] hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Options Checkbox List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center py-4">No matching options</p>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selectedIds.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition ${
                      isChecked
                        ? 'bg-[#FFF2F8] text-[#8A064D] font-bold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(opt.id)}
                      className="mt-0.5 rounded border-gray-300 text-[#8A064D] focus:ring-[#8A064D] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="block truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono shrink-0 ${badgeColor}`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subtitle && (
                        <span className="text-[10px] text-gray-500 font-normal block truncate mt-0.5">
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer Done button */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-600">
              {selectedIds.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 rounded-xl bg-[#590231] hover:bg-[#740340] text-white text-[11px] font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

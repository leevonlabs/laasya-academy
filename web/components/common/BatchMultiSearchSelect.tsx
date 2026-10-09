'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Layers, Search, ChevronDown, Check, X } from 'lucide-react';

export interface BatchOption {
  id: string;
  name: string;
  course_id: string;
  course_title?: string;
}

interface BatchMultiSearchSelectProps {
  batches: BatchOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function BatchMultiSearchSelect({
  batches,
  selectedIds,
  onChange,
  placeholder = 'All Batches (Multi-select)',
  className = ''
}: BatchMultiSearchSelectProps) {
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

  const filteredBatches = useMemo(() => {
    if (!search.trim()) return batches;
    const q = search.toLowerCase();
    return batches.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.course_title && b.course_title.toLowerCase().includes(q))
    );
  }, [batches, search]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleBatch = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedIds);
    filteredBatches.forEach(b => newSelected.add(b.id));
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
          <Layers className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
          <div className="truncate">
            {selectedIds.length === 0 ? (
              <span className="text-gray-600 font-bold">{placeholder}</span>
            ) : selectedIds.length === 1 ? (
              <span className="text-[#590231] font-bold">
                {(() => {
                  const b = batches.find(item => item.id === selectedIds[0]);
                  if (!b) return '1 Batch Selected';
                  return b.course_title ? `${b.name} (${b.course_title})` : b.name;
                })()}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-[#590231]">
                <span>{selectedIds.length} Batches Selected</span>
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
              placeholder="Search batch or course name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0D5E4]/60 text-[11px] font-bold">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-[#8A064D] hover:underline cursor-pointer"
            >
              Select All ({filteredBatches.length})
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-gray-500 hover:text-rose-600 cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
            {filteredBatches.length > 0 ? (
              filteredBatches.map(b => {
                const isSelected = selectedSet.has(b.id);
                const displayLabel = b.course_title ? `${b.name} (${b.course_title})` : b.name;
                return (
                  <div
                    key={b.id}
                    onClick={() => toggleBatch(b.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#FFF2F8] text-[#590231] font-bold border border-[#F0D5E4]'
                        : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                        isSelected ? 'bg-[#8A064D] border-[#8A064D] text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{displayLabel}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-gray-400 font-medium">
                No batches matching &quot;{search}&quot;
              </div>
            )}
          </div>

          {/* Footer Summary */}
          <div className="pt-2 mt-2 border-t border-[#F0D5E4]/60 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
            <span>{selectedIds.length} of {batches.length} selected</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 bg-[#8A064D] hover:bg-[#590231] text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

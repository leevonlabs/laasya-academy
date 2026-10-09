'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Search, ChevronDown, Check, X, CheckSquare, Square } from 'lucide-react';
import { StudentOption } from './StudentSearchSelect';

interface StudentMultiSearchSelectProps {
  students: StudentOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function StudentMultiSearchSelect({
  students,
  selectedIds,
  onChange,
  placeholder = 'All Students (Search & Multi-select)',
  className = ''
}: StudentMultiSearchSelectProps) {
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

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(q))
    );
  }, [students, search]);

  const selectedStudentsMap = useMemo(() => {
    const set = new Set(selectedIds);
    return set;
  }, [selectedIds]);

  const toggleStudent = (id: string) => {
    if (selectedStudentsMap.has(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedIds);
    filteredStudents.forEach(s => newSelected.add(s.id));
    onChange(Array.from(newSelected));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const removeStudent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(item => item !== id));
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
                {students.find(s => s.id === selectedIds[0])?.full_name || '1 Student Selected'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-[#590231]">
                <span>{selectedIds.length} Students Selected</span>
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
              placeholder="Search student name or roll #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
            />
          </div>

          {/* Action Row: Select all / Clear all */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0D5E4]/60 px-1 text-xs">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-[#8A064D] hover:text-[#590231] font-bold text-[11px] cursor-pointer"
            >
              Select All {search ? `Filtered (${filteredStudents.length})` : `(${students.length})`}
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-gray-500 hover:text-red-600 font-bold text-[11px] cursor-pointer"
              >
                Clear All ({selectedIds.length})
              </button>
            )}
          </div>

          {/* Student List with Checkboxes */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredStudents.map((s) => {
              const isSelected = selectedStudentsMap.has(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition flex items-center justify-between cursor-pointer select-none ${
                    isSelected ? 'bg-[#FFF2F8] text-[#8A064D] font-bold' : 'text-gray-700 hover:bg-[#FFF9FB]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div className="shrink-0 text-[#8A064D]">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 fill-[#FFF2F8] stroke-[2.5]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300 stroke-[2]" />
                      )}
                    </div>
                    <div className="truncate">
                      <span className="block truncate font-bold text-gray-800">{s.full_name}</span>
                      {s.roll_number && (
                        <span className="text-[10px] text-gray-400 block font-mono">{s.roll_number}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="py-4 text-center text-xs text-gray-400 font-medium">
                No students match &quot;{search}&quot;
              </div>
            )}
          </div>

          {/* Done Button */}
          <div className="pt-2.5 mt-2 border-t border-[#F0D5E4]/60 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-semibold">
              {selectedIds.length} of {students.length} selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

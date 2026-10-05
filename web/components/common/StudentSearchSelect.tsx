'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Search, ChevronDown, Check, X } from 'lucide-react';

export interface StudentOption {
  id: string;
  full_name: string;
  roll_number?: string;
}

interface StudentSearchSelectProps {
  students: StudentOption[];
  value: string; // studentId or '' for all
  onChange: (studentId: string, studentName?: string) => void;
  placeholder?: string;
  className?: string;
}

export default function StudentSearchSelect({
  students,
  value,
  onChange,
  placeholder = 'All Students',
  className = ''
}: StudentSearchSelectProps) {
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

  const selectedStudent = students.find(s => s.id === value || s.full_name.toLowerCase() === value.toLowerCase());

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.roll_number && s.roll_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef} suppressHydrationWarning>
      {/* Trigger Button */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition focus:outline-none focus:ring-2 focus:ring-[#8A064D] ${
          isOpen ? 'ring-2 ring-[#8A064D]/20 border-[#8A064D] bg-white' : ''
        } cursor-pointer`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <User className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
          <span className="truncate text-gray-800">
            {selectedStudent ? (
              <span>
                <strong className="text-[#2D041A]">{selectedStudent.full_name}</strong>
                {selectedStudent.roll_number && (
                  <span className="text-gray-400 font-normal ml-1">({selectedStudent.roll_number})</span>
                )}
              </span>
            ) : (
              <span className="text-gray-600 font-medium">{placeholder}</span>
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
        <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search student name or roll #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
            />
          </div>

          {/* Student List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin">
            {/* Option to clear / show all */}
            <button
              type="button"
              onClick={() => {
                onChange('', '');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                !value ? 'bg-[#FFF2F8] text-[#8A064D]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>All Students ({students.length})</span>
              {!value && <Check className="w-3.5 h-3.5 text-[#8A064D]" />}
            </button>

            {filteredStudents.map((s) => {
              const isSelected = value === s.id || value.toLowerCase() === s.full_name.toLowerCase();
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.id, s.full_name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                    isSelected ? 'bg-[#FFF2F8] text-[#8A064D] font-bold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="block truncate font-medium">{s.full_name}</span>
                    {s.roll_number && (
                      <span className="text-[10px] text-gray-400 block font-mono">{s.roll_number}</span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />}
                </button>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="py-3 text-center text-xs text-gray-400">
                No students found matching &quot;{search}&quot;
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface ComboboxOption {
  id: string;
  label: string;
  subtitle?: string;
  badge?: string;
  badgeClassName?: string;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string; // selected id
  onChange: (id: string, option?: ComboboxOption) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  emptyMessage?: string;
}

export default function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = 'Type to search...',
  disabled = false,
  required = false,
  className = '',
  emptyMessage = 'No matching results found'
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync selected option label into input text when value changes
  useEffect(() => {
    const selected = options.find(o => o.id === value);
    if (selected) {
      setSearchQuery(selected.label);
    } else if (!value) {
      setSearchQuery('');
    }
  }, [value, options]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If query was typed but not selected from list, revert back to currently selected label
        const selected = options.find(o => o.id === value);
        if (selected) {
          setSearchQuery(selected.label);
        } else {
          setSearchQuery('');
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, value, options]);

  // Filter options based on typed search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(o => 
      o.label.toLowerCase().includes(q) ||
      (o.subtitle && o.subtitle.toLowerCase().includes(q)) ||
      (o.badge && o.badge.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleSelect = (option: ComboboxOption) => {
    setSearchQuery(option.label);
    onChange(option.id, option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    onChange('', undefined);
    setIsOpen(true);
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev + 1) % (filteredOptions.length || 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % (filteredOptions.length || 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Cell */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          required={required && !value}
          value={searchQuery}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
            // If user cleared the input, notify parent
            if (!e.target.value) {
              onChange('', undefined);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pl-4 pr-16 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition ${
            isOpen ? 'border-[#8A064D] ring-2 ring-[#8A064D]/10 bg-white' : 'border-gray-200'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}`}
        />

        {/* Right Action Icons: Clear & Chevron */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {searchQuery && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus({ preventScroll: true });
              }
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-[#8A064D] transition cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu Options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white rounded-2xl shadow-xl border border-[#F0D5E4] py-1 animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
              {emptyMessage}
            </div>
          ) : (
            <ul ref={listRef} className="divide-y divide-gray-50">
              {filteredOptions.map((opt, idx) => {
                const isSelected = opt.id === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(opt)}
                    className={`px-4 py-3 flex items-center justify-between text-sm cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#FFF2F8] text-[#8A064D] font-bold'
                        : isHighlighted
                        ? 'bg-rose-50/50 text-[#2D041A]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold truncate text-[#2D041A] text-sm">{opt.label}</span>
                        {opt.badge && (
                          <span className={`shrink-0 text-xs font-black px-2.5 py-0.5 rounded-full border ${
                            opt.badgeClassName || (opt.badge.includes('Batch') 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-[#FFF2F8] text-[#8A064D] border-rose-200')
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subtitle && (
                        <p className="text-xs text-gray-500 font-medium truncate mt-1">
                          {opt.subtitle}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#8A064D] shrink-0 ml-2" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Room } from '@/lib/academy';
import { DoorOpen, ChevronDown, Search, Plus, Check, Loader2, X, Trash2 } from 'lucide-react';

export interface SearchableRoomSelectProps {
  value: string;
  onChange: (roomName: string, capacity?: number) => void;
  rooms: Room[];
  onRoomCreated?: (newRoom: Room) => void;
  onRoomDeleted?: (roomId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchableRoomSelect({
  value,
  onChange,
  rooms,
  onRoomCreated,
  onRoomDeleted,
  placeholder = 'Select a classroom or hall...',
  disabled = false
}: SearchableRoomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(25);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setErrorMsg(null);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && !isCreating && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isCreating]);

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRoomName.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a room name');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, capacity: Number(newRoomCapacity) || 25 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');

      if (onRoomCreated) {
        onRoomCreated(data.room);
      }
      onChange(data.room.name, data.room.capacity);
      setNewRoomName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete room "${roomName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/rooms?id=${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete room');
      if (onRoomDeleted) {
        onRoomDeleted(roomId);
      }
      if (value === roomName) {
        onChange('');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting room');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/80 border rounded-xl text-xs flex items-center justify-between text-left transition focus:outline-none focus:ring-2 focus:ring-[#8A064D] ${
          isOpen ? 'border-[#8A064D] ring-2 ring-[#8A064D]/20 bg-white' : 'border-gray-200'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 truncate">
          <DoorOpen className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
          {value ? (
            <span className="font-semibold text-gray-800 truncate">{value}</span>
          ) : (
            <span className="text-gray-400 font-normal truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-[#F0D5E4] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Top Option: Create Room Action */}
          {!isCreating ? (
            <div className="pb-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(true);
                  setErrorMsg(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] text-xs font-bold border border-[#F0D5E4] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Room</span>
              </button>
            </div>
          ) : (
            /* Inline Create Room Form */
            <form onSubmit={handleCreateRoom} className="pb-2.5 border-b border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#2D041A]">Create & Assign Room</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {errorMsg && (
                <div className="text-[10px] text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                  {errorMsg}
                </div>
              )}

              <input
                type="text"
                autoFocus
                placeholder="Room Name (e.g. Natya Studio 3)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
              />

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="Capacity"
                  value={newRoomCapacity}
                  onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  title="Class Capacity"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#8A064D] hover:bg-[#70043E] text-white py-1 px-3 rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save & Select</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Search Input */}
          <div className="py-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
              />
            </div>
          </div>

          {/* Rooms List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((r) => {
                const isSelected = value?.toLowerCase().trim() === r.name.toLowerCase().trim();
                return (
                  <div
                    key={r.id}
                    className={`w-full px-2.5 py-1 rounded-lg text-xs flex items-center justify-between transition group ${
                      isSelected
                        ? 'bg-[#FFF2F8] text-[#8A064D] font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange(r.name, r.capacity);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className="flex items-center gap-2 truncate pr-2 flex-1 text-left cursor-pointer py-1"
                    >
                      <DoorOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#8A064D]' : 'text-gray-400'}`} />
                      <span className="truncate">{r.name}</span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {r.capacity || 25} seats
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#8A064D]" />}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRoom(r.id, r.name, e)}
                        title={`Delete ${r.name}`}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-gray-400">No rooms found matching &quot;{search}&quot;</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewRoomName(search);
                    setIsCreating(true);
                  }}
                  className="mt-1 text-xs text-[#8A064D] font-semibold hover:underline"
                >
                  Create &quot;{search}&quot;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

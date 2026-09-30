'use client';

import React, { useState } from 'react';
import { Trainer } from '@/lib/academy';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  Award, 
  Calendar, 
  X,
  Search,
  Sparkles
} from 'lucide-react';

interface Props {
  initialTrainers: Trainer[];
}

export default function TrainersListClient({ initialTrainers }: Props) {
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New trainer form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specs, setSpecs] = useState('');
  const [bio, setBio] = useState('');

  const filteredTrainers = trainers.filter(t => 
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.specializations?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const specializationsArray = specs.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          specializations: specializationsArray,
          bio
        })
      });

      if (res.ok) {
        const added = await res.json();
        setTrainers(prev => [...prev, {
          ...added,
          full_name: fullName,
          email,
          phone,
          batches_assigned: 0
        }]);
        setIsAddOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setSpecs('');
        setBio('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Faculty & Instructors</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-semibold">
              {trainers.length} Gurus
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage classical dance gurus, vocal masters, music maestros, and martial arts trainers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by guru name, discipline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#F0D5E4] rounded-xl text-xs w-64 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Add Instructor</span>
          </button>
        </div>
      </div>

      {/* Trainers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Profile Card Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] font-bold text-base flex items-center justify-center shadow-md">
                    {t.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#2D041A] leading-tight">
                      {t.full_name}
                    </h3>
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Active Instructor
                    </span>
                  </div>
                </div>

                <div className="bg-[#FFF2F8] border border-[#F0D5E4] px-2.5 py-1 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Batches</span>
                  <span className="text-xs font-bold text-[#8A064D]">
                    {t.batches_assigned || 0}
                  </span>
                </div>
              </div>

              {/* Specializations Badges */}
              <div className="mb-4">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">
                  Disciplines / Art Forms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {t.specializations && t.specializations.length > 0 ? (
                    t.specializations.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium bg-[#FFF9FB] text-[#8A064D] border border-rose-100 px-2.5 py-0.5 rounded-lg"
                      >
                        {spec}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No disciplines tagged yet</span>
                  )}
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                {t.bio || 'Experienced artist and educator dedicated to fostering students artistic excellence.'}
              </p>
            </div>

            {/* Contact Footer */}
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="w-3.5 h-3.5 text-[#8A064D]" />
                <span className="truncate">{t.email}</span>
              </div>
              {t.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>{t.phone}</span>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Add Instructor Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Add New Instructor</h3>
                <p className="text-xs text-gray-500">Create instructor account and assign art disciplines.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTrainer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Guru / Trainer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guru Smt. Kalyani Devi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="kalyani@laasyaacademy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98480 11111"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Art Disciplines / Specializations (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Bharathanatyam, Kuchupudi, Carnatic Music"
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bio / Profile Summary</label>
                <textarea
                  rows={3}
                  placeholder="Credentials, years of experience, awards, dance master lineage..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Creating Account...' : 'Add Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

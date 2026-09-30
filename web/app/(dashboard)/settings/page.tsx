import React from 'react';
import Image from 'next/image';
import { 
  Building2, 
  Database, 
  Palette, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const brandColors = [
    { name: 'Royal Magenta Plum (Primary)', hex: '#8A064D', desc: 'Main navigation, headers, and primary buttons' },
    { name: 'Deep Wine Plum (Secondary)', hex: '#590231', desc: 'Dark sidebars, card footers, and active states' },
    { name: 'Cultural Radiant Gold (Accent)', hex: '#F9E33A', desc: 'Emblem rings, badges, accents, and student PINs' },
    { name: 'Warm Cream Surface (Light)', hex: '#FFF9FB', desc: 'Page background and soft surface containers' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D041A]">Academy Identity & Infrastructure</h1>
        <p className="text-xs text-gray-500 mt-1">
          Brand configuration, color system, and Supabase cloud database credentials.
        </p>
      </div>

      {/* Brand Identity Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-sm">
        <h2 className="text-base font-bold text-[#2D041A] mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#8A064D]" />
          <span>Academy Brand Identity</span>
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-[#590231] text-white border border-[#F9E33A]/30">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#F9E33A] bg-[#2A0017] shrink-0 p-1">
            <Image 
              src="/crest_logo.png" 
              alt="Logo Crest" 
              width={80} 
              height={80} 
              className="rounded-full object-cover"
            />
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">
              Laasya Cultural Academy
            </h3>
            <p className="text-sm font-semibold text-[#F9E33A] mt-0.5 tracking-wider uppercase">
              Classical Dance & Fine Arts Institution
            </p>
            <p className="text-xs text-rose-200 mt-1">
              Motto: <strong className="text-white">&quot;Unlock Your Talent&quot;</strong> • Official Web: <a href="https://www.laasyaacademy.com" target="_blank" rel="noreferrer" className="underline hover:text-[#F9E33A]">www.laasyaacademy.com</a>
            </p>
          </div>
        </div>

        {/* Color Palette Swatches */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#8A064D]" />
            <span>Harmonized Color Palette (Extracted from Brand Logo)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {brandColors.map((c) => (
              <div key={c.hex} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                <div 
                  className="w-full h-12 rounded-xl mb-3 shadow-xs border border-black/10" 
                  style={{ backgroundColor: c.hex }} 
                />
                <div className="font-bold text-xs text-gray-800">{c.name}</div>
                <div className="text-xs font-mono font-semibold text-[#8A064D] mt-0.5">{c.hex}</div>
                <div className="text-[11px] text-gray-500 mt-1 leading-snug">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-sm">
        <h2 className="text-base font-bold text-[#2D041A] mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#8A064D]" />
          <span>Supabase Backend Configuration</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Supabase Project ID</span>
              <span className="font-mono font-bold text-gray-800">bhpqzrcohjigkkpmcdsy</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Cloud Region</span>
              <span className="font-semibold text-gray-800">ap-northeast-2 (Seoul)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Database Port & Pooler</span>
              <span className="font-mono text-gray-700">6543 (Transaction Pooler)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Row Level Security (RLS) Active</span>
            </div>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              All 8 tables (courses, trainers, students, batches, sessions, attendance) are strictly guarded. Student check-in function <code className="font-mono text-[#8A064D]">student_self_check_in()</code> is deployed.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Attractive Branded Loading Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8A064D] via-[#750441] to-[#590231] p-6 text-white shadow-lg border border-[#F9E33A]/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,227,58,0.15),transparent_60%)] animate-pulse" />
        
        {/* Animated Top Shimmer Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F9E33A] to-transparent animate-[shimmer_2s_infinite]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Spinning Mandala / Ring Accent */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#F9E33A]/70 animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-1.5 rounded-full border border-[#F9E33A]/40 animate-[spin_6s_linear_infinite_reverse]" />
              <div className="w-9 h-9 rounded-full bg-[#590231] border border-[#F9E33A] flex items-center justify-center shadow-md">
                <span className="font-serif font-black text-xs text-[#F9E33A]">LC</span>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-[#F9E33A] border border-[#F9E33A]/30">
                <Sparkles className="w-3 h-3 text-[#F9E33A] animate-spin" />
                <span>Laasya Cultural Academy</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1 tracking-tight">
                Loading Academy Portal...
              </h2>
              <p className="text-xs text-rose-100/80">
                Harmonizing Art, Tradition & Realtime Excellence
              </p>
            </div>
          </div>

          {/* Smooth Pulsing Progress Meter */}
          <div className="w-full md:w-56 bg-black/30 backdrop-blur-xs rounded-2xl p-2.5 border border-white/10">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#F9E33A] uppercase tracking-wider mb-1.5">
              <span>Synchronizing</span>
              <span className="animate-pulse">Active</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#F9E33A] to-amber-300 rounded-full animate-[indeterminate_1.5s_infinite_ease-in-out]" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Skeleton with gentle shimmer */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="bg-white/90 p-4 rounded-2xl border border-[#F0D5E4] shadow-xs space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl bg-[#FFF2F8] border border-[#F0D5E4] animate-pulse" />
              <div className="h-2.5 w-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-2 w-20 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="h-5 w-44 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="h-16 bg-[#FFF9FB]/60 rounded-2xl border border-rose-100/60 p-3.5 flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-gray-200 rounded" />
                  <div className="h-2.5 w-24 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-rose-100/60 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

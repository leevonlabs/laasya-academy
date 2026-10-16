import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-28 rounded-3xl bg-white/40 backdrop-blur-xs border border-[#F0D5E4]/60 p-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200/60" />
          <div className="space-y-2">
            <div className="h-4 w-48 rounded-lg bg-gray-200/60" />
            <div className="h-3 w-72 rounded-md bg-gray-200/40" />
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-gray-200/50" />
          <div className="h-9 w-28 rounded-xl bg-gray-200/50" />
        </div>
      </div>

      {/* Metric Cards Transparent Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[...Array(6)].map((_, i) => (
          <div
            key={`kpi-skel-${i}`}
            className="p-4 rounded-2xl bg-white/50 backdrop-blur-xs border border-[#F0D5E4]/50 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-gray-200/60" />
              <div className="w-10 h-3 rounded-full bg-gray-200/40" />
            </div>
            <div className="space-y-1.5">
              <div className="w-16 h-6 rounded-md bg-gray-200/60" />
              <div className="w-20 h-2.5 rounded-full bg-gray-200/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Transparent Content Grids Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={`content-skel-${i}`}
            className="p-5 rounded-3xl bg-white/50 backdrop-blur-xs border border-[#F0D5E4]/50 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-gray-200/60" />
              <div className="w-16 h-4 rounded-full bg-gray-200/40" />
            </div>
            <div className="space-y-2">
              <div className="w-3/4 h-4 rounded-lg bg-gray-200/60" />
              <div className="w-1/2 h-3 rounded-md bg-gray-200/40" />
            </div>
            <div className="h-16 rounded-2xl bg-gray-100/50 border border-gray-100/60" />
            <div className="pt-2 flex gap-2">
              <div className="flex-1 h-8 rounded-xl bg-gray-200/50" />
              <div className="w-16 h-8 rounded-xl bg-gray-200/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

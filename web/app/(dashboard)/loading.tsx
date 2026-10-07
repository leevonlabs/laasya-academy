import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-36 rounded-3xl bg-gradient-to-r from-[#8A064D]/15 via-[#750441]/10 to-[#590231]/15 border border-[#F0D5E4]/60 p-6 flex flex-col justify-center space-y-3">
        <div className="h-4 w-32 bg-[#8A064D]/20 rounded-full" />
        <div className="h-8 w-64 bg-[#8A064D]/25 rounded-xl" />
        <div className="h-4 w-96 bg-[#8A064D]/15 rounded-lg max-w-full" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-white p-4 rounded-2xl border border-[#F0D5E4] space-y-3">
            <div className="w-8 h-8 rounded-xl bg-[#FFF2F8] border border-[#F0D5E4]" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-12 bg-gray-300 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
          <div className="h-8 w-28 bg-gray-100 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50/80 rounded-2xl border border-gray-100 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

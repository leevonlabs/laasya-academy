import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#8A064D]" />
          <span>Settings</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          System settings and preferences.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-12 border border-[#F0D5E4] shadow-xs text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center mx-auto mb-3">
          <Settings className="w-6 h-6 text-[#8A064D]" />
        </div>
        <h2 className="text-sm font-bold text-[#2D041A]">Settings Cleared</h2>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          All identity, infrastructure, and brand details have been removed.
        </p>
      </div>
    </div>
  );
}

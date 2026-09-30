'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Sign Out"
      className="p-1.5 rounded-lg text-rose-200/80 hover:text-white hover:bg-[#8A064D] transition cursor-pointer"
    >
      <LogOut className="w-4 h-4 text-rose-300" />
    </button>
  );
}

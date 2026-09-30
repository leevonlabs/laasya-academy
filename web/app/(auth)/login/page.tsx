'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('director@laasyaacademy.com');
  const [password, setPassword] = useState('Laasya@Owner2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillCredentials = () => {
    setEmail('director@laasyaacademy.com');
    setPassword('Laasya@Owner2026');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign in.');
      }

      router.push('/overview');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2D041A] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Decorative Brand Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#8A064D] rounded-full blur-[140px] opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#F9E33A] rounded-full blur-[180px] opacity-30 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Academy Brand Card Header */}
        <div className="bg-[#8A064D] text-white p-6 rounded-t-3xl text-center border-b border-[#F9E33A]/30 relative shadow-2xl">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Image 
              src="/header_logo.png" 
              alt="Laasya Cultural Academy Logo" 
              width={260} 
              height={76} 
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>
          
          <p className="text-[#F9E33A] font-semibold text-sm mt-1 tracking-wider uppercase">
            Unlock Your Talent
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 bg-[#590231]/80 px-3 py-1 rounded-full text-xs text-[#FFF9FB] border border-[#F9E33A]/40">
            <Sparkles className="w-3.5 h-3.5 text-[#F9E33A]" />
            <span className="tracking-wider uppercase font-semibold text-[11px]">Owner & Director Portal</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="bg-white p-8 rounded-b-3xl shadow-2xl border-x border-b border-[#F0D5E4]">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-[#2D041A]">Welcome, Director</h2>
            <p className="text-xs text-gray-500 mt-1">
              Sign in to manage courses, faculty, students, schedules & fees.
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Director Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A064D] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@laasyaacademy.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={fillCredentials}
                  className="text-[11px] text-[#8A064D] hover:underline font-medium cursor-pointer"
                >
                  Reset to default
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A064D] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-[#8A064D] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#8A064D] focus:ring-[#8A064D]"
                />
                <span>Remember me</span>
              </label>
              <span className="text-[11px] text-gray-400">Owner Session Protected</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#8A064D] hover:bg-[#72043F] text-white font-medium py-3 rounded-xl shadow-lg shadow-[#8A064D]/25 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Management Portal</span>
                  <ArrowRight className="w-4 h-4 text-[#F9E33A]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={fillCredentials}
              className="w-full bg-[#FFF9FB] hover:bg-[#FDF2F7] border border-[#F0D5E4] rounded-xl p-3 text-center transition cursor-pointer text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#8A064D] shrink-0" />
                <div>
                  <p className="text-[11px] text-[#590231] font-bold">
                    1-Click Auto-Fill Director Credentials
                  </p>
                  <p className="text-[10px] text-gray-500">
                    director@laasyaacademy.com • Laasya@Owner2026
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#8A064D]" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-rose-100/70 mt-4">
          Laasya Cultural Academy Management System • Protected by Supabase RLS
        </p>
      </div>
    </div>
  );
}

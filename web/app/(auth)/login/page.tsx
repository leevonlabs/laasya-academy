'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Phone, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign in. Please verify your credentials.');
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
    <div className="min-h-screen bg-[#2D041A] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Decorative Brand Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#8A064D] rounded-full blur-[140px] opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#F9E33A] rounded-full blur-[180px] opacity-30 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg relative z-10">
        
        {/* Academy Brand Card Header */}
        <div className="bg-gradient-to-b from-[#8A064D] to-[#590231] text-white p-7 rounded-t-3xl text-center border-b border-[#F9E33A]/40 relative shadow-2xl">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <Image 
              src="/header_logo.png" 
              alt="Laasya Cultural Academy Logo" 
              width={280} 
              height={82} 
              className="object-contain drop-shadow-xl w-auto h-auto"
              priority
            />
          </div>
          
          <div className="inline-flex items-center gap-2 mt-2 bg-[#3F0123]/90 px-4 py-1.5 rounded-full text-xs text-[#FFF9FB] border border-[#F9E33A]/50 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#F9E33A]" />
            <span className="tracking-wider uppercase font-bold text-xs text-[#F9E33A]">Director & Administrator Portal</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="bg-white p-8 sm:p-9 rounded-b-3xl shadow-2xl border-x border-b border-[#F0D5E4]">
          <div className="mb-7 text-center">
            <h2 className="text-2xl font-bold text-[#2D041A]">Academy Admin Sign In</h2>
            <p className="text-sm font-semibold text-[#8A064D] mt-2 leading-relaxed">
              Central Administration & Operational Management
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-md mx-auto">
              Please enter your registered admin phone number and password to access the portal.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium text-xs leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#2D041A] mb-2">
                Admin Phone Number
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-[#8A064D] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number (e.g. 7780763121)"
                  className="w-full pl-11 pr-4 py-3 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl text-base text-[#2D041A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:border-[#8A064D] focus:bg-white transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#2D041A] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#8A064D] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-11 pr-11 py-3 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl text-base text-[#2D041A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:border-[#8A064D] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-[#8A064D] cursor-pointer transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-[#6E3955] pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8A064D] accent-[#8A064D] focus:ring-[#8A064D] cursor-pointer"
                />
                <span className="font-semibold text-gray-700 text-xs">Keep me signed in</span>
              </label>
              <span className="text-xs font-semibold text-[#8C5E77]">Secure SSL Authentication</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-[#8A064D] hover:bg-[#72043F] active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#8A064D]/25 border border-[#F9E33A]/40 transition flex items-center justify-center gap-2.5 text-base disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-5 h-5 text-[#F9E33A]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs font-medium text-rose-100/80 mt-5">
          Laasya Cultural Academy Management Portal • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}

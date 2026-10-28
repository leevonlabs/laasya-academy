'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Phone, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';
import Particles from '@/components/react-bits/Particles';
import SpotlightCard from '@/components/react-bits/SpotlightCard';
import ShinyText from '@/components/react-bits/ShinyText';

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

      // If receptionist, route to their designated start page or overview
      if (data.user?.role === 'receptionist') {
        const allowed = data.user.allowedPages || [];
        const target = allowed.includes('/overview') ? '/overview' : (allowed[0] || '/reception-profile');
        router.push(target);
      } else {
        router.push('/overview');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#220314] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* 1. React Bits Interactive Canvas Particles Backdrop */}
      <Particles
        quantity={45}
        color="#F9E33A"
        staticity={40}
        ease={45}
        className="opacity-70"
      />

      {/* 2. Soft Ambient Brand Glow Orbs */}
      <div className="absolute -top-36 -left-36 w-[420px] h-[420px] bg-[#8A064D]/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-[420px] h-[420px] bg-[#F9E33A]/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#590231]/30 rounded-full blur-[180px] pointer-events-none" />

      {/* 3. Main Center Stage with React Bits Spotlight Card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Spotlight Card Wrapper */}
        <SpotlightCard
          spotlightColor="rgba(249, 227, 58, 0.16)"
          spotlightSize={420}
          className="bg-white/95 backdrop-blur-md shadow-2xl border border-[#F9E33A]/40 ring-1 ring-white/10"
        >
          {/* Brand Header Banner */}
          <div className="bg-gradient-to-b from-[#8A064D] via-[#750341] to-[#590231] text-white p-6 sm:p-7 text-center relative border-b border-[#F9E33A]/30 overflow-hidden">
            
            {/* Subtle header inner ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center gap-2">
              <div className="bg-white/95 px-5 py-2.5 rounded-2xl shadow-lg border border-[#F9E33A]/50 max-w-[240px] transition-transform duration-300 hover:scale-[1.02]">
                <Image 
                  src="/academy_illustration.png" 
                  alt="Laasya Cultural Academy Arts" 
                  width={220} 
                  height={88} 
                  className="w-full h-auto object-contain mx-auto"
                  priority
                />
              </div>
              <Image 
                src="/header_logo.png" 
                alt="Laasya Cultural Academy Logo" 
                width={250} 
                height={68} 
                className="object-contain drop-shadow-xl w-auto h-auto mt-0.5"
                priority
              />

              {/* Management Badge */}
              <div className="inline-flex items-center gap-2 mt-2 bg-[#3F0123]/95 px-4 py-1.5 rounded-full text-xs border border-[#D4AF37]/50 shadow-inner">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <ShinyText text="Director & Staff Management Portal" speed={3.5} className="text-xs tracking-wider uppercase font-extrabold text-[#F5E8C7]" />
              </div>
            </div>
          </div>

          {/* Login Form Body */}
          <div className="p-7 sm:p-8 bg-white/90">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-[#2D041A] tracking-tight">
                Academy Sign In
              </h1>
              <p className="text-xs font-semibold text-[#8A064D] mt-1.5 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8A064D]" />
                <span>Central Administration & Front Desk Management</span>
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-500 bg-[#FBF7FA] py-1.5 px-3 rounded-xl border border-[#F0D5E4]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supports Owner & Receptionist Registered Credentials</span>
              </div>
            </div>

            {error && (
              <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Input with modern micro-interactions */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#590231] mb-1.5">
                  Registered Mobile Number
                </label>
                <div className="relative group">
                  <Phone className="w-4 h-4 text-[#8A064D] absolute left-3.5 top-3.5 pointer-events-none transition-colors group-focus-within:text-[#F9E33A]" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl text-sm font-semibold text-[#2D041A] placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:border-[#8A064D] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#590231] mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-[#8A064D] absolute left-3.5 top-3.5 pointer-events-none transition-colors group-focus-within:text-[#F9E33A]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-xl text-sm font-semibold text-[#2D041A] placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:border-[#8A064D] focus:bg-white transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-[#8A064D] cursor-pointer transition p-0.5"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & SSL status */}
              <div className="flex items-center justify-between text-xs text-[#6E3955] pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#8A064D] accent-[#8A064D] focus:ring-[#8A064D] cursor-pointer"
                  />
                  <span className="font-semibold text-gray-700">Remember session</span>
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SSL Encrypted
                </span>
              </div>

              {/* Interactive Submit Button with Hover Sheen */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-[#8A064D] to-[#590231] hover:from-[#73023E] hover:to-[#450126] active:scale-[0.99] text-white font-extrabold py-3 px-5 rounded-xl shadow-lg shadow-[#8A064D]/25 border border-[#F9E33A]/40 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer group"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="tracking-wide">Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-[#F9E33A] group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </SpotlightCard>

        {/* Footer info */}
        <p className="text-center text-[11px] font-semibold text-rose-100/70 mt-4 tracking-wide">
          Laasya Cultural Academy Portal • ISO & SSL Secured
        </p>
      </div>
    </div>
  );
}

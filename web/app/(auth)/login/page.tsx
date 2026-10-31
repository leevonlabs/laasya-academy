'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  AlertCircle,
  X,
  Phone,
  MessageCircle,
  Clock,
  Info,
  CheckCircle2,
  ExternalLink,
  FileText,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine initial role from URL: ?role=student | ?role=guru | ?role=admin (or ?tab=admin)
  const initialRole = searchParams.get('role') || searchParams.get('tab') || 'student';
  const [activeTab, setActiveTab] = useState<'student' | 'guru' | 'admin'>(() => {
    if (initialRole === 'admin') return 'admin';
    if (initialRole === 'guru' || initialRole === 'trainer') return 'guru';
    return 'student';
  });

  // Student form state
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [agreeStudentTerms, setAgreeStudentTerms] = useState(true);

  // Guru form state
  const [guruPhone, setGuruPhone] = useState('');
  const [guruPassword, setGuruPassword] = useState('');
  const [showGuruPassword, setShowGuruPassword] = useState(false);
  const [agreeGuruTerms, setAgreeGuruTerms] = useState(true);

  // Admin form state
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Shared UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contact Admin Modal state for "Forgot Password" and "New Registration" (Student & Guru only)
  const [contactModal, setContactModal] = useState<{
    open: boolean;
    mode: 'forgot_password' | 'new_registration';
  }>({
    open: false,
    mode: 'forgot_password',
  });

  // Privacy Policy & Terms Modal state
  const [policyModal, setPolicyModal] = useState<{
    open: boolean;
    tab: 'privacy' | 'terms';
  }>({
    open: false,
    tab: 'privacy',
  });

  // Sync if query param changes
  useEffect(() => {
    const role = searchParams.get('role') || searchParams.get('tab');
    if (role === 'admin') setActiveTab('admin');
    else if (role === 'guru' || role === 'trainer') setActiveTab('guru');
    else if (role === 'student') setActiveTab('student');
    setError(null);
  }, [searchParams]);

  const switchTab = (tab: 'student' | 'guru' | 'admin') => {
    setActiveTab(tab);
    setError(null);
  };

  // Helper to persist auth and launch portal directly into dashboard
  const persistSessionAndLaunchPortal = (profile: any) => {
    if (typeof window !== 'undefined' && profile) {
      const profileString = JSON.stringify(profile);
      // Double stringified JSON matches Flutter shared_preferences_web format exactly
      localStorage.setItem('flutter.saved_user_profile', JSON.stringify(profileString));
      localStorage.setItem('saved_user_profile', profileString);
      localStorage.setItem('laasya_cached_user', profileString);
      localStorage.setItem('flutter.fcm_user_role', JSON.stringify(profile.role || 'student'));
      localStorage.setItem('flutter.fcm_user_id', JSON.stringify(String(profile.id || profile.profile_id)));
    }
    // Direct browser redirect into portal - loads directly into Student/Trainer dashboard
    window.location.href = '/portal/';
  };

  // 1. Student / Parent Submit
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/mobile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: studentId.trim(),
          password: studentPassword.trim(),
          role: 'student',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials. Please verify your mobile number or roll number.');
      }

      persistSessionAndLaunchPortal(data.profile);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 2. Guru / Faculty Submit
  const handleGuruSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/mobile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: guruPhone.trim(),
          password: guruPassword.trim(),
          role: 'trainer',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials. Please check your registered mobile number or password.');
      }

      persistSessionAndLaunchPortal(data.profile);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 3. Admin ERP Submit
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: adminPhone.trim(),
          password: adminPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign in. Please verify your credentials.');
      }

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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE3EB] flex flex-col justify-center items-center px-3 sm:px-6 lg:px-8 py-6 sm:py-10 select-none">
      {/* Main Responsive Wrapper:
          - On mobile (< lg): centered 390px card
          - On desktop (>= lg): expansive, elegant 2-column academy portal container
      */}
      <div className="w-full max-w-[390px] lg:max-w-5xl xl:max-w-6xl mx-auto bg-transparent lg:bg-white lg:rounded-3xl lg:shadow-2xl lg:border lg:border-[#DFD0DA] lg:overflow-hidden lg:grid lg:grid-cols-12 transition-all">
        
        {/* ========================================================================= */}
        {/* DESKTOP-ONLY SHOWCASE COLUMN (Visible on lg and above)                     */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 bg-gradient-to-br from-[#400020] via-[#5C002E] to-[#800040] p-10 xl:p-12 text-white flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative circles in background */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#F9E33A]/10 blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image 
                src="/header_logo.png" 
                alt="Laasya Cultural Academy Logo" 
                width={160} 
                height={45} 
                className="object-contain h-10 w-auto brightness-110"
                priority
              />
            </Link>
            <div className="inline-flex items-center gap-1.5 ml-1 mt-2.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[#fbf0b9] text-[11px] font-semibold tracking-wide border border-white/15">
              <span>ISO 9001:2015 Certified Academy</span>
            </div>
          </div>

          {/* Center Card & Mission */}
          <div className="relative z-10 my-8">
            <div className="bg-white/95 rounded-2xl p-3 border-2 border-[#F9E33A] shadow-xl mb-6">
              <Image
                src="/academy_illustration.png"
                alt="Classical Arts Heritage"
                width={420}
                height={130}
                className="w-full h-32 object-contain mx-auto"
                priority
              />
            </div>

            <h2 className="font-serif text-2xl xl:text-3xl font-bold tracking-tight text-white mb-2.5 leading-snug">
              Preserving Traditions.<br />Inspiring Excellence.
            </h2>
            <p className="text-sm text-white/85 leading-relaxed mb-6 font-normal">
              Official learning &amp; administrative portal for disciples, gurus, and leadership across 18+ classical arts disciplines.
            </p>

            {/* Core Feature Highlights */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F9E33A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Live Disciples Portal</p>
                  <p className="text-[11px] text-white/70">Attendance streaks &amp; timetables</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F9E33A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Revered Faculty Desk</p>
                  <p className="text-[11px] text-white/70">Roll call, batches &amp; pay slips</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F9E33A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Class Conclusion Chime</p>
                  <p className="text-[11px] text-white/70">Instant safe child pickup alert</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F9E33A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">256-Bit SSL Protection</p>
                  <p className="text-[11px] text-white/70">Institutional-grade security</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Cultural Quote & Badges */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/75">
            <p className="italic font-serif text-[13px] text-[#fbf0b9]">
              &ldquo;Where discipline meets devotion, art becomes divine.&rdquo;
            </p>
            <span className="flex items-center gap-1 font-semibold text-[11px] text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Portal Live
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* AUTHENTICATION FORM COLUMN (Mobile: standalone / Desktop: right column)    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center px-4 sm:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 lg:py-12 bg-transparent lg:bg-[#FAF5F8]">
          
          {/* Mobile-Only Header Logo & Title (Hidden on desktop because left banner displays it) */}
          <div className="lg:hidden text-center mb-3.5">
            <Link href="/" className="inline-block transition-transform active:scale-95">
              <Image 
                src="/header_logo.png" 
                alt="Laasya Cultural Academy Logo" 
                width={200} 
                height={50} 
                className="object-contain w-auto h-11 mx-auto"
                priority
              />
            </Link>
            <h1 className="font-serif font-bold text-lg text-[#260317] tracking-tight mt-1.5">
              Laasya Cultural Academy
            </h1>
            <p className="text-xs text-[#705263] mt-0.5">
              Sign in to access your classes and updates
            </p>
          </div>

          {/* Mobile-Only Heritage Banner Card (Hidden on desktop) */}
          <div className="lg:hidden bg-white rounded-2xl p-2.5 border-2 border-[#F9E33A] shadow-xs flex items-center justify-center mb-3.5">
            <Image
              src="/academy_illustration.png"
              alt="Classical Arts Heritage"
              width={340}
              height={100}
              className="w-full h-24 object-contain mx-auto"
              priority
            />
          </div>

          {/* Desktop-Only Form Greeting Header */}
          <div className="hidden lg:block mb-6">
            <h1 className="font-serif font-bold text-2xl xl:text-3xl text-[#260317] tracking-tight">
              Sign In to Academy Portal
            </h1>
            <p className="text-xs xl:text-sm text-[#705263] mt-1.5">
              Select your role to access your personalized learning dashboard or administrative workspace.
            </p>
          </div>

          {/* Segmented Role Selector Pill (Student | Guru | Admin) */}
          <div className="bg-[#E4D2DC] p-1 rounded-2xl flex items-center gap-1 mb-4 shadow-inner">
            <button
              type="button"
              onClick={() => switchTab('student')}
              className={cn(
                'py-2.5 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer',
                activeTab === 'student'
                  ? 'bg-[#800040] text-white shadow-sm'
                  : 'bg-transparent text-[#260317] hover:bg-black/5'
              )}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('guru')}
              className={cn(
                'py-2.5 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer',
                activeTab === 'guru'
                  ? 'bg-[#800040] text-white shadow-sm'
                  : 'bg-transparent text-[#260317] hover:bg-black/5'
              )}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Guru / Faculty</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('admin')}
              className={cn(
                'py-2.5 px-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 flex-1 transition-all cursor-pointer',
                activeTab === 'admin'
                  ? 'bg-[#800040] text-white shadow-sm'
                  : 'bg-transparent text-[#260317] hover:bg-black/5'
              )}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Admin ERP</span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 1: STUDENT / PARENT                                                 */}
          {/* ======================================================================= */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#260317] mb-1.5">
                  Mobile Number or Student Roll No
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#800040] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter mobile number or roll number"
                    className="w-full bg-white rounded-xl py-2.5 sm:py-3 pl-10 pr-3 text-sm text-[#260317] placeholder:text-gray-400 border border-[#E0D0DA] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800040] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#260317] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#800040] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-white rounded-xl py-2.5 sm:py-3 pl-10 pr-10 text-sm text-[#260317] placeholder:text-gray-400 border border-[#E0D0DA] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800040] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-3 text-[#9E8C96] hover:text-[#800040] cursor-pointer p-0.5"
                    tabIndex={-1}
                    aria-label={showStudentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setContactModal({ open: true, mode: 'forgot_password' })}
                  className="text-xs font-bold text-[#800040] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Clear, Clickable Terms & Privacy Policy Checkbox */}
              <div className="pt-0.5">
                <label className="flex items-start gap-2.5 text-xs text-gray-700 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeStudentTerms}
                    onChange={(e) => setAgreeStudentTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-[#800040] accent-[#800040] cursor-pointer shrink-0"
                  />
                  <span className="leading-relaxed">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPolicyModal({ open: true, tab: 'terms' });
                      }}
                      className="underline font-bold text-[#800040] hover:text-[#590231] cursor-pointer inline"
                    >
                      Terms &amp; Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPolicyModal({ open: true, tab: 'privacy' });
                      }}
                      className="underline font-bold text-[#800040] hover:text-[#590231] cursor-pointer inline"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#800040] hover:bg-[#6B0036] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Sign In as Student</span>
                )}
              </button>

              {/* Assistance for Student */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#705263]">
                <span>New admission or registration?</span>
                <button
                  type="button"
                  onClick={() => setContactModal({ open: true, mode: 'new_registration' })}
                  className="font-bold text-[#800040] hover:underline cursor-pointer"
                >
                  Contact Admin &rarr;
                </button>
              </div>
            </form>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: GURU / FACULTY                                                   */}
          {/* ======================================================================= */}
          {activeTab === 'guru' && (
            <form onSubmit={handleGuruSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#260317] mb-1.5">
                  Registered Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#800040] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={guruPhone}
                    onChange={(e) => setGuruPhone(e.target.value)}
                    placeholder="Enter registered phone number"
                    className="w-full bg-white rounded-xl py-2.5 sm:py-3 pl-10 pr-3 text-sm text-[#260317] placeholder:text-gray-400 border border-[#E0D0DA] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800040] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#260317] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#800040] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showGuruPassword ? 'text' : 'password'}
                    required
                    value={guruPassword}
                    onChange={(e) => setGuruPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-white rounded-xl py-2.5 sm:py-3 pl-10 pr-10 text-sm text-[#260317] placeholder:text-gray-400 border border-[#E0D0DA] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800040] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGuruPassword(!showGuruPassword)}
                    className="absolute right-3 top-3 text-[#9E8C96] hover:text-[#800040] cursor-pointer p-0.5"
                    tabIndex={-1}
                    aria-label={showGuruPassword ? 'Hide password' : 'Show password'}
                  >
                    {showGuruPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setContactModal({ open: true, mode: 'forgot_password' })}
                  className="text-xs font-bold text-[#800040] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Clear, Clickable Terms & Privacy Policy Checkbox */}
              <div className="pt-0.5">
                <label className="flex items-start gap-2.5 text-xs text-gray-700 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeGuruTerms}
                    onChange={(e) => setAgreeGuruTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-[#800040] accent-[#800040] cursor-pointer shrink-0"
                  />
                  <span className="leading-relaxed">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPolicyModal({ open: true, tab: 'terms' });
                      }}
                      className="underline font-bold text-[#800040] hover:text-[#590231] cursor-pointer inline"
                    >
                      Terms &amp; Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setPolicyModal({ open: true, tab: 'privacy' });
                      }}
                      className="underline font-bold text-[#800040] hover:text-[#590231] cursor-pointer inline"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#800040] hover:bg-[#6B0036] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Sign In as Guru</span>
                )}
              </button>

              {/* Assistance for Guru */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#705263]">
                <span>Faculty account onboarding?</span>
                <button
                  type="button"
                  onClick={() => setContactModal({ open: true, mode: 'new_registration' })}
                  className="font-bold text-[#800040] hover:underline cursor-pointer"
                >
                  Contact Admin &rarr;
                </button>
              </div>
            </form>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: ADMIN ERP (STRICTLY NO FORGOT PASSWORD OR NEW REGISTRATION)       */}
          {/* ======================================================================= */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#260317] mb-1.5">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#800040] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="Enter registered mobile number"
                    className="w-full bg-white rounded-xl py-2.5 sm:py-3 pl-10 pr-3 text-sm text-[#260317] placeholder:text-gray-400 border border-[#E0D0DA] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800040] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#260317] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#800040] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-white rounded-xl py-2.5 sm:py-3 pl-10 pr-10 text-sm text-[#260317] placeholder:text-gray-400 border border-[#E0D0DA] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#800040] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-3 text-[#9E8C96] hover:text-[#800040] cursor-pointer p-0.5"
                    tabIndex={-1}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#260317] pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#800040] accent-[#800040] cursor-pointer"
                  />
                  <span className="font-semibold text-gray-800">Remember session</span>
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SSL Encrypted
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#800040] hover:bg-[#6B0036] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Sign In to ERP Dashboard &rarr;</span>
                )}
              </button>
            </form>
          )}

          {/* ======================================================================= */}
          {/* CLEAR, PROMINENT PRIVACY POLICY & TERMS FOOTER                          */}
          {/* ======================================================================= */}
          <div className="mt-6 pt-4 border-t border-[#E8DCE4] flex flex-col items-center gap-2.5 text-xs text-[#705263]">
            {/* Prominent clickable policy buttons */}
            <div className="flex items-center flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
              <button
                type="button"
                onClick={() => setPolicyModal({ open: true, tab: 'privacy' })}
                className="font-bold text-[#800040] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#800040]" />
                <span>Privacy Policy</span>
              </button>

              <span className="text-gray-300">•</span>

              <button
                type="button"
                onClick={() => setPolicyModal({ open: true, tab: 'terms' })}
                className="font-bold text-[#800040] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#800040]" />
                <span>Terms of Service</span>
              </button>

              <span className="text-gray-300">•</span>

              <Link
                href="/privacy"
                target="_blank"
                className="text-gray-500 hover:text-[#800040] flex items-center gap-0.5"
                title="Open standalone Privacy Policy document"
              >
                <span>Full Doc</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>

            <Link
              href="/"
              className="text-xs font-bold text-[#800040] hover:underline mt-1 transition-colors"
            >
              &larr; Back to Laasya Cultural Academy Home
            </Link>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CONTACT ADMIN ASSISTANCE MODAL (Student & Guru only)                   */}
      {/* ========================================================================= */}
      {contactModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/50 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#800040] p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold leading-tight">
                  {contactModal.mode === 'forgot_password'
                    ? 'Password Assistance'
                    : 'Academy Registration'}
                </h3>
                <p className="text-[10px] text-[#fbf0b9]/90 font-medium">
                  Administration Support Desk
                </p>
              </div>

              <button
                type="button"
                onClick={() => setContactModal({ open: false, mode: 'forgot_password' })}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-700 leading-relaxed">
                {contactModal.mode === 'forgot_password'
                  ? 'Student and faculty credentials are reset directly by the Academy Administration office.'
                  : 'New student admissions and faculty onboarding are registered directly by the Academy Administration desk.'}
              </p>

              {/* Action Buttons */}
              <div className="space-y-2">
                <a
                  href="tel:+917780763121"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:border-[#800040] hover:bg-[#FFF9FB] transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 group-hover:text-[#800040]">
                        Admin Front Desk
                      </p>
                      <p className="text-[10px] text-gray-500">Call office</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Call
                  </span>
                </a>

                <a
                  href="https://wa.me/917780763121"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-700">
                        WhatsApp Desk
                      </p>
                      <p className="text-[10px] text-gray-500">Message administrator</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full">
                    Chat
                  </span>
                </a>

                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2 text-[10px] text-gray-600">
                  <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  <span>Hours: Mon to Sat, 9:00 AM – 7:30 PM IST</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setContactModal({ open: false, mode: 'forgot_password' })}
                className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE PRIVACY POLICY & TERMS MODAL                               */}
      {/* ========================================================================= */}
      {policyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#DFD0DA] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header with Tabs */}
            <div className="bg-[#800040] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#fbf0b9]" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold leading-tight">
                    Academy Governance &amp; Legal Policies
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Compliant with Google Play, Apple App Store &amp; DPDP Act
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPolicyModal({ ...policyModal, open: false })}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Segmented Pill Selector for Privacy vs Terms */}
            <div className="bg-[#FAF5F8] p-2 border-b border-[#E8DCE4] flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPolicyModal({ ...policyModal, tab: 'privacy' })}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5',
                  policyModal.tab === 'privacy'
                    ? 'bg-[#800040] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Privacy Policy</span>
              </button>

              <button
                type="button"
                onClick={() => setPolicyModal({ ...policyModal, tab: 'terms' })}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5',
                  policyModal.tab === 'terms'
                    ? 'bg-[#800040] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Terms &amp; Conditions</span>
              </button>
            </div>

            {/* Scrollable Policy Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
              {policyModal.tab === 'privacy' ? (
                <>
                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="text-sm sm:text-base font-bold text-[#800040] mb-1">
                      1. Institutional Scope &amp; Child Safety
                    </h4>
                    <p>
                      Laasya Cultural Academy operates physical academies and digital portals for classical art forms. We strictly safeguard all enrolled disciple data, parental contact details, attendance registers, and academic progress records.
                    </p>
                  </div>

                  <div className="bg-[#FFF5F8] border border-[#F0D5E4] rounded-xl p-3 sm:p-4">
                    <h4 className="text-sm font-bold text-[#800040] mb-1 flex items-center gap-1.5">
                      <span>🔔</span> 2. Class Conclusion Alerts &amp; Safe Child Pickup
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed mb-2">
                      When a faculty Guru concludes a scheduled batch session, our system broadcasts an audible notification to enrolled parents.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-[11px] sm:text-xs text-gray-600">
                      <li><strong>Audible Notice for Parents:</strong> Rings on devices to notify parents that the class has ended so their child can be picked up safely from academy studios.</li>
                      <li><strong>Zero Background Tracking:</strong> We never track background location or drain battery. Alerts use standard Google Play FCM and Apple APNs channels.</li>
                    </ul>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="text-sm sm:text-base font-bold text-[#800040] mb-1">
                      3. Data Protection &amp; Minor Privacy
                    </h4>
                    <p>
                      Disciples under 18 have accounts created under parental consent. No minor disciple personal information is ever sold, leased, or disclosed to advertising brokers.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#800040] mb-1">
                      4. Security &amp; Access Controls
                    </h4>
                    <p>
                      All database transactions utilize 256-bit SSL encryption, PostgreSQL Row-Level Security (RLS), and salted credential hashing.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="text-sm sm:text-base font-bold text-[#800040] mb-1">
                      1. Terms of Enrollment &amp; Digital Usage
                    </h4>
                    <p>
                      By logging into the Laasya Cultural Academy portal or mobile application, you agree to adhere to academy regulations, fee schedules, classroom discipline, and respectful interaction with all Gurus and fellow disciples.
                    </p>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="text-sm sm:text-base font-bold text-[#800040] mb-1">
                      2. Role-Based Permissions
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li><strong>Student Portal:</strong> For disciples and parents to check schedules, submit practice video recordings, track fee receipts, and receive pickup chimes.</li>
                      <li><strong>Guru Portal:</strong> Exclusively for faculty to mark attendance, review assignments, and log teaching hours.</li>
                      <li><strong>Admin ERP:</strong> Restricted strictly to authorized academy officers.</li>
                    </ul>
                  </div>

                  <div className="bg-[#FFF5F8] border border-[#F0D5E4] rounded-xl p-3 sm:p-4">
                    <h4 className="text-sm font-bold text-[#800040] mb-1">
                      3. Fees, Attendance &amp; Class Timings
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Monthly or term fees must be remitted by the designated due date. Timely studio pickup after the conclusion of class is mandatory for student safety.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#800040] mb-1">
                      4. Intellectual Property &amp; Video Curricula
                    </h4>
                    <p>
                      Choreography, tala notations, audio recordings, and learning videos shared through the academy library remain the exclusive intellectual property of Laasya Cultural Academy.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer with External Links */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 text-xs">
                <Link
                  href={policyModal.tab === 'privacy' ? '/privacy' : '/terms'}
                  target="_blank"
                  className="font-bold text-[#800040] hover:underline flex items-center gap-1"
                >
                  <span>Open Full {policyModal.tab === 'privacy' ? 'Privacy' : 'Terms'} Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setPolicyModal({ ...policyModal, open: false })}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#800040] hover:bg-[#680034] text-white text-xs font-bold transition cursor-pointer"
              >
                Understood &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE3EB] flex items-center justify-center text-[#800040] font-bold text-sm">
          Loading Academy Portals...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { 
  KeyRound, 
  Search, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Copy, 
  RefreshCw, 
  Users, 
  GraduationCap, 
  Phone, 
  X, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building2,
  Bell,
  Calendar,
  Database,
  ArrowRight,
  ArrowLeft,
  Settings as SettingsIcon,
  ChevronRight,
  Shield,
  Smartphone,
  Mail,
  Activity,
  Layers,
  Award
} from 'lucide-react';
import { StudentPasswordInfo, GuruPasswordInfo } from '@/lib/passwords';

interface Props {
  initialStudents: StudentPasswordInfo[];
  initialGurus: GuruPasswordInfo[];
}

export default function SettingsClient({ initialStudents, initialGurus }: Props) {
  const [activeSection, setActiveSection] = useState<'hub' | 'passwords' | 'admin-profile'>('hub');
  const [activeTab, setActiveTab] = useState<'students' | 'gurus'>('students');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<StudentPasswordInfo[]>(initialStudents);
  const [gurus, setGurus] = useState<GuruPasswordInfo[]>(initialGurus);

  // Admin Profile State
  const [adminName] = useState('Satya');
  const [adminPhone] = useState('7780763121');
  const [adminEmail] = useState('admin@laasyaacademy.com');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isUpdatingAdminPassword, setIsUpdatingAdminPassword] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Modal State
  const [selectedUser, setSelectedUser] = useState<{
    profile_id: string;
    name: string;
    identifier: string; // roll_number or guru_code
    phone: string;
    role: 'student' | 'guru';
  } | null>(null);

  const [newPassword, setNewPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);
  const [copiedDefault, setCopiedDefault] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(adminPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewPassword || adminNewPassword.trim().length < 4) {
      showNotification('error', 'New password must be at least 4 characters long.');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      showNotification('error', 'New password and confirm password do not match.');
      return;
    }
    setIsUpdatingAdminPassword(true);
    try {
      const res = await fetch('/api/settings/admin-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: adminNewPassword.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update admin password.');
      showNotification('success', 'Admin password updated successfully! Use your new password on next sign in.');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating admin password.');
    } finally {
      setIsUpdatingAdminPassword(false);
    }
  };

  const copyDefaultPassword = () => {
    navigator.clipboard.writeText('123456');
    setCopiedDefault(true);
    setTimeout(() => setCopiedDefault(false), 2000);
  };

  // Filtered lists
  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s =>
      (s.roll_number && s.roll_number.toLowerCase().includes(q)) ||
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  }, [students, search]);

  const filteredGurus = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return gurus;
    return gurus.filter(g =>
      (g.guru_code && g.guru_code.toLowerCase().includes(q)) ||
      (g.full_name && g.full_name.toLowerCase().includes(q)) ||
      (g.phone && g.phone.toLowerCase().includes(q)) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.display_title && g.display_title.toLowerCase().includes(q))
    );
  }, [gurus, search]);

  // Open modal
  const handleOpenChangePassword = (
    profileId: string, 
    name: string, 
    identifier: string, 
    phone: string, 
    role: 'student' | 'guru'
  ) => {
    setSelectedUser({
      profile_id: profileId,
      name,
      identifier,
      phone,
      role
    });
    setNewPassword('123456');
    setShowPassword(false);
  };

  // Submit Password Change
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const pwd = newPassword.trim();
    if (!pwd) {
      showNotification('error', 'Password cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: selectedUser.profile_id,
          new_password: pwd
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      showNotification('success', `Password for ${selectedUser.name} updated to "${pwd}" successfully!`);
      setSelectedUser(null);
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating password');
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk Reset All to 123456
  const handleResetAll = async () => {
    const confirmed = confirm(
      'Are you sure you want to reset ALL student and guru accounts to the default password "123456"?\n\nThis will allow all users to log in using their registered contact number and "123456".'
    );
    if (!confirmed) return;

    setIsResettingAll(true);
    try {
      const res = await fetch('/api/settings/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset passwords');

      showNotification('success', data.message || 'All passwords reset to 123456!');
    } catch (err: any) {
      showNotification('error', err.message || 'Error resetting passwords');
    } finally {
      setIsResettingAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in slide-in-from-top-3 border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION BREADCRUMB */}
      {/* ------------------------------------------------------------- */}
      {activeSection !== 'hub' && (
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <button 
              type="button" 
              onClick={() => setActiveSection('hub')} 
              className="hover:text-[#8A064D] transition flex items-center gap-1.5 cursor-pointer text-gray-600 hover:underline"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-[#8A064D]" />
              <span>Settings</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-full border border-[#F0D5E4]">
              {activeSection === 'admin-profile' ? 'Admin Profile' : 'Password Management'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection('hub')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8A064D] hover:text-[#70043E] bg-[#FFF2F8] hover:bg-[#FFE5F0] border border-[#F0D5E4] px-3.5 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Settings</span>
          </button>
        </div>
      )}

      {activeSection === 'hub' ? (
        /* ------------------------------------------------------------- */
        /* SETTINGS HUB OVERVIEW (OPTIONS SELECTION) */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Executive Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2D041A] via-[#4D0329] to-[#8A064D] text-white p-6 sm:p-8 shadow-xl border border-[#D4AF37]/30">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#F9E33A] text-[11px] font-bold border border-[#D4AF37]/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>LAASYA CULTURAL ACADEMY ADMINISTRATION</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                  Settings & Governance
                </h1>
                <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
                  Central management console for administrative credentials, disciple and guru authentication, communication preferences, and academic rules.
                </p>
              </div>

              {/* Quick Status / Quick Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
                <div className="bg-black/30 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F9E33A] flex items-center justify-center font-black text-[#2D041A] text-sm">
                    S
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <span>{adminName}</span>
                      <span className="text-[10px] text-[#F9E33A] font-mono">({adminPhone})</span>
                    </div>
                    <p className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Super Administrator
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-rose-200">
                  <span className="bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">300 Disciples</span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">14 Faculty Gurus</span>
                </div>
              </div>
            </div>
            {/* Background luxury gradient flare */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Settings Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Admin Profile Card (Active & Clickable) */}
            <div 
              onClick={() => setActiveSection('admin-profile')}
              className="bg-white rounded-3xl p-6 border-2 border-[#D4AF37]/50 hover:border-[#8A064D] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FFF2F8] to-transparent rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF2F8] to-[#FFE5F0] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D] group-hover:scale-105 transition-transform shadow-xs">
                    <ShieldCheck className="w-6 h-6 text-[#8A064D]" />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border border-amber-300">
                    MASTER CONTROL
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#2D041A] group-hover:text-[#8A064D] transition-colors flex items-center gap-2">
                  <span>Admin Profile</span>
                  <span className="w-2 h-2 rounded-full bg-[#8A064D] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Administrator records, verified login contact number, academy executive roles, and password management for admin portal.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]/60 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Administrator</span>
                    <span className="font-bold text-[#8A064D]">{adminName}</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Login Contact</span>
                    <span className="font-mono font-bold text-gray-800">{adminPhone}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#8A064D] group-hover:text-[#70043E]">
                <span>Manage Profile & Password</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. Password Management Card (Active & Clickable) */}
            <div 
              onClick={() => setActiveSection('passwords')}
              className="bg-white rounded-3xl p-6 border-2 border-[#8A064D]/30 hover:border-[#8A064D] shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FFF2F8] to-transparent rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF2F8] to-[#FFE5F0] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D] group-hover:scale-105 transition-transform shadow-xs">
                    <KeyRound className="w-6 h-6 text-[#8A064D]" />
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    PASSWORDS DESK
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#2D041A] group-hover:text-[#8A064D] transition-colors flex items-center gap-2">
                  <span>Password Management</span>
                  <span className="w-2 h-2 rounded-full bg-[#8A064D] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Manage, reset, and set passwords for students and faculty gurus. Single-click default &apos;123456&apos; login access.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]/60 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Accounts</span>
                    <span className="font-bold text-[#8A064D]">{students.length} Disciples • {gurus.length} Gurus</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Default Key</span>
                    <span className="font-mono font-bold text-emerald-700">123456</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#8A064D] group-hover:text-[#70043E]">
                <span>Open Password Registry</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 3. Academy Institution Profile */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    CAMPUS ACTIVE
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#2D041A]">
                  Academy Institutional Profile
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Campus facility data, 4 dedicated studio practice rooms (Room 101-104), and fine arts curriculum tracks.
                </p>

                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Campus:</span>
                    <span className="font-bold text-[#2D041A]">Main Campus, Hyderabad</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Rooms:</span>
                    <span className="font-bold text-[#2D041A]">4 Studio Rooms</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs font-semibold text-gray-400 flex items-center justify-between">
                <span>4 Fine Arts Disciplines</span>
                <Award className="w-4 h-4 text-[#D4AF37]" />
              </div>
            </div>

            {/* 4. Notifications & Broadcasts */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
                    <Bell className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    REALTIME ENGINE
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Notifications & Broadcasts
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Realtime notification dispatches, announcements from Gurus & Admin to enrolled batch disciples, and emergency alerts.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs font-semibold text-emerald-700 flex items-center justify-between">
                <span>Active Broadcast Channels</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* 5. Academic Calendar */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    10 CLASSES / MO
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Calendar & Holiday Rules
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Batch session scheduling, monthly 10-class policy, Vijayadashami performance terms, and holiday schedules.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs font-semibold text-gray-500 flex items-center justify-between">
                <span>Current Cycle: Active</span>
                <Layers className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* 6. System Data & Backup */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
                    <Database className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    CLOUD SYNC
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Data & Cloud Security
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Supabase database encryption, real-time timetable synchronization across web & mobile devices, and automated audit logs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 text-xs font-semibold text-emerald-700 flex items-center justify-between">
                <span>Realtime Linked</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      ) : activeSection === 'admin-profile' ? (
        /* ------------------------------------------------------------- */
        /* ADMIN PROFILE SUB-VIEW */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Admin Hero Card */}
          <div className="bg-gradient-to-r from-[#2D041A] via-[#590231] to-[#8A064D] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#D4AF37]/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-5 z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F9E33A] p-1 shadow-lg shrink-0">
                <div className="w-full h-full rounded-xl bg-[#3F0123] flex items-center justify-center text-3xl font-black text-[#F9E33A]">
                  S
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[#F9E33A] text-[11px] font-bold border border-[#D4AF37]/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>SUPER ADMINISTRATOR</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                  {adminName}
                </h1>
                <div className="text-xs sm:text-sm text-rose-100/90 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="flex items-center gap-1.5 font-mono font-bold text-[#F9E33A] bg-black/20 hover:bg-black/40 px-2.5 py-1 rounded-xl transition cursor-pointer border border-[#D4AF37]/20"
                    title="Click to copy admin phone"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{adminPhone}</span>
                    {copiedPhone ? <Check className="w-3 h-3 text-emerald-400 ml-1" /> : <Copy className="w-3 h-3 text-white/50 ml-1" />}
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1.5 text-rose-100 bg-black/20 hover:bg-black/40 px-2.5 py-1 rounded-xl transition cursor-pointer border border-white/10"
                    title="Click to copy admin email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{adminEmail}</span>
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-400 ml-1" /> : <Copy className="w-3 h-3 text-white/50 ml-1" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 z-10 shrink-0">
              <div className="bg-black/30 backdrop-blur-md border border-white/15 px-5 py-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-rose-200 block">Access Authority</span>
                <span className="text-xs font-black text-emerald-300 mt-0.5 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Full System Governance
                </span>
              </div>
            </div>
            {/* Background luxury gradient flare */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Admin Details & Privileges */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Details Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#F0D5E4] space-y-5">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#2D041A] flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#8A064D]" />
                      <span>Executive Profile Details</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Master administrative credentials registered for the academy management portal.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60">
                    <span className="text-[11px] text-gray-500 font-semibold block">Full Legal Name</span>
                    <span className="text-sm font-bold text-[#2D041A] mt-1 block">{adminName}</span>
                  </div>

                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60">
                    <span className="text-[11px] text-gray-500 font-semibold block">Primary Admin Login Number</span>
                    <span className="text-sm font-mono font-bold text-[#8A064D] mt-1 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#8A064D]" />
                      {adminPhone}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Used for Administrator Portal Sign In</span>
                  </div>

                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60">
                    <span className="text-[11px] text-gray-500 font-semibold block">Official Academy Email</span>
                    <span className="text-sm font-bold text-gray-800 mt-1 block">{adminEmail}</span>
                  </div>

                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60">
                    <span className="text-[11px] text-gray-500 font-semibold block">Designation</span>
                    <span className="text-sm font-bold text-gray-800 mt-1 block">Academy Director & Operations Lead</span>
                  </div>

                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60">
                    <span className="text-[11px] text-gray-500 font-semibold block">Administrative Department</span>
                    <span className="text-sm font-bold text-gray-800 mt-1 block">Central Governance & Academic Oversight</span>
                  </div>

                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60">
                    <span className="text-[11px] text-gray-500 font-semibold block">Campus Base</span>
                    <span className="text-sm font-bold text-gray-800 mt-1 block">Laasya Cultural Academy, Main Campus</span>
                  </div>
                </div>
              </div>

              {/* Administrative Access Rights */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#F0D5E4] space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-base text-[#2D041A] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#8A064D]" />
                    <span>System Privileges & Permissions</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Authorized executive controls granted to this master administrator account.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    'Master Course & Timetable Management',
                    'Guru / Faculty Assignment & Timings',
                    '300 Disciples Database & Batch Assignments',
                    'Real-time Fee Collection & Ledger Audit',
                    'Attendance Registers & Batch Attendance Reports',
                    'Video Library & Guru Drive Links Moderation',
                    'Push Announcements & Broadcast Dispatches',
                    'Student & Guru Password Reset Privileges'
                  ].map((perm, idx) => (
                    <div key={`perm-${idx}`} className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-emerald-900 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Change Password Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xs border-2 border-[#8A064D]/20 space-y-5">
                <div className="border-b border-gray-100 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D] mb-3">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#2D041A]">
                    Change Admin Password
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Update the password used to sign into the Admin portal with phone number <strong className="text-[#8A064D]">7780763121</strong>.
                  </p>
                </div>

                <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D041A] mb-1.5">
                      New Admin Password
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        placeholder="Enter new password (min 4 chars)"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl border border-gray-200 bg-[#FFF9FB] text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#8A064D]/30 focus:border-[#8A064D]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D041A] mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-[#FFF9FB] text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#8A064D]/30 focus:border-[#8A064D]"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                    <strong>Note:</strong> Current password is set to <code className="font-bold">123456789</code>. Updating here updates your credentials immediately.
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingAdminPassword}
                    className="w-full py-3 px-4 rounded-2xl bg-[#8A064D] hover:bg-[#72043F] active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-[#8A064D]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingAdminPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Update Admin Password</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* PASSWORD MANAGEMENT SUB-VIEW */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2.5">
                <div className="p-2 bg-[#FFF2F8] border border-[#F0D5E4] rounded-2xl text-[#8A064D]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <span>Password Management Desk</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                Reset or set individual passwords for Disciples and Gurus. If any user encounters difficulty logging into the mobile app, update their password here.
              </p>
            </div>

            {/* Global Action & Default Password Card */}
            <div className="flex items-center gap-3">
              <div className="bg-[#FFF9FB] border border-[#F0D5E4] px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-[#8A064D]" />
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 font-medium">Default App Key</p>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-[#8A064D]">123456</span>
                    <button
                      type="button"
                      onClick={copyDefaultPassword}
                      title="Copy Default Password"
                      className="p-1 hover:bg-[#FFF2F8] rounded text-gray-400 hover:text-[#8A064D] transition"
                    >
                      {copiedDefault ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetAll}
                disabled={isResettingAll}
                className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Reset every student and guru password to 123456"
              >
                {isResettingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Reset All to 123456</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
            {/* Navigation Tabs & Search Bar */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
              {/* Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'students'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Students / Disciples</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {students.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('gurus')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'gurus'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Gurus & Faculty</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'gurus' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {gurus.length}
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder={activeTab === 'students' ? "Search by Roll No, Name, Contact..." : "Search by Guru ID, Name, Phone..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-medium focus:ring-1 focus:ring-[#8A064D] focus:border-[#8A064D] transition shadow-2xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table Content */}
            {activeTab === 'students' ? (
              /* Students Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Roll No / ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Registered Contact Number</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-[#FFF9FB]/50 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#8A064D]">
                            <span className="bg-[#FFF2F8] px-2.5 py-1 rounded-xl border border-[#F0D5E4]">
                              {s.roll_number || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] flex items-center justify-center font-bold text-[11px] shrink-0">
                                {s.full_name ? s.full_name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{s.full_name}</p>
                                <p className="text-[10px] text-gray-400 font-normal">{s.email || 'No email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-800">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#8A064D] shrink-0" />
                              <span className="font-mono">{s.phone || 'No phone registered'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              s.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenChangePassword(s.profile_id, s.full_name, s.roll_number, s.phone, 'student')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] rounded-xl text-xs font-bold transition shadow-2xs hover:border-[#8A064D]/40 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Change Password</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          No students found matching &quot;{search}&quot;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Gurus Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Guru ID</th>
                      <th className="py-3 px-4">Revered Guru Name</th>
                      <th className="py-3 px-4">Primary Contact Number</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredGurus.length > 0 ? (
                      filteredGurus.map((g) => (
                        <tr key={g.id} className="hover:bg-[#FFF9FB]/50 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#8A064D]">
                            <span className="bg-[#FFF2F8] px-2.5 py-1 rounded-xl border border-[#F0D5E4]">
                              {g.guru_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] flex items-center justify-center font-bold text-[11px] shrink-0">
                                {g.full_name ? g.full_name.charAt(0).toUpperCase() : 'G'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{g.full_name}</p>
                                {g.display_title && (
                                  <p className="text-[10px] text-gray-500 font-normal">{g.display_title}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-800">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#8A064D] shrink-0" />
                              <span className="font-mono">{g.phone || 'No phone registered'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              g.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {g.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenChangePassword(g.profile_id, g.full_name, g.guru_code, g.phone, 'guru')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] rounded-xl text-xs font-bold transition shadow-2xs hover:border-[#8A064D]/40 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Change Password</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          No gurus found matching &quot;{search}&quot;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer info */}
            <div className="p-3.5 bg-gray-50/50 border-t border-gray-100 text-[11px] text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Showing {activeTab === 'students' ? filteredStudents.length : filteredGurus.length} registered accounts</span>
              <span>Students log in with disciple phone; Gurus log in with primary contact</span>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#F0D5E4] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FFF2F8] border border-[#F0D5E4] rounded-2xl text-[#8A064D]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D041A]">Change Password</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedUser.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account Details Callout */}
            <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Identifier / Code:</span>
                <span className="font-mono font-bold text-[#8A064D]">{selectedUser.identifier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Registered Contact:</span>
                <span className="font-mono font-bold text-gray-800">{selectedUser.phone || 'None registered'}</span>
              </div>
              <div className="pt-1 border-t border-[#F0D5E4]/60 text-[11px] text-gray-500">
                User will log into the mobile app using their registered contact number and this password.
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword('123456')}
                    className="text-[11px] font-bold text-[#8A064D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Set Default &apos;123456&apos;</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Enter new password (min 4 characters)..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:ring-1 focus:ring-[#8A064D] focus:border-[#8A064D] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#8A064D] hover:bg-[#70043E] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

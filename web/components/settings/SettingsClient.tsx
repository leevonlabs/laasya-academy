'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Mail,
  Shield,
  Settings as SettingsIcon,
  Edit3,
  Plus,
  Trash2,
  MapPin,
  ExternalLink,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { StudentPasswordInfo, GuruPasswordInfo } from '@/lib/passwords';

interface Props {
  initialStudents: StudentPasswordInfo[];
  initialGurus: GuruPasswordInfo[];
  initialSection?: 'admin-profile' | 'passwords';
}

export default function SettingsClient({ 
  initialStudents, 
  initialGurus, 
  initialSection = 'admin-profile' 
}: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'admin-profile' | 'passwords'>(initialSection);
  const [activeTab, setActiveTab] = useState<'students' | 'gurus'>('students');
  const [search, setSearch] = useState('');
  const [students] = useState<StudentPasswordInfo[]>(initialStudents);
  const [gurus] = useState<GuruPasswordInfo[]>(initialGurus);

  // Dynamic Admin Profile & Support Information
  const [adminProfile, setAdminProfile] = useState<{
    full_name: string;
    avatar_url: string;
    designation: string;
    contacts: Array<{ title: string; phone: string }>;
    emails: Array<{ title: string; email: string }>;
    campus_address: string;
    map_url: string;
  }>({
    full_name: 'Satya',
    avatar_url: '',
    designation: 'Academy Director & Operations Lead',
    contacts: [{ title: 'Office Desk & Admissions', phone: '7780763121' }],
    emails: [{ title: 'Official Inquiries', email: 'admin@laasyaacademy.com' }],
    campus_address: 'Laasya Cultural Academy, Main Campus, Hyderabad',
    map_url: 'https://maps.google.com/?q=Laasya+Cultural+Academy'
  });

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState(adminProfile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings/admin-profile')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setAdminProfile(data.profile);
          setEditProfileForm(data.profile);
        }
      })
      .catch(err => console.error('Error fetching admin profile:', err));
  }, []);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotification('error', 'Image size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditProfileForm(prev => ({ ...prev, avatar_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/settings/admin-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          ...editProfileForm
        })
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setAdminProfile(data.profile);
        setIsEditProfileModalOpen(false);
        showNotification('success', 'Admin profile and academy support directory updated successfully!');
      } else {
        showNotification('error', data.error || 'Failed to update admin profile');
      }
    } catch {
      showNotification('error', 'Network error while saving admin profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isUpdatingAdminPassword, setIsUpdatingAdminPassword] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Modal State for Password Management
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

  // Filtered lists for Password Management
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

  const switchSection = (section: 'admin-profile' | 'passwords') => {
    setActiveSection(section);
    router.push(`/settings/${section}`);
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0D5E4]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF2F8] text-[#8A064D] text-[11px] font-bold border border-[#F0D5E4] mb-1.5 shadow-2xs">
            {activeSection === 'admin-profile' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#8A064D]" />
                <span>ADMIN PROFILE</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-[#8A064D]" />
                <span>PASSWORD MANAGEMENT</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-[#2D041A]">
            {activeSection === 'admin-profile' ? 'Admin Profile & Master Access' : 'Password Management Desk'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeSection === 'admin-profile'
              ? 'Administrator records, official contact number, executive authority privileges, and password security.'
              : 'Manage, reset, and set passwords for students and faculty Gurus with single-click default credentials.'}
          </p>
        </div>
      </div>

      {activeSection === 'admin-profile' ? (
        /* ============================================================= */
        /* PAGE 1: ADMIN PROFILE & MASTER GOVERNANCE                      */
        /* ============================================================= */
        <div className="space-y-6">
          {/* Admin Hero Card */}
          <div className="bg-gradient-to-r from-[#2D041A] via-[#590231] to-[#8A064D] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#D4AF37]/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-5 z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F9E33A] p-1 shadow-lg shrink-0 overflow-hidden">
                {adminProfile.avatar_url ? (
                  <img
                    src={adminProfile.avatar_url}
                    alt={adminProfile.full_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-[#3F0123] flex items-center justify-center text-3xl font-black text-[#F9E33A]">
                    {adminProfile.full_name.charAt(0).toUpperCase() || 'S'}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[#F9E33A] text-[11px] font-bold border border-[#D4AF37]/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{adminProfile.designation.toUpperCase() || 'SUPER ADMINISTRATOR'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                  {adminProfile.full_name}
                </h2>
                <div className="text-xs sm:text-sm text-rose-100/90 flex flex-wrap items-center gap-3">
                  {adminProfile.contacts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(adminProfile.contacts[0].phone, 'hero_phone')}
                      className="flex items-center gap-1.5 font-mono font-bold text-[#F9E33A] bg-black/20 hover:bg-black/40 px-2.5 py-1 rounded-xl transition cursor-pointer border border-[#D4AF37]/20"
                      title="Click to copy admin phone"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{adminProfile.contacts[0].phone}</span>
                      {copiedIndex === 'hero_phone' ? <Check className="w-3 h-3 text-emerald-400 ml-1" /> : <Copy className="w-3 h-3 text-white/50 ml-1" />}
                    </button>
                  )}
                  {adminProfile.emails.length > 0 && (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(adminProfile.emails[0].email, 'hero_email')}
                        className="flex items-center gap-1.5 text-rose-100 bg-black/20 hover:bg-black/40 px-2.5 py-1 rounded-xl transition cursor-pointer border border-white/10"
                        title="Click to copy admin email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{adminProfile.emails[0].email}</span>
                        {copiedIndex === 'hero_email' ? <Check className="w-3 h-3 text-emerald-400 ml-1" /> : <Copy className="w-3 h-3 text-white/50 ml-1" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 z-10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditProfileForm(adminProfile);
                  setIsEditProfileModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#F9E33A] to-[#D4AF37] hover:brightness-110 active:scale-95 text-[#2D041A] font-bold text-xs shadow-md shadow-black/20 transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-[#2D041A]" />
                <span>Edit Profile</span>
              </button>
            </div>
            {/* Background luxury gradient flare */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Admin Details */}
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
                      Official contact and location information published across mobile applications.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileForm(adminProfile);
                      setIsEditProfileModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFF2F8] hover:bg-[#FCE7F3] text-[#8A064D] text-xs font-bold border border-[#F0D5E4] transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Full Name */}
                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60">
                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Full Name</span>
                    <span className="text-sm font-bold text-[#2D041A] mt-1 block">{adminProfile.full_name}</span>
                  </div>

                  {/* Designation */}
                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60">
                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Designation</span>
                    <span className="text-sm font-bold text-gray-800 mt-1 block">{adminProfile.designation}</span>
                  </div>

                  {/* Contacts */}
                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60 sm:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Contact Numbers</span>
                      <span className="text-[10px] text-gray-400 font-medium">{adminProfile.contacts.length} registered</span>
                    </div>
                    <div className="space-y-2">
                      {adminProfile.contacts.map((c, i) => (
                        <div key={`contact-view-${i}`} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100">
                          <div>
                            <span className="text-[10px] font-bold text-[#8A064D] uppercase block">{c.title}</span>
                            <span className="text-xs font-mono font-bold text-gray-900">{c.phone}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.phone, `contact_${i}`)}
                            className="p-1.5 text-gray-400 hover:text-[#8A064D] rounded-lg hover:bg-gray-50 cursor-pointer"
                            title="Copy number"
                          >
                            {copiedIndex === `contact_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Academy Emails */}
                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60 sm:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Academy Emails</span>
                      <span className="text-[10px] text-gray-400 font-medium">{adminProfile.emails.length} registered</span>
                    </div>
                    <div className="space-y-2">
                      {adminProfile.emails.map((e, i) => (
                        <div key={`email-view-${i}`} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100">
                          <div>
                            <span className="text-[10px] font-bold text-blue-800 uppercase block">{e.title}</span>
                            <span className="text-xs font-semibold text-gray-800">{e.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(e.email, `email_${i}`)}
                            className="p-1.5 text-gray-400 hover:text-blue-700 rounded-lg hover:bg-gray-50 cursor-pointer"
                            title="Copy email"
                          >
                            {copiedIndex === `email_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campus Address */}
                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60 sm:col-span-2">
                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Campus Address</span>
                    <span className="text-xs font-medium text-gray-800 mt-1 block leading-relaxed">{adminProfile.campus_address}</span>
                  </div>

                  {/* Map URL Link */}
                  <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]/60 sm:col-span-2">
                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Map URL Link</span>
                    {adminProfile.map_url ? (
                      <a
                        href={adminProfile.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8A064D] hover:underline mt-1 break-all"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
                        <span>{adminProfile.map_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 mt-1 block italic">No Google Map link added yet</span>
                    )}
                  </div>
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
                    Update the credentials used to sign into the Admin portal.
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

          {/* EDIT PROFILE MODAL */}
          {isEditProfileModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
                  <div>
                    <h3 className="font-bold text-lg text-[#2D041A]">Edit Administrator Profile</h3>
                    <p className="text-xs text-gray-500">Update official contact, designation, and campus details</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditProfileModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                  {/* Avatar Upload */}
                  <div>
                    <label className="block text-xs font-bold text-[#2D041A] mb-2">Profile Image</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#FFF2F8] border-2 border-dashed border-[#F0D5E4] flex items-center justify-center overflow-hidden shrink-0">
                        {editProfileForm.avatar_url ? (
                          <img
                            src={editProfileForm.avatar_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-[#8A064D]/50" />
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="file"
                          ref={avatarFileInputRef}
                          onChange={handleAvatarFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => avatarFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#72043F] text-white text-xs font-bold cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Image</span>
                          </button>
                          {editProfileForm.avatar_url && (
                            <button
                              type="button"
                              onClick={() => setEditProfileForm(prev => ({ ...prev, avatar_url: '' }))}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">PNG, JPG or WEBP (Max 2MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#2D041A] mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editProfileForm.full_name}
                      onChange={(e) => setEditProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
                      placeholder="e.g. Satya"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-bold text-[#2D041A] mb-1.5">Designation *</label>
                    <input
                      type="text"
                      required
                      value={editProfileForm.designation}
                      onChange={(e) => setEditProfileForm(prev => ({ ...prev, designation: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
                      placeholder="e.g. Academy Director & Operations Lead"
                    />
                  </div>

                  {/* Contacts List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-[#2D041A]">
                        Contact Numbers (Title & Phone)
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditProfileForm(prev => ({
                          ...prev,
                          contacts: [...prev.contacts, { title: 'Office Helpline', phone: '' }]
                        }))}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Number</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editProfileForm.contacts.map((c, i) => (
                        <div key={`edit-contact-${i}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={c.title}
                            onChange={(e) => {
                              const newC = [...editProfileForm.contacts];
                              newC[i].title = e.target.value;
                              setEditProfileForm(prev => ({ ...prev, contacts: newC }));
                            }}
                            placeholder="Title (e.g. Office Desk)"
                            className="w-1/3 px-3 py-2 rounded-xl border border-gray-200 text-xs"
                          />
                          <input
                            type="tel"
                            value={c.phone}
                            onChange={(e) => {
                              const newC = [...editProfileForm.contacts];
                              newC[i].phone = e.target.value;
                              setEditProfileForm(prev => ({ ...prev, contacts: newC }));
                            }}
                            placeholder="Phone (e.g. 7780763121)"
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                          />
                          {editProfileForm.contacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newC = editProfileForm.contacts.filter((_, idx) => idx !== i);
                                setEditProfileForm(prev => ({ ...prev, contacts: newC }));
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emails List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-[#2D041A]">
                        Academy Emails (Title & Email)
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditProfileForm(prev => ({
                          ...prev,
                          emails: [...prev.emails, { title: 'Helpdesk Email', email: '' }]
                        }))}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8A064D] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Email</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editProfileForm.emails.map((em, i) => (
                        <div key={`edit-email-${i}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={em.title}
                            onChange={(e) => {
                              const newE = [...editProfileForm.emails];
                              newE[i].title = e.target.value;
                              setEditProfileForm(prev => ({ ...prev, emails: newE }));
                            }}
                            placeholder="Title (e.g. Support)"
                            className="w-1/3 px-3 py-2 rounded-xl border border-gray-200 text-xs"
                          />
                          <input
                            type="email"
                            value={em.email}
                            onChange={(e) => {
                              const newE = [...editProfileForm.emails];
                              newE[i].email = e.target.value;
                              setEditProfileForm(prev => ({ ...prev, emails: newE }));
                            }}
                            placeholder="Email (e.g. info@laasya.com)"
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs"
                          />
                          {editProfileForm.emails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newE = editProfileForm.emails.filter((_, idx) => idx !== i);
                                setEditProfileForm(prev => ({ ...prev, emails: newE }));
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campus Address */}
                  <div>
                    <label className="block text-xs font-bold text-[#2D041A] mb-1.5">Campus Address</label>
                    <textarea
                      rows={2}
                      value={editProfileForm.campus_address}
                      onChange={(e) => setEditProfileForm(prev => ({ ...prev, campus_address: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
                      placeholder="Campus address..."
                    />
                  </div>

                  {/* Map URL */}
                  <div>
                    <label className="block text-xs font-bold text-[#2D041A] mb-1.5">Map URL Link</label>
                    <input
                      type="url"
                      value={editProfileForm.map_url}
                      onChange={(e) => setEditProfileForm(prev => ({ ...prev, map_url: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#72043F] text-white text-xs font-bold transition shadow-md shadow-[#8A064D]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Profile Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================= */
        /* PAGE 2: PASSWORD MANAGEMENT DESK                               */
        /* ============================================================= */
        <div className="space-y-6">

          <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
            {/* Navigation Tabs & Search Bar */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
              {/* Sub-Tabs: Students vs Gurus */}
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
                  <span>Students</span>
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
                    <tr className="bg-[#FFF9FB] text-gray-500 font-bold border-b border-[#F0D5E4]/80 text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-5">Roll No / ID</th>
                      <th className="py-3.5 px-5">Student Name</th>
                      <th className="py-3.5 px-5">Registered Contact Number</th>
                      <th className="py-3.5 px-5">Account Status</th>
                      <th className="py-3.5 px-5 text-right">Access Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-[#FFF9FB]/70 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-[#8A064D]">
                            <span className="bg-[#FFF2F8] px-2.5 py-1 rounded-xl border border-[#F0D5E4] shadow-2xs inline-block">
                              {s.roll_number || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF2F8] to-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                                {s.full_name ? s.full_name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-xs">{s.full_name}</p>
                                <p className="text-[10px] text-gray-400 font-normal">{s.email || 'No email registered'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-800">
                            <div className="flex items-center gap-2">
                              <a
                                href={s.phone ? `tel:${s.phone}` : undefined}
                                className="font-mono text-gray-800 hover:text-[#8A064D] hover:underline flex items-center gap-1.5"
                                title="Click to call student"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
                                <span>{s.phone || 'No phone registered'}</span>
                              </a>
                              {s.phone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(s.phone);
                                    showNotification('success', `Copied ${s.phone} to clipboard`);
                                  }}
                                  title="Copy phone"
                                  className="p-1 rounded-md text-gray-400 hover:text-[#8A064D] hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs ${
                              s.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                              <span>{s.status}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenChangePassword(s.profile_id, s.full_name, s.roll_number, s.phone, 'student')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] rounded-xl text-xs font-bold transition shadow-2xs hover:border-[#8A064D]/50 hover:shadow-xs cursor-pointer active:scale-98"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Set Password</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="font-bold text-gray-600">No students found matching &quot;{search}&quot;</p>
                          <p className="text-xs text-gray-400 mt-0.5">Try searching with roll number or registered phone.</p>
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
                    <tr className="bg-[#FFF9FB] text-gray-500 font-bold border-b border-[#F0D5E4]/80 text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-5">Guru ID</th>
                      <th className="py-3.5 px-5">Faculty Guru Name</th>
                      <th className="py-3.5 px-5">Primary Contact Number</th>
                      <th className="py-3.5 px-5">Account Status</th>
                      <th className="py-3.5 px-5 text-right">Access Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredGurus.length > 0 ? (
                      filteredGurus.map((g) => (
                        <tr key={g.id} className="hover:bg-[#FFF9FB]/70 transition-colors">
                          <td className="py-3.5 px-5 font-mono font-bold text-[#8A064D]">
                            <span className="bg-[#FFF2F8] px-2.5 py-1 rounded-xl border border-[#F0D5E4] shadow-2xs inline-block">
                              {g.guru_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF2F8] to-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                                {g.full_name ? g.full_name.charAt(0).toUpperCase() : 'G'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-xs">{g.full_name}</p>
                                {g.display_title && (
                                  <p className="text-[10px] text-gray-500 font-normal">{g.display_title}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-gray-800">
                            <div className="flex items-center gap-2">
                              <a
                                href={g.phone ? `tel:${g.phone}` : undefined}
                                className="font-mono text-gray-800 hover:text-[#8A064D] hover:underline flex items-center gap-1.5"
                                title="Click to call guru"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
                                <span>{g.phone || 'No phone registered'}</span>
                              </a>
                              {g.phone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(g.phone);
                                    showNotification('success', `Copied ${g.phone} to clipboard`);
                                  }}
                                  title="Copy phone"
                                  className="p-1 rounded-md text-gray-400 hover:text-[#8A064D] hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs ${
                              g.is_active
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${g.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                              <span>{g.is_active ? 'Active' : 'Inactive'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenChangePassword(g.profile_id, g.full_name, g.guru_code, g.phone, 'guru')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] rounded-xl text-xs font-bold transition shadow-2xs hover:border-[#8A064D]/50 hover:shadow-xs cursor-pointer active:scale-98"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Set Password</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="font-bold text-gray-600">No gurus found matching &quot;{search}&quot;</p>
                          <p className="text-xs text-gray-400 mt-0.5">Try searching with Guru code or contact number.</p>
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
              <span>Students log in with registered phone; Gurus log in with primary contact</span>
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

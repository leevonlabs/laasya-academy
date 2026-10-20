'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Clock, 
  Banknote, 
  CheckCircle2, 
  Layers, 
  KeyRound,
  LayoutDashboard,
  Users,
  BookOpen,
  Receipt,
  GraduationCap,
  Megaphone,
  ClipboardCheck,
  BarChart3,
  CalendarCheck,
  Video,
  Image as ImageIcon,
  BadgePercent,
  TrendingDown,
  RefreshCw,
  FileText,
  Printer,
  DollarSign
} from 'lucide-react';

export interface Receptionist {
  id: string;
  full_name: string;
  age?: number | null;
  phone: string;
  alternative_phone?: string | null;
  email?: string | null;
  address?: string | null;
  password_hash: string;
  allowed_pages: string[];
  is_active: boolean;
  monthly_salary?: number;
  created_at: string;
  updated_at?: string;
}

export interface ReceptionistSalary {
  id: string;
  receptionist_id: string;
  month_year: string;
  amount: number;
  status: string;
  payment_date?: string;
  payment_mode?: string;
  notes?: string;
  created_at: string;
  receptionist_name?: string;
  receptionist_phone?: string;
  receptionist_email?: string;
  monthly_salary?: number;
}

interface Props {
  initialReceptionists: Receptionist[];
  initialSalaries?: ReceptionistSalary[];
  defaultTab?: 'team' | 'salaries';
}

export const AVAILABLE_MODULES = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard, description: 'KPI dashboard and analytics overview' },
  { label: 'Today Schedules', href: '/schedule', icon: Clock, description: 'Live session schedule & room planner' },
  { label: 'Attendance Audit', href: '/attendance', icon: ClipboardCheck, description: 'Class attendance records and audit' },
  { label: 'Reports and Audit', href: '/reports', icon: BarChart3, description: 'Executive summary & academy audits' },
  { label: 'Student Fees', href: '/fees', icon: Receipt, description: 'Fee ledger, dues, and payment collections' },
  { label: 'Guru Salaries', href: '/salaries', icon: Banknote, description: 'Faculty pay ledger and payouts' },
  { label: 'Students', href: '/students', icon: GraduationCap, description: 'Student directory, profiles & enrollments' },
  { label: 'Gurus', href: '/trainers', icon: Users, description: 'Faculty guru profiles and assignments' },
  { label: 'Courses', href: '/courses', icon: BookOpen, description: 'Academy curriculum and courses' },
  { label: 'Batches', href: '/batches', icon: Calendar, description: 'Batch schedules, timetables & halls' },
  { label: 'Announcements', href: '/announcements', icon: Megaphone, description: 'Broadcast circulars and notices' },
  { label: 'Tally Classes', href: '/tally-classes', icon: CalendarCheck, description: 'Missed & rescheduled extra classes' },
  { label: 'Video Library', href: '/video-library', icon: Video, description: 'Dance & music lesson vault' },
  { label: 'Advertisements', href: '/advertisements', icon: ImageIcon, description: 'Marketing banners & campaigns' },
  { label: 'Schemes', href: '/schemes', icon: BadgePercent, description: 'Scholarships & discount schemes' },
  { label: 'Expenses', href: '/expenses', icon: TrendingDown, description: 'Academy operational expense logs' },
];

export default function ReceptionClient({ 
  initialReceptionists, 
  initialSalaries = [],
  defaultTab = 'team' 
}: Props) {
  const [activeTab, setActiveTab] = useState<'team' | 'salaries'>(defaultTab);

  // Receptionists State
  const [receptionists, setReceptionists] = useState<Receptionist[]>(initialReceptionists);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Salaries State
  const [salaries, setSalaries] = useState<ReceptionistSalary[]>(initialSalaries);
  const [salarySearchQuery, setSalarySearchQuery] = useState('');
  const [salaryStatusFilter, setSalaryStatusFilter] = useState<'all' | 'Paid' | 'Issued'>('all');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReceptionist, setEditingReceptionist] = useState<Receptionist | null>(null);
  const [deletingReceptionist, setDeletingReceptionist] = useState<Receptionist | null>(null);

  // Salary Notice Modals
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [viewingSalarySlip, setViewingSalarySlip] = useState<ReceptionistSalary | null>(null);
  const [deletingSalary, setDeletingSalary] = useState<ReceptionistSalary | null>(null);

  // Receptionist Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [monthlySalary, setMonthlySalary] = useState<string>('20000');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Salary Form State
  const [salaryReceptionistId, setSalaryReceptionistId] = useState('');
  const [salaryMonthYear, setSalaryMonthYear] = useState(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });
  const [salaryAmount, setSalaryAmount] = useState('20000');
  const [salaryPaymentMode, setSalaryPaymentMode] = useState('Bank Transfer');
  const [salaryStatus, setSalaryStatus] = useState('Paid');
  const [salaryPaymentDate, setSalaryPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salaryNotes, setSalaryNotes] = useState('');
  const [salaryFormError, setSalaryFormError] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Create Receptionist Modal
  const openCreateModal = () => {
    setEditingReceptionist(null);
    setFullName('');
    setAge('');
    setPhone('');
    setAlternativePhone('');
    setEmail('');
    setAddress('');
    setPassword('123456');
    setShowPassword(false);
    setChangePassword(false);
    setIsActive(true);
    setMonthlySalary('20000');
    // Default to common front desk pages
    setSelectedPages(['/overview', '/schedule', '/attendance', '/students', '/fees']);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Receptionist Modal (PASSWORD IS NOT DISPLAYED)
  const openEditModal = (rec: Receptionist) => {
    setEditingReceptionist(rec);
    setFullName(rec.full_name);
    setAge(rec.age ? rec.age.toString() : '');
    setPhone(rec.phone);
    setAlternativePhone(rec.alternative_phone || '');
    setEmail(rec.email || '');
    setAddress(rec.address || '');
    setPassword(''); // DO NOT DISPLAY PASSWORD
    setShowPassword(false);
    setChangePassword(false); // Only enable password edit if user explicitly checks it
    setIsActive(rec.is_active);
    setMonthlySalary(rec.monthly_salary ? rec.monthly_salary.toString() : '20000');
    setSelectedPages(Array.isArray(rec.allowed_pages) ? rec.allowed_pages : []);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Generate random 6-digit password
  const generatePassword = () => {
    const randomPass = Math.floor(100000 + Math.random() * 900000).toString();
    setPassword(randomPass);
  };

  // Toggle Page selection
  const togglePage = (href: string) => {
    setSelectedPages(prev => 
      prev.includes(href) ? prev.filter(p => p !== href) : [...prev, href]
    );
  };

  const selectAllPages = () => {
    setSelectedPages(AVAILABLE_MODULES.map(m => m.href));
  };

  const clearAllPages = () => {
    setSelectedPages([]);
  };

  // Submit Receptionist
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter full name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter primary contact number.');
      return;
    }
    if (!editingReceptionist && !password.trim()) {
      setFormError('Please enter a login password.');
      return;
    }
    if (editingReceptionist && changePassword && !password.trim()) {
      setFormError('Please enter a new password or uncheck "Change Password".');
      return;
    }
    if (selectedPages.length === 0) {
      setFormError('Please select at least one page module for this receptionist.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingReceptionist) {
        // Update
        const payload: any = {
          id: editingReceptionist.id,
          full_name: fullName.trim(),
          age: age ? parseInt(age, 10) : null,
          phone: phone.trim(),
          alternative_phone: alternativePhone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          allowed_pages: selectedPages,
          is_active: isActive,
          monthly_salary: monthlySalary ? parseFloat(monthlySalary) : 20000
        };

        // Only send password if admin explicitly checked Change Password
        if (changePassword && password.trim().length > 0) {
          payload.password = password.trim();
        }

        const res = await fetch('/api/receptionists', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update receptionist.');
        }

        setReceptionists(prev => 
          prev.map(r => (r.id === editingReceptionist.id ? data.receptionist : r))
        );
        showToast('Receptionist credentials and permissions updated successfully!');
        setIsModalOpen(false);
      } else {
        // Create
        const res = await fetch('/api/receptionists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName.trim(),
            age: age ? parseInt(age, 10) : null,
            phone: phone.trim(),
            alternative_phone: alternativePhone.trim() || null,
            email: email.trim() || null,
            address: address.trim() || null,
            password: password.trim(),
            allowed_pages: selectedPages,
            is_active: isActive,
            monthly_salary: monthlySalary ? parseFloat(monthlySalary) : 20000
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create receptionist.');
        }

        setReceptionists(prev => [data.receptionist, ...prev]);
        showToast('Receptionist profile created with login credentials!');
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Receptionist
  const handleDelete = async () => {
    if (!deletingReceptionist) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/receptionists?id=${deletingReceptionist.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete receptionist.');
      }
      setReceptionists(prev => prev.filter(r => r.id !== deletingReceptionist.id));
      showToast('Receptionist deleted successfully.');
      setDeletingReceptionist(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Issue Salary Notice Modal
  const openIssueSalaryModal = () => {
    const defaultRec = receptionists[0];
    setSalaryReceptionistId(defaultRec ? defaultRec.id : '');
    setSalaryAmount(defaultRec?.monthly_salary ? defaultRec.monthly_salary.toString() : '20000');
    setSalaryMonthYear(() => {
      const d = new Date();
      return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    });
    setSalaryPaymentMode('Bank Transfer');
    setSalaryStatus('Paid');
    setSalaryPaymentDate(new Date().toISOString().split('T')[0]);
    setSalaryNotes('');
    setSalaryFormError(null);
    setIsSalaryModalOpen(true);
  };

  // Handle Receptionist Selection Change in Salary Modal
  const handleSalaryReceptionistChange = (id: string) => {
    setSalaryReceptionistId(id);
    const rec = receptionists.find(r => r.id === id);
    if (rec?.monthly_salary) {
      setSalaryAmount(rec.monthly_salary.toString());
    }
  };

  // Submit Salary Notice
  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalaryFormError(null);

    if (!salaryReceptionistId) {
      setSalaryFormError('Please select a receptionist.');
      return;
    }
    if (!salaryMonthYear.trim()) {
      setSalaryFormError('Please enter month and year.');
      return;
    }
    if (!salaryAmount || parseFloat(salaryAmount) <= 0) {
      setSalaryFormError('Please enter a valid salary amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/receptionists/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receptionist_id: salaryReceptionistId,
          month_year: salaryMonthYear.trim(),
          amount: parseFloat(salaryAmount),
          status: salaryStatus,
          payment_date: salaryPaymentDate,
          payment_mode: salaryPaymentMode,
          notes: salaryNotes.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue salary notice.');
      }

      const selectedRec = receptionists.find(r => r.id === salaryReceptionistId);
      const newSalaryWithDetails = {
        ...data.salary,
        receptionist_name: selectedRec?.full_name || 'Receptionist',
        receptionist_phone: selectedRec?.phone || '',
        receptionist_email: selectedRec?.email || ''
      };

      setSalaries(prev => [newSalaryWithDetails, ...prev]);
      showToast('Salary notice issued and logged successfully!');
      setIsSalaryModalOpen(false);
    } catch (err: any) {
      setSalaryFormError(err.message || 'Failed to issue salary notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Salary Notice
  const handleDeleteSalary = async () => {
    if (!deletingSalary) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/receptionists/salaries?id=${deletingSalary.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete salary notice.');
      }
      setSalaries(prev => prev.filter(s => s.id !== deletingSalary.id));
      showToast('Salary notice deleted successfully.');
      setDeletingSalary(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete salary notice.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Receptionists
  const filteredReceptionists = useMemo(() => {
    return receptionists.filter(r => {
      if (statusFilter === 'active' && !r.is_active) return false;
      if (statusFilter === 'inactive' && r.is_active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.full_name?.toLowerCase().includes(q);
        const matchesPhone = r.phone?.includes(q);
        const matchesAltPhone = r.alternative_phone?.includes(q);
        const matchesEmail = r.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesAltPhone && !matchesEmail) return false;
      }
      return true;
    });
  }, [receptionists, searchQuery, statusFilter]);

  // Filtered Salaries
  const filteredSalaries = useMemo(() => {
    return salaries.filter(s => {
      if (salaryStatusFilter === 'Paid' && s.status !== 'Paid') return false;
      if (salaryStatusFilter === 'Issued' && s.status !== 'Issued' && s.status !== 'Pending') return false;

      if (salarySearchQuery.trim()) {
        const q = salarySearchQuery.toLowerCase();
        const matchesName = s.receptionist_name?.toLowerCase().includes(q);
        const matchesMonth = s.month_year?.toLowerCase().includes(q);
        const matchesPhone = s.receptionist_phone?.includes(q);
        if (!matchesName && !matchesMonth && !matchesPhone) return false;
      }
      return true;
    });
  }, [salaries, salarySearchQuery, salaryStatusFilter]);

  const activeCount = useMemo(() => receptionists.filter(r => r.is_active).length, [receptionists]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-[#590231] border-[#F9E33A] text-white'
        }`}>
          {toast.type === 'error' ? (
            <X className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#F9E33A]" />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Main Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#590231] text-[#F9E33A] flex items-center justify-center shadow-md shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reception Management</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#590231]/10 text-[#590231] border border-[#590231]/20">
                Staff & Payroll
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Create receptionist logins, manage access permissions, and issue monthly salary notices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/reception-profile"
            className="h-11 px-4 rounded-2xl bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <UserCheck className="w-4 h-4" />
            <span>View Reception Profile</span>
          </Link>

          {activeTab === 'team' ? (
            <button
              onClick={openCreateModal}
              className="h-11 px-5 rounded-2xl bg-[#590231] hover:bg-[#73023E] text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer border border-[#F9E33A]/40 shrink-0"
            >
              <Plus className="w-4 h-4 text-[#F9E33A]" />
              <span>Add New Receptionist</span>
            </button>
          ) : (
            <button
              onClick={openIssueSalaryModal}
              className="h-11 px-5 rounded-2xl bg-[#590231] hover:bg-[#73023E] text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer border border-[#F9E33A]/40 shrink-0"
            >
              <Plus className="w-4 h-4 text-[#F9E33A]" />
              <span>Issue Salary Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher: Staff Logins vs Salary Notices */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'team'
              ? 'border-[#590231] text-[#590231]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Reception Staff Logins ({receptionists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('salaries')}
          className={`pb-3 px-6 text-sm font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'salaries'
              ? 'border-[#590231] text-[#590231]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Salary Notices ({salaries.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RECEPTION STAFF LOGINS & ACCESS                    */}
      {/* ========================================================= */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Staff</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{receptionists.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Logins</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Inactive</span>
              <p className="text-2xl font-black text-gray-600 mt-1">{receptionists.length - activeCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-[#075E54] uppercase tracking-wider">Available Modules</span>
              <p className="text-2xl font-black text-[#075E54] mt-1">{AVAILABLE_MODULES.length}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl p-3 border border-gray-200 shadow-2xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231] bg-gray-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto text-xs font-bold text-gray-600">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${statusFilter === 'all' ? 'bg-white shadow-2xs text-[#590231] font-black' : 'hover:text-gray-900'}`}
                >
                  All ({receptionists.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${statusFilter === 'active' ? 'bg-white shadow-2xs text-emerald-700 font-black' : 'hover:text-gray-900'}`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${statusFilter === 'inactive' ? 'bg-white shadow-2xs text-gray-800 font-black' : 'hover:text-gray-900'}`}
                >
                  Inactive ({receptionists.length - activeCount})
                </button>
              </div>
            </div>
          </div>

          {/* Receptionists List */}
          {filteredReceptionists.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-[#590231] mx-auto flex items-center justify-center">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-gray-800">No Receptionists Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No receptionists match the search criteria. Try clearing the filter or search.'
                  : 'No front desk receptionist accounts have been created yet. Click "+ Add New Receptionist" above to create credentials and assign page permissions.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceptionists.map((rec) => {
                const allowed = Array.isArray(rec.allowed_pages) ? rec.allowed_pages : [];
                const initials = rec.full_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'RC';

                return (
                  <div 
                    key={rec.id}
                    className="bg-white rounded-3xl p-5 border border-gray-200 hover:border-[#590231]/30 transition shadow-xs hover:shadow-md flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top: Avatar, Name & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#590231] to-[#8A064D] text-[#F9E33A] font-black text-base flex items-center justify-center shadow-xs shrink-0 border border-[#F9E33A]/30">
                            {initials}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 leading-snug">{rec.full_name}</h3>
                            <p className="text-[11px] font-semibold text-gray-500">
                              {rec.age ? `Age ${rec.age} • ` : ''}Front Desk Reception
                            </p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          rec.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {rec.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Contact & Compensation Details */}
                      <div className="mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#590231]" />
                            <span>Primary Phone</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-gray-900">{rec.phone}</span>
                            <button
                              onClick={() => handleCopy(rec.phone, `${rec.id}-phone`, 'Phone Number')}
                              className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition cursor-pointer"
                              title="Copy phone"
                            >
                              {copiedId === `${rec.id}-phone` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {rec.alternative_phone && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-blue-600" />
                              <span>Alternative Phone</span>
                            </span>
                            <span className="font-mono font-bold text-gray-800">{rec.alternative_phone}</span>
                          </div>
                        )}

                        {rec.email && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#8A064D]" />
                              <span>Email</span>
                            </span>
                            <span className="font-bold text-gray-800 truncate max-w-[160px]">{rec.email}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                          <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            <span>Monthly Salary</span>
                          </span>
                          <span className="font-black text-[#590231]">
                            ₹{(Number(rec.monthly_salary) || 20000).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Accessible Modules Section */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                          <span>Accessible Pages:</span>
                          <span className="text-[#590231] font-black">
                            {allowed.length} of {AVAILABLE_MODULES.length} Granted
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-gray-50/50 rounded-xl border border-gray-100">
                          {allowed.length === 0 ? (
                            <span className="text-[10px] text-gray-400 font-semibold p-1">No pages granted</span>
                          ) : (
                            allowed.map(href => {
                              const mod = AVAILABLE_MODULES.find(m => m.href === href);
                              return (
                                <span 
                                  key={href} 
                                  className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-gray-700 shadow-2xs"
                                >
                                  {mod ? mod.label : href}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openEditModal(rec)}
                        className="flex-1 h-9 rounded-xl bg-gray-50 hover:bg-[#590231] hover:text-white text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-gray-200"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Access</span>
                      </button>

                      <button
                        onClick={() => setDeletingReceptionist(rec)}
                        className="h-9 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-rose-200"
                        title="Delete Receptionist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SALARY NOTICES & PAYROLL                           */}
      {/* ========================================================= */}
      {activeTab === 'salaries' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Notices Issued</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{salaries.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Disbursed</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                ₹{salaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
              <span className="text-[11px] font-bold text-[#8A064D] uppercase tracking-wider">Average Monthly Salary</span>
              <p className="text-2xl font-black text-[#8A064D] mt-1">
                ₹{(receptionists.reduce((sum, r) => sum + (Number(r.monthly_salary) || 20000), 0) / (receptionists.length || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl p-3 border border-gray-200 shadow-2xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={salarySearchQuery}
                onChange={(e) => setSalarySearchQuery(e.target.value)}
                placeholder="Search by receptionist name or month/year..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231] bg-gray-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto text-xs font-bold text-gray-600">
                <button
                  onClick={() => setSalaryStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${salaryStatusFilter === 'all' ? 'bg-white shadow-2xs text-[#590231] font-black' : 'hover:text-gray-900'}`}
                >
                  All ({salaries.length})
                </button>
                <button
                  onClick={() => setSalaryStatusFilter('Paid')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${salaryStatusFilter === 'Paid' ? 'bg-white shadow-2xs text-emerald-700 font-black' : 'hover:text-gray-900'}`}
                >
                  Paid
                </button>
                <button
                  onClick={() => setSalaryStatusFilter('Issued')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${salaryStatusFilter === 'Issued' ? 'bg-white shadow-2xs text-amber-800 font-black' : 'hover:text-gray-900'}`}
                >
                  Issued / Pending
                </button>
              </div>
            </div>
          </div>

          {/* Salaries Table / List */}
          {filteredSalaries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Banknote className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-gray-800">No Salary Notices Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No monthly salary notices have been recorded yet. Click "+ Issue Salary Notice" to create an official salary slip for a receptionist.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                      <th className="py-3.5 px-4">Receptionist</th>
                      <th className="py-3.5 px-4">Month / Year</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Payment Date</th>
                      <th className="py-3.5 px-4">Payment Mode</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredSalaries.map(sal => (
                      <tr key={sal.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-gray-900">{sal.receptionist_name || 'Staff'}</p>
                          <p className="text-[10px] text-gray-400">{sal.receptionist_phone}</p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-800">
                          {sal.month_year}
                        </td>
                        <td className="py-3.5 px-4 font-black text-[#590231]">
                          ₹{Number(sal.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                          {sal.payment_date || new Date(sal.created_at).toISOString().split('T')[0]}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                          {sal.payment_mode || 'Bank Transfer'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            sal.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {sal.status || 'Issued'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingSalarySlip(sal)}
                              className="h-8 px-2.5 rounded-lg bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              title="View Salary Slip"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Slip</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSalary(sal)}
                              className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition flex items-center justify-center cursor-pointer border border-rose-200"
                              title="Delete Notice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* RECEPTIONIST CREATE / EDIT MODAL                          */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#590231] text-[#F9E33A] flex items-center justify-center shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    {editingReceptionist ? 'Edit Receptionist Access' : 'Create New Receptionist'}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {editingReceptionist 
                      ? 'Update profile details and permissions. Password is not displayed.' 
                      : 'Provide required profile details, credentials, and select permitted modules.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Full Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter receptionist full name"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 26"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>
              </div>

              {/* Row 2: Primary Phone & Alternative Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Primary Contact Number (Login ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Primary contact (10 digits)"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Alternative Contact Number
                  </label>
                  <input
                    type="tel"
                    value={alternativePhone}
                    onChange={(e) => setAlternativePhone(e.target.value)}
                    placeholder="Alternative mobile or landline"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>
              </div>

              {/* Row 3: Email & Monthly Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="receptionist@laasyaacademy.com"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="20000"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>
              </div>

              {/* Row 4: Residential Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Residential / Local Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, pin code..."
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                />
              </div>

              {/* Password Section (DON'T DISPLAY IN EDIT ACCESS; ONLY OPTIONAL CHANGE PASSWORD) */}
              {!editingReceptionist ? (
                // CREATE MODE: Password input required
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#590231]" />
                      <span>Login Password <span className="text-rose-500">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[10px] font-black text-[#590231] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#590231]" />
                      <span>Randomize PIN</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter login password"
                      className="w-full h-10 pl-3 pr-10 rounded-xl border border-gray-200 text-xs font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-[#590231] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                // EDIT MODE: DO NOT DISPLAY PASSWORD; GIVE OPTION "CHANGE PASSWORD"
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">Account Password</span>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-black text-[#590231]">
                      <input
                        type="checkbox"
                        checked={changePassword}
                        onChange={(e) => {
                          setChangePassword(e.target.checked);
                          if (!e.target.checked) setPassword('');
                        }}
                        className="rounded border-gray-300 text-[#590231] focus:ring-[#590231]"
                      />
                      <span>Change Password</span>
                    </label>
                  </div>

                  {!changePassword ? (
                    <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                      <span className="font-mono tracking-widest text-gray-400">••••••••</span>
                      <span className="text-[10px] text-gray-400 font-medium">Password hidden for security</span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-600">Enter New Password:</span>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="text-[10px] font-black text-[#590231] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-[#590231]" />
                          <span>Generate New PIN</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={changePassword}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Type new secure password"
                          className="w-full h-10 pl-3 pr-10 rounded-xl border border-gray-200 text-xs font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-[#590231] bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Status */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-xs font-black text-gray-800">Account Status</span>
                  <p className="text-[11px] text-gray-500 font-medium">
                    When active, the receptionist can log into the academy web dashboard with their credentials.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#590231]"></div>
                </label>
              </div>

              {/* Module Permissions Checkbox Grid */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#590231]" />
                      <span>Authorized Academy Pages & Modules</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                      Select which pages this receptionist can see and manage in the sidebar.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPages}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-black transition cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllPages}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-black transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 pr-2">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isSelected = selectedPages.includes(mod.href);
                    const Icon = mod.icon;
                    return (
                      <div
                        key={mod.href}
                        onClick={() => togglePage(mod.href)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#590231]/5 border-[#590231] shadow-2xs'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-[#590231] border-[#590231] text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#590231]' : 'text-gray-500'}`} />
                            <span className="text-xs font-bold text-gray-900 truncate">{mod.label}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium truncate">{mod.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#590231] hover:bg-[#73023E] text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingReceptionist ? 'Save Access Edits' : 'Create Receptionist'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ISSUE SALARY NOTICE MODAL                                 */}
      {/* ========================================================= */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-gray-200 shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#590231] text-[#F9E33A] flex items-center justify-center shadow-xs">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Issue Salary Notice</h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Generate an official monthly pay slip for front desk staff.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSalaryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalarySubmit} className="p-6 space-y-4">
              {salaryFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{salaryFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Receptionist <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={salaryReceptionistId}
                  onChange={(e) => handleSalaryReceptionistChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                >
                  <option value="">-- Choose Receptionist --</option>
                  {receptionists.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} ({r.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Salary Month & Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={salaryMonthYear}
                    onChange={(e) => setSalaryMonthYear(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Net Salary Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                    placeholder="20000"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={salaryPaymentMode}
                    onChange={(e) => setSalaryPaymentMode(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={salaryPaymentDate}
                    onChange={(e) => setSalaryPaymentDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Payment Status
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      name="salaryStatus"
                      value="Paid"
                      checked={salaryStatus === 'Paid'}
                      onChange={() => setSalaryStatus('Paid')}
                      className="text-[#590231] focus:ring-[#590231]"
                    />
                    <span>Paid & Disbursed</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      name="salaryStatus"
                      value="Issued"
                      checked={salaryStatus === 'Issued'}
                      onChange={() => setSalaryStatus('Issued')}
                      className="text-[#590231] focus:ring-[#590231]"
                    />
                    <span>Issued / Pending Payout</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Notice / Remarks
                </label>
                <textarea
                  rows={2}
                  value={salaryNotes}
                  onChange={(e) => setSalaryNotes(e.target.value)}
                  placeholder="e.g. Regular monthly salary for reception attendance and front desk management..."
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#590231]"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#590231] hover:bg-[#73023E] text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Issue Salary Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW SALARY SLIP MODAL                                    */}
      {/* ========================================================= */}
      {viewingSalarySlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 print:m-0 print:border-none print:shadow-none">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F9E33A]" />
                <h3 className="text-sm font-black tracking-wide uppercase">Official Salary Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSalarySlip(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Content */}
            <div className="p-6 space-y-6">
              <div className="text-center pb-4 border-b border-gray-200">
                <h2 className="text-lg font-black text-[#590231] tracking-tight">
                  LAASYA CULTURAL ACADEMY
                </h2>
                <p className="text-[11px] text-gray-500">
                  Front Desk Staff Monthly Compensation Slip
                </p>
                <span className="inline-block mt-2 bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-3 py-1 rounded-full text-xs font-black">
                  Salary Notice for {viewingSalarySlip.month_year}
                </span>
              </div>

              {/* Staff Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">Staff Name</p>
                  <p className="font-bold text-gray-900 mt-0.5">{viewingSalarySlip.receptionist_name || 'Staff'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">Designation</p>
                  <p className="font-bold text-gray-900 mt-0.5">Front Desk Receptionist</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">Contact Number</p>
                  <p className="font-bold text-gray-900 mt-0.5">{viewingSalarySlip.receptionist_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">Payment Mode</p>
                  <p className="font-bold text-gray-900 mt-0.5">{viewingSalarySlip.payment_mode || 'Bank Transfer'}</p>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Base Monthly Salary:</span>
                  <span className="font-bold text-gray-900">₹{Number(viewingSalarySlip.amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Allowances & Incentives:</span>
                  <span className="font-bold text-gray-900">₹0.00</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Deductions:</span>
                  <span className="font-bold text-gray-900">₹0.00</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-200 text-sm font-black">
                  <span className="text-[#590231]">Total Net Disbursed:</span>
                  <span className="text-emerald-700">₹{Number(viewingSalarySlip.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {viewingSalarySlip.notes && (
                <div className="bg-[#FFFDF7] p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold mb-0.5">Remarks / Notice:</p>
                  <p>{viewingSalarySlip.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
                <span>Authorized Signature: Academy Director</span>
                <span>Status: {viewingSalarySlip.status || 'Paid'}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setViewingSalarySlip(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#590231] text-white hover:bg-[#750341] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE RECEPTIONIST CONFIRMATION                          */}
      {/* ========================================================= */}
      {deletingReceptionist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">Delete Receptionist?</h3>
              <p className="text-xs text-gray-500 font-medium">
                Are you sure you want to remove <span className="font-bold text-gray-800">{deletingReceptionist.full_name}</span>? They will no longer be able to log into the academy portal.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReceptionist(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE SALARY NOTICE CONFIRMATION                         */}
      {/* ========================================================= */}
      {deletingSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">Delete Salary Notice?</h3>
              <p className="text-xs text-gray-500 font-medium">
                Are you sure you want to delete the salary notice for <span className="font-bold text-gray-800">{deletingSalary.month_year}</span> ({deletingSalary.receptionist_name})?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSalary(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSalary}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

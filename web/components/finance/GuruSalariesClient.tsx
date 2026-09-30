'use client';

import React, { useState } from 'react';
import { 
  GuruSalaryRecord, 
  GuruSalaryAdvance, 
  FinancialSummary 
} from '@/lib/finance';
import { Trainer } from '@/lib/academy';
import { 
  Banknote, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  CreditCard, 
  Eye, 
  X, 
  Sparkles,
  Phone,
  Calendar,
  DollarSign,
  UserCheck,
  Building,
  Edit3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileText,
  Check,
  Briefcase,
  ChevronRight
} from 'lucide-react';

interface Props {
  initialRecords: GuruSalaryRecord[];
  initialAdvances: GuruSalaryAdvance[];
  initialSummary: FinancialSummary;
  trainers: Trainer[];
}

// Convert numbers to Indian Rupees in words
function numberToIndianWords(num: number): string {
  if (num === 0) return 'Rupees Zero Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return inWords(Math.floor(n / 100)) + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  const rounded = Math.round(num);
  return `Rupees ${inWords(rounded).trim()} Only`;
}

export default function GuruSalariesClient({
  initialRecords,
  initialAdvances,
  initialSummary,
  trainers
}: Props) {
  const [records, setRecords] = useState<GuruSalaryRecord[]>(initialRecords);
  const [advances, setAdvances] = useState<GuruSalaryAdvance[]>(initialAdvances);
  const [summary, setSummary] = useState<FinancialSummary>(initialSummary);

  // Active view tab: 'salaries' | 'advances'
  const [activeTab, setActiveTab] = useState<'salaries' | 'advances'>('salaries');

  // Month selector
  const [selectedMonth, setSelectedMonth] = useState('March 2026');
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'paid'>('all');

  // Modals state
  // 1. Process Payment Modal
  const [payingRecord, setPayingRecord] = useState<GuruSalaryRecord | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'upi' | 'cash' | 'cheque'>('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // 2. Adjustments Modal
  const [adjustingRecord, setAdjustingRecord] = useState<GuruSalaryRecord | null>(null);
  const [adjBaseSalary, setAdjBaseSalary] = useState('');
  const [adjBonus, setAdjBonus] = useState('');
  const [adjBonusReason, setAdjBonusReason] = useState('');
  const [adjDeduction, setAdjDeduction] = useState('');
  const [adjDeductionReason, setAdjDeductionReason] = useState('');
  const [adjAdvanceDeducted, setAdjAdvanceDeducted] = useState('');
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  // 3. Official Printable Salary Slip Modal
  const [slipRecord, setSlipRecord] = useState<GuruSalaryRecord | null>(null);

  // 4. Issue Advance Modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState(trainers[0]?.id || '');
  const [advanceAmount, setAdvanceAmount] = useState('10000');
  const [advanceReason, setAdvanceReason] = useState('Personal / Festival Advance');
  const [advanceMethod, setAdvanceMethod] = useState<'bank_transfer' | 'upi' | 'cash'>('bank_transfer');
  const [advanceRef, setAdvanceRef] = useState('');
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Month change
  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month);
    setLoadingMonth(true);
    try {
      const res = await fetch(`/api/finance/salaries?month=${encodeURIComponent(month)}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error('Failed to load salaries for month:', e);
    } finally {
      setLoadingMonth(false);
    }
  };

  // Computed totals for selected month
  const totalBilledSalaries = records.reduce((acc, r) => acc + Number(r.net_salary), 0);
  const totalPaidSalaries = records
    .filter((r) => r.status === 'paid')
    .reduce((acc, r) => acc + Number(r.net_salary), 0);
  const totalPendingSalaries = records
    .filter((r) => r.status !== 'paid')
    .reduce((acc, r) => acc + Number(r.net_salary), 0);
  const paidCount = records.filter((r) => r.status === 'paid').length;
  const pendingCount = records.filter((r) => r.status !== 'paid').length;
  const totalActiveAdvances = advances
    .filter((a) => a.status !== 'settled')
    .reduce((acc, a) => acc + Number(a.remaining_balance), 0);

  // Filtered salary records
  const filteredRecords = records.filter((r) => {
    const matchesSearch = 
      r.guru_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.display_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.specializations || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.phone && r.phone.includes(searchQuery));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  // Filtered advances
  const filteredAdvances = advances.filter((a) => {
    return (
      a.guru_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.display_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.reason && a.reason.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Open Adjustments Modal
  const openAdjustmentsModal = (r: GuruSalaryRecord) => {
    setAdjustingRecord(r);
    setAdjBaseSalary(r.base_salary.toString());
    setAdjBonus(r.bonus_amount.toString());
    setAdjBonusReason(r.bonus_reason || '');
    setAdjDeduction(r.deduction_amount.toString());
    setAdjDeductionReason(r.deduction_reason || '');
    setAdjAdvanceDeducted(r.advance_deducted.toString());
  };

  // Open Payment Modal
  const openPaymentModal = (r: GuruSalaryRecord) => {
    setPayingRecord(r);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('bank_transfer');
    setPayRef(`NEFT-${Date.now().toString().slice(-6)}`);
    setPayNotes(`Disbursed salary for ${r.payroll_month}`);
  };

  // Submit Salary Payment
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;
    setSubmittingPay(true);

    try {
      const res = await fetch('/api/finance/salaries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payingRecord.id,
          status: 'paid',
          payment_date: payDate,
          payment_method: payMethod,
          transaction_reference: payRef,
          notes: payNotes || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process salary payment');
      }

      const updated = await res.json();

      setRecords((prev) =>
        prev.map((item) => (item.id === payingRecord.id ? { ...item, ...updated } : item))
      );

      // Update Summary KPI
      setSummary((prev) => ({
        ...prev,
        totalSalariesPaid: prev.totalSalariesPaid + Number(payingRecord.net_salary),
        totalSalariesPending: Math.max(0, prev.totalSalariesPending - Number(payingRecord.net_salary)),
        netOperatingCashFlow: prev.netOperatingCashFlow - Number(payingRecord.net_salary)
      }));

      showToast(`Salary payment of ₹${payingRecord.net_salary.toLocaleString('en-IN')} marked as PAID for ${payingRecord.guru_name}!`);
      
      const completedRecord = { ...payingRecord, ...updated };
      setPayingRecord(null);
      // Auto open voucher/slip
      setSlipRecord(completedRecord);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingPay(false);
    }
  };

  // Submit Salary Adjustments
  const handleSaveAdjustments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingRecord) return;
    setSubmittingAdjustment(true);

    try {
      const res = await fetch('/api/finance/salaries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adjustingRecord.id,
          base_salary: Number(adjBaseSalary),
          bonus_amount: Number(adjBonus || 0),
          bonus_reason: adjBonusReason || null,
          deduction_amount: Number(adjDeduction || 0),
          deduction_reason: adjDeductionReason || null,
          advance_deducted: Number(adjAdvanceDeducted || 0)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update adjustments');
      }

      const updated = await res.json();

      setRecords((prev) =>
        prev.map((item) => (item.id === adjustingRecord.id ? { ...item, ...updated } : item))
      );

      showToast(`Salary adjustments updated for ${adjustingRecord.guru_name}! Net Salary: ₹${updated.net_salary.toLocaleString('en-IN')}`);
      setAdjustingRecord(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // Submit New Salary Advance
  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdvance(true);

    try {
      const res = await fetch('/api/finance/salaries/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: selectedTrainerId,
          amount: Number(advanceAmount),
          reason: advanceReason,
          payment_method: advanceMethod,
          transaction_ref: advanceRef || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to issue salary advance');
      }

      const created = await res.json();
      const trObj = trainers.find((t) => t.id === selectedTrainerId);

      const fullAdvance: GuruSalaryAdvance = {
        ...created,
        guru_name: trObj?.full_name || 'Academy Guru',
        display_title: trObj?.display_title || 'Faculty'
      };

      setAdvances((prev) => [fullAdvance, ...prev]);
      showToast(`Salary Advance of ₹${Number(advanceAmount).toLocaleString('en-IN')} disbursed to ${fullAdvance.guru_name}!`);
      setIsAdvanceModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingAdvance(false);
    }
  };

  // Export Payroll to CSV
  const handleExportCSV = () => {
    if (activeTab === 'salaries') {
      const headers = [
        'Month',
        'Guru Name',
        'Display Title',
        'Specializations',
        'Classes Assigned',
        'Classes Conducted',
        'Base Salary',
        'Bonus Amount',
        'Bonus Reason',
        'Deduction Amount',
        'Deduction Reason',
        'Advance Deducted',
        'Net Salary',
        'Status',
        'Payment Date',
        'Payment Method',
        'Txn Reference'
      ];

      const rows = filteredRecords.map((r) => [
        r.payroll_month,
        `"${r.guru_name}"`,
        `"${r.display_title}"`,
        `"${(r.specializations || []).join('; ')}"`,
        r.classes_assigned,
        r.classes_conducted,
        r.base_salary,
        r.bonus_amount,
        `"${r.bonus_reason || ''}"`,
        r.deduction_amount,
        `"${r.deduction_reason || ''}"`,
        r.advance_deducted,
        r.net_salary,
        r.status,
        r.payment_date || '',
        r.payment_method || '',
        r.transaction_reference || ''
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laasya_Guru_Payroll_${selectedMonth.replace(' ', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        'Guru Name',
        'Display Title',
        'Amount',
        'Request Date',
        'Disbursement Date',
        'Recovered Amount',
        'Remaining Balance',
        'Status',
        'Reason',
        'Payment Method',
        'Txn Ref'
      ];

      const rows = filteredAdvances.map((a) => [
        `"${a.guru_name}"`,
        `"${a.display_title}"`,
        a.amount,
        a.request_date,
        a.disbursement_date || '',
        a.recovered_amount,
        a.remaining_balance,
        a.status,
        `"${a.reason || ''}"`,
        a.payment_method || '',
        a.transaction_ref || ''
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laasya_Guru_Salary_Advances_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-[#2D041A] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-5 h-5 text-[#F9E33A]" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FCE7F3] text-[#8A064D]">
              Owner Confidential
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Payroll & Honorarium
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#2D041A] tracking-tight flex items-center gap-2">
            <Banknote className="w-7 h-7 text-[#8A064D]" />
            Guru Salary & Payroll Management
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Track monthly compensation, conduct logs, performance bonuses, leave deductions, advance settlements, and official payslips for all 17 Gurus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={loadingMonth}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-[#8A064D] cursor-pointer"
            >
              <option value="March 2026">Payroll: March 2026</option>
              <option value="February 2026">Payroll: February 2026</option>
              <option value="April 2026">Payroll: April 2026 (Upcoming)</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          {/* Issue Advance Button */}
          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#2D041A] hover:bg-[#430928] text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Issue Salary Advance</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Monthly Payroll */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>Monthly Net Payroll</span>
            <div className="p-2 rounded-2xl bg-[#FCE7F3] text-[#8A064D]">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2D041A] tracking-tight">
            ₹{totalBilledSalaries.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-500">
            <span className="font-semibold text-gray-800">{records.length} Gurus</span>
            <span>on active payroll</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A064D] to-[#EBB128]" />
        </div>

        {/* Total Salaries Paid */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>Salaries Disbursed</span>
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            ₹{totalPaidSalaries.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-bold">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100">{paidCount} Paid</span>
            <span className="text-gray-400 font-normal">of {records.length} Gurus</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Pending Disbursals */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>Pending Disbursals</span>
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            ₹{totalPendingSalaries.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 font-bold">
            <span className="px-1.5 py-0.5 rounded-md bg-amber-100">{pendingCount} Pending</span>
            <span className="text-gray-400 font-normal">due for settlement</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Active Salary Advances */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>Active Salary Advances</span>
            <div className="p-2 rounded-2xl bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight">
            ₹{totalActiveAdvances.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-600 font-semibold">
            <span>Recoverable across payroll</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
        </div>

      </div>

      {/* VIEW SELECTOR & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#F0D5E4]">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('salaries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'salaries'
                ? 'bg-[#8A064D] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Monthly Payroll ({records.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'advances'
                ? 'bg-[#8A064D] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Salary Advances ({advances.length})</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Guru, title, style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A064D] font-medium"
            />
          </div>

          {activeTab === 'salaries' && (
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-2xl border border-gray-200">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                  statusFilter === 'pending'
                    ? 'bg-amber-100 text-amber-800 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Paid
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ===================================================================== */}
      {/* TAB 1: MONTHLY GURU PAYROLL TABLE */}
      {/* ===================================================================== */}
      {activeTab === 'salaries' && (
        <div className="bg-white rounded-3xl border border-[#F0D5E4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#2D041A] font-bold">
                  <th className="py-3.5 px-4">Guru / Faculty</th>
                  <th className="py-3.5 px-3">Classes</th>
                  <th className="py-3.5 px-3">Base Salary</th>
                  <th className="py-3.5 px-3">Adjustments (Bonus / Deductions)</th>
                  <th className="py-3.5 px-3">Net Salary</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No Guru salary records match your search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const initials = r.guru_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    const isPaid = r.status === 'paid';
                    const hasBonus = Number(r.bonus_amount) > 0;
                    const hasDeduction = Number(r.deduction_amount) > 0;
                    const hasAdvanceDeduction = Number(r.advance_deducted) > 0;

                    return (
                      <tr 
                        key={r.id} 
                        className="hover:bg-[#FFFDFC] transition group"
                      >
                        {/* Guru Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#430928] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-[#8A064D] transition">
                                {r.guru_name}
                              </div>
                              <div className="text-[11px] text-gray-500 leading-tight">
                                {r.display_title}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(r.specializations || []).slice(0, 2).map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-gray-100 text-gray-600"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {(r.specializations || []).length > 2 && (
                                  <span className="text-[9px] text-gray-400">
                                    +{(r.specializations || []).length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Classes Assigned vs Conducted */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-800">
                              {r.classes_conducted}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">
                              {r.classes_assigned}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-semibold block">
                            {r.classes_assigned > 0
                              ? `${Math.round((r.classes_conducted / r.classes_assigned) * 100)}% conducted`
                              : '100%'}
                          </span>
                        </td>

                        {/* Base Salary */}
                        <td className="py-3.5 px-3 font-semibold text-gray-700">
                          ₹{Number(r.base_salary).toLocaleString('en-IN')}
                        </td>

                        {/* Adjustments */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            {hasBonus && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <span>+₹{Number(r.bonus_amount).toLocaleString('en-IN')}</span>
                                {r.bonus_reason && (
                                  <span className="text-emerald-600 font-normal">({r.bonus_reason})</span>
                                )}
                              </div>
                            )}

                            {hasDeduction && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                <span>-₹{Number(r.deduction_amount).toLocaleString('en-IN')}</span>
                                {r.deduction_reason && (
                                  <span className="text-rose-600 font-normal">({r.deduction_reason})</span>
                                )}
                              </div>
                            )}

                            {hasAdvanceDeduction && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                                <span>-₹{Number(r.advance_deducted).toLocaleString('en-IN')}</span>
                                <span className="text-purple-600 font-normal">(Advance)</span>
                              </div>
                            )}

                            {!hasBonus && !hasDeduction && !hasAdvanceDeduction && (
                              <span className="text-gray-400 text-[11px] italic">No adjustments</span>
                            )}
                          </div>
                        </td>

                        {/* Net Salary */}
                        <td className="py-3.5 px-3">
                          <span className="font-extrabold text-sm text-[#2D041A]">
                            ₹{Number(r.net_salary).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          {isPaid ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {r.payment_date} • {r.payment_method?.toUpperCase()}
                              </div>
                            </div>
                          ) : r.status === 'processing' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>Processing</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* If Pending, Pay Button */}
                            {!isPaid && (
                              <button
                                onClick={() => openPaymentModal(r)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition flex items-center gap-1 shadow-xs cursor-pointer"
                                title="Process and record salary payment"
                              >
                                <Check className="w-3 h-3" />
                                <span>Pay</span>
                              </button>
                            )}

                            {/* Adjustments Button */}
                            <button
                              onClick={() => openAdjustmentsModal(r)}
                              className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-[11px] transition flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Edit bonuses, deductions and advance recovery"
                            >
                              <Edit3 className="w-3 h-3 text-gray-500" />
                              <span>Adjust</span>
                            </button>

                            {/* Payslip / Voucher Button */}
                            <button
                              onClick={() => setSlipRecord(r)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white font-semibold text-[11px] transition flex items-center gap-1 shadow-xs cursor-pointer"
                              title="View & Print Official Academy Payslip"
                            >
                              <FileText className="w-3 h-3 text-[#F9E33A]" />
                              <span>Slip</span>
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: GURU SALARY ADVANCES TABLE */}
      {/* ===================================================================== */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#2D041A]">Guru Salary Advance Records</h2>
              <p className="text-xs text-gray-500">Track short-term advances and auto-recovery against monthly payroll.</p>
            </div>
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#F9E33A]" />
              <span>Issue New Advance</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#F0D5E4] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#2D041A] font-bold">
                    <th className="py-3.5 px-4">Guru</th>
                    <th className="py-3.5 px-3">Advance Amount</th>
                    <th className="py-3.5 px-3">Date Disbursed</th>
                    <th className="py-3.5 px-3">Recovery Progress</th>
                    <th className="py-3.5 px-3">Reason / Purpose</th>
                    <th className="py-3.5 px-3">Disbursement Mode</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdvances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No salary advances found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdvances.map((adv) => {
                      const recoveryPercent = adv.amount > 0 
                        ? Math.round((Number(adv.recovered_amount) / Number(adv.amount)) * 100)
                        : 0;

                      return (
                        <tr key={adv.id} className="hover:bg-[#FFFDFC] transition">
                          
                          {/* Guru */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{adv.guru_name}</div>
                            <div className="text-[11px] text-gray-500">{adv.display_title}</div>
                          </td>

                          {/* Advance Amount */}
                          <td className="py-3.5 px-3">
                            <span className="font-extrabold text-gray-900 text-sm">
                              ₹{Number(adv.amount).toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Disbursement Date */}
                          <td className="py-3.5 px-3 text-gray-600">
                            {adv.disbursement_date || adv.request_date}
                          </td>

                          {/* Recovery Progress */}
                          <td className="py-3.5 px-3">
                            <div className="w-36">
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-emerald-700 font-semibold">
                                  ₹{Number(adv.recovered_amount).toLocaleString('en-IN')} paid
                                </span>
                                <span className="text-gray-500 font-semibold">
                                  ₹{Number(adv.remaining_balance).toLocaleString('en-IN')} left
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${recoveryPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-3.5 px-3 text-gray-600 max-w-xs truncate">
                            {adv.reason || 'Personal Advance'}
                          </td>

                          {/* Disbursement Mode */}
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-gray-700 uppercase text-[11px]">
                              {adv.payment_method || 'Bank Transfer'}
                            </div>
                            {adv.transaction_ref && (
                              <div className="text-[10px] text-gray-400 font-mono">
                                {adv.transaction_ref}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-right">
                            {adv.status === 'settled' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Settled</span>
                              </span>
                            ) : adv.status === 'partially_settled' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>Partial ({recoveryPercent}%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                <Clock className="w-3 h-3 text-purple-600" />
                                <span>Disbursed</span>
                              </span>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: PROCESS SALARY PAYMENT */}
      {/* ===================================================================== */}
      {payingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-[#2D041A]">Disburse Guru Salary</h3>
              </div>
              <button
                onClick={() => setPayingRecord(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              
              {/* Guru & Amount Highlight */}
              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F0D5E4]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Guru Beneficiary</span>
                    <span className="text-sm font-extrabold text-[#2D041A] block">{payingRecord.guru_name}</span>
                    <span className="text-xs text-gray-500">{payingRecord.display_title}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Net Payable</span>
                    <span className="text-xl font-black text-emerald-700">
                      ₹{Number(payingRecord.net_salary).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-500 block">{payingRecord.payroll_month}</span>
                  </div>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Disbursement Mode</label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D]"
                >
                  <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cheque">Bank Cheque</option>
                  <option value="cash">Petty Cash Voucher</option>
                </select>
              </div>

              {/* Transaction Ref / UTR */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Reference / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC202603309812 / UPI-394821"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Office Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Full settlement processed via academy primary account"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{submittingPay ? 'Recording...' : 'Confirm Disbursal & View Slip'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT SALARY ADJUSTMENTS (BONUS, DEDUCTIONS, ADVANCE) */}
      {/* ===================================================================== */}
      {adjustingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Salary Adjustments & Deductions</h3>
                <p className="text-xs text-gray-500">
                  {adjustingRecord.guru_name} • {adjustingRecord.payroll_month}
                </p>
              </div>
              <button
                onClick={() => setAdjustingRecord(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustments} className="space-y-4">
              
              {/* Base Salary */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Base Monthly Salary (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjBaseSalary}
                  onChange={(e) => setAdjBaseSalary(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Bonus Section */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2.5">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  Performance / Festival Bonus
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-700 mb-1">Bonus Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={adjBonus}
                      onChange={(e) => setAdjBonus(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-700 mb-1">Bonus Reason</label>
                    <input
                      type="text"
                      value={adjBonusReason}
                      onChange={(e) => setAdjBonusReason(e.target.value)}
                      placeholder="e.g. Ugadi Special / Choreography"
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Deduction Section */}
              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-2.5">
                <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                  Leave / Absence / Penalty Deductions
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-700 mb-1">Deduction (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={adjDeduction}
                      onChange={(e) => setAdjDeduction(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-700 mb-1">Deduction Reason</label>
                    <input
                      type="text"
                      value={adjDeductionReason}
                      onChange={(e) => setAdjDeductionReason(e.target.value)}
                      placeholder="e.g. Unplanned Leave (2 classes)"
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Advance Deducted */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Salary Advance Recovery (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjAdvanceDeducted}
                  onChange={(e) => setAdjAdvanceDeducted(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#8A064D]"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Amount deducted towards prior cash/bank salary advances.
                </span>
              </div>

              {/* Live Net Calculation Preview */}
              {(() => {
                const b = Number(adjBaseSalary || 0);
                const bon = Number(adjBonus || 0);
                const d = Number(adjDeduction || 0);
                const adv = Number(adjAdvanceDeducted || 0);
                const net = b + bon - d - adv;

                return (
                  <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4] flex justify-between items-center text-xs">
                    <div>
                      <span className="text-gray-500 font-semibold block">Calculated Net Salary:</span>
                      <span className="text-[10px] text-gray-400">
                        ₹{b} + ₹{bon} - ₹{d} - ₹{adv}
                      </span>
                    </div>
                    <div className="text-lg font-black text-[#8A064D]">
                      ₹{net.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAdjustingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjustment}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{submittingAdjustment ? 'Saving...' : 'Save Adjustments'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: OFFICIAL PRINTABLE GURU SALARY SLIP / VOUCHER */}
      {/* ===================================================================== */}
      {slipRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Modal Actions */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100 print:hidden">
              <span className="text-xs font-bold text-gray-500 uppercase">
                Official Guru Salary Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#8A064D] hover:bg-[#70043E] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>Print Payslip</span>
                </button>
                <button
                  onClick={() => setSlipRecord(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Container */}
            <div className="border-2 border-[#8A064D] rounded-2xl p-6 bg-white relative">
              
              {/* Academy Crest Header */}
              <div className="text-center pb-4 border-b border-rose-100">
                <h2 className="text-lg font-black tracking-wide text-[#2D041A] uppercase">
                  Laasya Cultural Academy
                </h2>
                <p className="text-[11px] font-bold text-[#8A064D]">
                  ಲಾಸ್ಯ ಸಾಂಸ್ಕೃತಿಕ ಅಕಾಡೆಮಿ • Unleash Your Talent
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  VV Maple Hub, 2nd Floor, Kannamangala, Doddabanahalli, Bangalore - 560067
                </p>
                <p className="text-[10px] text-gray-500">
                  Accounts & Administration • Phone: +91 8151 998 899 | info@laasyaacademy.com
                </p>
              </div>

              {/* Title & Voucher Meta */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100 text-xs">
                <div>
                  <span className="font-bold text-gray-900 tracking-wide uppercase">
                    GURU SALARY & HONORARIUM SLIP
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Confidential Faculty Pay Advice
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#8A064D] text-xs">
                    LCA-PAY-2026-{slipRecord.id.slice(-5).toUpperCase()}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Month: {slipRecord.payroll_month}
                  </span>
                </div>
              </div>

              {/* Guru Details Grid */}
              <div className="grid grid-cols-2 gap-4 py-3.5 text-xs border-b border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Guru / Faculty Name:
                  </span>
                  <span className="font-bold text-gray-900">{slipRecord.guru_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Designation / Title:
                  </span>
                  <span className="font-semibold text-gray-800">{slipRecord.display_title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Specializations:
                  </span>
                  <span className="text-gray-700">
                    {(slipRecord.specializations || []).join(', ') || 'Classical Arts'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                    Classes Conducted:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {slipRecord.classes_conducted} of {slipRecord.classes_assigned} sessions
                  </span>
                </div>
              </div>

              {/* Itemized Earnings & Deductions Breakdown */}
              <div className="py-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                      <th className="py-1 text-left">Earnings</th>
                      <th className="py-1 text-right">Amount (₹)</th>
                      <th className="py-1 pl-6 text-left">Deductions</th>
                      <th className="py-1 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-2 font-medium text-gray-800">Base Monthly Salary</td>
                      <td className="py-2 text-right font-semibold">
                        ₹{Number(slipRecord.base_salary).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 pl-6 font-medium text-gray-800">
                        Leave / Absence Deductions
                        {slipRecord.deduction_reason && (
                          <span className="block text-[9px] text-gray-400">
                            {slipRecord.deduction_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right font-semibold text-rose-600">
                        ₹{Number(slipRecord.deduction_amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium text-gray-800">
                        Performance / Festival Bonus
                        {slipRecord.bonus_reason && (
                          <span className="block text-[9px] text-gray-400">
                            {slipRecord.bonus_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right font-semibold text-emerald-600">
                        ₹{Number(slipRecord.bonus_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 pl-6 font-medium text-gray-800">
                        Salary Advance Settlement
                      </td>
                      <td className="py-2 text-right font-semibold text-purple-600">
                        ₹{Number(slipRecord.advance_deducted || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-bold text-gray-900">
                      <td className="py-2">Total Gross Earnings</td>
                      <td className="py-2 text-right">
                        ₹{(Number(slipRecord.base_salary) + Number(slipRecord.bonus_amount || 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 pl-6">Total Deductions</td>
                      <td className="py-2 text-right text-rose-600">
                        ₹{(Number(slipRecord.deduction_amount || 0) + Number(slipRecord.advance_deducted || 0)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Net Disbursed Highlight */}
              <div className="bg-[#FFF9FB] p-4 rounded-xl border border-[#F0D5E4] my-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">
                      Net Remittance Payable
                    </span>
                    <span className="text-xs font-semibold text-[#8A064D]">
                      {numberToIndianWords(Number(slipRecord.net_salary))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-700">
                      ₹{Number(slipRecord.net_salary).toLocaleString('en-IN')}.00
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-gray-500 pt-2 border-t border-rose-100 mt-2">
                  <span>Payment Mode: <strong className="uppercase text-gray-700">{slipRecord.payment_method || 'Bank Transfer'}</strong></span>
                  <span>Txn Ref: <strong className="font-mono text-gray-700">{slipRecord.transaction_reference || 'DIRECT-BANK-NEFT'}</strong></span>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-8 mt-4 text-[10px] text-gray-500">
                <div className="text-center border-t border-gray-400 pt-1 w-36">
                  <span className="font-bold text-gray-800 text-[11px] block">{slipRecord.guru_name}</span>
                  <span className="text-[9px] text-gray-400">Guru Signature / Acknowledgement</span>
                </div>
                <div className="text-center border-t border-gray-400 pt-1 w-36">
                  <span className="font-bold text-gray-800 text-[11px] block">Managing Director</span>
                  <span className="text-[9px] text-gray-400">Authorized Signatory</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: ISSUE NEW SALARY ADVANCE */}
      {/* ===================================================================== */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-[#2D041A]">Disburse Guru Salary Advance</h3>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4">
              
              {/* Select Guru */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Guru Beneficiary <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D]"
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.display_title || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Advance Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Disbursement Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Disbursement Mode</label>
                <select
                  value={advanceMethod}
                  onChange={(e: any) => setAdvanceMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  <option value="bank_transfer">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi">UPI / Instant Pay</option>
                  <option value="cash">Petty Cash Advance</option>
                </select>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction Ref / Note</label>
                <input
                  type="text"
                  placeholder="e.g. ADV-NEFT-928120"
                  value={advanceRef}
                  onChange={(e) => setAdvanceRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              {/* Purpose / Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Purpose / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Festival advance / Medical / Equipment purchase"
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdvance}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{submittingAdvance ? 'Processing...' : 'Disburse Advance'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

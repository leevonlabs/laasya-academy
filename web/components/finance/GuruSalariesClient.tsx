'use client';

import React, { useState, useMemo } from 'react';
import { 
  GuruSalaryRecord, 
  GuruPayment,
  GuruPaymentType,
  FinancialSummary 
} from '@/lib/finance';
import { Trainer } from '@/lib/academy';
import MonthPicker from '@/components/common/MonthPicker';
import DateRangeQuickFilter, { DateRangeResult } from '@/components/common/DateRangeQuickFilter';
import { downloadGuruSalarySlipPdf } from '@/lib/pdf';
import { 
  Banknote, 
  Plus, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  CreditCard, 
  X, 
  Calendar, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Check, 
  MessageCircle,
  ExternalLink,
  Receipt,
  DollarSign
} from 'lucide-react';

interface Props {
  initialRecords: GuruSalaryRecord[];
  initialPayments?: GuruPayment[];
  initialSummary: FinancialSummary;
  trainers: Trainer[];
  defaultMonth?: string;
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

// Helper to determine if a payroll month string is earlier than the current month
function isMonthInPast(monthStr?: string): boolean {
  if (!monthStr) return false;
  const parsed = new Date(Date.parse(`1 ${monthStr}`));
  if (isNaN(parsed.getTime())) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const recYear = parsed.getFullYear();
  const recMonth = parsed.getMonth();
  return recYear < currentYear || (recYear === currentYear && recMonth < currentMonth);
}

const PAYMENT_TYPE_LABELS: Record<GuruPaymentType, { label: string; badgeClass: string }> = {
  monthly_salary: { label: 'Monthly Salary', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  salary_advance: { label: 'Salary Advance', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  bonus: { label: 'Performance Bonus', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  festival_bonus: { label: 'Festival / Special Bonus', badgeClass: 'bg-pink-100 text-pink-800 border-pink-200' },
  incentive: { label: 'Class Incentive', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  reimbursement: { label: 'Travel / Conveyance', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  honorarium: { label: 'Event Honorarium', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  other: { label: 'Direct Payment', badgeClass: 'bg-gray-100 text-gray-800 border-gray-200' }
};

export default function GuruSalariesClient({
  initialRecords,
  initialPayments = [],
  initialSummary,
  trainers,
  defaultMonth
}: Props) {
  const currentCalMonth = useMemo(() => {
    return defaultMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [defaultMonth]);

  const [records, setRecords] = useState<GuruSalaryRecord[]>(initialRecords);
  const [payments, setPayments] = useState<GuruPayment[]>(initialPayments);
  const [summary, setSummary] = useState<FinancialSummary>(initialSummary);

  // Active view tab: 'salaries' | 'payments' (Salary Advance page completely replaced by Payments)
  const [activeTab, setActiveTab] = useState<'salaries' | 'payments'>('salaries');

  // Month selector for Monthly Payroll (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState(currentCalMonth);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Filters for Monthly Payroll
  const [salarySearchQuery, setSalarySearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'paid'>('all');

  // Filters for Payments Page
  const [paySearchQuery, setPaySearchQuery] = useState('');
  const [payTypeFilter, setPayTypeFilter] = useState<'all' | GuruPaymentType>('all');
  const [payTrainerFilter, setPayTrainerFilter] = useState<string>('all');
  const [payStartDate, setPayStartDate] = useState('');
  const [payEndDate, setPayEndDate] = useState('');

  // Modals state
  // 1. Process Monthly Salary Modal
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

  // 3. Official Printable Salary Slip Modal (In addition to opening in dedicated new page)
  const [slipRecord, setSlipRecord] = useState<GuruSalaryRecord | null>(null);

  // 4. Record Payment Modal (Replaces Advance modal: stores advance, bonus, or any other payment)
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [recordTrainerId, setRecordTrainerId] = useState(trainers[0]?.id || '');
  const [recordPaymentType, setRecordPaymentType] = useState<GuruPaymentType>('salary_advance');
  const [recordAmount, setRecordAmount] = useState('10000');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordMethod, setRecordMethod] = useState<'bank_transfer' | 'upi' | 'cash' | 'cheque'>('bank_transfer');
  const [recordRef, setRecordRef] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Month change for Monthly Payroll
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

  // Refresh Payments list
  const refreshPayments = async () => {
    try {
      const res = await fetch('/api/finance/guru-payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (e) {
      console.error('Failed to refresh payments:', e);
    }
  };

  // Process Salary Payment submission
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
          transaction_reference: payRef || `SAL-${payingRecord.payroll_month.replace(' ', '')}-${Date.now().toString().slice(-4)}`,
          notes: payNotes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment');
      }

      const updated = await res.json();
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`Salary payment of ₹${Number(updated.net_salary).toLocaleString('en-IN')} recorded for ${updated.guru_name}!`);
      setPayingRecord(null);
      refreshPayments();
    } catch (err: any) {
      alert(err.message || 'Error recording salary payment');
    } finally {
      setSubmittingPay(false);
    }
  };

  // Handle Adjustments submission
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
          bonus_amount: Number(adjBonus),
          bonus_reason: adjBonusReason,
          deduction_amount: Number(adjDeduction),
          deduction_reason: adjDeductionReason,
          advance_deducted: Number(adjAdvanceDeducted)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save adjustments');
      }

      const updated = await res.json();
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`Payroll adjustments updated for ${updated.guru_name}!`);
      setAdjustingRecord(null);
    } catch (err: any) {
      alert(err.message || 'Error updating adjustments');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // Handle Record Guru Payment submission (Advance, Bonus, or any other type)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTrainerId || !recordAmount || Number(recordAmount) <= 0) {
      alert('Please select a Guru and enter a valid positive amount.');
      return;
    }
    setSubmittingPayment(true);

    try {
      const res = await fetch('/api/finance/guru-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: recordTrainerId,
          payment_type: recordPaymentType,
          amount: Number(recordAmount),
          payment_date: recordDate,
          payment_method: recordMethod,
          transaction_reference: recordRef || `TXN-${Date.now().toString().slice(-8)}`,
          notes: recordNotes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment');
      }

      const result = await res.json();
      const trainer = trainers.find((t) => t.id === recordTrainerId);
      showToast(`Payment of ₹${Number(recordAmount).toLocaleString('en-IN')} (${PAYMENT_TYPE_LABELS[recordPaymentType]?.label}) stored for ${trainer?.full_name || 'Guru'}!`);
      setIsRecordPaymentModalOpen(false);
      setRecordNotes('');
      setRecordRef('');
      refreshPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to store payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

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

  // Open Payment Modal for a monthly salary row
  const openPaymentModal = (r: GuruSalaryRecord) => {
    setPayingRecord(r);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('bank_transfer');
    setPayRef(`NEFT/AXIS/${r.payroll_month.replace(' ', '')}/${Date.now().toString().slice(-4)}`);
    setPayNotes(`Monthly salary disbursement for ${r.payroll_month}`);
  };

  // Open Official Salary Slip Page in new tab with download option
  const openSlipPage = (r: GuruSalaryRecord) => {
    const url = `/salaries/slip?id=${encodeURIComponent(r.id)}&month=${encodeURIComponent(r.payroll_month)}&guruName=${encodeURIComponent(r.guru_name)}&vNo=${encodeURIComponent(r.transaction_reference || '')}`;
    window.open(url, '_blank');
  };

  // Computed totals for selected month (Monthly Payroll)
  const totalBilledSalaries = records.reduce((acc, r) => acc + Number(r.net_salary), 0);
  const totalPaidSalaries = records
    .filter((r) => r.status === 'paid')
    .reduce((acc, r) => acc + Number(r.net_salary), 0);
  const totalPendingSalaries = records
    .filter((r) => r.status !== 'paid')
    .reduce((acc, r) => acc + Number(r.net_salary), 0);
  const paidCount = records.filter((r) => r.status === 'paid').length;
  const pendingCount = records.filter((r) => r.status !== 'paid').length;

  // Filtered salary records (Monthly Payroll Table)
  const filteredRecords = records.filter((r) => {
    const matchesSearch = 
      r.guru_name.toLowerCase().includes(salarySearchQuery.toLowerCase()) ||
      r.display_title.toLowerCase().includes(salarySearchQuery.toLowerCase()) ||
      (r.specializations || []).some((s) => s.toLowerCase().includes(salarySearchQuery.toLowerCase())) ||
      (r.phone && r.phone.includes(salarySearchQuery));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  // Filtered payments (Guru Payments Page)
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search filter
      const q = paySearchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = p.guru_name.toLowerCase().includes(q);
        const matchesTitle = (p.display_title || '').toLowerCase().includes(q);
        const matchesType = (PAYMENT_TYPE_LABELS[p.payment_type]?.label || p.payment_type).toLowerCase().includes(q);
        const matchesRef = (p.transaction_reference || '').toLowerCase().includes(q);
        const matchesReceipt = (p.receipt_number || '').toLowerCase().includes(q);
        const matchesNotes = (p.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesType && !matchesRef && !matchesReceipt && !matchesNotes) {
          return false;
        }
      }

      // Type filter
      if (payTypeFilter !== 'all' && p.payment_type !== payTypeFilter) {
        return false;
      }

      // Trainer filter
      if (payTrainerFilter !== 'all' && p.trainer_id !== payTrainerFilter) {
        return false;
      }

      // Date range filter
      if (payStartDate) {
        const start = new Date(payStartDate).getTime();
        const pDate = new Date(p.payment_date).getTime();
        if (pDate < start) return false;
      }
      if (payEndDate) {
        const end = new Date(payEndDate).getTime();
        const pDate = new Date(p.payment_date).getTime();
        if (pDate > end) return false;
      }

      return true;
    });
  }, [payments, paySearchQuery, payTypeFilter, payTrainerFilter, payStartDate, payEndDate]);

  // Total Disbursed in Payments Table
  const totalPaymentsAmount = filteredPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const salaryDisbursedAmount = filteredPayments
    .filter((p) => p.payment_type === 'monthly_salary')
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const advancesDisbursedAmount = filteredPayments
    .filter((p) => p.payment_type === 'salary_advance')
    .reduce((acc, p) => acc + Number(p.amount), 0);
  const bonusDisbursedAmount = filteredPayments
    .filter((p) => p.payment_type === 'bonus' || p.payment_type === 'festival_bonus' || p.payment_type === 'incentive')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'salaries') {
      const headers = [
        'Month',
        'Guru Name',
        'Title',
        'Specializations',
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

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laasya_Guru_Payroll_${selectedMonth.replace(' ', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        'Payment Date',
        'Guru Name',
        'Designation',
        'Payment Type',
        'Amount Paid',
        'Payment Method',
        'Transaction Ref',
        'Receipt No',
        'Notes'
      ];

      const rows = filteredPayments.map((p) => [
        p.payment_date,
        `"${p.guru_name}"`,
        `"${p.display_title || ''}"`,
        `"${PAYMENT_TYPE_LABELS[p.payment_type]?.label || p.payment_type}"`,
        p.amount,
        p.payment_method,
        `"${p.transaction_reference || ''}"`,
        `"${p.receipt_number || ''}"`,
        `"${p.notes || ''}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laasya_Guru_Payments_${new Date().toISOString().split('T')[0]}.csv`);
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
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
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
            Guru Salary & Payments Management
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Track current monthly compensation, conduct logs, bonuses, deductions, and record any advances, incentives, and payments done to Gurus with official downloadable payslips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Picker: ONLY for Monthly Payroll tab */}
          {activeTab === 'salaries' && (
            <MonthPicker
              value={selectedMonth}
              onChange={(monthLabel) => handleMonthChange(monthLabel)}
              disabled={loadingMonth}
            />
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-4.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          {/* Record Guru Payment Button (Replaces Issue Advance) */}
          <button
            onClick={() => setIsRecordPaymentModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-sm font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS STRIP */}
      {activeTab === 'salaries' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Monthly Payroll */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between text-[#6E3955] text-xs font-semibold mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Monthly Net Payroll</span>
              <div className="p-2 rounded-2xl bg-[#FCE7F3] text-[#8A064D]">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#2D041A] tracking-tight tabular-nums">
              ₹{totalBilledSalaries.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#6E3955]">
              <span className="font-semibold text-gray-800 tabular-nums">{records.length} Gurus</span>
              <span>on {selectedMonth} payroll</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A064D] to-[#EBB128]" />
          </div>

          {/* Total Salaries Paid */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Salaries Disbursed</span>
              <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
              ₹{totalPaidSalaries.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 tabular-nums">{paidCount} Paid</span>
              <span className="text-[#8C5E77] font-normal tabular-nums">of {records.length} Gurus</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          </div>

          {/* Pending Disbursals */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Disbursals</span>
              <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 tracking-tight tabular-nums">
              ₹{totalPendingSalaries.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 font-bold">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 tabular-nums">{pendingCount} Pending</span>
              <span className="text-[#8C5E77] font-normal">due for settlement</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
          </div>

          {/* Total Payments Recorded */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-purple-800 text-xs font-semibold mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">All Guru Disbursals</span>
              <div className="p-2 rounded-2xl bg-purple-50 text-purple-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-purple-700 tracking-tight tabular-nums">
              ₹{payments.reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-600 font-semibold">
              <span className="tabular-nums">{payments.length} total payments stored</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
          </div>
        </div>
      ) : (
        /* KPI STRIP FOR PAYMENTS TAB */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Disbursed</div>
            <div className="text-2xl font-black text-[#2D041A] tabular-nums">
              ₹{totalPaymentsAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-400 mt-1">{filteredPayments.length} transactions in view</div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Salaries Paid</div>
            <div className="text-2xl font-black text-emerald-700 tabular-nums">
              ₹{salaryDisbursedAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-400 mt-1">Monthly payroll payouts</div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">Advances Paid</div>
            <div className="text-2xl font-black text-purple-700 tabular-nums">
              ₹{advancesDisbursedAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-400 mt-1">Salary advances issued</div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Bonuses & Incentives</div>
            <div className="text-2xl font-black text-amber-700 tabular-nums">
              ₹{bonusDisbursedAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-400 mt-1">Performance & special rewards</div>
          </div>
        </div>
      )}

      {/* VIEW SELECTOR & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4.5 rounded-3xl border border-[#F0D5E4]">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#FFF9FB] border border-[#F0D5E4] p-1.5 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('salaries')}
            className={`px-4.5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'salaries'
                ? 'bg-[#8A064D] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span className="tabular-nums">Monthly Payroll ({records.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4.5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#8A064D] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span className="tabular-nums">Guru Payments ({payments.length})</span>
          </button>
        </div>

        {/* Filters specific to active tab */}
        {activeTab === 'salaries' ? (
          /* Monthly Payroll Filters: NO Date Range filter as requested! */
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Guru, title, style..."
                value={salarySearchQuery}
                onChange={(e) => setSalarySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8A064D] font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#FFF9FB] p-1 rounded-2xl border border-[#F0D5E4]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs border border-[#F0D5E4]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-100 text-amber-800 shadow-2xs border border-amber-200'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 shadow-2xs border border-emerald-200'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        ) : (
          /* Payments Tab Filters: Search bar and STANDARD DATE RANGE FILTER */
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Guru, ref, notes..."
                value={paySearchQuery}
                onChange={(e) => setPaySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8A064D] font-medium"
              />
            </div>

            {/* Standard DateRangeQuickFilter */}
            <DateRangeQuickFilter
              startDate={payStartDate}
              endDate={payEndDate}
              onApply={(res: DateRangeResult) => {
                setPayStartDate(res.startDate);
                setPayEndDate(res.endDate);
              }}
              placeholder="Filter by Date"
            />

            {/* Payment Type Selector */}
            <select
              value={payTypeFilter}
              onChange={(e: any) => setPayTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
            >
              <option value="all">All Payment Types</option>
              <option value="monthly_salary">Monthly Salary</option>
              <option value="salary_advance">Salary Advance</option>
              <option value="bonus">Performance Bonus</option>
              <option value="festival_bonus">Festival Bonus</option>
              <option value="incentive">Incentive</option>
              <option value="reimbursement">Travel / Conveyance</option>
              <option value="other">Other Payment</option>
            </select>

            {/* Guru Filter */}
            <select
              value={payTrainerFilter}
              onChange={(e) => setPayTrainerFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
            >
              <option value="all">All Gurus</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* ===================================================================== */}
      {/* TAB 1: MONTHLY GURU PAYROLL TABLE */}
      {/* ===================================================================== */}
      {activeTab === 'salaries' && (
        <div className="bg-white rounded-3xl border border-[#F0D5E4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#590231] font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-5">Guru / Faculty</th>
                  <th className="py-4 px-5">Base Salary</th>
                  <th className="py-4 px-5">Adjustments (Bonus / Deductions)</th>
                  <th className="py-4 px-5">Net Salary</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0D5E4]/60 text-sm">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No Guru salary records found for {selectedMonth}.
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

                    // Condition: If a month changes with pending status of salaries, or previous month salary is pending
                    const isPrevMonthPending = !isPaid && (Boolean(r.previous_pending_months) || isMonthInPast(r.payroll_month));

                    return (
                      <tr 
                        key={r.id} 
                        className={`transition group ${
                          isPrevMonthPending 
                            ? 'bg-rose-50/85 hover:bg-rose-100/90 border-l-4 border-l-rose-600' 
                            : 'hover:bg-[#FFF9FB]'
                        }`}
                      >
                        {/* Guru Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#430928] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-[#8A064D] transition text-sm">
                                {r.guru_name}
                              </div>
                              <div className="text-xs text-[#6E3955] leading-tight">
                                {r.display_title}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(r.specializations || []).slice(0, 2).map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]/60"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {(r.specializations || []).length > 2 && (
                                  <span className="text-[10px] text-gray-400">
                                    +{(r.specializations || []).length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Base Salary */}
                        <td className="py-4 px-5 font-bold text-gray-700 text-sm tabular-nums">
                          ₹{Number(r.base_salary).toLocaleString('en-IN')}
                        </td>

                        {/* Adjustments */}
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            {hasBonus && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 tabular-nums">
                                <span>+₹{Number(r.bonus_amount).toLocaleString('en-IN')}</span>
                                {r.bonus_reason && (
                                  <span className="text-emerald-600 font-normal">({r.bonus_reason})</span>
                                )}
                              </div>
                            )}

                            {hasDeduction && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 tabular-nums">
                                <span>-₹{Number(r.deduction_amount).toLocaleString('en-IN')}</span>
                                {r.deduction_reason && (
                                  <span className="text-rose-600 font-normal">({r.deduction_reason})</span>
                                )}
                              </div>
                            )}

                            {hasAdvanceDeduction && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 tabular-nums">
                                <span>-₹{Number(r.advance_deducted).toLocaleString('en-IN')}</span>
                                <span className="text-purple-600 font-normal">(Advance)</span>
                              </div>
                            )}

                            {!hasBonus && !hasDeduction && !hasAdvanceDeduction && (
                              <span className="text-gray-400 text-xs italic">No adjustments</span>
                            )}
                          </div>
                        </td>

                        {/* Net Salary */}
                        <td className="py-4 px-5">
                          <span className="font-extrabold text-sm text-[#2D041A] tabular-nums">
                            ₹{Number(r.net_salary).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Status (with Red Highlight warning if previous month is pending) */}
                        <td className="py-4 px-5">
                          {isPaid ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                              <div className="text-xs text-[#6E3955] mt-1 tabular-nums">
                                {r.payment_date} • {r.payment_method?.toUpperCase()}
                              </div>
                            </div>
                          ) : isPrevMonthPending ? (
                            /* RED HIGHLIGHT WARNING: Previous month payment not done */
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-200 text-rose-900 border border-rose-300 shadow-2xs">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                                <span>Payment Not Done</span>
                              </span>
                              <div className="text-[11px] font-bold text-rose-700">
                                ⚠️ Previous month payment not done {r.previous_pending_months ? `(${r.previous_pending_months})` : `(${r.payroll_month})`}
                              </div>
                            </div>
                          ) : r.status === 'processing' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>Processing</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            
                            {/* If Pending, Pay Button */}
                            {!isPaid && (
                              <button
                                onClick={() => openPaymentModal(r)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                title="Process and record salary payment"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Pay</span>
                              </button>
                            )}

                            {/* Adjustments Button */}
                            <button
                              onClick={() => openAdjustmentsModal(r)}
                              className="px-3 py-1.5 rounded-xl border border-[#E8BFD5] bg-[#FFF5F9] hover:bg-[#FCE7F3] text-[#8A064D] font-bold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Edit bonuses, deductions and advance recovery"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#8A064D]" />
                              <span>Adjust</span>
                            </button>

                            {/* SLIP BUTTON: Only appears when payment is done! Opens in dedicated page with download option */}
                            {isPaid && (
                              <button
                                onClick={() => openSlipPage(r)}
                                className="px-3 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#430928] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs border border-[#48082B] cursor-pointer"
                                title="Open Official Salary Slip PDF in New Tab"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#F9E33A]" />
                                <span>Slip</span>
                              </button>
                            )}

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
      {/* TAB 2: GURU PAYMENTS PAGE (Replaces Salary Advances completely) */}
      {/* ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#2D041A]">All Guru Payments & Disbursal Records</h2>
              <p className="text-xs text-gray-500">
                Audit trail of all disbursements to Gurus including monthly salaries, salary advances, bonuses, and reimbursements.
              </p>
            </div>
            <button
              onClick={() => setIsRecordPaymentModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-[#F9E33A]" />
              <span>Record New Payment</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#F0D5E4] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#2D041A] font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Payment Date & Ref</th>
                    <th className="py-4 px-4">Guru Beneficiary</th>
                    <th className="py-4 px-4">Payment Type</th>
                    <th className="py-4 px-4">Amount Paid</th>
                    <th className="py-4 px-4">Disbursement Mode</th>
                    <th className="py-4 px-4">Notes / Purpose</th>
                    <th className="py-4 px-4 text-right">Receipt / Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No guru payment records match your search or date filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const typeConfig = PAYMENT_TYPE_LABELS[p.payment_type] || PAYMENT_TYPE_LABELS.other;

                      return (
                        <tr key={p.id} className="hover:bg-[#FFFDFC] transition">
                          {/* Date & Ref */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{p.payment_date}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {p.transaction_reference || p.receipt_number || 'DIRECT-PAY'}
                            </div>
                          </td>

                          {/* Guru */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{p.guru_name}</div>
                            <div className="text-[11px] text-gray-500">{p.display_title || 'Faculty Guru'}</div>
                          </td>

                          {/* Payment Type */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeConfig.badgeClass}`}>
                              {typeConfig.label}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-sm text-[#2D041A] tabular-nums">
                              ₹{Number(p.amount).toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Disbursement Mode */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-700 uppercase text-[11px]">
                              {p.payment_method.replace('_', ' ')}
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                            {p.notes || `${typeConfig.label} payout`}
                          </td>

                          {/* Receipt / Slip */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                const url = `/salaries/slip?id=${encodeURIComponent(p.id)}&month=${encodeURIComponent(p.payroll_month || '')}&guruName=${encodeURIComponent(p.guru_name)}&vNo=${encodeURIComponent(p.transaction_reference || '')}`;
                                window.open(url, '_blank');
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-[11px] transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="View and Download Payment Voucher"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#8A064D]" />
                              <span>Voucher</span>
                            </button>
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Reference / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC202603309812 / UPI-394821"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Disbursal Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via corporate online banking portal"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{submittingPay ? 'Recording...' : 'Confirm Disbursal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: ADJUSTMENTS MODAL */}
      {/* ===================================================================== */}
      {adjustingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#8A064D]" />
                <h3 className="font-bold text-base text-[#2D041A]">Edit Payroll Adjustments</h3>
              </div>
              <button
                onClick={() => setAdjustingRecord(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustments} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Guru Base Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={adjBaseSalary}
                  onChange={(e) => setAdjBaseSalary(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2.5">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  Performance / Festival / Special Bonus
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
                      placeholder="e.g. Festival Special / Choreography"
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

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
                      placeholder="e.g. Unplanned Leave"
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

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
              </div>

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
      {/* MODAL 3: RECORD GURU PAYMENT (Advance, Bonus, or Any Other Payout) */}
      {/* ===================================================================== */}
      {isRecordPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#8A064D]" />
                <h3 className="font-bold text-base text-[#2D041A]">Store Payment Done to Guru</h3>
              </div>
              <button
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Select Guru */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Guru Beneficiary <span className="text-rose-500">*</span>
                </label>
                <select
                  value={recordTrainerId}
                  onChange={(e) => setRecordTrainerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D]"
                  required
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.display_title || 'Faculty Guru'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={recordPaymentType}
                  onChange={(e: any) => setRecordPaymentType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D]"
                >
                  <option value="salary_advance">Salary Advance (Recoverable)</option>
                  <option value="bonus">Performance Bonus</option>
                  <option value="festival_bonus">Festival / Special Bonus</option>
                  <option value="monthly_salary">Monthly Salary / Honorarium</option>
                  <option value="incentive">Class / Workshop Incentive</option>
                  <option value="reimbursement">Travel / Conveyance Reimbursement</option>
                  <option value="honorarium">Guest Lecture / Event Honorarium</option>
                  <option value="other">Other Payment</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                  required
                  placeholder="e.g. 15000"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Disbursement Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={recordMethod}
                  onChange={(e: any) => setRecordMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="upi">UPI / Instant Pay (GPay / PhonePe)</option>
                  <option value="cash">Petty Cash</option>
                  <option value="cheque">Bank Cheque</option>
                </select>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transaction Ref / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. AXIS98231012 / UPI-89472"
                  value={recordRef}
                  onChange={(e) => setRecordRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              {/* Purpose / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Festival Advance / Choreography Workshop honorarium"
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{submittingPayment ? 'Storing...' : 'Save Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

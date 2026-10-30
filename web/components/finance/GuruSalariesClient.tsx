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
import SearchableGuruSelect from '@/components/common/SearchableGuruSelect';
import { 
  Banknote, 
  Plus, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  X, 
  Calendar, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Check, 
  MessageCircle,
  Receipt,
  Hash,
  Info,
  User,
  Phone,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface Props {
  initialRecords?: GuruSalaryRecord[];
  initialPayments?: GuruPayment[];
  initialSummary?: FinancialSummary | null;
  trainers?: Trainer[];
  defaultMonth?: string;
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

function getNextInvoiceNumber(prefix: 'PAY' | 'SAL', list: Array<{ invoice_number?: string | null }>): string {
  const year = new Date().getFullYear();
  let maxSeq = 0;
  const regex = new RegExp(`^LCA-${prefix}-${year}-(\\d+)$`);
  for (const item of list) {
    if (item.invoice_number) {
      const match = item.invoice_number.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }
  return `LCA-${prefix}-${year}-${maxSeq + 1}`;
}

const PAYMENT_TYPE_LABELS: Record<string, { label: string; badgeClass: string }> = {
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
  initialRecords = [],
  initialPayments = [],
  initialSummary,
  trainers = [],
  defaultMonth
}: Props) {
  const currentCalMonth = useMemo(() => {
    return defaultMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [defaultMonth]);

  const [records, setRecords] = useState<GuruSalaryRecord[]>(initialRecords || []);
  const [payments, setPayments] = useState<GuruPayment[]>(initialPayments || []);
  const [summary, setSummary] = useState<FinancialSummary | null | undefined>(initialSummary);

  // Active view tab: 'salaries' | 'payments'
  const [activeTab, setActiveTab] = useState<'salaries' | 'payments'>('salaries');

  // Month selector for Monthly Payroll (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState(currentCalMonth);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Filters for Monthly Payroll
  const [salarySearchQuery, setSalarySearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Filters for Payments Page
  const [paySearchQuery, setPaySearchQuery] = useState('');
  const [payTypeFilter, setPayTypeFilter] = useState<'all' | string>('all');
  const [payTrainerFilter, setPayTrainerFilter] = useState<string>('all');
  const [payStartDate, setPayStartDate] = useState('');
  const [payEndDate, setPayEndDate] = useState('');

  // Modals state
  // 1. Process Monthly Salary Modal (Clean UI/UX)
  const [payingRecord, setPayingRecord] = useState<GuruSalaryRecord | null>(null);
  const [payInvoiceNumber, setPayInvoiceNumber] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'upi' | 'cash' | 'cheque' | ''>('');
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

  // 3. Record Payment Modal
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [recordInvoiceNumber, setRecordInvoiceNumber] = useState('');
  const [recordTrainerId, setRecordTrainerId] = useState('');
  const [recordPaymentType, setRecordPaymentType] = useState<string>('');
  const [recordAmount, setRecordAmount] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordMethod, setRecordMethod] = useState<'bank_transfer' | 'upi' | 'cash' | 'cheque' | ''>('');
  const [recordRef, setRecordRef] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // 4. Payment Details Subpage / Modal
  const [viewingPayment, setViewingPayment] = useState<GuruPayment | null>(null);

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
    if (!payMethod) {
      alert('Please select a payment mode.');
      return;
    }
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
          transaction_reference: payRef.trim() || undefined,
          invoice_number: payInvoiceNumber,
          notes: payNotes.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment');
      }

      const updated = await res.json();
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      showToast(`Salary payment of ₹${Number(updated.net_salary).toLocaleString('en-IN')} recorded with Invoice ${payInvoiceNumber}!`);
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
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      showToast(`Payroll adjustments updated for ${updated.guru_name || 'Guru'}!`);
      setAdjustingRecord(null);
    } catch (err: any) {
      alert(err.message || 'Error updating adjustments');
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // Open Record Guru Payment Modal: Reset form with system-generated invoice number and NO defaults
  const openRecordPaymentModal = () => {
    setRecordInvoiceNumber(getNextInvoiceNumber('PAY', payments));
    setRecordTrainerId('');
    setRecordPaymentType('');
    setRecordAmount('');
    setRecordDate(new Date().toISOString().split('T')[0]);
    setRecordMethod('');
    setRecordRef('');
    setRecordNotes('');
    setIsRecordPaymentModalOpen(true);
  };

  // Handle Record Guru Payment submission
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTrainerId) {
      alert('Please select a Guru Beneficiary.');
      return;
    }
    if (!recordPaymentType) {
      alert('Please select a Payment Type.');
      return;
    }
    if (!recordAmount || Number(recordAmount) <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (!recordMethod) {
      alert('Please select a Payment Mode.');
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
          transaction_reference: recordRef.trim() || undefined,
          invoice_number: recordInvoiceNumber,
          notes: recordNotes.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment');
      }

      const data = await res.json();
      const trainer = trainers.find((t) => t.id === recordTrainerId);
      showToast(`Payment of ₹${Number(recordAmount).toLocaleString('en-IN')} stored under Invoice ${recordInvoiceNumber}!`);
      setIsRecordPaymentModalOpen(false);
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

  // Open Pay Modal: Prefilled with current date and read-only system generated invoice number
  const openPaymentModal = (r: GuruSalaryRecord) => {
    setPayingRecord(r);
    const inv = r.invoice_number || getNextInvoiceNumber('SAL', records);
    setPayInvoiceNumber(inv);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('');
    setPayRef('');
    setPayNotes('');
  };

  // Open Official Salary Slip Page in new tab with download option
  const openSlipPage = (r: GuruSalaryRecord) => {
    const url = `/salaries/slip?id=${encodeURIComponent(r.id)}&month=${encodeURIComponent(r.payroll_month)}&guruName=${encodeURIComponent(r.guru_name)}&vNo=${encodeURIComponent(r.transaction_reference || r.invoice_number || '')}`;
    window.open(url, '_blank');
  };

  // Directly share the PDF invoice link on WhatsApp (per user requirement)
  const handleWhatsAppShare = (r: GuruSalaryRecord | GuruPayment) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const invNo = (r as any).invoice_number || (r as any).transaction_reference || '';
    const month = (r as any).payroll_month || '';
    const pdfUrl = `${origin}/api/finance/salaries/pdf?voucherId=${encodeURIComponent(r.id)}&month=${encodeURIComponent(month)}&guruName=${encodeURIComponent(r.guru_name)}&voucherNumber=${encodeURIComponent(invNo)}`;

    let cleanPhone = (r.phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(pdfUrl)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(pdfUrl)}`;
    window.open(waUrl, '_blank');
  };

  // Check if current selected month is in the past
  const isSelectedMonthInPast = isMonthInPast(selectedMonth);

  // Computed totals for selected month (Monthly Payroll)
  const safeRecords = records || [];
  const totalBilledSalaries = safeRecords.reduce((acc, r) => acc + Number(r.net_salary || 0), 0);
  const totalPaidSalaries = safeRecords
    .filter((r) => r.status === 'paid')
    .reduce((acc, r) => acc + Number(r.net_salary || 0), 0);
  const totalPendingSalaries = safeRecords
    .filter((r) => r.status !== 'paid')
    .reduce((acc, r) => acc + Number(r.net_salary || 0), 0);
  const paidCount = safeRecords.filter((r) => r.status === 'paid').length;
  const pendingCount = safeRecords.filter((r) => r.status !== 'paid').length;

  // Filtered salary records (Monthly Payroll Table)
  const filteredRecords = safeRecords.filter((r) => {
    const q = salarySearchQuery.toLowerCase().trim();
    if (q) {
      const matchesName = r.guru_name.toLowerCase().includes(q);
      const matchesTitle = (r.display_title || '').toLowerCase().includes(q);
      const matchesStyle = (r.specializations || []).some((s) => s.toLowerCase().includes(q));
      const matchesId = (r.guru_id || '').toLowerCase().includes(q);
      const matchesInvoice = (r.invoice_number || '').toLowerCase().includes(q);
      if (!matchesName && !matchesTitle && !matchesStyle && !matchesId && !matchesInvoice) {
        return false;
      }
    }
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  // Filtered payments (Guru Payments Page)
  const filteredPayments = useMemo(() => {
    return (payments || []).filter((p) => {
      const q = paySearchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = p.guru_name.toLowerCase().includes(q);
        const matchesId = (p.guru_id || '').toLowerCase().includes(q);
        const matchesTitle = (p.display_title || '').toLowerCase().includes(q);
        const matchesType = (PAYMENT_TYPE_LABELS[p.payment_type]?.label || p.payment_type).toLowerCase().includes(q);
        const matchesRef = (p.transaction_reference || '').toLowerCase().includes(q);
        const matchesReceipt = (p.receipt_number || '').toLowerCase().includes(q);
        const matchesInvoice = (p.invoice_number || '').toLowerCase().includes(q);
        const matchesNotes = (p.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesTitle && !matchesType && !matchesRef && !matchesReceipt && !matchesInvoice && !matchesNotes) {
          return false;
        }
      }

      if (payTypeFilter !== 'all' && p.payment_type !== payTypeFilter) {
        return false;
      }

      if (payTrainerFilter !== 'all' && p.trainer_id !== payTrainerFilter) {
        return false;
      }

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
        'Invoice No',
        'Guru ID',
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
        `"${r.invoice_number || ''}"`,
        `"${r.guru_id || ''}"`,
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
        'Invoice Number',
        'Guru ID',
        'Guru Name',
        'Payment Type',
        'Amount Paid',
        'Payment Method',
        'Transaction Ref',
        'Notes'
      ];

      const rows = filteredPayments.map((p) => [
        p.payment_date,
        `"${p.invoice_number || ''}"`,
        `"${p.guru_id || ''}"`,
        `"${p.guru_name}"`,
        `"${PAYMENT_TYPE_LABELS[p.payment_type]?.label || p.payment_type}"`,
        p.amount,
        p.payment_method,
        `"${p.transaction_reference || ''}"`,
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
    <div className="w-full space-y-6">

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-[#2D041A] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
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
            Track monthly compensation, conduct logs, bonuses, deductions, and record any advances, incentives, and payments done to Gurus with official downloadable payslips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-4.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          {/* Record Guru Payment Button */}
          <button
            onClick={openRecordPaymentModal}
            className="px-5 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-sm font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS STRIP */}
      {activeTab === 'salaries' ? (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              ₹{(payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-600 font-semibold">
              <span className="tabular-nums">{(payments || []).length} total payments stored</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
          </div>
        </div>
      ) : (
        /* KPI STRIP FOR PAYMENTS TAB */
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* VIEW SELECTOR & TOOLBAR */}
      <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4.5 rounded-3xl border border-[#F0D5E4]">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#FFF9FB] border border-[#F0D5E4] p-1.5 rounded-2xl self-start md:self-auto shrink-0">
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
          /* Monthly Payroll Filters: MonthPicker placed directly BESIDE search bar */
          <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
            <MonthPicker
              value={selectedMonth}
              onChange={(monthLabel) => handleMonthChange(monthLabel)}
              disabled={loadingMonth}
            />

            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Guru, title, style..."
                value={salarySearchQuery}
                onChange={(e) => setSalarySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FFF9FB] border border-[#F0D5E4] rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8A064D] font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#FFF9FB] p-1 rounded-2xl border border-[#F0D5E4]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs border border-[#F0D5E4]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-100 text-amber-800 shadow-2xs border border-amber-200'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
          /* Payments Tab Filters: Search bar, Standard DateRangeQuickFilter, Payment Type, and Searchable Multi-colored Guru Filter */
          <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Guru, ref, invoice..."
                value={paySearchQuery}
                onChange={(e) => setPaySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FFF9FB] border border-[#F0D5E4] rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8A064D] font-medium"
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
              className="px-5 py-3.5 min-h-[54px] bg-white border border-[#F0D5E4] rounded-2xl text-[15px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8A064D] hover:border-[#8A064D] transition shadow-2xs"
            >
              <option value="all">All Payment Types</option>
              <option value="monthly_salary">Monthly Salary</option>
              <option value="salary_advance">Salary Advance</option>
              <option value="bonus">Performance Bonus</option>
              <option value="festival_bonus">Festival Bonus</option>
              <option value="incentive">Incentive</option>
              <option value="reimbursement">Travel / Conveyance</option>
              <option value="honorarium">Event Honorarium</option>
              <option value="other">Other Payment</option>
            </select>

            {/* Searchable Multi-colored Guru Filter (Enlarged) */}
            <div className="min-w-[340px] sm:min-w-[420px] lg:min-w-[480px] flex-1 sm:flex-initial">
              <SearchableGuruSelect
                trainers={trainers}
                value={payTrainerFilter}
                onChange={(val) => setPayTrainerFilter(val)}
                includeAllOption={true}
                allOptionLabel="All Gurus"
                placeholder="Filter by Guru"
                align="right"
                size="lg"
              />
            </div>
          </div>
        )}

      </div>

      {/* ===================================================================== */}
      {/* TAB 1: MONTHLY GURU PAYROLL TABLE */}
      {/* ===================================================================== */}
      {activeTab === 'salaries' && (
        <div className="w-full bg-white rounded-3xl border border-[#F0D5E4] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#590231] font-bold text-xs uppercase tracking-wider">
                  <th className="py-4.5 px-6">GURU / FACULTY</th>
                  <th className="py-4.5 px-6">BASE SALARY</th>
                  <th className="py-4.5 px-6">ADJUSTMENTS (BONUS / DEDUCTIONS)</th>
                  <th className="py-4.5 px-6">NET SALARY</th>
                  <th className="py-4.5 px-6">STATUS</th>
                  <th className="py-4.5 px-6 text-right">ACTIONS</th>
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
                    const initials = (r.guru_name || 'Guru')
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'G';

                    const isPaid = r.status === 'paid';
                    const hasBonus = Number(r.bonus_amount) > 0;
                    const hasDeduction = Number(r.deduction_amount) > 0;
                    const hasAdvanceDeduction = Number(r.advance_deducted) > 0;

                    // Condition: ONLY highlight in red if the user has selected a PREVIOUS month and salary is pending!
                    const isPreviousMonthUnpaid = isSelectedMonthInPast && !isPaid;

                    return (
                      <tr 
                        key={r.id} 
                        className={`transition group ${
                          isPreviousMonthUnpaid 
                            ? 'bg-rose-50/85 hover:bg-rose-100/90 border-l-4 border-l-rose-600' 
                            : 'hover:bg-[#FFF9FB]'
                        }`}
                      >
                        {/* Guru Info */}
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#430928] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-[#8A064D] transition text-base">
                                {r.guru_name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-mono">
                                  {r.guru_id ? `ID: ${r.guru_id}` : `ID: GURU-${r.trainer_id.slice(0, 4).toUpperCase()}`}
                                </span>
                                {r.display_title && (
                                  <span className="text-xs text-[#6E3955]">
                                    {r.display_title}
                                  </span>
                                )}
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
                        <td className="py-4.5 px-6 font-bold text-gray-800 text-sm tabular-nums">
                          ₹{Number(r.base_salary).toLocaleString('en-IN')}
                        </td>

                        {/* Adjustments */}
                        <td className="py-4.5 px-6">
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
                        <td className="py-4.5 px-6">
                          <span className="font-extrabold text-base text-[#2D041A] tabular-nums">
                            ₹{Number(r.net_salary).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4.5 px-6">
                          {isPaid ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                              <div className="text-xs text-[#6E3955] mt-1 tabular-nums font-medium">
                                {r.payment_date} • {r.payment_method?.toUpperCase()}
                              </div>
                              {r.invoice_number && (
                                <div className="text-[11px] font-mono text-[#8A064D] mt-0.5">
                                  {r.invoice_number}
                                </div>
                              )}
                            </div>
                          ) : isPreviousMonthUnpaid ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-200 text-rose-900 border border-rose-300 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-rose-700" />
                                <span>Pending</span>
                              </span>
                              <div className="text-[11px] font-bold text-rose-700">
                                Payment not done
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-6 text-right">
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

                            {/* SLIP BUTTON: Only appears when payment is done */}
                            {isPaid && (
                              <>
                                <button
                                  onClick={() => openSlipPage(r)}
                                  className="px-3 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#430928] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs border border-[#48082B] cursor-pointer"
                                  title="Open Official Salary Slip PDF in New Page"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#F9E33A]" />
                                  <span>Slip</span>
                                </button>

                                {/* WhatsApp Share Button */}
                                <button
                                  onClick={() => handleWhatsAppShare(r)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                  title="Share Invoice Link on WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>WhatsApp</span>
                                </button>
                              </>
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
      {/* TAB 2: GURU PAYMENTS PAGE */}
      {/* ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#2D041A]">All Guru Payments & Disbursal Records</h2>
              <p className="text-xs text-gray-500">
                Audit trail of all disbursements to Gurus including monthly salaries, salary advances, bonuses, and reimbursements.
              </p>
            </div>
            <button
              onClick={openRecordPaymentModal}
              className="px-4 py-2 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-[#F9E33A]" />
              <span>Record New Payment</span>
            </button>
          </div>

          <div className="w-full bg-white rounded-3xl border border-[#F0D5E4] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#590231] font-bold text-xs uppercase tracking-wider">
                    {/* Col 1: Payment Date & Invoice No */}
                    <th className="py-4.5 px-6">Payment Date & Invoice No.</th>
                    {/* Col 2: Guru Name & ID */}
                    <th className="py-4.5 px-6">Guru Beneficiary</th>
                    {/* Col 3: Payment Type */}
                    <th className="py-4.5 px-6">Payment Type</th>
                    {/* Col 4: Amount Paid */}
                    <th className="py-4.5 px-6">Amount Paid</th>
                    {/* Col 5: Payment Mode */}
                    <th className="py-4.5 px-6">Payment Mode</th>
                    {/* Col 6: Actions */}
                    <th className="py-4.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0D5E4]/60 text-sm">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        No guru payment records match your search or date filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p) => {
                      const typeConfig = PAYMENT_TYPE_LABELS[p.payment_type] || PAYMENT_TYPE_LABELS.other;
                      const displayInvoiceNo = p.invoice_number || 'LCA-PAY-2026-1';

                      return (
                        <tr key={p.id} className="hover:bg-[#FFFDFC] transition">
                          
                          {/* Col 1: Payment Date & Invoice Number */}
                          <td className="py-5 px-6">
                            <div className="font-extrabold text-gray-900 text-sm sm:text-base">{p.payment_date}</div>
                            <div className="text-xs sm:text-sm font-mono font-bold text-[#8A064D] bg-[#FCE7F3] px-3 py-1 rounded-lg inline-flex items-center gap-1.5 mt-1 border border-[#F0D5E4]">
                              <Hash className="w-3.5 h-3.5 text-[#8A064D]" />
                              <span>{displayInvoiceNo}</span>
                            </div>
                          </td>

                          {/* Col 2: Only Guru Name and ID Below */}
                          <td className="py-5 px-6">
                            <div className="font-black text-gray-900 text-base">{p.guru_name}</div>
                            <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-block mt-1 border border-blue-200 font-mono">
                              {p.guru_id ? `ID: ${p.guru_id}` : `ID: GURU-${p.trainer_id.slice(0, 4).toUpperCase()}`}
                            </div>
                          </td>

                          {/* Col 3: Payment Type */}
                          <td className="py-5 px-6">
                            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${typeConfig.badgeClass}`}>
                              {typeConfig.label}
                            </span>
                          </td>

                          {/* Col 4: Amount Paid */}
                          <td className="py-5 px-6">
                            <span className="font-black text-lg sm:text-xl text-[#2D041A] tabular-nums">
                              ₹{Number(p.amount).toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Col 5: Payment Mode */}
                          <td className="py-5 px-6">
                            <span className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gray-100 text-gray-800 border border-gray-200 uppercase tracking-wide">
                              {(p.payment_method || 'other').replace('_', ' ')}
                            </span>
                          </td>

                          {/* Col 6: Actions: Details button and Slip button */}
                          <td className="py-5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              {/* Details button: Opens subpage modal with all details */}
                              <button
                                onClick={() => setViewingPayment(p)}
                                className="px-4 py-2.5 rounded-xl border border-[#E8BFD5] bg-[#FFF5F9] hover:bg-[#FCE7F3] text-[#8A064D] font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                title="View All Details of this Payment"
                              >
                                <Info className="w-4 h-4 text-[#8A064D]" />
                                <span>Details</span>
                              </button>

                              {/* Slip button: Opens invoice view */}
                              <button
                                onClick={() => {
                                  const url = `/salaries/slip?id=${encodeURIComponent(p.id)}&month=${encodeURIComponent(p.payroll_month || '')}&guruName=${encodeURIComponent(p.guru_name)}&vNo=${encodeURIComponent(p.transaction_reference || displayInvoiceNo)}`;
                                  window.open(url, '_blank');
                                }}
                                className="px-4 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                title="View Official Vector PDF Payslip"
                              >
                                <FileText className="w-4 h-4 text-[#F9E33A]" />
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: PROCESS SALARY PAYMENT (Monthly Payroll) */}
      {/* ===================================================================== */}
      {payingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-[#F0D5E4] overflow-hidden animate-in zoom-in-95 duration-200 my-6">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#8A064D] to-[#430928] p-7 sm:p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0">
                  <CreditCard className="w-7 h-7 text-[#F9E33A]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl sm:text-3xl leading-tight">Record Salary Payment</h3>
                  <p className="text-white/85 text-sm sm:text-base mt-1">Disburse monthly honorarium to faculty guru through payroll</p>
                </div>
              </div>
              <button
                onClick={() => setPayingRecord(null)}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-7 sm:p-9 space-y-6">
              
              {/* Beneficiary & Amount Summary Card */}
              <div className="bg-[#FFF9FB] p-6 sm:p-7 rounded-3xl border-2 border-[#F0D5E4] shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Faculty Beneficiary</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#2D041A] block mt-1">{payingRecord.guru_name}</span>
                    <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                      <span className="text-xs text-blue-700 font-mono font-bold bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                        {payingRecord.guru_id ? `ID: ${payingRecord.guru_id}` : `ID: GURU-${payingRecord.trainer_id.slice(0, 4).toUpperCase()}`}
                      </span>
                      {payingRecord.display_title && (
                        <span className="text-xs font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                          {payingRecord.display_title}
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#8A064D] bg-[#FCE7F3] px-3 py-1 rounded-lg border border-[#F0D5E4]">
                        {payingRecord.payroll_month}
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right bg-white p-4.5 rounded-2xl border border-[#F0D5E4]">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Net Disbursable Amount</span>
                    <span className="text-3xl sm:text-4xl font-black text-emerald-700 block tabular-nums mt-1">
                      ₹{Number(payingRecord.net_salary).toLocaleString('en-IN')}
                    </span>
                    <div className="text-[11px] text-gray-500 mt-1 font-medium">
                      Base: ₹{Number(payingRecord.base_salary).toLocaleString('en-IN')}
                      {Number(payingRecord.bonus_amount || 0) > 0 && ` • Bonus: +₹${payingRecord.bonus_amount}`}
                      {Number(payingRecord.deduction_amount || 0) > 0 && ` • Ded: -₹${payingRecord.deduction_amount}`}
                      {Number(payingRecord.advance_deducted || 0) > 0 && ` • Adv: -₹${payingRecord.advance_deducted}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Row: Payment Date & Invoice Number (System Generated, Read-only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-[#8A064D]" />
                    <span>Payment Date <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 min-h-[54px] bg-gray-50 border border-gray-200 rounded-2xl text-base font-semibold focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                    <Hash className="w-4.5 h-4.5 text-[#8A064D]" />
                    <span>Invoice Number (System Generated)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={payInvoiceNumber}
                      readOnly
                      disabled
                      className="w-full px-5 py-3.5 min-h-[54px] bg-[#FFF9FB] border-2 border-[#F0D5E4] rounded-2xl text-base font-mono font-extrabold text-[#8A064D] cursor-not-allowed select-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Auto-Assigned
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Mode: NO default prefilled - user must actively select */}
              <div>
                <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-[#8A064D]" />
                  <span>Payment Mode <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  required
                  className="w-full px-5 py-4 min-h-[56px] bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                >
                  <option value="" disabled>-- Select Payment Mode --</option>
                  <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cheque">Bank Cheque</option>
                  <option value="cash">Petty Cash Voucher</option>
                </select>
              </div>

              {/* Transaction Ref: NO default prefilled */}
              <div>
                <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                  <Hash className="w-4.5 h-4.5 text-[#8A064D]" />
                  <span>Transaction Reference / UTR Number</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter UTR, Cheque No, or IMPS Ref (Optional)"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-5 py-3.5 min-h-[54px] bg-gray-50 border border-gray-200 rounded-2xl text-base font-mono font-medium focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                />
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-[#8A064D]" />
                  <span>Disbursal Remarks</span>
                </label>
                <input
                  type="text"
                  placeholder="Add any remarks or notes (Optional)"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-5 py-3.5 min-h-[54px] bg-gray-50 border border-gray-200 rounded-2xl text-base font-medium focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-6 py-3.5 rounded-2xl text-base font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay || !payMethod}
                  className="px-8 py-3.5 rounded-2xl text-base font-black bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-7 sm:p-8 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FCE7F3] flex items-center justify-center text-[#8A064D]">
                  <Edit3 className="w-5 h-5 text-[#8A064D]" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-[#2D041A]">Edit Payroll Adjustments</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{adjustingRecord.guru_name} • {adjustingRecord.payroll_month}</p>
                </div>
              </div>
              <button
                onClick={() => setAdjustingRecord(null)}
                className="p-2 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustments} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">Guru Base Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={adjBaseSalary}
                  onChange={(e) => setAdjBaseSalary(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-base font-black text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-3">
                <span className="text-xs font-black text-emerald-800 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  Performance / Festival / Special Bonus
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 mb-1">Bonus Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={adjBonus}
                      onChange={(e) => setAdjBonus(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 mb-1">Bonus Reason</label>
                    <input
                      type="text"
                      value={adjBonusReason}
                      onChange={(e) => setAdjBonusReason(e.target.value)}
                      placeholder="e.g. Festival Special / Choreography"
                      className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-100 space-y-3">
                <span className="text-xs font-black text-rose-800 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  Leave / Absence / Penalty Deductions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-rose-800 mb-1">Deduction (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={adjDeduction}
                      onChange={(e) => setAdjDeduction(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-xl text-sm font-bold text-rose-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-800 mb-1">Deduction Reason</label>
                    <input
                      type="text"
                      value={adjDeductionReason}
                      onChange={(e) => setAdjDeductionReason(e.target.value)}
                      placeholder="e.g. Unplanned Leave"
                      className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">
                  Salary Advance Recovery (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjAdvanceDeducted}
                  onChange={(e) => setAdjAdvanceDeducted(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {(() => {
                const b = Number(adjBaseSalary || 0);
                const bon = Number(adjBonus || 0);
                const d = Number(adjDeduction || 0);
                const adv = Number(adjAdvanceDeducted || 0);
                const net = b + bon - d - adv;

                return (
                  <div className="bg-[#FFF9FB] p-4.5 rounded-2xl border-2 border-[#F0D5E4] flex justify-between items-center text-sm">
                    <div>
                      <span className="text-gray-600 font-bold block">Calculated Net Payable:</span>
                      <span className="text-xs text-gray-500 font-mono">
                        ₹{b} + ₹{bon} - ₹{d} - ₹{adv}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-[#8A064D]">
                      ₹{net.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAdjustingRecord(null)}
                  className="px-5 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjustment}
                  className="px-7 py-3 rounded-2xl text-sm font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F9E33A]" />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-7 sm:p-10 shadow-2xl border border-[#F0D5E4] animate-in zoom-in-95 duration-200 my-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FCE7F3] flex items-center justify-center text-[#8A064D] shadow-inner shrink-0">
                  <Receipt className="w-7 h-7 text-[#8A064D]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl sm:text-3xl text-[#2D041A]">Store Payment Done to Guru</h3>
                  <p className="text-sm sm:text-base text-gray-500 mt-1">Record advance, performance bonus, incentive, or direct payments</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-6">
              
              {/* TOP ROW: Payment Date (default = today) & System-Generated Unique Invoice Number (Read-only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-[#FFF9FB] p-6 rounded-3xl border-2 border-[#F0D5E4] shadow-xs">
                <div>
                  <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-[#8A064D]" />
                    <span>Payment Date <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 min-h-[54px] bg-white border border-gray-200 rounded-2xl text-base font-semibold focus:ring-2 focus:ring-[#8A064D] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                    <Hash className="w-4.5 h-4.5 text-[#8A064D]" />
                    <span>Invoice Number (System Generated)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recordInvoiceNumber}
                      readOnly
                      disabled
                      className="w-full px-5 py-3.5 min-h-[54px] bg-white border-2 border-[#F0D5E4] rounded-2xl text-base font-mono font-extrabold text-[#8A064D] cursor-not-allowed select-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-0.5 rounded bg-pink-100 text-[#8A064D]">
                      Auto Voucher
                    </span>
                  </div>
                </div>
              </div>

              {/* GURU BENEFICIARY: Searchable Multi-colored Dropdown with NO default selected */}
              <div>
                <SearchableGuruSelect
                  trainers={trainers}
                  value={recordTrainerId}
                  onChange={(val) => setRecordTrainerId(val)}
                  label="Guru Beneficiary"
                  required={true}
                  placeholder="-- Select Guru Beneficiary --"
                  size="lg"
                />
              </div>

              {/* PAYMENT TYPE: NO default selected */}
              <div>
                <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                  <Banknote className="w-4.5 h-4.5 text-[#8A064D]" />
                  <span>Payment Type <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={recordPaymentType}
                  onChange={(e) => setRecordPaymentType(e.target.value)}
                  className="w-full px-5 py-4 min-h-[56px] bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  required
                >
                  <option value="" disabled>-- Select Payment Type --</option>
                  <option value="salary_advance">Salary Advance (Recoverable from Payroll)</option>
                  <option value="bonus">Performance Bonus</option>
                  <option value="festival_bonus">Festival / Special Bonus</option>
                  <option value="monthly_salary">Monthly Salary / Honorarium</option>
                  <option value="incentive">Class / Workshop Incentive</option>
                  <option value="reimbursement">Travel / Conveyance Reimbursement</option>
                  <option value="honorarium">Guest Lecture / Event Honorarium</option>
                  <option value="other">Other Direct Payment</option>
                </select>
              </div>

              {/* AMOUNT & DISBURSEMENT MODE: NO default prefilled */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[15px] font-extrabold text-gray-800 mb-2">
                    Amount Paid (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 text-2xl">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={recordAmount}
                      onChange={(e) => setRecordAmount(e.target.value)}
                      required
                      placeholder="0"
                      className="w-full pl-12 pr-5 py-4 min-h-[56px] bg-gray-50 border border-gray-200 rounded-2xl text-2xl font-black text-gray-900 focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[15px] font-extrabold text-gray-800 mb-2">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={recordMethod}
                    onChange={(e: any) => setRecordMethod(e.target.value)}
                    required
                    className="w-full px-5 py-4 min-h-[56px] bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  >
                    <option value="" disabled>-- Select Payment Mode --</option>
                    <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS / RTGS)</option>
                    <option value="upi">UPI / Instant Pay (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Petty Cash</option>
                    <option value="cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              {/* Transaction Ref: NO default */}
              <div>
                <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                  <Hash className="w-4.5 h-4.5 text-[#8A064D]" />
                  <span>Transaction Ref / UTR / Cheque Number</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter UTR / Cheque / IMPS Ref (Optional)"
                  value={recordRef}
                  onChange={(e) => setRecordRef(e.target.value)}
                  className="w-full px-5 py-3.5 min-h-[54px] bg-gray-50 border border-gray-200 rounded-2xl text-base font-mono font-medium focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                />
              </div>

              {/* Purpose / Remarks: NO default */}
              <div>
                <label className="block text-[15px] font-extrabold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-[#8A064D]" />
                  <span>Remarks / Purpose</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter payment purpose or remarks (Optional)"
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  className="w-full px-5 py-3.5 min-h-[54px] bg-gray-50 border border-gray-200 rounded-2xl text-base font-medium focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentModalOpen(false)}
                  className="px-6 py-3.5 rounded-2xl text-base font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-8 py-3.5 rounded-2xl text-base font-black bg-[#8A064D] hover:bg-[#70043E] text-white shadow-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-5 h-5 text-[#F9E33A]" />
                  <span>{submittingPayment ? 'Storing...' : 'Save Payment'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: PAYMENT DETAILS SUBPAGE / MODAL */}
      {/* ===================================================================== */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-7 sm:p-9 shadow-2xl border border-[#F0D5E4] animate-in zoom-in-95 duration-150 my-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FCE7F3] flex items-center justify-center text-[#8A064D] shrink-0">
                  <Receipt className="w-6 h-6 text-[#8A064D]" />
                </div>
                <div>
                  <h3 className="font-black text-xl sm:text-2xl text-[#2D041A]">Payment Voucher Details</h3>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-sm font-mono font-extrabold text-[#8A064D] bg-[#FFF9FB] px-2.5 py-0.5 rounded-lg border border-[#F0D5E4]">
                      # {viewingPayment.invoice_number || 'LCA-PAY-2026-1'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Disbursed & Settled
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="p-2 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="py-6 space-y-5">
              
              {/* Amount Box */}
              <div className="bg-[#FFF9FB] p-5 sm:p-6 rounded-3xl border-2 border-[#F0D5E4] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Amount Disbursed</span>
                  <span className="text-3xl sm:text-4xl font-black text-[#2D041A] block tabular-nums mt-1">
                    ₹{Number(viewingPayment.amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Disbursement Date</span>
                  <span className="text-base sm:text-lg font-bold text-gray-800 block mt-1">{viewingPayment.payment_date}</span>
                </div>
              </div>

              {/* Beneficiary Card */}
              <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/80 space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Beneficiary Information</span>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-black text-gray-900 text-lg">{viewingPayment.guru_name}</span>
                  <span className="px-3 py-1 rounded-md font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {viewingPayment.guru_id ? `ID: ${viewingPayment.guru_id}` : `ID: GURU-${viewingPayment.trainer_id.slice(0, 4).toUpperCase()}`}
                  </span>
                </div>
                {viewingPayment.phone && (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{viewingPayment.phone}</span>
                  </div>
                )}
              </div>

              {/* Payment Attributes Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Payment Type</span>
                  <span className="font-bold text-gray-900 text-base">
                    {PAYMENT_TYPE_LABELS[viewingPayment.payment_type]?.label || viewingPayment.payment_type}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Payment Mode</span>
                  <span className="font-bold text-gray-900 uppercase text-base">
                    {(viewingPayment.payment_method || 'other').replace('_', ' ')}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Transaction Ref / UTR</span>
                  <span className="font-mono font-bold text-gray-800 break-all text-sm">
                    {viewingPayment.transaction_reference || 'N/A'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Payroll Period</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {viewingPayment.payroll_month || 'Direct Payment'}
                  </span>
                </div>
              </div>

              {/* Remarks / Purpose */}
              {viewingPayment.notes && (
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm">
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Remarks / Purpose</span>
                  <p className="text-gray-700 italic font-medium">{viewingPayment.notes}</p>
                </div>
              )}

            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Copy Invoice */}
                <button
                  onClick={() => {
                    const invNo = viewingPayment.invoice_number || viewingPayment.transaction_reference || '';
                    navigator.clipboard.writeText(invNo);
                    showToast(`Copied Invoice Number: ${invNo}`);
                  }}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl border-2 border-[#F0D5E4] text-[#8A064D] hover:bg-[#FCE7F3] text-sm font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                  title="Copy Invoice Number"
                >
                  <Hash className="w-4 h-4 text-[#8A064D]" />
                  <span>Copy Invoice</span>
                </button>

                {/* WhatsApp Share Button */}
                <button
                  onClick={() => handleWhatsAppShare(viewingPayment)}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  title="Share Invoice Link on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-[#F9E33A]" />
                  <span>WhatsApp</span>
                </button>

                {/* View Slip */}
                <button
                  onClick={() => {
                    const invNo = viewingPayment.invoice_number || viewingPayment.transaction_reference || '';
                    const url = `/salaries/slip?id=${encodeURIComponent(viewingPayment.id)}&month=${encodeURIComponent(viewingPayment.payroll_month || '')}&guruName=${encodeURIComponent(viewingPayment.guru_name)}&vNo=${encodeURIComponent(invNo)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-sm font-extrabold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#F9E33A]" />
                  <span>Download Slip</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

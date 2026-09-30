'use client';

import React, { useState } from 'react';
import { 
  StudentFeeInvoice, 
  FeePayment, 
  FeeReminder, 
  FinancialSummary 
} from '@/lib/finance';
import { Course, Batch, Student } from '@/lib/academy';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  Printer, 
  CreditCard, 
  Eye, 
  X, 
  Sparkles,
  Phone,
  Calendar,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Share2,
  DollarSign,
  UserCheck,
  Building
} from 'lucide-react';

interface Props {
  initialInvoices: StudentFeeInvoice[];
  initialSummary: FinancialSummary;
  courses: Course[];
  batches: Batch[];
  students: Student[];
}

export default function StudentFeesClient({
  initialInvoices,
  initialSummary,
  courses,
  batches,
  students
}: Props) {
  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>(initialInvoices);
  const [summary, setSummary] = useState<FinancialSummary>(initialSummary);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_overdue' | 'partial' | 'paid'>('all');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Modals state
  const [payingInvoice, setPayingInvoice] = useState<StudentFeeInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'bank_transfer' | 'card' | 'cheque'>('upi');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<{
    invoice: StudentFeeInvoice;
    payment: FeePayment;
  } | null>(null);

  // Reminder Modal
  const [remindingInvoice, setRemindingInvoice] = useState<StudentFeeInvoice | null>(null);
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [sendingReminder, setSendingReminder] = useState(false);

  // Create Invoice Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [feePeriod, setFeePeriod] = useState('April 2026');
  const [dueDate, setDueDate] = useState('2026-04-10');
  const [totalAmount, setTotalAmount] = useState('2000');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.parent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.course_title?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending_overdue') {
      return inv.status === 'overdue' || inv.status === 'pending';
    }
    if (statusFilter === 'partial') {
      return inv.status === 'partial';
    }
    if (statusFilter === 'paid') {
      return inv.status === 'paid';
    }
    return true;
  });

  // Handle open payment modal
  const openPaymentModal = (inv: StudentFeeInvoice) => {
    setPayingInvoice(inv);
    setPaymentAmount(inv.balance_amount.toString());
    setPaymentMethod('upi');
    setPaymentRef('');
    setPaymentRemarks(inv.status === 'partial' ? 'Balance installment fee' : 'Monthly tuition fee');
  };

  // Submit payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount greater than ₹0');
      return;
    }
    if (amount > Number(payingInvoice.balance_amount)) {
      alert(`Amount cannot exceed the remaining balance of ₹${payingInvoice.balance_amount}`);
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/finance/fees/${payingInvoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: amount,
          payment_method: paymentMethod,
          transaction_reference: paymentRef || undefined,
          remarks: paymentRemarks || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment');
      }

      const { payment, invoiceStatus, newPaidAmount, newBalance } = await res.json();

      // Update state locally
      setInvoices((prev) =>
        prev.map((item) => {
          if (item.id === payingInvoice.id) {
            const updatedPayments = [payment, ...(item.payments || [])];
            return {
              ...item,
              paid_amount: newPaidAmount,
              balance_amount: newBalance,
              status: invoiceStatus,
              payments: updatedPayments
            };
          }
          return item;
        })
      );

      // Update summary KPI
      setSummary((prev) => ({
        ...prev,
        totalFeeCollected: prev.totalFeeCollected + amount,
        totalFeePending: Math.max(0, prev.totalFeePending - amount),
        netOperatingCashFlow: prev.netOperatingCashFlow + amount
      }));

      showToast(`Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully! Receipt: ${payment.receipt_number}`);
      setPayingInvoice(null);

      // Auto-open Receipt modal
      setActiveReceipt({
        invoice: {
          ...payingInvoice,
          paid_amount: newPaidAmount,
          balance_amount: newBalance,
          status: invoiceStatus
        },
        payment
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Submit Reminder
  const handleSendReminder = async () => {
    if (!remindingInvoice) return;
    setSendingReminder(true);
    try {
      const res = await fetch(`/api/finance/fees/${remindingInvoice.id}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: reminderChannel })
      });

      if (!res.ok) throw new Error('Failed to send reminder');
      const data = await res.json();

      // Update local invoice last_reminder_sent_at
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === remindingInvoice.id
            ? { ...inv, last_reminder_sent_at: new Date().toISOString() }
            : inv
        )
      );

      showToast(`Gentle reminder logged and sent to ${data.sent_to} via ${reminderChannel.toUpperCase()}!`);
      
      // If WhatsApp, also open WhatsApp Web with pre-filled message
      if (reminderChannel === 'whatsapp') {
        const cleanPhone = (remindingInvoice.phone || '').replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
        const encoded = encodeURIComponent(data.message);
        window.open(`https://wa.me/${targetPhone}?text=${encoded}`, '_blank');
      }

      setRemindingInvoice(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSendingReminder(false);
    }
  };

  // Submit New Fee Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInvoice(true);
    try {
      const res = await fetch('/api/finance/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          course_id: selectedCourseId,
          batch_id: selectedBatchId,
          fee_period: feePeriod,
          due_date: dueDate,
          total_amount: Number(totalAmount),
          discount_amount: Number(discountAmount),
          notes: invoiceNotes || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create fee invoice');
      }

      const created = await res.json();
      const studentObj = students.find((s) => s.id === selectedStudentId);
      const courseObj = courses.find((c) => c.id === selectedCourseId);
      const batchObj = batches.find((b) => b.id === selectedBatchId);

      const fullInvoice: StudentFeeInvoice = {
        ...created,
        student_name: studentObj?.full_name || 'Enrolled Student',
        roll_number: studentObj?.roll_number || 'LCA-00000',
        parent_name: studentObj?.parent_name || 'Parent',
        phone: studentObj?.phone || '+91 98450 12345',
        email: studentObj?.email || '',
        course_title: courseObj?.title || 'Academy Course',
        batch_name: batchObj?.name || 'Standard Batch',
        payments: [],
        reminders: []
      };

      setInvoices((prev) => [fullInvoice, ...prev]);
      showToast(`Fee Invoice ${created.invoice_number} generated for ${fullInvoice.student_name}!`);
      setIsCreateOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Roll Number',
      'Student Name',
      'Parent Name',
      'Phone',
      'Course',
      'Fee Period',
      'Due Date',
      'Total Amount',
      'Discount',
      'Paid Amount',
      'Balance Due',
      'Status'
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoice_number,
      inv.roll_number,
      `"${inv.student_name}"`,
      `"${inv.parent_name || ''}"`,
      inv.phone || '',
      `"${inv.course_title}"`,
      inv.fee_period,
      inv.due_date,
      inv.total_amount,
      inv.discount_amount,
      inv.paid_amount,
      inv.balance_amount,
      inv.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laasya_Student_Fees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-[#2D041A] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-5 h-5 text-[#F9E33A]" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Student Fee Management</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-bold">
              {invoices.length} Invoices
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track student tuition billing, record partial payments, print official receipts, and send WhatsApp payment reminders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-[#F0D5E4] rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#8A064D]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-[#8A064D] hover:bg-[#70043E] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Generate Fee Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Billed</span>
            <Receipt className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-black text-[#2D041A] mt-2">
            ₹{summary.totalFeeBilled.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            {summary.totalStudentsBilled} Students active
          </span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">Total Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-2">
            ₹{summary.totalFeeCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-semibold text-emerald-700 mt-1 block">
            {summary.collectionRate}% Collection Rate
          </span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Pending & Overdue</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-2">
            ₹{summary.totalFeePending.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] font-semibold text-amber-700 mt-1 block">
            {summary.overdueInvoicesCount} Overdue accounts
          </span>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A064D] uppercase">Installment Accounts</span>
            <CreditCard className="w-4 h-4 text-[#8A064D]" />
          </div>
          <p className="text-2xl font-black text-[#2D041A] mt-2">
            {summary.partialInvoicesCount} Partial
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Multi-installment payments tracked
          </span>
        </div>

      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#F0D5E4] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Invoices', count: invoices.length },
            { id: 'pending_overdue', label: 'Pending & Overdue', count: invoices.filter(i => i.status === 'overdue' || i.status === 'pending').length },
            { id: 'partial', label: 'Partial Payments', count: invoices.filter(i => i.status === 'partial').length },
            { id: 'paid', label: 'Paid & Settled', count: invoices.filter(i => i.status === 'paid').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#8A064D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student, roll number, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs w-72 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
          />
        </div>

      </div>

      {/* Invoices List / Table */}
      <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F9] text-gray-700 font-bold border-b border-[#F0D5E4]">
              <tr>
                <th className="py-3.5 px-4">Student & Roll No</th>
                <th className="py-3.5 px-4">Course & Batch</th>
                <th className="py-3.5 px-4">Invoice / Due</th>
                <th className="py-3.5 px-4 text-right">Fee & Discount</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600 text-sm">No fee invoices match your search</p>
                    <p className="text-xs text-gray-400 mt-1">Try switching filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  const hasPayments = (inv.payments || []).length > 0;

                  return (
                    <React.Fragment key={inv.id}>
                      <tr className={`hover:bg-[#FFF9FB]/70 transition ${isExpanded ? 'bg-[#FFF9FB]/90' : ''}`}>
                        
                        {/* Student Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {inv.student_name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-[#2D041A] block">{inv.student_name}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                                <span className="font-mono font-semibold text-[#8A064D]">{inv.roll_number}</span>
                                {inv.parent_name && <span>• {inv.parent_name}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Course & Batch */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-800 block">{inv.course_title}</span>
                          <span className="text-[11px] text-gray-500 block mt-0.5">{inv.batch_name}</span>
                        </td>

                        {/* Invoice & Period */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] font-semibold text-gray-700 block">{inv.invoice_number}</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">
                            {inv.fee_period} • Due: {inv.due_date}
                          </span>
                        </td>

                        {/* Total & Discount */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-gray-800 block">₹{Number(inv.total_amount).toLocaleString('en-IN')}</span>
                          {Number(inv.discount_amount) > 0 && (
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              -₹{Number(inv.discount_amount).toLocaleString('en-IN')} disc.
                            </span>
                          )}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-emerald-700">
                            ₹{Number(inv.paid_amount).toLocaleString('en-IN')}
                          </span>
                          {hasPayments && (
                            <button
                              onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                              className="text-[10px] text-[#8A064D] font-semibold hover:underline block ml-auto mt-0.5 flex items-center gap-0.5 justify-end"
                            >
                              <span>{inv.payments?.length} {inv.payments?.length === 1 ? 'pay' : 'pays'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </td>

                        {/* Balance Due */}
                        <td className="py-3.5 px-4 text-right font-black">
                          {Number(inv.balance_amount) > 0 ? (
                            <span className="text-rose-600">
                              ₹{Number(inv.balance_amount).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-xs">₹0 (Nil)</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {inv.status === 'paid' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Paid Full</span>
                            </span>
                          )}
                          {inv.status === 'partial' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              <span>Partial Paid</span>
                            </span>
                          )}
                          {inv.status === 'overdue' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              <span>Overdue</span>
                            </span>
                          )}
                          {inv.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Collect Payment (if balance > 0) */}
                            {Number(inv.balance_amount) > 0 && (
                              <button
                                onClick={() => openPaymentModal(inv)}
                                className="px-2.5 py-1 bg-[#8A064D] hover:bg-[#70043E] text-white rounded-lg text-[11px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Collect Full or Partial Payment"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Pay</span>
                              </button>
                            )}

                            {/* View Latest Receipt (if payment made) */}
                            {hasPayments && (
                              <button
                                onClick={() => setActiveReceipt({ invoice: inv, payment: inv.payments![0] })}
                                className="px-2 py-1 bg-white hover:bg-gray-100 text-[#8A064D] border border-[#F0D5E4] rounded-lg text-[11px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="View & Print Official Receipt"
                              >
                                <Receipt className="w-3 h-3 text-[#8A064D]" />
                                <span>Receipt</span>
                              </button>
                            )}

                            {/* Send Reminder (if balance > 0) */}
                            {Number(inv.balance_amount) > 0 && (
                              <button
                                onClick={() => setRemindingInvoice(inv)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                title="Send WhatsApp / SMS Reminder"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>

                      {/* Expandable Payment Timeline & Receipts */}
                      {isExpanded && (
                        <tr className="bg-[#FAF7F9]">
                          <td colSpan={8} className="p-4 pl-16">
                            <div className="bg-white rounded-2xl p-4 border border-[#F0D5E4] shadow-xs space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <span className="text-xs font-bold text-[#2D041A] flex items-center gap-1.5">
                                  <Receipt className="w-3.5 h-3.5 text-[#8A064D]" />
                                  <span>Payment History & Installment Receipts ({inv.payments?.length})</span>
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                  Total Paid: ₹{Number(inv.paid_amount).toLocaleString('en-IN')} of ₹{(Number(inv.total_amount) - Number(inv.discount_amount)).toLocaleString('en-IN')}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {inv.payments?.map((pay) => (
                                  <div 
                                    key={pay.id} 
                                    className="p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs bg-gray-50/60"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                                        ✓
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-[#8A064D]">{pay.receipt_number}</span>
                                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded">
                                            {pay.payment_method}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                          {pay.payment_date} • Ref: {pay.transaction_reference || 'N/A'} • {pay.remarks}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="font-black text-emerald-800 text-sm">
                                        ₹{Number(pay.amount_paid).toLocaleString('en-IN')}
                                      </span>
                                      <button
                                        onClick={() => setActiveReceipt({ invoice: inv, payment: pay })}
                                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] font-bold text-[#8A064D] hover:bg-[#FFF2F8] transition flex items-center gap-1 shadow-2xs"
                                      >
                                        <Printer className="w-3 h-3" />
                                        <span>Print</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: RECORD PAYMENT (FULL OR PARTIAL) */}
      {/* =================================================================== */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Record Student Fee Payment</h3>
                <p className="text-xs text-gray-500">Collect full or partial tuition fees & generate receipt.</p>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Quick Summary Card */}
            <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4] mb-4 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-[#2D041A]">
                <span>{payingInvoice.student_name}</span>
                <span className="font-mono text-[#8A064D]">{payingInvoice.roll_number}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>{payingInvoice.course_title}</span>
                <span>Period: {payingInvoice.fee_period}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-rose-100 text-xs">
                <span className="text-gray-500">Remaining Balance:</span>
                <span className="text-rose-600 font-black">₹{Number(payingInvoice.balance_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              
              {/* Payment Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount Received (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max={payingInvoice.balance_amount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>Balance after payment:</span>
                  <span className="font-bold text-gray-800">
                    ₹{Math.max(0, Number(payingInvoice.balance_amount) - (Number(paymentAmount) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Method / Mode <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm / QR)</option>
                  <option value="cash">Direct Counter Cash</option>
                  <option value="bank_transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="card">Debit / Credit Card (POS)</option>
                  <option value="cheque">Bank Cheque</option>
                </select>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transaction Reference / UTR / Cheque No
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/6075192834/HDFC or Cheque #492810"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Receipt Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Installment 1 of 2 paid via GPay"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{submittingPayment ? 'Processing...' : 'Confirm & Generate Receipt'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: PRINTABLE OFFICIAL FEE RECEIPT */}
      {/* =================================================================== */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Receipt Modal Controls */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100 print:hidden">
              <span className="text-xs font-bold text-gray-500 uppercase">Official Academy Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#8A064D] hover:bg-[#70043E] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Layout */}
            <div className="border-2 border-[#8A064D] rounded-2xl p-6 bg-white relative">
              
              {/* Header with Academy Crest */}
              <div className="text-center pb-4 border-b border-rose-100">
                <h2 className="text-lg font-black tracking-wide text-[#2D041A] uppercase">
                  Laasya Cultural Academy
                </h2>
                <p className="text-[11px] font-bold text-[#8A064D]">ಲಾಸ್ಯ ಸಾಂಸ್ಕೃತಿಕ ಅಕಾಡೆಮಿ • Unleash Your Talent</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  VV Maple Hub, 2nd Floor, Kannamangala, Doddabanahalli, Bangalore - 560067
                </p>
                <p className="text-[10px] text-gray-500">
                  Helpdesk: +91 8151 998 899 | +91 8155 889 988 • info@laasyaacademy.com
                </p>
              </div>

              {/* Receipt Title & Meta */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100 text-xs">
                <div>
                  <span className="font-bold text-gray-800">FEES PAYMENT RECEIPT</span>
                  <span className="text-[10px] text-gray-500 block">Original Customer Copy</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#8A064D] text-xs">
                    {activeReceipt.payment.receipt_number}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Date: {activeReceipt.payment.payment_date}
                  </span>
                </div>
              </div>

              {/* Student & Course Details */}
              <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Student Name:</span>
                  <span className="font-bold text-gray-900">{activeReceipt.invoice.student_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Roll Number:</span>
                  <span className="font-mono font-bold text-[#8A064D]">{activeReceipt.invoice.roll_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Discipline / Course:</span>
                  <span className="font-bold text-gray-900">{activeReceipt.invoice.course_title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Class Batch:</span>
                  <span className="font-semibold text-gray-700">{activeReceipt.invoice.batch_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Fee Period:</span>
                  <span className="font-semibold text-gray-700">{activeReceipt.invoice.fee_period}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Payment Mode:</span>
                  <span className="font-semibold text-gray-700 uppercase">
                    {activeReceipt.payment.payment_method} ({activeReceipt.payment.transaction_reference || 'Counter'})
                  </span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-[#FFF9FB] p-4 rounded-xl border border-[#F0D5E4] my-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-700">Amount Received:</span>
                  <span className="text-xl font-black text-emerald-700">
                    ₹{Number(activeReceipt.payment.amount_paid).toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-rose-100 mt-2">
                  <span>Balance Due on Invoice:</span>
                  <span className="font-bold text-rose-600">
                    ₹{Number(activeReceipt.invoice.balance_amount).toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>

              {/* Footer & Signature */}
              <div className="flex justify-between items-end pt-6 mt-4 text-[10px] text-gray-500">
                <div>
                  <p className="italic">Computer generated verified receipt.</p>
                  <p>Thank you for choosing Laasya Cultural Academy!</p>
                </div>
                <div className="text-center border-t border-gray-400 pt-1 w-36">
                  <span className="font-bold text-gray-800 text-[11px] block">Academy Office</span>
                  <span className="text-[9px] text-gray-400">Authorized Signatory</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: SEND WHATSAPP / SMS REMINDER */}
      {/* =================================================================== */}
      {remindingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-[#2D041A]">Send Fee Reminder</h3>
              </div>
              <button
                onClick={() => setRemindingInvoice(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
                <p className="font-bold">{remindingInvoice.student_name} ({remindingInvoice.roll_number})</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Parent: {remindingInvoice.parent_name || 'N/A'} • Phone: {remindingInvoice.phone}
                </p>
                <p className="font-extrabold text-rose-700 mt-1">
                  Pending Due: ₹{Number(remindingInvoice.balance_amount).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reminder Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'sms', label: 'SMS' },
                    { id: 'email', label: 'Email' }
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setReminderChannel(ch.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        reminderChannel === ch.id
                          ? 'bg-[#8A064D] text-white border-[#8A064D]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-composed Temple Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reminder Message Preview</label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed font-sans">
                  Namaste {remindingInvoice.parent_name || remindingInvoice.student_name}, gentle reminder from Laasya Cultural Academy: {remindingInvoice.course_title} tuition fee for {remindingInvoice.fee_period} (Pending Due: ₹{remindingInvoice.balance_amount}) is due. Please pay via UPI or visit academy desk. Thank you.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRemindingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReminder ? 'Sending...' : 'Send WhatsApp Reminder'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: CREATE FEE INVOICE */}
      {/* =================================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-base text-[#2D041A]">Generate New Student Fee Invoice</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              
              {/* Select Student */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Enrolled Student <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#8A064D]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.roll_number}) - Parent: {s.parent_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course & Batch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      const crs = courses.find(c => c.id === e.target.value);
                      if (crs) setTotalAmount(crs.monthly_fee.toString());
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (₹{c.monthly_fee}/m)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Slot</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fee Period & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fee Period</label>
                  <input
                    type="text"
                    required
                    value={feePeriod}
                    onChange={(e) => setFeePeriod(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="e.g. April 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Total & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Net Balance Preview */}
              <div className="p-3 bg-[#FFF9FB] rounded-xl border border-[#F0D5E4] flex justify-between text-xs font-bold">
                <span className="text-gray-700">Net Invoice Amount to Pay:</span>
                <span className="text-[#8A064D] text-sm">
                  ₹{Math.max(0, (Number(totalAmount) || 0) - (Number(discountAmount) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingInvoice ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { 
  StudentFeeInvoice, 
  FeePayment, 
  FinancialSummary 
} from '@/lib/finance';
import { Course, Batch, Student } from '@/lib/academy';
import { 
  Receipt, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Eye, 
  MessageCircle, 
  IndianRupee, 
  CreditCard, 
  X, 
  Sparkles, 
  Phone, 
  User, 
  Users, 
  Printer, 
  AlertTriangle, 
  CalendarRange, 
  Send,
  Layers,
  Check
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
  students: initialStudents
}: Props) {
  // -------------------------------------------------------------
  // 1. TOP TAB STATE: Collections vs Payments
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'collections' | 'payments'>('collections');

  // Main Data States
  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>(initialInvoices);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [summary, setSummary] = useState<FinancialSummary>(initialSummary);

  // -------------------------------------------------------------
  // 2. COLLECTIONS PAGE STATE & FILTERS
  // -------------------------------------------------------------
  const [collectionsSearch, setCollectionsSearch] = useState('');
  const [collectionsStatusFilter, setCollectionsStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');

  // -------------------------------------------------------------
  // 3. PAYMENTS PAGE STATE & FILTERS
  // -------------------------------------------------------------
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [paymentEndDate, setPaymentEndDate] = useState('');

  // -------------------------------------------------------------
  // 4. MODALS STATE
  // -------------------------------------------------------------
  // A. Collect Modal (From Collections tab)
  const [collectingStudent, setCollectingStudent] = useState<Student | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectMethod, setCollectMethod] = useState<'upi' | 'cash' | 'bank_transfer' | 'card' | 'cheque'>('upi');
  const [collectRef, setCollectRef] = useState('');
  const [collectFeePeriod, setCollectFeePeriod] = useState('September 2026');
  const [collectRemarks, setCollectRemarks] = useState('');
  const [submittingCollect, setSubmittingCollect] = useState(false);

  // B. Edit Invoice Modal (From Payments tab)
  const [editingInvoice, setEditingInvoice] = useState<StudentFeeInvoice | null>(null);
  const [editTotalAmount, setEditTotalAmount] = useState<string>('');
  const [editDiscountAmount, setEditDiscountAmount] = useState<string>('0');
  const [editFeePeriod, setEditFeePeriod] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'paid' | 'partial' | 'pending' | 'overdue'>('pending');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // C. View Invoice / Printable Receipt Modal (From Payments tab)
  const [viewingInvoice, setViewingInvoice] = useState<StudentFeeInvoice | null>(null);

  // D. Share WhatsApp Modal (Asks: Parent or Student?)
  const [sharingInvoice, setSharingInvoice] = useState<StudentFeeInvoice | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // DATE FORMATTER: "dd and month name" (e.g. "30 Sep" or "30 Sep 2026")
  // -------------------------------------------------------------
  const formatDdMonthName = (dateStr?: string | null, includeYear = true) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      return includeYear ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`;
    } catch {
      return dateStr;
    }
  };

  const currentMonthDueDate = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${lastDay.getDate()} ${lastDay.toLocaleString('en-US', { month: 'short' })}`;
  }, []);

  // -------------------------------------------------------------
  // COLLECTIONS DATA TRANSFORMATION & COMPUTATION
  // -------------------------------------------------------------
  interface StudentCollectionRow {
    student: Student;
    studentId: string;
    studentName: string;
    rollNumber: string;
    phone: string;
    parentName: string;
    parentContact: string;
    parentRelation: string;
    totalMonthlyFee: number;
    totalPaidAmount: number;
    balanceDue: number;
    status: 'paid' | 'partial' | 'pending';
    statusLabel: string;
  }

  const collectionsData = useMemo<StudentCollectionRow[]>(() => {
    return students.map((s) => {
      const totalMonthly = Number(s.total_monthly_fee || 0);
      const studentInvoices = invoices.filter((i) => i.student_id === s.id);
      const invoicedPaid = studentInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
      const advancePaid = Number(s.advance_paid || 0);
      
      const totalPaid = invoicedPaid > 0 ? invoicedPaid + advancePaid : advancePaid;
      
      // Due formula: total monthly fee - advance paid (or invoice balance if overdue accumulated)
      let due = s.due_amount !== undefined ? Number(s.due_amount) : (totalMonthly - advancePaid);
      if (studentInvoices.length > 0) {
        const invBalance = studentInvoices.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0);
        if (invBalance > totalMonthly) {
          due = invBalance - advancePaid;
        }
      }

      let status: 'paid' | 'partial' | 'pending' = 'pending';
      let statusLabel = 'Pending Due';

      if (due <= 0) {
        status = 'paid';
        statusLabel = due < 0 ? 'Advance Credit' : 'Paid & Settled';
      } else if (totalPaid > 0 && due > 0) {
        status = 'partial';
        statusLabel = 'Partial Payment';
      } else {
        status = 'pending';
        statusLabel = due > totalMonthly ? 'Overdue' : 'Pending Due';
      }

      return {
        student: s,
        studentId: s.id,
        studentName: s.full_name,
        rollNumber: s.roll_number,
        phone: s.phone,
        parentName: s.parent_name || '—',
        parentContact: s.parent_contact || s.phone,
        parentRelation: s.parent_relation || 'Parent',
        totalMonthlyFee: totalMonthly,
        totalPaidAmount: totalPaid,
        balanceDue: due,
        status,
        statusLabel
      };
    });
  }, [students, invoices]);

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collectionsData.filter((row) => {
      // 1. Search Filter (by student name or roll number)
      if (collectionsSearch.trim()) {
        const q = collectionsSearch.toLowerCase();
        const matchesName = row.studentName.toLowerCase().includes(q);
        const matchesRoll = row.rollNumber.toLowerCase().includes(q);
        const matchesPhone = row.phone.includes(q);
        if (!matchesName && !matchesRoll && !matchesPhone) return false;
      }

      // 2. Status Filter
      if (collectionsStatusFilter === 'pending') {
        return row.status === 'pending';
      }
      if (collectionsStatusFilter === 'partial') {
        return row.status === 'partial';
      }
      if (collectionsStatusFilter === 'paid') {
        return row.status === 'paid';
      }

      return true;
    });
  }, [collectionsData, collectionsSearch, collectionsStatusFilter]);

  // Collections Summary Metrics
  const collectionsSummary = useMemo(() => {
    const totalStudents = collectionsData.length;
    const totalMonthlyExpected = collectionsData.reduce((sum, r) => sum + r.totalMonthlyFee, 0);
    const totalPaid = collectionsData.reduce((sum, r) => sum + r.totalPaidAmount, 0);
    const totalDue = collectionsData.reduce((sum, r) => sum + Math.max(0, r.balanceDue), 0);
    const pendingCount = collectionsData.filter((r) => r.status === 'pending').length;
    const partialCount = collectionsData.filter((r) => r.status === 'partial').length;
    const settledCount = collectionsData.filter((r) => r.status === 'paid').length;
    const collectionRate = totalMonthlyExpected > 0 ? Math.round((totalPaid / totalMonthlyExpected) * 100) : 100;

    return {
      totalStudents,
      totalMonthlyExpected,
      totalPaid,
      totalDue,
      pendingCount,
      partialCount,
      settledCount,
      collectionRate
    };
  }, [collectionsData]);

  // -------------------------------------------------------------
  // PAYMENTS DATA FILTERING & COMPUTATION
  // -------------------------------------------------------------
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search Filter (by student name or invoice number)
      if (paymentsSearch.trim()) {
        const q = paymentsSearch.toLowerCase();
        const matchesName = inv.student_name.toLowerCase().includes(q);
        const matchesInv = inv.invoice_number.toLowerCase().includes(q);
        const matchesRoll = inv.roll_number.toLowerCase().includes(q);
        if (!matchesName && !matchesInv && !matchesRoll) return false;
      }

      // 2. Status Filter
      if (paymentsStatusFilter === 'pending') {
        if (inv.status !== 'pending' && inv.status !== 'overdue') return false;
      }
      if (paymentsStatusFilter === 'partial') {
        if (inv.status !== 'partial') return false;
      }
      if (paymentsStatusFilter === 'paid') {
        if (inv.status !== 'paid') return false;
      }

      // 3. Date Range Filter
      if (paymentStartDate) {
        const invDate = inv.due_date || inv.created_at;
        if (invDate && invDate.substring(0, 10) < paymentStartDate) return false;
      }
      if (paymentEndDate) {
        const invDate = inv.due_date || inv.created_at;
        if (invDate && invDate.substring(0, 10) > paymentEndDate) return false;
      }

      return true;
    });
  }, [invoices, paymentsSearch, paymentsStatusFilter, paymentStartDate, paymentEndDate]);

  // Payments Summary Metrics
  const paymentsSummary = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const totalBilled = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.discount_amount || 0)), 0);
    const totalPaid = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
    const totalDue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0);
    const pendingCount = filteredInvoices.filter((i) => i.status === 'pending' || i.status === 'overdue').length;
    const partialCount = filteredInvoices.filter((i) => i.status === 'partial').length;
    const paidCount = filteredInvoices.filter((i) => i.status === 'paid').length;
    const settledRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

    return {
      totalInvoices,
      totalBilled,
      totalPaid,
      totalDue,
      pendingCount,
      partialCount,
      paidCount,
      settledRate
    };
  }, [filteredInvoices]);

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------
  // 1. Open Collect Modal
  const handleOpenCollect = (row: StudentCollectionRow) => {
    setCollectingStudent(row.student);
    const defAmount = row.balanceDue > 0 ? row.balanceDue.toString() : row.totalMonthlyFee.toString();
    setCollectAmount(defAmount);
    setCollectMethod('upi');
    setCollectRef('');
    setCollectFeePeriod('September 2026');
    setCollectRemarks(`Tuition fee collection for ${row.studentName}`);
  };

  // Submit Collect Fee
  const handleSubmitCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingStudent) return;
    const amount = Number(collectAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid collection amount greater than ₹0');
      return;
    }

    setSubmittingCollect(true);
    try {
      const res = await fetch('/api/finance/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collect',
          student_id: collectingStudent.id,
          amount_paid: amount,
          payment_method: collectMethod,
          transaction_reference: collectRef || undefined,
          fee_period: collectFeePeriod,
          remarks: collectRemarks || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to collect payment');
      }

      const result = await res.json();

      // Update student due amount locally
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === collectingStudent.id) {
            const currentDue = Number(s.due_amount ?? (s.total_monthly_fee || 0));
            const newDue = currentDue - amount;
            const newAdv = Number(s.advance_paid || 0) + (newDue < 0 ? Math.abs(newDue) : 0);
            return {
              ...s,
              due_amount: newDue,
              advance_paid: newAdv,
              due_status: newDue <= 0 ? 'green' : newDue > (s.total_monthly_fee || 0) ? 'red' : 'yellow'
            };
          }
          return s;
        })
      );

      // Refresh invoices
      const invRes = await fetch('/api/finance/fees');
      if (invRes.ok) {
        const freshInvoices = await invRes.json();
        setInvoices(freshInvoices);
      }

      showToast(`Fee payment of ₹${amount.toLocaleString('en-IN')} collected for ${collectingStudent.full_name}!`);
      setCollectingStudent(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingCollect(false);
    }
  };

  // 2. Open Edit Invoice Modal
  const handleOpenEditInvoice = (inv: StudentFeeInvoice) => {
    setEditingInvoice(inv);
    setEditTotalAmount(inv.total_amount.toString());
    setEditDiscountAmount((inv.discount_amount || 0).toString());
    setEditFeePeriod(inv.fee_period || 'September 2026');
    setEditDueDate(inv.due_date ? inv.due_date.substring(0, 10) : '2026-09-30');
    setEditNotes(inv.notes || '');
    setEditStatus(inv.status);
  };

  // Submit Edit Invoice
  const handleSubmitEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setSubmittingEdit(true);
    try {
      const res = await fetch('/api/finance/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingInvoice.id,
          total_amount: Number(editTotalAmount),
          discount_amount: Number(editDiscountAmount || 0),
          fee_period: editFeePeriod,
          due_date: editDueDate,
          notes: editNotes,
          status: editStatus
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update invoice');
      }

      const updated = await res.json();

      setInvoices((prev) =>
        prev.map((i) => (i.id === editingInvoice.id ? { ...i, ...updated } : i))
      );

      showToast(`Invoice ${editingInvoice.invoice_number} updated successfully!`);
      setEditingInvoice(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // 3. WhatsApp Message Generator & Redirect Handler
  const generateWhatsAppMessage = (inv: StudentFeeInvoice, recipientType: 'parent' | 'student') => {
    const recipientName = recipientType === 'parent' 
      ? (inv.parent_name || `Parent of ${inv.student_name}`)
      : inv.student_name;

    const formattedDate = formatDdMonthName(inv.due_date || inv.created_at);

    return `✨ *LAASYA CULTURAL ACADEMY* ✨
_Unleash Your Talent_

🧾 *FEE INVOICE & RECEIPT*
• Invoice No: *${inv.invoice_number}*
• Date: *${formattedDate}*

👤 *Student Details:*
• Name: *${inv.student_name}*
• Student ID: *${inv.roll_number}*
• Course: *${inv.course_title || 'Academy Course'}*
• Fee Period: *${inv.fee_period}*

💰 *Payment Breakdown:*
• Invoice Fee: ₹${Number(inv.total_amount).toLocaleString('en-IN')}
• Paid Amount: ₹${Number(inv.paid_amount).toLocaleString('en-IN')}
• Balance Due: *₹${Number(inv.balance_amount).toLocaleString('en-IN')}*
• Status: *${inv.status === 'paid' ? '✅ PAID & SETTLED' : inv.status === 'partial' ? '⏳ PARTIALLY PAID' : '⚠️ PENDING DUE'}*

Namaste ${recipientName}, thank you for being a valued part of Laasya Cultural Academy!
For queries, contact: +91 98450 12345`;
  };

  const handleSendWhatsApp = (inv: StudentFeeInvoice, recipientType: 'parent' | 'student') => {
    let targetPhone = recipientType === 'parent' 
      ? (inv.phone || '') 
      : (inv.phone || '');

    // Check if student has parent contact in student profile
    const matchedStudent = students.find((s) => s.id === inv.student_id);
    if (recipientType === 'parent' && matchedStudent?.parent_contact) {
      targetPhone = matchedStudent.parent_contact;
    }

    if (!targetPhone) {
      alert('Contact phone number not available for this recipient.');
      return;
    }

    // Clean phone number (remove spaces, symbols)
    let cleanPhone = targetPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const msg = generateWhatsAppMessage(inv, recipientType);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    setSharingInvoice(null);
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#2D041A] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-5 h-5 text-[#F9E33A]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. TOP HEADER WITH 2 PRIMARY TABS: COLLECTIONS & PAYMENTS */}
      {/* ===================================================================== */}
      <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FCE7F3] text-[#8A064D]">
              Student Finance Portal
            </span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-bold">
              {activeTab === 'collections' ? `${collectionsData.length} Student Learners` : `${invoices.length} Invoices & Receipts`}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#2D041A] tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-[#8A064D]" />
            Student Fee Management
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Track student fee collections, process invoice settlements, and share instant WhatsApp receipts.
          </p>
        </div>

        {/* The 2 Primary Tabs: Collections vs Payments */}
        <div className="flex items-center bg-[#FDF2F7] p-1.5 rounded-2xl border border-[#F0D5E4] shadow-inner">
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'collections'
                ? 'bg-[#8A064D] text-white shadow-md ring-2 ring-[#F9E33A]/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4 text-[#F9E33A]" />
            <span>Collections</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'collections' ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-700'
            }`}>
              {collectionsData.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#8A064D] text-white shadow-md ring-2 ring-[#F9E33A]/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#F9E33A]" />
            <span>Payments</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'payments' ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-700'
            }`}>
              {invoices.length}
            </span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. TAB CONTENT A: COLLECTIONS PAGE */}
      {/* ===================================================================== */}
      {activeTab === 'collections' && (
        <div className="space-y-6">

          {/* Collections Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Active Learners</span>
                <Users className="w-5 h-5 text-[#8A064D]" />
              </div>
              <div className="text-2xl font-black text-[#2D041A]">
                {collectionsSummary.totalStudents}
              </div>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                {collectionsSummary.settledCount} Fully Paid • {collectionsSummary.pendingCount} Pending
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Expected Monthly Fee</span>
                <IndianRupee className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-[#2D041A]">
                ₹{collectionsSummary.totalMonthlyExpected.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Total sum of joined course fees
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Fee Collected</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-800">
                ₹{collectionsSummary.totalPaid.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {collectionsSummary.collectionRate}% of monthly target collected
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between text-rose-700 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Balance Due Outstanding</span>
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700">
                ₹{collectionsSummary.totalDue.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                Due by {currentMonthDueDate}
              </span>
            </div>

          </div>

          {/* Collections Search Bar & Top Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[#F0D5E4]">
            
            {/* Filter Tabs: All Students, Pending Due, Partial Payments, Paid & Settled */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCollectionsStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  collectionsStatusFilter === 'all'
                    ? 'bg-[#8A064D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Students ({collectionsData.length})
              </button>

              <button
                onClick={() => setCollectionsStatusFilter('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  collectionsStatusFilter === 'pending'
                    ? 'bg-[#8A064D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Pending Due</span>
                <span className="text-[10px] opacity-80">({collectionsSummary.pendingCount})</span>
              </button>

              <button
                onClick={() => setCollectionsStatusFilter('partial')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  collectionsStatusFilter === 'partial'
                    ? 'bg-[#8A064D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Partial Payments</span>
                <span className="text-[10px] opacity-80">({collectionsSummary.partialCount})</span>
              </button>

              <button
                onClick={() => setCollectionsStatusFilter('paid')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  collectionsStatusFilter === 'paid'
                    ? 'bg-[#8A064D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Paid & Settled</span>
                <span className="text-[10px] opacity-80">({collectionsSummary.settledCount})</span>
              </button>
            </div>

            {/* Search Bar for Collections (Search by Student Name & Roll) */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name, ID..."
                value={collectionsSearch}
                onChange={(e) => setCollectionsSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
              />
            </div>

          </div>

          {/* Collections Table (Student Name & ID, Total Monthly Fee, Total Paid Amount, Balance Due, Status, ONLY Collect Button) */}
          <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#2D041A] font-bold">
                    <th className="py-3.5 px-5">Student Name & ID</th>
                    <th className="py-3.5 px-4 text-right">Total Monthly Fee</th>
                    <th className="py-3.5 px-4 text-right">Total Paid Amount</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCollections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-bold text-gray-600">No students match your filter criteria.</p>
                        <p className="text-xs text-gray-400 mt-1">Try switching filters or clearing the search query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCollections.map((row) => {
                      const isPaid = row.status === 'paid';
                      const isPartial = row.status === 'partial';

                      return (
                        <tr key={row.studentId} className="hover:bg-[#FFFDFC] transition">
                          
                          {/* 1. Student Name & ID */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-lg shrink-0">
                                {row.rollNumber}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 block text-xs">{row.studentName}</span>
                                <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{row.phone}</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Total Monthly Fee */}
                          <td className="py-3.5 px-4 text-right font-extrabold text-[#2D041A]">
                            ₹{row.totalMonthlyFee.toLocaleString('en-IN')}
                          </td>

                          {/* 3. Total Paid Amount */}
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                            ₹{row.totalPaidAmount.toLocaleString('en-IN')}
                          </td>

                          {/* 4. Balance Due */}
                          <td className="py-3.5 px-4 text-right font-black">
                            {row.balanceDue <= 0 ? (
                              <span className="text-emerald-700">
                                {row.balanceDue < 0 ? `-₹${Math.abs(row.balanceDue).toLocaleString('en-IN')}` : '₹0'}
                              </span>
                            ) : (
                              <span className={row.balanceDue > row.totalMonthlyFee ? 'text-rose-700' : 'text-amber-700'}>
                                ₹{row.balanceDue.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          {/* 5. Status */}
                          <td className="py-3.5 px-4 text-center">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>{row.statusLabel}</span>
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                <span>Partial Paid</span>
                              </span>
                            )}
                            {!isPaid && !isPartial && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                <span>{row.statusLabel}</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Action: ONLY Collect Button */}
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => handleOpenCollect(row)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs border border-[#48082B] cursor-pointer ml-auto"
                              title={`Collect fee from ${row.studentName}`}
                            >
                              <IndianRupee className="w-3.5 h-3.5 text-[#F9E33A]" />
                              <span>Collect</span>
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
      {/* 3. TAB CONTENT B: PAYMENTS & INVOICES PAGE */}
      {/* ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">

          {/* Payments Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Invoices</span>
                <Receipt className="w-5 h-5 text-[#8A064D]" />
              </div>
              <div className="text-2xl font-black text-[#2D041A]">
                {paymentsSummary.totalInvoices}
              </div>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                {paymentsSummary.paidCount} Settled • {paymentsSummary.pendingCount} Pending
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Invoiced Amount</span>
                <IndianRupee className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-[#2D041A]">
                ₹{paymentsSummary.totalBilled.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                Gross billing across selected period
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Amount Paid</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-800">
                ₹{paymentsSummary.totalPaid.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {paymentsSummary.settledRate}% settled across invoices
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between text-rose-700 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Balance Due</span>
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700">
                ₹{paymentsSummary.totalDue.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                Remaining outstanding receivables
              </span>
            </div>

          </div>

          {/* Payments Filters: Status Tabs, Date Range Filter & Search Bar */}
          <div className="bg-white p-4 rounded-3xl border border-[#F0D5E4] space-y-3">
            
            {/* Row 1: Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPaymentsStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    paymentsStatusFilter === 'all'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Invoices ({invoices.length})
                </button>

                <button
                  onClick={() => setPaymentsStatusFilter('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentsStatusFilter === 'pending'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Pending Due</span>
                </button>

                <button
                  onClick={() => setPaymentsStatusFilter('partial')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentsStatusFilter === 'partial'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Partial Payments</span>
                </button>

                <button
                  onClick={() => setPaymentsStatusFilter('paid')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentsStatusFilter === 'paid'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Paid & Settled</span>
                </button>
              </div>

              {/* Search Bar for Payments: Student Name & Invoice Number */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student name, invoice #..."
                  value={paymentsSearch}
                  onChange={(e) => setPaymentsSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>
            </div>

            {/* Row 2: Date Range Filter */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-gray-700 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-[#8A064D]" />
                <span>Date Range:</span>
              </span>

              <div className="flex items-center gap-2">
                <label className="text-gray-500">From:</label>
                <input
                  type="date"
                  value={paymentStartDate}
                  onChange={(e) => setPaymentStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-500">To:</label>
                <input
                  type="date"
                  value={paymentEndDate}
                  onChange={(e) => setPaymentEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {(paymentStartDate || paymentEndDate) && (
                <button
                  onClick={() => {
                    setPaymentStartDate('');
                    setPaymentEndDate('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline px-2 py-1 cursor-pointer"
                >
                  Clear Dates
                </button>
              )}
            </div>

          </div>

          {/* Payments Table (Student Name & ID, Invoice Number, Amount Paid, Due, Status, Actions: Edit, View, Share WhatsApp) */}
          <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#2D041A] font-bold">
                    <th className="py-3.5 px-5">Student Name & ID</th>
                    <th className="py-3.5 px-4">Invoice Number</th>
                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                    <th className="py-3.5 px-4 text-right">Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-bold text-gray-600">No invoices match your search or date criteria.</p>
                        <p className="text-xs text-gray-400 mt-1">Try resetting the date range or status filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isPaid = inv.status === 'paid';
                      const isPartial = inv.status === 'partial';

                      return (
                        <tr key={inv.id} className="hover:bg-[#FFFDFC] transition">
                          
                          {/* 1. Student Name & ID */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-lg shrink-0">
                                {inv.roll_number}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 block text-xs">{inv.student_name}</span>
                                <span className="text-[10px] text-gray-500 block mt-0.5">
                                  {inv.course_title}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Invoice Number */}
                          <td className="py-3.5 px-4 font-mono font-bold text-[#8A064D]">
                            <div>{inv.invoice_number}</div>
                            <span className="text-[10px] text-gray-500 font-sans font-normal block">
                              Due: {formatDdMonthName(inv.due_date, false)}
                            </span>
                          </td>

                          {/* 3. Amount Paid */}
                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                            ₹{Number(inv.paid_amount).toLocaleString('en-IN')}
                          </td>

                          {/* 4. Due (Balance Amount) */}
                          <td className="py-3.5 px-4 text-right font-black">
                            {Number(inv.balance_amount) <= 0 ? (
                              <span className="text-emerald-700">₹0</span>
                            ) : (
                              <span className={Number(inv.balance_amount) > Number(inv.paid_amount) ? 'text-rose-700' : 'text-amber-700'}>
                                ₹{Number(inv.balance_amount).toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          {/* 5. Status */}
                          <td className="py-3.5 px-4 text-center">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>Paid Full</span>
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                <span>Partial</span>
                              </span>
                            )}
                            {!isPaid && !isPartial && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                <span>Pending Due</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Actions: Edit, View, Share Invoice [WhatsApp] */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditInvoice(inv)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1D4ED8] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs border border-[#1E3A8A] cursor-pointer"
                                title="Edit Invoice Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-sky-200" />
                                <span>Edit</span>
                              </button>

                              {/* View Button */}
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs border border-[#48082B] cursor-pointer"
                                title="View Complete Invoice & Receipt"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                                <span>View</span>
                              </button>

                              {/* Share Invoice [WhatsApp] Button */}
                              <button
                                onClick={() => setSharingInvoice(inv)}
                                className="px-3 py-1.5 rounded-xl bg-[#064E3B] hover:bg-[#065F46] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-[#047857] cursor-pointer"
                                title="Share Invoice on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Share Invoice</span>
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
      {/* 4. MODAL A: COLLECT STUDENT FEE (FOR COLLECTIONS PAGE) */}
      {/* ===================================================================== */}
      {collectingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#8A064D] bg-[#FFF2F8] px-2 py-0.5 rounded-lg border border-rose-100">
                  {collectingStudent.roll_number}
                </span>
                <h3 className="font-black text-lg text-[#2D041A] mt-1">Collect Student Fee</h3>
                <p className="text-xs text-gray-500">Record fee collection and generate official payment receipt.</p>
              </div>
              <button
                onClick={() => setCollectingStudent(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCollect} className="space-y-4">
              
              {/* Student Summary Banner */}
              <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-900 block text-sm">{collectingStudent.full_name}</span>
                  <span className="text-gray-500 text-[11px]">
                    Guardian: {collectingStudent.parent_name || '—'} ({collectingStudent.parent_relation || 'Parent'})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Monthly Fee</span>
                  <span className="font-black text-[#8A064D] text-sm">
                    ₹{Number(collectingStudent.total_monthly_fee || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Amount to Collect */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Collection Amount (INR ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base font-black text-[#2D041A] focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {(['upi', 'cash', 'bank_transfer', 'card', 'cheque'] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setCollectMethod(method)}
                      className={`py-2 px-2.5 rounded-xl border text-center uppercase tracking-wider text-[11px] transition cursor-pointer ${
                        collectMethod === method
                          ? 'bg-[#8A064D] text-white border-[#8A064D] shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Period & Transaction Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fee Period</label>
                  <input
                    type="text"
                    required
                    value={collectFeePeriod}
                    onChange={(e) => setCollectFeePeriod(e.target.value)}
                    placeholder="e.g. September 2026"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Transaction Ref / Cheque No.</label>
                  <input
                    type="text"
                    value={collectRef}
                    onChange={(e) => setCollectRef(e.target.value)}
                    placeholder="e.g. UPI-998822"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Remarks</label>
                <input
                  type="text"
                  value={collectRemarks}
                  onChange={(e) => setCollectRemarks(e.target.value)}
                  placeholder="Optional payment notes"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCollectingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCollect}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <IndianRupee className="w-4 h-4 text-[#F9E33A]" />
                  <span>{submittingCollect ? 'Processing...' : 'Confirm & Collect Fee'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MODAL B: EDIT INVOICE (FOR PAYMENTS PAGE) */}
      {/* ===================================================================== */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#8A064D] bg-[#FFF2F8] px-2 py-0.5 rounded-lg border border-rose-100">
                  {editingInvoice.invoice_number}
                </span>
                <h3 className="font-black text-lg text-[#2D041A] mt-1">Edit Invoice Details</h3>
                <p className="text-xs text-gray-500">Update fee period, due date, amounts, notes, and status.</p>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditInvoice} className="space-y-4">
              
              {/* Student Header */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                <span className="text-gray-500">Student: </span>
                <strong className="text-gray-900">{editingInvoice.student_name}</strong> ({editingInvoice.roll_number}) • <span>{editingInvoice.course_title}</span>
              </div>

              {/* Total & Discount Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Fee Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editTotalAmount}
                    onChange={(e) => setEditTotalAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editDiscountAmount}
                    onChange={(e) => setEditDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Fee Period & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fee Period</label>
                  <input
                    type="text"
                    required
                    value={editFeePeriod}
                    onChange={(e) => setEditFeePeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Status Override */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#8A064D]"
                >
                  <option value="pending">Pending Due</option>
                  <option value="partial">Partial Payment</option>
                  <option value="paid">Paid Full & Settled</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional internal remarks..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. MODAL C: VIEW INVOICE & PRINTABLE RECEIPT */}
      {/* ===================================================================== */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[92vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            
            {/* Header with Academy Brand */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#2D041A] border-2 border-[#F9E33A] flex items-center justify-center text-[#F9E33A] font-serif font-black text-lg shadow-sm">
                  LC
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2D041A] uppercase tracking-wide">
                    Laasya Cultural Academy
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">
                    Official Student Fee Receipt
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingInvoice(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition print:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="py-4 space-y-4 text-xs">
              
              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Invoice No</span>
                  <span className="font-mono font-black text-[#8A064D] text-sm">{viewingInvoice.invoice_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Due Date</span>
                  <span className="font-mono font-bold text-gray-800">{formatDdMonthName(viewingInvoice.due_date)}</span>
                </div>
              </div>

              {/* Student & Guardian Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-[#FFF9FB] rounded-2xl border border-rose-100">
                <div>
                  <span className="text-[10px] text-[#8A064D] uppercase font-bold block">Student Details</span>
                  <span className="font-bold text-gray-900 text-sm block mt-0.5">{viewingInvoice.student_name}</span>
                  <span className="text-[11px] text-gray-600 font-mono font-bold">ID: {viewingInvoice.roll_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8A064D] uppercase font-bold block">Guardian & Contact</span>
                  <span className="font-semibold text-gray-800 block mt-0.5">{viewingInvoice.parent_name || 'Parent'}</span>
                  <span className="text-[11px] text-gray-600">{viewingInvoice.phone}</span>
                </div>
              </div>

              {/* Course & Fee Breakdown */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Period</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    <tr>
                      <td className="py-3 px-3">
                        <strong className="text-gray-900 block">{viewingInvoice.course_title}</strong>
                        <span className="text-[10px] text-gray-500">Batch: {viewingInvoice.batch_name}</span>
                      </td>
                      <td className="py-3 px-3 text-center">{viewingInvoice.fee_period}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        ₹{Number(viewingInvoice.total_amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {Number(viewingInvoice.discount_amount) > 0 && (
                      <tr className="text-emerald-700 bg-emerald-50/40">
                        <td className="py-2 px-3">Academy Discount / Concession</td>
                        <td className="py-2 px-3 text-center">—</td>
                        <td className="py-2 px-3 text-right font-bold">
                          -₹{Number(viewingInvoice.discount_amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200 font-bold">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 text-right">Paid Amount:</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-black">
                        ₹{Number(viewingInvoice.paid_amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 text-sm">
                      <td colSpan={2} className="py-2.5 px-3 text-right text-[#8A064D] font-black">Balance Due:</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-700">
                        ₹{Number(viewingInvoice.balance_amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Timeline if recorded */}
              {viewingInvoice.payments && viewingInvoice.payments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Installment Receipts ({viewingInvoice.payments.length})
                  </span>
                  <div className="space-y-1.5">
                    {viewingInvoice.payments.map((p) => (
                      <div key={p.id} className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-[11px]">
                        <div>
                          <strong className="font-mono text-[#8A064D]">{p.receipt_number}</strong>
                          <span className="text-gray-500 ml-2">({p.payment_method.toUpperCase()})</span>
                          <span className="text-gray-400 block text-[10px]">{formatDdMonthName(p.payment_date)}</span>
                        </div>
                        <span className="font-black text-emerald-800">₹{Number(p.amount_paid).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Actions: Print & Share WhatsApp */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 print:hidden">
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2D041A] hover:bg-[#48082B] text-white shadow-sm border border-[#48082B] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const inv = viewingInvoice;
                    setViewingInvoice(null);
                    setSharingInvoice(inv);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#064E3B] hover:bg-[#065F46] text-white shadow-sm border border-[#047857] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Share WhatsApp</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. MODAL D: SHARE INVOICE VIA WHATSAPP (ASKS: PARENT OR STUDENT?) */}
      {/* ===================================================================== */}
      {sharingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2D041A]">Share Invoice via WhatsApp</h3>
                  <p className="text-xs text-gray-500">Choose whether to send to Parent or Student.</p>
                </div>
              </div>
              <button
                onClick={() => setSharingInvoice(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Option 1: Send to Parent */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 transition group flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-[#8A064D]">
                      Option 1: Parent / Guardian
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1">
                      {sharingInvoice.parent_name || 'Parent of ' + sharingInvoice.student_name}
                    </h4>
                    <p className="text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{sharingInvoice.phone}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(sharingInvoice, 'parent')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#064E3B] hover:bg-[#065F46] active:scale-95 text-white font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Send to Parent on WhatsApp</span>
                </button>
              </div>

              {/* Option 2: Send to Student */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 transition group flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                      Option 2: Student
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1">
                      {sharingInvoice.student_name}
                    </h4>
                    <p className="text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{sharingInvoice.phone}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(sharingInvoice, 'student')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1D4ED8] active:scale-95 text-white font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-sky-200" />
                  <span>Send to Student on WhatsApp</span>
                </button>
              </div>

              {/* Message Preview Box */}
              <div className="p-3 bg-[#FFFDF5] rounded-2xl border border-amber-200/80 text-[11px] text-gray-700">
                <span className="font-bold text-amber-900 block mb-1">Preview WhatsApp Text:</span>
                <p className="font-mono text-[10px] bg-white p-2.5 rounded-xl border border-amber-100 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line text-gray-800">
                  {generateWhatsAppMessage(sharingInvoice, 'parent')}
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

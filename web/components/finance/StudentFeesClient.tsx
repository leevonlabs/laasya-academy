'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Check,
  Download,
  ChevronDown
} from 'lucide-react';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';
import { downloadStudentFeeInvoicePdf } from '@/lib/pdf';

interface Props {
  initialInvoices: StudentFeeInvoice[];
  initialSummary: FinancialSummary;
  courses: Course[];
  batches: Batch[];
  students: Student[];
}

const MONTHS = [
  { short: 'Jan', full: 'January', num: 0 },
  { short: 'Feb', full: 'February', num: 1 },
  { short: 'Mar', full: 'March', num: 2 },
  { short: 'Apr', full: 'April', num: 3 },
  { short: 'May', full: 'May', num: 4 },
  { short: 'Jun', full: 'June', num: 5 },
  { short: 'Jul', full: 'July', num: 6 },
  { short: 'Aug', full: 'August', num: 7 },
  { short: 'Sep', full: 'September', num: 8 },
  { short: 'Oct', full: 'October', num: 9 },
  { short: 'Nov', full: 'November', num: 10 },
  { short: 'Dec', full: 'December', num: 11 },
];

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
  // 2. COLLECTIONS PAGE STATE & FILTERS (With Year & Month selector)
  // -------------------------------------------------------------
  const [collectionsSearch, setCollectionsSearch] = useState('');
  const [collectionsStatusFilter, setCollectionsStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [collectionsYear, setCollectionsYear] = useState<number>(2026);
  const [collectionsMonth, setCollectionsMonth] = useState<number>(8); // 8 = September (0-indexed)

  // -------------------------------------------------------------
  // 3. PAYMENTS PAGE STATE & FILTERS (Searchable Student Dropdown, No Pending Due)
  // -------------------------------------------------------------
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState<'all' | 'partial' | 'paid'>('all');
  const [paymentsStudentFilter, setPaymentsStudentFilter] = useState<string>('all');
  const [isPaymentsStudentDropdownOpen, setIsPaymentsStudentDropdownOpen] = useState(false);
  const [paymentsStudentSearch, setPaymentsStudentSearch] = useState('');
  const paymentsStudentDropdownRef = useRef<HTMLDivElement>(null);
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [paymentEndDate, setPaymentEndDate] = useState('');

  // Close payments student dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (paymentsStudentDropdownRef.current && !paymentsStudentDropdownRef.current.contains(event.target as Node)) {
        setIsPaymentsStudentDropdownOpen(false);
      }
    }
    if (isPaymentsStudentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPaymentsStudentDropdownOpen]);

  // -------------------------------------------------------------
  // 4. MODALS STATE
  // -------------------------------------------------------------
  // A. Collect Modal (From Collections tab)
  const [collectingStudent, setCollectingStudent] = useState<Student | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectDiscount, setCollectDiscount] = useState<string>('0');
  const [collectMethod, setCollectMethod] = useState<'upi' | 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other'>('upi');
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
  // DATE FORMATTER: Month End Date in DD/MM/YY format (e.g. 30/09/26, 31/03/26)
  // -------------------------------------------------------------
  const formatMonthEndDdMmYy = (dateStrOrPeriod?: string | null) => {
    let d = new Date();
    if (dateStrOrPeriod) {
      const parsed = new Date(dateStrOrPeriod);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      } else {
        const match = dateStrOrPeriod.match(/([a-zA-Z]+)\s+(\d{4})/);
        if (match) {
          const mNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
          const mIdx = mNames.findIndex(m => m.startsWith(match[1].toLowerCase()));
          if (mIdx !== -1) {
            d = new Date(parseInt(match[2], 10), mIdx, 1);
          }
        }
      }
    }
    const year = d.getFullYear();
    const month = d.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dd = String(lastDay).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    const yy = String(year).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

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

  const collectionsMonthDueDate = useMemo(() => {
    return formatMonthEndDdMmYy(new Date(collectionsYear, collectionsMonth, 1).toISOString());
  }, [collectionsYear, collectionsMonth]);

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
    const selectedMonthName = MONTHS[collectionsMonth].full;
    const selectedMonthShort = MONTHS[collectionsMonth].short.toLowerCase();
    const selectedYearStr = collectionsYear.toString();

    return students.map((s) => {
      const totalMonthly = Number(s.total_monthly_fee || 0);

      // Invoices matching this student and selected month & year
      const matchingInvoices = invoices.filter((inv) => {
        if (inv.student_id !== s.id) return false;
        
        const period = (inv.fee_period || '').toLowerCase();
        if (period.includes(selectedMonthName.toLowerCase()) || 
           (period.includes(selectedMonthShort) && period.includes(selectedYearStr))) {
          return true;
        }

        const dStr = inv.due_date || inv.created_at;
        if (dStr) {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            return d.getFullYear() === collectionsYear && d.getMonth() === collectionsMonth;
          }
        }
        return false;
      });

      // Total paid in this selected month
      let totalPaidInMonth = 0;
      if (matchingInvoices.length > 0) {
        totalPaidInMonth = matchingInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
      }

      const advancePaid = Number(s.advance_paid || 0);

      // Due calculation
      let due = totalMonthly;
      if (matchingInvoices.length > 0) {
        due = matchingInvoices.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0);
      } else if (advancePaid > 0) {
        due = Math.max(0, totalMonthly - advancePaid);
      }

      let status: 'paid' | 'partial' | 'pending' = 'pending';
      let statusLabel = 'Pending Due';

      if (due <= 0 && (totalPaidInMonth > 0 || advancePaid > 0)) {
        status = 'paid';
        statusLabel = due < 0 ? 'Advance Credit' : 'Paid & Settled';
      } else if (totalPaidInMonth > 0 && due > 0) {
        status = 'partial';
        statusLabel = 'Partial Payment';
      } else {
        status = 'pending';
        statusLabel = 'Pending Due';
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
        totalPaidAmount: totalPaidInMonth,
        balanceDue: due,
        status,
        statusLabel
      };
    });
  }, [students, invoices, collectionsYear, collectionsMonth]);

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
  // Payments = Money received from the student (can be multiple times in a month)
  // Excludes students who didn't pay (amount_paid == 0)
  // -------------------------------------------------------------
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Exclude 0 amount payments: payments are strictly money received from students!
      if (Number(inv.paid_amount || 0) <= 0) return false;

      // 2. Student Dropdown Filter
      if (paymentsStudentFilter !== 'all' && inv.student_id !== paymentsStudentFilter) {
        return false;
      }

      // 3. Search Filter (by student name or invoice number)
      if (paymentsSearch.trim()) {
        const q = paymentsSearch.toLowerCase();
        const matchesName = inv.student_name.toLowerCase().includes(q);
        const matchesInv = inv.invoice_number.toLowerCase().includes(q);
        const matchesRoll = inv.roll_number.toLowerCase().includes(q);
        if (!matchesName && !matchesInv && !matchesRoll) return false;
      }

      // 4. Status Filter: 'all' | 'partial' | 'paid' (Pending Due is removed)
      if (paymentsStatusFilter === 'partial') {
        const isPart = inv.status === 'partial' || Number(inv.balance_amount || 0) > 0;
        if (!isPart) return false;
      }
      if (paymentsStatusFilter === 'paid') {
        const isPaid = inv.status === 'paid' || Number(inv.balance_amount || 0) <= 0;
        if (!isPaid) return false;
      }

      // 5. Date Range Filter
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
  }, [invoices, paymentsSearch, paymentsStatusFilter, paymentsStudentFilter, paymentStartDate, paymentEndDate]);

  // Students list for payments searchable dropdown
  const filteredStudentsForDropdown = useMemo(() => {
    if (!paymentsStudentSearch.trim()) return students;
    const q = paymentsStudentSearch.toLowerCase();
    return students.filter(s => 
      s.full_name.toLowerCase().includes(q) || 
      s.roll_number.toLowerCase().includes(q)
    );
  }, [students, paymentsStudentSearch]);

  // Payments Summary Metrics
  const paymentsSummary = useMemo(() => {
    const validPayments = invoices.filter(inv => Number(inv.paid_amount || 0) > 0);
    const totalPaymentsCount = filteredInvoices.length;
    const totalPaid = filteredInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
    const totalDue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0);
    const partialCount = filteredInvoices.filter((i) => i.status === 'partial' || Number(i.balance_amount || 0) > 0).length;
    const paidCount = filteredInvoices.filter((i) => i.status === 'paid' || Number(i.balance_amount || 0) <= 0).length;

    return {
      totalPaymentsCount,
      allPaymentsCount: validPayments.length,
      totalPaid,
      totalDue,
      partialCount,
      paidCount
    };
  }, [filteredInvoices, invoices]);

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------
  // 1. Open Collect Modal
  const handleOpenCollect = (row: StudentCollectionRow) => {
    setCollectingStudent(row.student);
    const defAmount = row.balanceDue > 0 ? row.balanceDue.toString() : row.totalMonthlyFee.toString();
    setCollectAmount(defAmount);
    setCollectDiscount('0');
    setCollectMethod('upi');
    setCollectRef('');
    setCollectFeePeriod(`${MONTHS[collectionsMonth].full} ${collectionsYear}`);
    setCollectRemarks('');
  };

  const handleDiscountChange = (val: string) => {
    setCollectDiscount(val);
    const discNum = Math.max(0, Number(val) || 0);
    const base = Number(collectingStudent?.total_monthly_fee || 0);
    if (base > 0 && discNum <= base) {
      setCollectAmount((base - discNum).toString());
    }
  };

  const collectDiscountPercent = useMemo(() => {
    const discNum = Number(collectDiscount || 0);
    const base = Number(collectingStudent?.total_monthly_fee || 0) || (Number(collectAmount || 0) + discNum);
    if (base <= 0 || discNum <= 0) return 0;
    return Math.min(100, Math.round(((discNum / base) * 100) * 10) / 10);
  }, [collectDiscount, collectingStudent, collectAmount]);

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
          discount_amount: Number(collectDiscount || 0),
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

📄 The official fee invoice PDF has been downloaded to your device for sharing.
Namaste ${recipientName}, thank you for being a valued part of Laasya Cultural Academy!
For queries, contact: +91 8151 998 899`;
  };

  const handleSendWhatsApp = async (inv: StudentFeeInvoice, recipientType: 'parent' | 'student') => {
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

    // Trigger vector PDF download for the invoice
    downloadStudentFeeInvoicePdf(inv);

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
            className={`px-6 py-3 rounded-xl text-sm font-black transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'collections'
                ? 'bg-[#8A064D] text-white shadow-md ring-2 ring-[#F9E33A]/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4 text-[#F9E33A]" />
            <span>Collections</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              activeTab === 'collections' ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-700'
            }`}>
              {collectionsData.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#8A064D] text-white shadow-md ring-2 ring-[#F9E33A]/40'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#F9E33A]" />
            <span>Payments</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
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

          {/* Month & Year Selection Filter for Collections Audit */}
          <div className="bg-white p-4.5 rounded-3xl border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#8A064D]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Collection Period Audit</span>
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-black text-[#2D041A]">{MONTHS[collectionsMonth].full} {collectionsYear}</span>
                  <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-bold">
                    Due: {collectionsMonthDueDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Year Navigator */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setCollectionsYear(y => y - 1)}
                  className="px-2.5 py-1 hover:bg-white text-gray-600 rounded-xl transition cursor-pointer font-black text-xs"
                  title="Previous Year"
                >
                  «
                </button>
                <span className="px-3.5 text-xs font-black text-[#2D041A]">{collectionsYear}</span>
                <button
                  type="button"
                  onClick={() => setCollectionsYear(y => y + 1)}
                  className="px-2.5 py-1 hover:bg-white text-gray-600 rounded-xl transition cursor-pointer font-black text-xs"
                  title="Next Year"
                >
                  »
                </button>
              </div>

              {/* Month Pills */}
              <div className="flex items-center gap-1 overflow-x-auto p-1 bg-gray-50 border border-gray-200 rounded-2xl scrollbar-none">
                {MONTHS.map((m) => {
                  const isSelected = collectionsMonth === m.num;
                  return (
                    <button
                      key={m.short}
                      type="button"
                      onClick={() => setCollectionsMonth(m.num)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#8A064D] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                      }`}
                    >
                      {m.short}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Collections Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4]/80 shadow-xs">
              <div className="flex items-center justify-between text-[#6E3955] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Active Learners</span>
                <Users className="w-5 h-5 text-[#8A064D]" />
              </div>
              <div className="text-3xl font-black text-[#2D041A] tabular-nums">
                {collectionsSummary.totalStudents}
              </div>
              <span className="text-xs text-[#6E3955] font-medium mt-1.5 block tabular-nums">
                {collectionsSummary.settledCount} Fully Paid • {collectionsSummary.pendingCount} Pending
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4]/80 shadow-xs">
              <div className="flex items-center justify-between text-[#6E3955] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Expected Monthly Fee</span>
                <IndianRupee className="w-5 h-5 text-[#8A064D]" />
              </div>
              <div className="text-3xl font-black text-[#2D041A] tabular-nums">
                ₹{collectionsSummary.totalMonthlyExpected.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#6E3955] font-medium mt-1.5 block">
                Total sum of joined course fees
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Fee Collected</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-800 tabular-nums">
                ₹{collectionsSummary.totalPaid.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-emerald-700 font-semibold mt-1.5 block tabular-nums">
                {collectionsSummary.collectionRate}% of monthly target collected
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between text-rose-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Balance Due Outstanding</span>
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-3xl font-black text-rose-700 tabular-nums">
                ₹{collectionsSummary.totalDue.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-rose-600 font-semibold mt-1.5 block tabular-nums">
                Due by {collectionsMonthDueDate}
              </span>
            </div>
          </div>

          {/* Collections Search Bar & Top Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-3xl border border-[#F0D5E4]">
            
            {/* Filter Tabs: All Students, Pending Due, Partial Payments, Paid & Settled */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCollectionsStatusFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  collectionsStatusFilter === 'all'
                    ? 'bg-[#8A064D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Students ({collectionsData.length})
              </button>

              <button
                onClick={() => setCollectionsStatusFilter('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  collectionsStatusFilter === 'pending'
                    ? 'bg-[#8A064D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Pending Due</span>
                <span className="text-xs opacity-80">({collectionsSummary.pendingCount})</span>
              </button>

              <button
                onClick={() => setCollectionsStatusFilter('partial')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  collectionsStatusFilter === 'partial'
                    ? 'bg-[#8A064D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Partial Payments</span>
                <span className="text-xs opacity-80">({collectionsSummary.partialCount})</span>
              </button>

              <button
                onClick={() => setCollectionsStatusFilter('paid')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  collectionsStatusFilter === 'paid'
                    ? 'bg-[#8A064D] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Paid & Settled</span>
                <span className="text-xs opacity-80">({collectionsSummary.settledCount})</span>
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
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
              />
            </div>

          </div>

          {/* Collections Table (Student Name & ID, Total Monthly Fee, Total Paid Amount, Balance Due, Status, ONLY Collect Button) */}
          <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#590231] font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-5">Student Name & ID</th>
                    <th className="py-4 px-5 text-right">Total Monthly Fee</th>
                    <th className="py-4 px-5 text-right">Total Paid Amount</th>
                    <th className="py-4 px-5 text-right">Balance Due</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
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
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg shrink-0">
                                {row.rollNumber}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 block text-sm">{row.studentName}</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{row.phone}</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Total Monthly Fee */}
                          <td className="py-4 px-5 text-right font-extrabold text-[#2D041A] text-sm">
                            ₹{row.totalMonthlyFee.toLocaleString('en-IN')}
                          </td>

                          {/* 3. Total Paid Amount */}
                          <td className="py-4 px-5 text-right font-extrabold text-emerald-700 text-sm">
                            ₹{row.totalPaidAmount.toLocaleString('en-IN')}
                          </td>

                          {/* 4. Balance Due */}
                          <td className="py-4 px-5 text-right font-black text-sm">
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
                          <td className="py-4 px-5 text-center">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>{row.statusLabel}</span>
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                <span>Partial Paid</span>
                              </span>
                            )}
                            {!isPaid && !isPartial && (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                <span>{row.statusLabel}</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Action: ONLY Collect Button */}
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => handleOpenCollect(row)}
                              className="px-4 py-2 rounded-xl bg-[#2D041A] hover:bg-[#48082B] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs border border-[#48082B] cursor-pointer ml-auto"
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
            
            <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4]/80 shadow-xs">
              <div className="flex items-center justify-between text-[#6E3955] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Payments Received</span>
                <Receipt className="w-5 h-5 text-[#8A064D]" />
              </div>
              <div className="text-3xl font-black text-[#2D041A] tabular-nums">
                {paymentsSummary.totalPaymentsCount}
              </div>
              <span className="text-xs text-[#6E3955] font-medium mt-1.5 block tabular-nums">
                {paymentsSummary.paidCount} Full Settled • {paymentsSummary.partialCount} Partial
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Amount Received</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-800 tabular-nums">
                ₹{paymentsSummary.totalPaid.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-emerald-700 font-semibold mt-1.5 block">
                Total money collected from students
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0D5E4]/80 shadow-xs">
              <div className="flex items-center justify-between text-[#6E3955] mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Paying Students</span>
                <Users className="w-5 h-5 text-[#8A064D]" />
              </div>
              <div className="text-3xl font-black text-[#2D041A] tabular-nums">
                {new Set(filteredInvoices.map(i => i.student_id)).size}
              </div>
              <span className="text-xs text-[#6E3955] font-medium mt-1.5 block">
                Active student learners with paid fees
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-xs bg-amber-50/20">
              <div className="flex items-center justify-between text-amber-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Remaining Invoice Due</span>
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-amber-700 tabular-nums">
                ₹{paymentsSummary.totalDue.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-amber-600 font-semibold mt-1.5 block">
                Remaining balance on partial receipts
              </span>
            </div>

          </div>

          {/* Payments Filters: Status Tabs, Student Dropdown, Date Range Filter & Search Bar */}
          <div className="bg-white p-4.5 rounded-3xl border border-[#F0D5E4] space-y-3.5">
            
            {/* Row 1: Filter Tabs (Pending Due REMOVED per user instruction) & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPaymentsStatusFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    paymentsStatusFilter === 'all'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Payments ({filteredInvoices.length})
                </button>

                <button
                  onClick={() => setPaymentsStatusFilter('paid')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentsStatusFilter === 'paid'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Paid & Settled</span>
                  <span className="text-xs opacity-80">({paymentsSummary.paidCount})</span>
                </button>

                <button
                  onClick={() => setPaymentsStatusFilter('partial')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    paymentsStatusFilter === 'partial'
                      ? 'bg-[#8A064D] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Partial Payments</span>
                  <span className="text-xs opacity-80">({paymentsSummary.partialCount})</span>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>
            </div>

            {/* Row 2: Student Searchable Dropdown & Date Range Filter (align left to prevent overlap) */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Searchable Student Dropdown Filter */}
                <div className="relative" ref={paymentsStudentDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsPaymentsStudentDropdownOpen(!isPaymentsStudentDropdownOpen)}
                    className={`px-4 py-2.5 bg-white hover:bg-gray-50 border rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer ${
                      paymentsStudentFilter !== 'all' ? 'border-[#8A064D] text-[#8A064D] bg-[#FFF2F8]' : 'border-[#F0D5E4] text-gray-800'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#8A064D]" />
                    <span className="truncate max-w-[200px]">
                      {paymentsStudentFilter === 'all'
                        ? 'All Students'
                        : students.find(s => s.id === paymentsStudentFilter)?.full_name || 'Selected Student'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isPaymentsStudentDropdownOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
                  </button>

                  {isPaymentsStudentDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-76 bg-white rounded-3xl shadow-2xl border border-[#F0D5E4] p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search student name or ID..."
                          value={paymentsStudentSearch}
                          onChange={(e) => setPaymentsStudentSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#8A064D] focus:bg-white"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentsStudentFilter('all');
                            setIsPaymentsStudentDropdownOpen(false);
                            setPaymentsStudentSearch('');
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            paymentsStudentFilter === 'all'
                              ? 'bg-[#FFF2F8] text-[#8A064D] font-bold'
                              : 'text-gray-700 hover:bg-gray-50 font-medium'
                          }`}
                        >
                          <span>All Students ({students.length})</span>
                          {paymentsStudentFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#8A064D]" />}
                        </button>

                        {filteredStudentsForDropdown.map((s) => {
                          const isSelected = paymentsStudentFilter === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setPaymentsStudentFilter(s.id);
                                setIsPaymentsStudentDropdownOpen(false);
                                setPaymentsStudentSearch('');
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FFF2F8] text-[#8A064D] font-bold'
                                  : 'text-gray-700 hover:bg-gray-50 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded shrink-0">
                                  {s.roll_number}
                                </span>
                                <span className="truncate">{s.full_name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Range Quick Filter with align="left" to prevent table overlap */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <CalendarRange className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Payment Period:</span>
                  </span>
                  <DateRangeQuickFilter
                    startDate={paymentStartDate}
                    endDate={paymentEndDate}
                    align="left"
                    onApply={({ startDate, endDate }) => {
                      setPaymentStartDate(startDate);
                      setPaymentEndDate(endDate);
                    }}
                    placeholder="Select Date Range (All Payments)"
                  />
                </div>
              </div>

              {(paymentStartDate || paymentEndDate || paymentsStudentFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStartDate('');
                    setPaymentEndDate('');
                    setPaymentsStudentFilter('all');
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline px-2.5 py-1.5 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

          </div>

          {/* Payments Table (Student Name & ID, Invoice Number, Amount Paid, Due, Status, Actions: Edit, View, Share WhatsApp) */}
          <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#590231] font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-5">Student Name & ID</th>
                    <th className="py-4 px-5">Invoice Number</th>
                    <th className="py-4 px-5 text-right">Amount Paid</th>
                    <th className="py-4 px-5 text-right">Due</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-bold text-gray-600">No payments found matching your filter criteria.</p>
                        <p className="text-xs text-gray-400 mt-1">Try resetting the student or date range filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isPaid = inv.status === 'paid' || Number(inv.balance_amount) <= 0;
                      const isPartial = !isPaid;

                      return (
                        <tr key={inv.id} className="hover:bg-[#FFFDFC] transition">
                          
                          {/* 1. Student Name & ID */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg shrink-0">
                                {inv.roll_number}
                              </span>
                              <div>
                                <span className="font-bold text-gray-900 block text-sm">{inv.student_name}</span>
                                <span className="text-xs text-gray-500 block mt-0.5">
                                  {inv.course_title}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Invoice Number & Due Date in DD/MM/YY format */}
                          <td className="py-4 px-5 font-mono font-bold text-[#8A064D]">
                            <div className="text-sm">{inv.invoice_number}</div>
                            <span className="text-xs text-gray-500 font-sans font-medium block mt-0.5">
                              Due: {formatMonthEndDdMmYy(inv.due_date || inv.fee_period || inv.created_at)}
                            </span>
                          </td>

                          {/* 3. Amount Paid */}
                          <td className="py-4 px-5 text-right font-extrabold text-emerald-700 text-sm">
                            <div>₹{Number(inv.paid_amount).toLocaleString('en-IN')}</div>
                            {Number(inv.discount_amount) > 0 && (
                              <div className="text-[10px] font-semibold text-rose-600 mt-0.5">
                                Disc: -₹{Number(inv.discount_amount).toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>

                          {/* 4. Due (Balance Amount) */}
                          <td className="py-4 px-5 text-right font-black text-sm">
                            {Number(inv.balance_amount) <= 0 ? (
                              <span className="text-emerald-700">₹0</span>
                            ) : (
                              <span className={Number(inv.balance_amount) > Number(inv.paid_amount) ? 'text-rose-700' : 'text-amber-700'}>
                                ₹{Number(inv.balance_amount).toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          {/* 5. Status */}
                          <td className="py-4 px-5 text-center">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>Paid Full</span>
                              </span>
                            )}
                            {isPartial && (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                <span>Partial</span>
                              </span>
                            )}
                            {!isPaid && !isPartial && (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                <span>Pending Due</span>
                              </span>
                            )}
                          </td>

                          {/* 6. Actions: Edit, View, Share Invoice [WhatsApp] */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditInvoice(inv)}
                                className="px-3 py-1.5 rounded-xl bg-[#FFF5F9] hover:bg-[#FCE7F3] active:scale-95 text-[#8A064D] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs border border-[#E8BFD5] cursor-pointer"
                                title="Edit Invoice Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#8A064D]" />
                                <span>Edit</span>
                              </button>

                              {/* View Button */}
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                className="px-3 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-[#48082B] cursor-pointer"
                                title="View Complete Invoice & Receipt"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                                <span>View</span>
                              </button>

                              {/* Share Invoice [WhatsApp] Button */}
                              <button
                                onClick={() => setSharingInvoice(inv)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#064E3B] hover:bg-[#065F46] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-[#047857] cursor-pointer"
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

              {/* Discount Option Below Collection Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">
                    Discount (INR ₹)
                  </label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    collectDiscountPercent > 0 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'text-gray-400 bg-gray-100'
                  }`}>
                    {collectDiscountPercent}% Discount
                  </span>
                </div>
                <div className="relative flex items-center">
                  <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={0}
                    value={collectDiscount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#2D041A] focus:ring-2 focus:ring-[#8A064D]"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#8A064D] pointer-events-none">
                    {collectDiscountPercent > 0 ? `(${collectDiscountPercent}% off)` : '0%'}
                  </div>
                </div>
              </div>

              {/* Payment Method Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#2D041A] focus:ring-2 focus:ring-[#8A064D] cursor-pointer"
                >
                  <option value="upi">UPI / QR Code (Default)</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
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
                  placeholder="Enter payment remarks (optional)"
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
            
            {/* Printable Invoice Container */}
            <div id="student-fee-invoice-content" className="bg-white p-2 rounded-2xl">
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
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition print:hidden cursor-pointer"
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
                    <span className="font-mono font-bold text-gray-800">{formatMonthEndDdMmYy(viewingInvoice.due_date || viewingInvoice.fee_period || viewingInvoice.created_at)}</span>
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
            </div>

            {/* Actions: Download PDF, Print & Share WhatsApp */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-gray-100 print:hidden">
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* Download PDF Button */}
                <button
                  type="button"
                  onClick={() => {
                    const ok = downloadStudentFeeInvoicePdf(viewingInvoice);
                    if (ok) {
                      showToast(`Official Invoice PDF downloaded for ${viewingInvoice.student_name}!`);
                    } else {
                      showToast(`Could not generate PDF. Please try Print Receipt.`);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2D041A] hover:bg-[#48082B] text-white shadow-sm border border-[#48082B] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>Download PDF</span>
                </button>

                {/* Print Receipt Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-sm border border-[#70043E] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>Print Receipt</span>
                </button>

                {/* Share WhatsApp Button */}
                <button
                  type="button"
                  onClick={() => {
                    const inv = viewingInvoice;
                    downloadStudentFeeInvoicePdf(inv);
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

            {/* Hidden invoice printable element for direct PDF export */}
            <div id="sharing-invoice-pdf-card" className="sr-only p-6 bg-white border border-[#8A064D] rounded-2xl text-xs space-y-4">
              <div className="text-center pb-3 border-b border-rose-100">
                <h3 className="font-black text-base text-[#2D041A] uppercase">Laasya Cultural Academy</h3>
                <p className="text-[10px] font-bold text-[#8A064D]">Official Student Fee Receipt & Invoice</p>
                <p className="text-[10px] text-gray-500">Invoice: {sharingInvoice.invoice_number} • Date: {formatDdMonthName(sharingInvoice.due_date || sharingInvoice.created_at)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Student:</strong> {sharingInvoice.student_name} ({sharingInvoice.roll_number})</div>
                <div><strong>Guardian:</strong> {sharingInvoice.parent_name || 'Parent'}</div>
                <div><strong>Course:</strong> {sharingInvoice.course_title}</div>
                <div><strong>Batch:</strong> {sharingInvoice.batch_name}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="flex justify-between"><span>Fee Period:</span><strong>{sharingInvoice.fee_period}</strong></div>
                <div className="flex justify-between"><span>Total Invoiced:</span><strong>₹{Number(sharingInvoice.total_amount).toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between text-emerald-700"><span>Paid Amount:</span><strong>₹{Number(sharingInvoice.paid_amount).toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between text-rose-700 font-bold border-t border-gray-200 pt-1"><span>Balance Due:</span><span>₹{Number(sharingInvoice.balance_amount).toLocaleString('en-IN')}</span></div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

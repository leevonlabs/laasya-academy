'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  X, 
  Check,
  CreditCard,
  Building,
  RefreshCw,
  PlayCircle,
  HelpCircle,
  Filter
} from 'lucide-react';
import { 
  INITIAL_AXIS_TRANSACTIONS, 
  AxisTransactionRecord, 
  AXIS_PG_CONFIG, 
  DEMO_PAYMENT_DISCLAIMER,
  DemoOutcome,
  SYNTHETIC_DEMO_FIXTURES
} from '@/lib/axisBankPayment';

export default function AxisReconciliationClient() {
  const [transactions, setAxisTransactions] = useState<AxisTransactionRecord[]>(INITIAL_AXIS_TRANSACTIONS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'axis_upi' | 'axis_netbanking' | 'axis_card'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reconcilingTxn, setReconcilingTxn] = useState<AxisTransactionRecord | null>(null);
  const [reconcileUtrInput, setReconcileUtrInput] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Demo simulator tester modal state
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [simOutcome, setSimOutcome] = useState<DemoOutcome>('SUCCESS');
  const [simStudent, setSimStudent] = useState('Aditi Sundaram');
  const [simRoll, setSimRoll] = useState('LCA-6');
  const [simCourse, setSimCourse] = useState('Bharatanatyam');
  const [simAmount, setSimAmount] = useState('2000');
  const [simMethod, setSimMethod] = useState<'axis_upi' | 'axis_netbanking' | 'axis_card'>('axis_upi');
  const [isSimulating, setIsSimulating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch updated transactions from API on mount
  useEffect(() => {
    fetch('/api/finance/payments/axis/transactions?status=all')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.transactions)) {
          setAxisTransactions(res.transactions);
        }
      })
      .catch(() => {});
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;
      
      if (startDate) {
        const start = new Date(startDate).getTime();
        if (!isNaN(start) && new Date(t.initiatedAt).getTime() < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        if (!isNaN(end) && new Date(t.initiatedAt).getTime() > end) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          t.studentName.toLowerCase().includes(q) ||
          t.rollNumber.toLowerCase().includes(q) ||
          t.axisOrderId.toLowerCase().includes(q) ||
          t.axisUtr.toLowerCase().includes(q) ||
          t.invoiceNumber.toLowerCase().includes(q) ||
          (t.merchantRef && t.merchantRef.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, statusFilter, methodFilter, searchQuery, startDate, endDate]);

  const summary = useMemo(() => {
    const successTxns = transactions.filter(t => t.status === 'demo_success' || t.status === 'settled');
    const pendingTxns = transactions.filter(t => t.status === 'demo_pending' || t.status === 'pending_reconciliation');
    const failedTxns = transactions.filter(t => t.status === 'demo_failed' || t.status === 'failed');
    const cancelledTxns = transactions.filter(t => t.status === 'demo_cancelled' || t.status === 'demo_timeout');

    return {
      totalCount: transactions.length,
      simulatedSuccessTotal: successTxns.reduce((sum, t) => sum + t.amount, 0),
      simulatedSuccessCount: successTxns.length,
      pendingCount: pendingTxns.length,
      pendingTotal: pendingTxns.reduce((sum, t) => sum + t.amount, 0),
      failedCount: failedTxns.length,
      cancelledCount: cancelledTxns.length,
    };
  }, [transactions]);

  const handleExportCsv = () => {
    const disclaimerRow = `"DISCLAIMER: ${DEMO_PAYMENT_DISCLAIMER}. ALL RECORDS ARE SYNTHETIC TEST TRANSACTIONS."`;
    const headers = [
      'Demo Order ID',
      'Simulated Ref',
      'Invoice No',
      'Student Name',
      'Roll No',
      'Course',
      'Fee Period',
      'Amount (INR)',
      'Base Tuition',
      'GST (18%)',
      'Payment Method',
      'Simulated UTR',
      'Demo Status',
      'Initiated At',
      'Settled At',
      'Notes'
    ];
    const rows = filteredTransactions.map(t => [
      t.axisOrderId,
      t.merchantRef,
      t.invoiceNumber,
      `"${t.studentName}"`,
      t.rollNumber,
      `"${t.courseTitle}"`,
      `"${t.feePeriod}"`,
      t.amount,
      t.baseAmount,
      t.gstAmount,
      t.paymentMethod,
      t.axisUtr,
      `"${t.statusLabel || t.status}"`,
      t.initiatedAt,
      t.settledAt || 'N/A',
      `"${t.notes || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [disclaimerRow, headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Axis_Demo_Reconciliation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Demo Reconciliation CSV exported successfully!');
  };

  const handleConfirmReconcile = () => {
    if (!reconcilingTxn) return;
    const utr = reconcileUtrInput.trim() || `DEMO-RECON-UTR-${Date.now().toString().slice(-8)}`;
    setAxisTransactions(prev => prev.map(t => {
      if (t.id === reconcilingTxn.id) {
        return {
          ...t,
          status: 'demo_success',
          statusLabel: '[DEMO] Manually Reconciled',
          axisUtr: utr,
          settledAt: new Date().toISOString(),
          notes: reconcileNotes.trim() || 'Simulated settlement manually confirmed in demo registry'
        };
      }
      return t;
    }));
    showToast(`Order ${reconcilingTxn.axisOrderId} reconciled in demo registry!`);
    setReconcilingTxn(null);
    setReconcileUtrInput('');
    setReconcileNotes('');
  };

  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    try {
      const amt = Number(simAmount) || 2000;
      const res = await fetch('/api/finance/payments/axis/process-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `AXIS-DEMO-ORD-${Date.now().toString().slice(-6)}`,
          invoiceNumber: `LCA-INV-DEMO-${Date.now().toString().slice(-5)}`,
          studentId: 's-demo-tester',
          studentName: simStudent,
          rollNumber: simRoll,
          courseTitle: simCourse,
          feePeriod: 'Demo Test Cycle',
          amount: amt,
          paymentMethod: simMethod,
          outcome: simOutcome,
        })
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setAxisTransactions(prev => [data.transaction, ...prev]);
        showToast(`Simulation complete: ${data.transaction.statusLabel}`);
        setShowSimulatorModal(false);
      } else {
        showToast(`Simulation error: ${data.error || 'Failed'}`);
      }
    } catch {
      showToast('Network error triggering simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusBadge = (status: string, label?: string) => {
    if (status === 'demo_success' || status === 'settled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{label || '[DEMO] Success'}</span>
        </span>
      );
    }
    if (status === 'demo_pending' || status === 'pending_reconciliation') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{label || '[DEMO] Pending Clearance'}</span>
        </span>
      );
    }
    if (status === 'demo_failed' || status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>{label || '[DEMO] Bank Decline'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
        <X className="w-3 h-3 text-gray-500" />
        <span>{label || '[DEMO] Cancelled / Timeout'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D041A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#F9E33A]/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-[#F9E33A]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* MANDATORY PROMINENT DEMO BANNER */}
      <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 sm:p-5 text-amber-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200 text-amber-900 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-amber-900">
              {DEMO_PAYMENT_DISCLAIMER}
            </h3>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Official Axis Bank credentials pending academy onboarding. All entries here are synthetic test transactions. Production fee dues, official receipts, and bank account totals are strictly isolated and unaffected.
            </p>
          </div>
        </div>

        {/* Test Simulator Launcher Button */}
        <button
          type="button"
          onClick={() => setShowSimulatorModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#590231] text-white hover:bg-[#8A064D] text-xs font-bold shadow transition shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <PlayCircle className="w-4 h-4 text-[#F9E33A]" />
          <span>Simulate Test Outcome</span>
        </button>
      </div>

      {/* Axis PG Integration Header */}
      <div className="bg-gradient-to-r from-[#2D041A] via-[#590231] to-[#8A064D] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-[#F0D5E4]/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#F9E33A] text-xs font-black tracking-wider uppercase mb-2 border border-white/10">
              <Shield className="w-3.5 h-3.5 text-[#F9E33A]" />
              Axis Bank PG Sandbox &amp; Demo Ledger
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Axis Bank Demo Reconciliation
            </h2>
            <p className="text-xs sm:text-sm text-pink-100/80 mt-1 max-w-2xl">
              Simulated payment gateway tracking for testing student tuition checkouts, 18% GST tax breakdowns, idempotent references, and safe outcome verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/20 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#F9E33A]" />
              <span>Export Demo CSV</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] font-bold text-pink-200/80 uppercase tracking-wider">Demo Transactions</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{summary.totalCount}</p>
            <p className="text-[10px] text-pink-200/70 mt-0.5">Synthetic Test Entries</p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-400/30">
            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Simulated Approved</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">₹{summary.simulatedSuccessTotal.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-emerald-300/70 mt-0.5">{summary.simulatedSuccessCount} Test Approvals (No Real Funds)</p>
          </div>

          <div className="bg-amber-950/40 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/30">
            <p className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">Simulated Pending</p>
            <p className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">{summary.pendingCount} Orders</p>
            <p className="text-[10px] text-amber-300/70 mt-0.5">₹{summary.pendingTotal.toLocaleString('en-IN')} Under Test Simulation</p>
          </div>

          <div className="bg-rose-950/40 backdrop-blur-md rounded-2xl p-3.5 border border-rose-400/30">
            <p className="text-[11px] font-bold text-rose-200 uppercase tracking-wider">Declines &amp; Timeouts</p>
            <p className="text-xl sm:text-2xl font-black text-rose-300 mt-0.5">{summary.failedCount + summary.cancelledCount} Events</p>
            <p className="text-[10px] text-rose-300/70 mt-0.5">{summary.failedCount} Declined, {summary.cancelledCount} Cancelled</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, roll no, invoice, demo order ID, or simulated UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
            />
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:ring-1 focus:ring-[#8A064D]"
              title="Start Date"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:ring-1 focus:ring-[#8A064D]"
              title="End Date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-[#8A064D] font-bold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status and Method Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" /> Status:
          </span>
          {[
            { id: 'all', label: 'All Test Records' },
            { id: 'demo_success', label: 'Simulated Success' },
            { id: 'demo_pending', label: 'Clearance Pending' },
            { id: 'demo_failed', label: 'Bank Decline' },
            { id: 'demo_cancelled', label: 'Cancelled' },
            { id: 'demo_timeout', label: 'Timeout' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1 rounded-full font-bold transition text-xs ${
                statusFilter === s.id
                  ? 'bg-[#590231] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}

          <div className="hidden sm:block h-4 w-px bg-gray-300 mx-1" />

          <span className="text-gray-500 font-bold ml-1">Method:</span>
          {[
            { id: 'all', label: 'All Methods' },
            { id: 'axis_upi', label: 'UPI' },
            { id: 'axis_netbanking', label: 'NetBanking' },
            { id: 'axis_card', label: 'Cards' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMethodFilter(m.id as any)}
              className={`px-3 py-1 rounded-full font-bold transition text-xs ${
                methodFilter === m.id
                  ? 'bg-[#8A064D] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                <th className="py-3 px-4">Demo Order &amp; Ref</th>
                <th className="py-3 px-4">Student &amp; Course</th>
                <th className="py-3 px-4">Total (INR)</th>
                <th className="py-3 px-4">GST (18%) Breakdown</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Simulated UTR</th>
                <th className="py-3 px-4">Demo Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-bold text-sm text-gray-700">No demo transactions match the filter criteria</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing your filters or click "Simulate Test Outcome" above.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-pink-50/30 transition-colors">
                    {/* Demo Order & Ref */}
                    <td className="py-3 px-4 font-mono">
                      <p className="font-bold text-[#8A064D]">{txn.axisOrderId}</p>
                      <p className="text-[11px] text-gray-400">{txn.merchantRef}</p>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">DEMO MOCK</span>
                    </td>

                    {/* Student & Course */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{txn.studentName}</p>
                      <p className="text-gray-500 text-[11px]">Roll: {txn.rollNumber} • {txn.courseTitle}</p>
                      <p className="text-gray-400 text-[10px]">Period: {txn.feePeriod}</p>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900 text-sm">₹{txn.amount.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-400">Inv: {txn.invoiceNumber}</p>
                    </td>

                    {/* GST Breakdown */}
                    <td className="py-3 px-4 text-[11px]">
                      <p className="text-gray-600">Base: ₹{txn.baseAmount.toFixed(2)}</p>
                      <p className="text-emerald-700 font-medium">GST (18%): ₹{txn.gstAmount.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">CGST 9% + SGST 9%</p>
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {txn.paymentMethod === 'axis_upi' && <span className="font-bold text-[#25D366]">UPI</span>}
                        {txn.paymentMethod === 'axis_netbanking' && <Building className="w-3.5 h-3.5 text-[#590231]" />}
                        {txn.paymentMethod === 'axis_card' && <CreditCard className="w-3.5 h-3.5 text-blue-700]" />}
                        <span className="font-medium text-gray-700 capitalize">{txn.paymentMethod.replace('axis_', '')}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{txn.gatewayBank}</p>
                    </td>

                    {/* Simulated UTR */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <p className="text-gray-800">{txn.axisUtr}</p>
                      <p className="text-[10px] text-gray-400">Auth: {txn.authCode}</p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {getStatusBadge(txn.status, txn.statusLabel)}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(txn.initiatedAt).toLocaleDateString()} {new Date(txn.initiatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {txn.status === 'demo_pending' ? (
                        <button
                          onClick={() => {
                            setReconcilingTxn(txn);
                            setReconcileUtrInput(txn.axisUtr);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          Reconcile
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">Logged</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Reconcile Modal */}
      {reconcilingTxn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-[#2D041A]">Simulated Reconcile Entry</h3>
              <button onClick={() => setReconcilingTxn(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                <p className="font-bold">{DEMO_PAYMENT_DISCLAIMER}</p>
                <p className="text-[11px] mt-0.5">This action confirms simulated clearing in the demo ledger only.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Demo Order ID</label>
                <input
                  type="text"
                  readOnly
                  value={reconcilingTxn.axisOrderId}
                  className="w-full px-3 py-2 bg-gray-100 rounded-xl border border-gray-200 font-mono text-gray-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Simulated Bank Settlement UTR</label>
                <input
                  type="text"
                  value={reconcileUtrInput}
                  onChange={(e) => setReconcileUtrInput(e.target.value)}
                  placeholder="e.g. DEMO-UTR-991827364501"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-mono focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reconciliation Notes</label>
                <textarea
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Simulated bank statement clearance matched in demo test"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReconcilingTxn(null)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReconcile}
                  className="px-4 py-2 rounded-xl bg-[#590231] hover:bg-[#8A064D] text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirm Demo Reconciliation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Modal for Admin / Testers */}
      {showSimulatorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-[#8A064D]" />
                <h3 className="font-bold text-base text-[#2D041A]">Simulate Demo Checkout Outcome</h3>
              </div>
              <button onClick={() => setShowSimulatorModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
                <strong>{DEMO_PAYMENT_DISCLAIMER}</strong>
                <p className="text-[11px] mt-0.5">Use this control to test how the ERP and student ledger react to various gateway states without real money.</p>
              </div>

              {/* Outcome Selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Simulation Outcome:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'SUCCESS', label: 'Success (Approved)', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                    { id: 'FAILURE', label: 'Bank Decline', color: 'border-rose-500 bg-rose-50 text-rose-900' },
                    { id: 'CANCELLED', label: 'User Cancelled', color: 'border-gray-500 bg-gray-50 text-gray-900' },
                    { id: 'TIMEOUT', label: 'Gateway Timeout', color: 'border-purple-500 bg-purple-50 text-purple-900' },
                    { id: 'PENDING', label: 'Clearance Pending', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSimOutcome(opt.id as any)}
                      className={`p-2 rounded-xl border-2 text-xs font-bold text-left transition ${
                        simOutcome === opt.id ? opt.color : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student & Amount Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Student Disciple</label>
                  <input
                    type="text"
                    value={simStudent}
                    onChange={(e) => setSimStudent(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payable Fee (₹)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 font-bold text-xs text-[#8A064D]"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                <div className="flex gap-2">
                  {[
                    { id: 'axis_upi', label: 'Axis UPI' },
                    { id: 'axis_netbanking', label: 'NetBanking' },
                    { id: 'axis_card', label: 'Card' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSimMethod(m.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition ${
                        simMethod === m.id
                          ? 'bg-[#590231] text-white border-[#590231]'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSimulatorModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleTriggerSimulation}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#590231] to-[#8A064D] text-white font-bold shadow-md hover:scale-[1.02] transition cursor-pointer disabled:opacity-50"
                >
                  {isSimulating ? 'Simulating...' : `Simulate ${simOutcome}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

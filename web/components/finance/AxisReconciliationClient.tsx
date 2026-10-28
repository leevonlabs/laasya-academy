'use client';

import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Search, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download, 
  X, 
  Check,
  CreditCard,
  Building,
  RefreshCw
} from 'lucide-react';
import { INITIAL_AXIS_TRANSACTIONS, AxisTransactionRecord, AXIS_PG_CONFIG } from '@/lib/axisBankPayment';

export default function AxisReconciliationClient() {
  const [transactions, setAxisTransactions] = useState<AxisTransactionRecord[]>(INITIAL_AXIS_TRANSACTIONS);
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'pending_reconciliation' | 'dev_mock'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'axis_upi' | 'axis_netbanking' | 'axis_card'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reconcilingTxn, setReconcilingTxn] = useState<AxisTransactionRecord | null>(null);
  const [reconcileUtrInput, setReconcileUtrInput] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.studentName.toLowerCase().includes(q) ||
          t.rollNumber.toLowerCase().includes(q) ||
          t.axisOrderId.toLowerCase().includes(q) ||
          t.axisUtr.toLowerCase().includes(q) ||
          t.invoiceNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, statusFilter, methodFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'Axis Order ID',
      'Merchant Ref',
      'Invoice No',
      'Student Name',
      'Roll No',
      'Course',
      'Fee Period',
      'Total Amount (INR)',
      'Base Tuition',
      'GST (18%)',
      'Payment Method',
      'Gateway Bank',
      'Axis UTR',
      'Status',
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
      `"${t.gatewayBank}"`,
      t.axisUtr,
      t.status,
      t.initiatedAt,
      t.settledAt || 'N/A',
      `"${t.notes || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Axis_Bank_Reconciliation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Axis Bank Reconciliation CSV exported successfully!');
  };

  const handleConfirmReconcile = () => {
    if (!reconcilingTxn) return;
    const utr = reconcileUtrInput.trim() || `AXIS-RECON-${Date.now().toString().slice(-8)}`;
    setAxisTransactions(prev => prev.map(t => {
      if (t.id === reconcilingTxn.id) {
        return {
          ...t,
          status: 'settled',
          axisUtr: utr,
          settledAt: new Date().toISOString(),
          notes: reconcileNotes.trim() || 'Settlement verified against Axis Bank Corporate Account Statement'
        };
      }
      return t;
    }));
    showToast(`Order ${reconcilingTxn.axisOrderId} reconciled with UTR ${utr}!`);
    setReconcilingTxn(null);
    setReconcileUtrInput('');
    setReconcileNotes('');
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

      {/* Axis PG Integration Header */}
      <div className="bg-gradient-to-r from-[#2D041A] via-[#590231] to-[#8A064D] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-[#F0D5E4]/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#F9E33A] text-xs font-black tracking-wider uppercase mb-2 border border-white/10">
              <Shield className="w-3.5 h-3.5 text-[#F9E33A]" />
              Axis EasyPay Merchant PG
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Axis Bank Transactions & Reconciliation
            </h2>
            <p className="text-xs sm:text-sm text-pink-100/80 mt-1 max-w-2xl">
              Centralized payment gateway tracking for student tuition collections. Matches Axis merchant settlement UTRs, verifies 18% GST tax breakdowns, and links directly to official vector PDF receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs">
              <span className="text-pink-200 block text-[10px] font-bold uppercase">Axis Merchant ID</span>
              <span className="font-mono font-black text-[#F9E33A] text-sm">{AXIS_PG_CONFIG.merchantId}</span>
            </div>

            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-2xl bg-[#F9E33A] hover:bg-[#ebd52a] text-[#2D041A] text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer"
              title="Export Axis Bank Corporate Reconciliation CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2D041A]" />
              <span>Export Recon CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dev Mock Notice Alert */}
      <div className="bg-[#FEF3C7] border border-[#F59E0B] p-4 rounded-2xl flex items-start gap-3 text-[#92400E]">
        <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <div className="text-xs">
          <strong className="block font-bold text-sm text-[#78350F]">
            Axis Bank Gateway Test Environment • Safe Mock Mode Active
          </strong>
          <p className="mt-0.5 text-[#92400E]">
            Official Axis Bank EasyPay credentials onboarding is underway. Test transactions simulate the live Axis Bank PG response cycle. Real student fee ledgers and database balances are not modified during test mock runs.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Settled Collections</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-800">
              ₹{transactions.filter(t => t.status === 'settled').reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {transactions.filter(t => t.status === 'settled').length} Settled
            </span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">Cleared to Academy Current A/C</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Pending Settlement</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-700">
              ₹{transactions.filter(t => t.status === 'pending_reconciliation').reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {transactions.filter(t => t.status === 'pending_reconciliation').length} Pending
            </span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">Awaiting T+1 NEFT cycle match</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">GST Tax Collected (18%)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#8A064D]">
              ₹{transactions.reduce((sum, t) => sum + t.gstAmount, 0).toFixed(2)}
            </span>
            <span className="text-xs font-bold text-[#8A064D] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              HSN: 999293
            </span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">Itemized in all vector PDF invoices</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Dev Simulated Mode</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-700">
              ₹{transactions.filter(t => t.status === 'dev_mock').reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {transactions.filter(t => t.status === 'dev_mock').length} Mock
            </span>
          </div>
          <span className="text-[11px] text-gray-400 block mt-1">Isolated from real student records</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, roll number, Axis Order ID, or UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-xs font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 focus:outline-none"
          >
            <option value="all">All Statuses ({transactions.length})</option>
            <option value="settled">Settled ({transactions.filter(t => t.status === 'settled').length})</option>
            <option value="pending_reconciliation">Pending Recon ({transactions.filter(t => t.status === 'pending_reconciliation').length})</option>
            <option value="dev_mock">Dev Mock ({transactions.filter(t => t.status === 'dev_mock').length})</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="axis_upi">Axis UPI</option>
            <option value="axis_netbanking">Axis NetBanking</option>
            <option value="axis_card">RuPay / Visa Card</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5F8] border-b border-gray-200 text-gray-600 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Student & Roll No</th>
                <th className="py-3.5 px-4">Course & Period</th>
                <th className="py-3.5 px-4 text-right">Amount (GST Itemized)</th>
                <th className="py-3.5 px-4">Method & Gateway</th>
                <th className="py-3.5 px-4">Axis UTR / Ref</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Reconciliation & PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No Axis Bank transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-pink-50/20 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#8A064D] block">{txn.axisOrderId}</span>
                      <span className="text-[10px] text-gray-400 block">{txn.initiatedAt.substring(0, 10)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-gray-900 block">{txn.studentName}</strong>
                      <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {txn.rollNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-gray-800 block">{txn.courseTitle}</span>
                      <span className="text-[10px] text-gray-500 block">{txn.feePeriod}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <strong className="text-sm font-black text-gray-900 block">₹{txn.amount.toLocaleString('en-IN')}</strong>
                      <span className="text-[10px] text-gray-400 block">
                        Base: ₹{txn.baseAmount.toFixed(0)} • GST: ₹{txn.gstAmount.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-700 block uppercase text-[11px]">
                        {txn.paymentMethod.replace('axis_', 'Axis ')}
                      </span>
                      <span className="text-[10px] text-gray-400 block">{txn.gatewayBank}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] text-gray-800 block select-all font-semibold">
                        {txn.axisUtr}
                      </span>
                      <span className="text-[10px] text-gray-400 block font-mono">Auth: {txn.authCode}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {txn.status === 'settled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          SETTLED
                        </span>
                      ) : txn.status === 'pending_reconciliation' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          PENDING RECON
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          DEV MOCK
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {txn.status === 'pending_reconciliation' && (
                          <button
                            onClick={() => {
                              setReconcilingTxn(txn);
                              setReconcileUtrInput(txn.axisUtr);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-2xs cursor-pointer"
                            title="Reconcile with Bank Statement"
                          >
                            Reconcile
                          </button>
                        )}

                        <a
                          href={`/api/finance/invoices/pdf?invoiceNumber=${encodeURIComponent(txn.invoiceNumber)}&studentName=${encodeURIComponent(txn.studentName)}&rollNumber=${encodeURIComponent(txn.rollNumber)}&courseTitle=${encodeURIComponent(txn.courseTitle)}&feePeriod=${encodeURIComponent(txn.feePeriod)}&amount=${txn.amount}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#590231] hover:bg-[#73053D] text-white font-bold text-[11px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Download Official Vector PDF Invoice"
                        >
                          <Download className="w-3 h-3 text-[#F9E33A]" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconcile Modal */}
      {reconcilingTxn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  {reconcilingTxn.axisOrderId}
                </span>
                <h3 className="font-black text-lg text-[#2D041A] mt-1">Reconcile Axis Bank Settlement</h3>
              </div>
              <button
                onClick={() => setReconcilingTxn(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Student:</span>
                  <strong>{reconcilingTxn.studentName} ({reconcilingTxn.rollNumber})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gross Amount:</span>
                  <strong className="text-emerald-700 font-bold">₹{reconcilingTxn.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice:</span>
                  <span className="font-mono">{reconcilingTxn.invoiceNumber}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Bank Statement UTR / Settlement Reference</label>
                <input
                  type="text"
                  value={reconcileUtrInput}
                  onChange={(e) => setReconcileUtrInput(e.target.value)}
                  placeholder="e.g. AXIS-NEFT-991827364501"
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl font-mono text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reconciliation Notes</label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="Confirmed on Axis Corporate NetBanking statement for October..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReconcilingTxn(null)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReconcile}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as Settled</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

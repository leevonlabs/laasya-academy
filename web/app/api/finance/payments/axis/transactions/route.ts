import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_AXIS_TRANSACTIONS, AxisTransactionRecord } from '@/lib/axisBankPayment';

export const dynamic = 'force-dynamic';

// In-memory store for active session; seeded with realistic academy records
let activeTransactions: AxisTransactionRecord[] = [...INITIAL_AXIS_TRANSACTIONS];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const query = searchParams.get('q');

    let results = [...activeTransactions];

    if (status && status !== 'all') {
      results = results.filter((t) => t.status === status);
    }

    if (method && method !== 'all') {
      results = results.filter((t) => t.paymentMethod === method);
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase();
      results = results.filter(
        (t) =>
          t.studentName.toLowerCase().includes(q) ||
          t.rollNumber.toLowerCase().includes(q) ||
          t.invoiceNumber.toLowerCase().includes(q) ||
          t.axisOrderId.toLowerCase().includes(q) ||
          t.axisUtr.toLowerCase().includes(q)
      );
    }

    const totalSettled = results
      .filter((t) => t.status === 'settled')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPending = results
      .filter((t) => t.status === 'pending_reconciliation')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalMock = results
      .filter((t) => t.status === 'dev_mock')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalRecords: results.length,
        totalSettled,
        totalPending,
        totalMock,
      },
      transactions: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch Axis PG transactions', details: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, transactionId, utr, notes } = body;

    if (action === 'reconcile' && transactionId) {
      const idx = activeTransactions.findIndex((t) => t.id === transactionId || t.axisOrderId === transactionId);
      if (idx !== -1) {
        activeTransactions[idx] = {
          ...activeTransactions[idx],
          status: 'settled',
          settledAt: new Date().toISOString(),
          axisUtr: utr || activeTransactions[idx].axisUtr,
          notes: notes || 'Manually reconciled against Axis Bank Statement',
        };
        return NextResponse.json({ success: true, transaction: activeTransactions[idx] });
      }
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (action === 'record_mock' && body.payment) {
      const p = body.payment;
      const newTxn: AxisTransactionRecord = {
        id: `axis-mock-${Date.now()}`,
        axisOrderId: `AXIS-ORD-2026-${Date.now().toString().slice(-6)}`,
        merchantRef: `LCA-AXIS-${Date.now().toString().slice(-8)}`,
        invoiceNumber: p.invoice_number || `LCA-INV-${Date.now().toString().slice(-6)}`,
        studentId: p.student_id || 's-guest',
        studentName: p.student_name || 'Student',
        rollNumber: p.roll_number || 'LCA-0',
        courseTitle: p.course_title || 'Bharatanatyam',
        feePeriod: p.fee_period || 'October 2026',
        amount: Number(p.amount_paid || 2000),
        baseAmount: Number(((p.amount_paid || 2000) / 1.18).toFixed(2)),
        gstAmount: Number(((p.amount_paid || 2000) - (p.amount_paid || 2000) / 1.18).toFixed(2)),
        paymentMethod: 'axis_upi',
        gatewayBank: 'Axis PG Simulator',
        axisUtr: `AXIS-SIM-${Date.now().toString().slice(-10)}`,
        authCode: `SIM-${Math.floor(Math.random() * 9000 + 1000)}`,
        status: 'dev_mock',
        initiatedAt: new Date().toISOString(),
        settledAt: new Date().toISOString(),
        isMock: true,
        notes: 'Dev mock test payment recorded. Real student dues are unaffected.',
      };
      activeTransactions.unshift(newTxn);
      return NextResponse.json({ success: true, transaction: newTxn });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process reconciliation', details: err?.message }, { status: 500 });
  }
}

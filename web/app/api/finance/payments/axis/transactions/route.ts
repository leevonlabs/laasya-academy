import { NextRequest, NextResponse } from 'next/server';
import { 
  getActiveDemoTransactions, 
  updateDemoTransaction, 
  defaultPaymentGateway,
  DEMO_PAYMENT_DISCLAIMER,
  DemoOutcome 
} from '@/lib/axisBankPayment';

export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const query = searchParams.get('q');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let results = getActiveDemoTransactions();

    if (status && status !== 'all') {
      results = results.filter((t) => t.status === status);
    }

    if (method && method !== 'all') {
      results = results.filter((t) => t.paymentMethod === method);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      if (!isNaN(start)) {
        results = results.filter((t) => new Date(t.initiatedAt).getTime() >= start);
      }
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      if (!isNaN(end)) {
        results = results.filter((t) => new Date(t.initiatedAt).getTime() <= end);
      }
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (t) =>
          t.studentName.toLowerCase().includes(q) ||
          t.rollNumber.toLowerCase().includes(q) ||
          t.invoiceNumber.toLowerCase().includes(q) ||
          t.axisOrderId.toLowerCase().includes(q) ||
          t.axisUtr.toLowerCase().includes(q) ||
          t.merchantRef.toLowerCase().includes(q)
      );
    }

    const demoSettled = results
      .filter((t) => t.status === 'demo_success' || t.status === 'settled')
      .reduce((sum, t) => sum + t.amount, 0);

    const demoPending = results
      .filter((t) => t.status === 'demo_pending' || t.status === 'pending_reconciliation')
      .reduce((sum, t) => sum + t.amount, 0);

    const demoFailed = results
      .filter((t) => t.status === 'demo_failed' || t.status === 'failed')
      .reduce((sum, t) => sum + t.amount, 0);

    const demoCancelled = results
      .filter((t) => t.status === 'demo_cancelled')
      .reduce((sum, t) => sum + t.amount, 0);

    const demoTimeout = results
      .filter((t) => t.status === 'demo_timeout')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      disclaimer: DEMO_PAYMENT_DISCLAIMER,
      isDemoRegistry: true,
      summary: {
        totalRecords: results.length,
        demoSettled,
        demoPending,
        demoFailed,
        demoCancelled,
        demoTimeout,
      },
      transactions: results,
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch Axis PG demo transactions', 
      details: err?.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, transactionId, utr, notes, outcome = 'SUCCESS', payment } = body;

    if (action === 'reconcile' && transactionId) {
      const user = await getCurrentUser(req);
      if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
        return NextResponse.json({ error: 'Unauthorized. Staff role required to reconcile transactions.' }, { status: 403 });
      }
      const updated = updateDemoTransaction(transactionId, {
        status: 'demo_success',
        settledAt: new Date().toISOString(),
        axisUtr: utr || `DEMO-UTR-MANUAL-${Date.now().toString().slice(-8)}`,
        notes: notes || 'Manually marked reconciled in Demo Test Registry',
      });

      if (updated) {
        return NextResponse.json({ success: true, transaction: updated });
      }
      return NextResponse.json({ error: 'Transaction not found in demo store' }, { status: 404 });
    }

    if ((action === 'simulate_payment' || action === 'record_mock') && payment) {
      const validOutcomes: DemoOutcome[] = ['SUCCESS', 'FAILURE', 'CANCELLED', 'TIMEOUT', 'PENDING'];
      const chosenOutcome = validOutcomes.includes(outcome) ? outcome : 'SUCCESS';

      const txn = await defaultPaymentGateway.processDemoPayment({
        orderId: payment.order_id || `AXIS-DEMO-ORD-${Date.now()}`,
        invoiceNumber: payment.invoice_number || `LCA-INV-DEMO`,
        studentId: payment.student_id || 's-guest',
        studentName: payment.student_name || 'Student',
        rollNumber: payment.roll_number || 'LCA-0',
        courseTitle: payment.course_title || 'Bharatanatyam',
        feePeriod: payment.fee_period || 'October 2026',
        amount: Number(payment.amount_paid || 2000),
        paymentMethod: payment.payment_method || 'axis_upi',
        outcome: chosenOutcome,
      });

      return NextResponse.json({ 
        success: true, 
        disclaimer: DEMO_PAYMENT_DISCLAIMER,
        transaction: txn 
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Failed to process reconciliation or demo record', 
      details: err?.message 
    }, { status: 500 });
  }
}

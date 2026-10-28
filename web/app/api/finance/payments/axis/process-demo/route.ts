import { NextRequest, NextResponse } from 'next/server';
import { 
  defaultPaymentGateway, 
  DemoOutcome, 
  DEMO_PAYMENT_DISCLAIMER 
} from '@/lib/axisBankPayment';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      invoiceNumber,
      studentId,
      studentName,
      rollNumber,
      courseTitle,
      feePeriod,
      amount,
      paymentMethod = 'axis_upi',
      outcome = 'SUCCESS',
      payerVpa,
      cardLast4,
      bankName,
    } = body;

    const validOutcomes: DemoOutcome[] = ['SUCCESS', 'FAILURE', 'CANCELLED', 'TIMEOUT', 'PENDING'];
    const selectedOutcome: DemoOutcome = validOutcomes.includes(outcome) ? outcome : 'SUCCESS';

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ 
        error: 'Valid payment amount is required for demo simulation' 
      }, { status: 400 });
    }

    // Process demo transaction using clean provider abstraction
    const transaction = await defaultPaymentGateway.processDemoPayment({
      orderId: orderId || `AXIS-DEMO-ORD-${Date.now()}`,
      invoiceNumber: invoiceNumber || `LCA-INV-DEMO`,
      studentId: studentId || 's-guest',
      studentName: studentName || 'Student',
      rollNumber: rollNumber || 'LCA-0',
      courseTitle: courseTitle || 'Classical Arts',
      feePeriod: feePeriod || 'Current Month',
      amount: parsedAmount,
      paymentMethod,
      outcome: selectedOutcome,
      payerVpa,
      cardLast4,
      bankName,
    });

    /**
     * STRICT SERVER-SIDE ISOLATION GUARANTEE:
     * Demo transactions are strictly isolated in memory / demo ledger.
     * Real production database tables (`student_fee_invoices`, `payments`) are NOT touched.
     * Real student fee balances remain intact.
     */

    return NextResponse.json({
      success: true,
      isDemo: true,
      disclaimer: DEMO_PAYMENT_DISCLAIMER,
      transaction,
      message: selectedOutcome === 'SUCCESS' 
        ? 'Demo checkout approved. Production invoice dues remain strictly untouched.'
        : `Demo payment simulated with status: ${transaction.statusLabel}. No real money was charged.`,
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Failed to process demo payment simulation', 
      details: err?.message 
    }, { status: 500 });
  }
}

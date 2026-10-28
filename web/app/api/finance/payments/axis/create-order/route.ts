import { NextRequest, NextResponse } from 'next/server';
import { defaultPaymentGateway, AxisPaymentOrder, DEMO_PAYMENT_DISCLAIMER } from '@/lib/axisBankPayment';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId,
      studentName,
      rollNumber,
      courseTitle,
      feePeriod,
      invoiceNumber,
      amount,
      discountAmount = 0,
      paymentMethod = 'axis_upi',
      bankName,
      idempotencyKey,
    } = body;

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ 
        error: 'Valid payment amount is required and must be greater than 0' 
      }, { status: 400 });
    }

    const parsedDiscount = Number(discountAmount) || 0;
    const totalAmount = Math.max(0, Number((parsedAmount - parsedDiscount).toFixed(2)));
    const baseAmount = Number((totalAmount / 1.18).toFixed(2));
    const gstAmount = Number((totalAmount - baseAmount).toFixed(2));
    
    // Idempotency: generate deterministic or unique demo order ID
    const safeInv = (invoiceNumber || 'INV-DEMO').replace(/[^a-zA-Z0-9-]/g, '');
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderId = `AXIS-DEMO-ORD-${dateStamp}-${safeInv.slice(-5)}`;

    const order: AxisPaymentOrder = {
      orderId,
      idempotencyKey: idempotencyKey || `${safeInv}_${totalAmount}`,
      studentId: studentId || 's-guest',
      studentName: studentName || 'Student Disciple',
      rollNumber: rollNumber || 'LCA-0',
      courseTitle: courseTitle || 'Classical Dance',
      feePeriod: feePeriod || 'Current Month',
      invoiceNumber: invoiceNumber || `LCA-INV-${Date.now().toString().slice(-6)}`,
      baseAmount,
      gstAmount,
      discountAmount: parsedDiscount,
      totalAmount,
      paymentMethod,
      bankName,
    };

    const orderResult = await defaultPaymentGateway.createOrder(order);

    return NextResponse.json({
      ...orderResult,
      message: `${DEMO_PAYMENT_DISCLAIMER}. Official Axis Bank PG credentials pending. Simulated checkout ready.`,
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Failed to initialize Axis PG demo order', 
      details: err?.message 
    }, { status: 500 });
  }
}

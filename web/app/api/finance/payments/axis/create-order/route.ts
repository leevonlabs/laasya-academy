import { NextRequest, NextResponse } from 'next/server';
import { createAxisPaymentPayload, AXIS_PG_CONFIG, AxisPaymentOrder } from '@/lib/axisBankPayment';

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
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    const totalAmount = Math.max(0, Number(amount) - Number(discountAmount));
    const baseAmount = Number((totalAmount / 1.18).toFixed(2));
    const gstAmount = Number((totalAmount - baseAmount).toFixed(2));
    const orderId = `AXIS-ORD-2026-${Date.now().toString().slice(-6)}`;

    const order: AxisPaymentOrder = {
      orderId,
      studentId: studentId || 's-guest',
      studentName: studentName || 'Student',
      rollNumber: rollNumber || 'LCA-0',
      courseTitle: courseTitle || 'Classical Dance',
      feePeriod: feePeriod || 'October 2026',
      invoiceNumber: invoiceNumber || `LCA-INV-${Date.now().toString().slice(-6)}`,
      baseAmount,
      gstAmount,
      discountAmount: Number(discountAmount),
      totalAmount,
      paymentMethod,
      bankName,
    };

    const payload = createAxisPaymentPayload(order);

    return NextResponse.json({
      success: true,
      orderId,
      merchantId: AXIS_PG_CONFIG.merchantId,
      currency: AXIS_PG_CONFIG.currency,
      totalAmount,
      baseAmount,
      gstAmount,
      discountAmount: Number(discountAmount),
      isLive: AXIS_PG_CONFIG.isLive,
      payload,
      message: AXIS_PG_CONFIG.isLive
        ? 'Axis Bank PG Session Initialized'
        : '[DEV MOCK MODE] Official Axis Bank PG credentials pending. Simulated checkout ready.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to initialize Axis PG order', details: err?.message }, { status: 500 });
  }
}

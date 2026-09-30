import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { recordStudentFeePayment } from '@/lib/finance';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const result = await recordStudentFeePayment({
      invoice_id: id,
      amount_paid: Number(body.amount_paid),
      payment_method: body.payment_method || 'upi',
      transaction_reference: body.transaction_reference,
      remarks: body.remarks,
      receipt_issued_by: user.fullName || 'Academy Director'
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Fee payment error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

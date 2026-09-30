import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  getStudentFeeInvoices, 
  createStudentFeeInvoice, 
  updateStudentFeeInvoice,
  collectStudentFee 
} from '@/lib/finance';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
  }

  try {
    const invoices = await getStudentFeeInvoices();
    return NextResponse.json(invoices);
  } catch (err: any) {
    console.error('Fees GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Check if this is a direct fee collection from Collections tab
    if (body.action === 'collect' || (body.student_id && body.amount_paid && !body.total_amount)) {
      const result = await collectStudentFee({
        student_id: body.student_id,
        amount_paid: Number(body.amount_paid),
        payment_method: body.payment_method || 'upi',
        transaction_reference: body.transaction_reference,
        fee_period: body.fee_period,
        remarks: body.remarks,
        receipt_issued_by: user.fullName || 'Academy Director'
      });
      return NextResponse.json(result);
    }

    const invoice = await createStudentFeeInvoice(body);
    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error('Fees POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
    const updated = await updateStudentFeeInvoice(body.id, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Fees PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

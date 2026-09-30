import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStudentFeeInvoices, createStudentFeeInvoice } from '@/lib/finance';

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
    const invoice = await createStudentFeeInvoice(body);
    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error('Fees POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

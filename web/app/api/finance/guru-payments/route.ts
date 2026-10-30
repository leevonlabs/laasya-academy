import { NextRequest, NextResponse } from 'next/server';
import { getGuruPayments, createGuruPayment, GuruPaymentType } from '@/lib/finance';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const trainerId = searchParams.get('trainerId') || undefined;
    const type = searchParams.get('type') || undefined;

    const payments = await getGuruPayments({ startDate, endDate, trainerId, type });
    return NextResponse.json(payments);
  } catch (err: any) {
    console.error('Guru payments GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch guru payments', details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { trainer_id, payment_type, amount, payment_date, payment_method, transaction_reference, notes } = body;

    if (!trainer_id || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid Trainer and positive payment amount are required.' },
        { status: 400 }
      );
    }

    const validTypes: GuruPaymentType[] = [
      'salary_advance',
      'bonus',
      'festival_bonus',
      'monthly_salary',
      'incentive',
      'reimbursement',
      'honorarium',
      'other',
    ];
    const chosenType: GuruPaymentType = validTypes.includes(payment_type) ? payment_type : 'other';

    const newPayment = await createGuruPayment({
      trainer_id,
      payment_type: chosenType,
      amount: Number(amount),
      payment_date,
      payment_method,
      transaction_reference,
      notes,
    });

    return NextResponse.json({ success: true, payment: newPayment }, { status: 201 });
  } catch (err: any) {
    console.error('Guru payments POST error:', err);
    return NextResponse.json(
      { error: 'Failed to record guru payment', details: err?.message },
      { status: 500 }
    );
  }
}

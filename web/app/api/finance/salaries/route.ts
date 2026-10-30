import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGuruSalaryRecords, updateGuruSalaryRecord } from '@/lib/finance';
import { query } from '@/lib/db';
import { sendFcmToRole } from '@/lib/fcm';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    return NextResponse.json({ error: 'Unauthorized: Staff access only' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const month = searchParams.get('month') || currentMonth;
    const records = await getGuruSalaryRecords(month);
    return NextResponse.json(records);
  } catch (err: any) {
    console.error('Salaries GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    return NextResponse.json({ error: 'Unauthorized: Staff access only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'Salary record ID is required' }, { status: 400 });
    }
    const updated = await updateGuruSalaryRecord(id, data);

    if (updated) {
      const invNo = updated.invoice_number || 'LCA-SAL-2026';
      const net = Number(updated.net_salary || 0).toLocaleString('en-IN');
      const isDisbursal = data.status === 'paid';
      const title = isDisbursal
        ? `Salary Disbursed: ₹${net} (${updated.payroll_month})`
        : `Salary Update: ₹${net} (${updated.payroll_month})`;
      const message = isDisbursal
        ? `Namaste ${updated.guru_name || 'Guru'} ji, your salary honorarium for ${updated.payroll_month} has been disbursed under Invoice ${invNo}.`
        : `Namaste ${updated.guru_name || 'Guru'} ji, your payroll honorarium details for ${updated.payroll_month} have been updated by admin.`;

      query(`
        INSERT INTO public.announcements (
          title, message, announcement_type, priority, target_audience, is_active, publish_date
        ) VALUES ($1, $2, 'notification', 'high', 'trainers', true, CURRENT_DATE);
      `, [title, message]).catch(() => {});

      sendFcmToRole('trainer', {
        title,
        body: message,
        data: { type: 'salary', invoice: invNo, id: updated.id }
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Salaries PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

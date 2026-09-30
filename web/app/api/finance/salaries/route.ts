import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGuruSalaryRecords, updateGuruSalaryRecord } from '@/lib/finance';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || 'March 2026';
    const records = await getGuruSalaryRecords(month);
    return NextResponse.json(records);
  } catch (err: any) {
    console.error('Salaries GET error:', err);
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
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'Salary record ID is required' }, { status: 400 });
    }
    const updated = await updateGuruSalaryRecord(id, data);
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Salaries PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

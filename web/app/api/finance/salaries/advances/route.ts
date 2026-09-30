import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGuruSalaryAdvances, createGuruSalaryAdvance } from '@/lib/finance';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized: Owner access only' }, { status: 403 });
  }

  try {
    const advances = await getGuruSalaryAdvances();
    return NextResponse.json(advances);
  } catch (err: any) {
    console.error('Advances GET error:', err);
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
    const advance = await createGuruSalaryAdvance(body);
    return NextResponse.json(advance);
  } catch (err: any) {
    console.error('Advances POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

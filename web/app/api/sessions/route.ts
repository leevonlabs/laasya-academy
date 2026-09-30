import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSessions, updateSessionStatus } from '@/lib/academy';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const sessions = await getSessions(date, startDate, endDate);
  return NextResponse.json(sessions);
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { sessionId, status, checkInCode } = await req.json();
    const updated = await updateSessionStatus(sessionId, status, checkInCode);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

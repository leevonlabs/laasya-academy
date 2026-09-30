import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendFeeReminderNotification } from '@/lib/finance';

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
    const channel = body.channel || 'whatsapp';
    const result = await sendFeeReminderNotification(id, channel);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Fee reminder error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

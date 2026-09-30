import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTrainers, createTrainer } from '@/lib/academy';

export async function GET() {
  const trainers = await getTrainers();
  return NextResponse.json(trainers);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const trainer = await createTrainer(body);
    return NextResponse.json(trainer);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

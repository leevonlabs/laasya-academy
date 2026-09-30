import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBatches, createBatch } from '@/lib/academy';

export async function GET() {
  const batches = await getBatches();
  return NextResponse.json(batches);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const batch = await createBatch(body);
    return NextResponse.json(batch);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { enrollStudentInBatch } from '@/lib/academy';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { studentId, batchId } = await req.json();
    if (!studentId || !batchId) {
      return NextResponse.json({ error: 'Student and Batch are required' }, { status: 400 });
    }

    const enrollment = await enrollStudentInBatch(studentId, batchId);
    return NextResponse.json({ success: true, enrollment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

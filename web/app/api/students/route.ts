import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStudents, createStudent } from '@/lib/academy';

export async function GET() {
  const students = await getStudents();
  return NextResponse.json(students);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const student = await createStudent(body);
    return NextResponse.json(student);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

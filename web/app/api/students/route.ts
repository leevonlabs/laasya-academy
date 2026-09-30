import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStudents, createStudent, updateStudent, deleteStudent } from '@/lib/academy';

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

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }
    const student = await updateStudent(id, data);
    return NextResponse.json(student);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }
    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }
    const deleted = await deleteStudent(id);
    return NextResponse.json(deleted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

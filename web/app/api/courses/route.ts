import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCourses, createCourse, updateCourse } from '@/lib/academy';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const courses = await getCourses(category);
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const course = await createCourse(body);
    return NextResponse.json(course);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, ...data } = await req.json();
    const updated = await updateCourse(id, data);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

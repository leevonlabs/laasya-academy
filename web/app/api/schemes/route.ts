import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSchemes, createScheme, updateScheme, deleteScheme } from '@/lib/academy';

export async function GET() {
  const schemes = await getSchemes();
  return NextResponse.json(schemes);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const scheme = await createScheme(body);
    return NextResponse.json(scheme);
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
      return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
    }
    const scheme = await updateScheme(id, data);
    return NextResponse.json(scheme);
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
      return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
    }
    const deleted = await deleteScheme(id);
    return NextResponse.json(deleted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

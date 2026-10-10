import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCourseCategories, createCourseCategory, deleteCourseCategory, renameCourseCategory } from '@/lib/academy';

export async function GET() {
  try {
    const categories = await getCourseCategories();
    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const created = await createCourseCategory(name);
    const updatedCategories = await getCourseCategories();
    return NextResponse.json({ category: created, categories: updatedCategories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const oldName = body.oldName?.trim();
    const newName = body.newName?.trim();
    if (!oldName || !newName) {
      return NextResponse.json({ error: 'Both oldName and newName are required' }, { status: 400 });
    }

    const updated = await renameCourseCategory(oldName, newName);
    const updatedCategories = await getCourseCategories();
    return NextResponse.json({ category: updated, categories: updatedCategories, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to rename category' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized. Owner access required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let name = searchParams.get('name');
    if (!name) {
      const body = await req.json().catch(() => ({}));
      name = body.name;
    }

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    await deleteCourseCategory(name);
    const updatedCategories = await getCourseCategories();
    return NextResponse.json({ deleted: name, categories: updatedCategories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete category' }, { status: 500 });
  }
}

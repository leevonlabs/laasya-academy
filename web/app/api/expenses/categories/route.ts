import { NextRequest, NextResponse } from 'next/server';
import { getExpenseCategories, addExpenseCategory } from '@/lib/expenses';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const categories = await getExpenseCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await addExpenseCategory(name.trim());
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add category' }, { status: 400 });
  }
}

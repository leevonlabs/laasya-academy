import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, getExpenseSummary, createExpense } from '@/lib/expenses';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const category = searchParams.get('category') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const search = searchParams.get('search') || undefined;

    const filters = { startDate, endDate, category, paymentMethod, search };
    const expenses = await getExpenses(filters);
    const summary = await getExpenseSummary(filters);

    return NextResponse.json({
      success: true,
      expenses,
      summary
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validation rules: amount > 0, date required
    if (!body.expense_date) {
      return NextResponse.json({ error: 'Date is required', field: 'expense_date' }, { status: 400 });
    }
    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0', field: 'amount' }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: 'Category is required', field: 'category' }, { status: 400 });
    }
    if (!body.description) {
      return NextResponse.json({ error: 'Description is required', field: 'description' }, { status: 400 });
    }

    const expense = await createExpense({
      ...body,
      created_by: user.fullName || 'Academy Director'
    });

    return NextResponse.json({
      success: true,
      message: 'Expense recorded successfully',
      expense
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 400 });
  }
}

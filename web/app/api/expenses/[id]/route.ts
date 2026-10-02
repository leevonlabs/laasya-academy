import { NextRequest, NextResponse } from 'next/server';
import { updateExpense, deleteExpense } from '@/lib/expenses';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.expense_date) {
      return NextResponse.json({ error: 'Date is required', field: 'expense_date' }, { status: 400 });
    }
    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0', field: 'amount' }, { status: 400 });
    }

    const updated = await updateExpense(id, body, user.fullName || 'Academy Director');

    return NextResponse.json({
      success: true,
      message: 'Expense updated successfully',
      expense: updated
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: error.message || 'Failed to update expense' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const removed = await deleteExpense(id, user.fullName || 'Academy Director');

    return NextResponse.json({
      success: true,
      message: 'Expense removed successfully and archived in audit logs',
      expense: removed
    });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove expense' }, { status: 400 });
  }
}

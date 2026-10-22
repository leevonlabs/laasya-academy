import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getExpenses, getExpenseSummary, getExpenseCategories } from '@/lib/expenses';
import ExpensesClient from '@/components/expenses/ExpensesClient';

export const revalidate = 15;

export default async function ExpensesPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    redirect('/login');
  }

  const canDelete = user.role === 'owner' || Boolean(user.canDelete);

  const [expenses, summary, categories] = await Promise.all([
    getExpenses({ includeDeleted: false }),
    getExpenseSummary({ includeDeleted: false }),
    getExpenseCategories()
  ]);

  return (
    <div className="w-full">
      <ExpensesClient 
        initialExpenses={expenses}
        initialSummary={summary}
        categories={categories}
        canDelete={canDelete}
      />
    </div>
  );
}

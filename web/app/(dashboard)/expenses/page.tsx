import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getExpenses, getExpenseSummary, getExpenseCategories } from '@/lib/expenses';
import ExpensesClient from '@/components/expenses/ExpensesClient';

export const revalidate = 0; // Dynamic real-time data

export default async function ExpensesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  const [expenses, summary, categories] = await Promise.all([
    getExpenses({ includeDeleted: false }),
    getExpenseSummary({ includeDeleted: false }),
    getExpenseCategories()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ExpensesClient 
        initialExpenses={expenses}
        initialSummary={summary}
        categories={categories}
      />
    </div>
  );
}

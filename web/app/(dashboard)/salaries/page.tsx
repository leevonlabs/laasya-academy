import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getGuruSalaryRecords, getGuruPayments, getFinancialSummary } from '@/lib/finance';
import { getTrainers } from '@/lib/academy';
import GuruSalariesClient from '@/components/finance/GuruSalariesClient';

export const revalidate = 15;

export default async function SalariesPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    redirect('/login');
  }

  const now = new Date();
  const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const [records, payments, summary, trainers] = await Promise.all([
    getGuruSalaryRecords(currentMonth).catch((err) => {
      console.error('getGuruSalaryRecords error:', err);
      return [];
    }),
    getGuruPayments().catch((err) => {
      console.error('getGuruPayments error:', err);
      return [];
    }),
    getFinancialSummary().catch((err) => {
      console.error('getFinancialSummary error:', err);
      return null;
    }),
    getTrainers().catch((err) => {
      console.error('getTrainers error:', err);
      return [];
    })
  ]);

  return (
    <div className="w-full">
      <GuruSalariesClient 
        initialRecords={records}
        initialPayments={payments}
        defaultMonth={currentMonth}
        initialSummary={summary}
        trainers={trainers}
      />
    </div>
  );
}

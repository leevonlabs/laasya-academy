import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getGuruSalaryRecords, getGuruSalaryAdvances, getFinancialSummary } from '@/lib/finance';
import { getTrainers } from '@/lib/academy';
import GuruSalariesClient from '@/components/finance/GuruSalariesClient';

export const revalidate = 15;

export default async function SalariesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  const [records, advances, summary, trainers] = await Promise.all([
    getGuruSalaryRecords('March 2026'),
    getGuruSalaryAdvances(),
    getFinancialSummary(),
    getTrainers()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <GuruSalariesClient 
        initialRecords={records}
        initialAdvances={advances}
        initialSummary={summary}
        trainers={trainers}
      />
    </div>
  );
}

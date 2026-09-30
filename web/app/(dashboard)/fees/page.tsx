import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStudentFeeInvoices, getFinancialSummary } from '@/lib/finance';
import { getCourses, getBatches, getStudents } from '@/lib/academy';
import StudentFeesClient from '@/components/finance/StudentFeesClient';

export const revalidate = 0; // Dynamic real-time data

export default async function FeesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  const [invoices, summary, courses, batches, students] = await Promise.all([
    getStudentFeeInvoices(),
    getFinancialSummary(),
    getCourses(),
    getBatches(),
    getStudents()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <StudentFeesClient 
        initialInvoices={invoices}
        initialSummary={summary}
        courses={courses}
        batches={batches}
        students={students}
      />
    </div>
  );
}

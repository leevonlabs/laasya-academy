import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCourses, getBatches, getStudents, getTrainers } from '@/lib/academy';
import ReportsClient from '@/components/reports/ReportsClient';

export const revalidate = 15;

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  const [courses, batches, students, trainers] = await Promise.all([
    getCourses(),
    getBatches(),
    getStudents(),
    getTrainers()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ReportsClient 
        courses={courses}
        batches={batches}
        students={students}
        trainers={trainers}
      />
    </div>
  );
}

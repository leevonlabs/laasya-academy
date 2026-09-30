import React from 'react';
import { getStudents, getBatches } from '@/lib/academy';
import StudentsListClient from '@/components/students/StudentsListClient';

export const revalidate = 0;

export default async function StudentsPage() {
  const students = await getStudents();
  const batches = await getBatches();

  return (
    <div className="max-w-7xl mx-auto">
      <StudentsListClient initialStudents={students} batches={batches} />
    </div>
  );
}

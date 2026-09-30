import React from 'react';
import { getStudents, getBatches, getCourses } from '@/lib/academy';
import StudentsListClient from '@/components/students/StudentsListClient';

export const revalidate = 0;

export default async function StudentsPage() {
  const [students, batches, courses] = await Promise.all([
    getStudents(),
    getBatches(),
    getCourses()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <StudentsListClient 
        initialStudents={students} 
        batches={batches}
        courses={courses}
      />
    </div>
  );
}

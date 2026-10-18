import React from 'react';
import { getStudents, getBatches, getCourses, getSchemes } from '@/lib/academy';
import StudentsListClient from '@/components/students/StudentsListClient';

export const revalidate = 15;

export default async function StudentsPage() {
  const [students, batches, courses, schemes] = await Promise.all([
    getStudents(),
    getBatches(),
    getCourses(),
    getSchemes()
  ]);

  return (
    <div className="w-full">
      <StudentsListClient 
        initialStudents={students} 
        batches={batches}
        courses={courses}
        schemes={schemes}
      />
    </div>
  );
}

import React from 'react';
import { getStudents, getBatches, getCourses } from '@/lib/academy';
import { getCurrentUser } from '@/lib/auth';
import StudentsListClient from '@/components/students/StudentsListClient';

export const revalidate = 15;

export default async function StudentsPage() {
  const [user, students, batches, courses] = await Promise.all([
    getCurrentUser(),
    getStudents(),
    getBatches(),
    getCourses()
  ]);

  const canDelete = user?.role === 'owner' || Boolean(user?.canDelete);

  return (
    <div className="w-full">
      <StudentsListClient 
        initialStudents={students} 
        batches={batches}
        courses={courses}
        canDelete={canDelete}
      />
    </div>
  );
}

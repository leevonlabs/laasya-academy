import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCourses, getCourseCategories } from '@/lib/academy';
import CourseListClient from '@/components/courses/CourseListClient';

export const revalidate = 15;

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    redirect('/login');
  }

  const canDelete = user.role === 'owner' || Boolean(user.canDelete);

  const [courses, categories] = await Promise.all([
    getCourses(),
    getCourseCategories()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <CourseListClient 
        initialCourses={courses} 
        initialCategories={categories} 
        canDelete={canDelete}
      />
    </div>
  );
}

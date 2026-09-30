import React from 'react';
import { getCourses, getCourseCategories } from '@/lib/academy';
import CourseListClient from '@/components/courses/CourseListClient';

export const revalidate = 0;

export default async function CoursesPage() {
  const [courses, categories] = await Promise.all([
    getCourses(),
    getCourseCategories()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <CourseListClient initialCourses={courses} initialCategories={categories} />
    </div>
  );
}

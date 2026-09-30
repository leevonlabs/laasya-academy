import React from 'react';
import { getCourses } from '@/lib/academy';
import CourseListClient from '@/components/courses/CourseListClient';

export const revalidate = 0;

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="max-w-7xl mx-auto">
      <CourseListClient initialCourses={courses} />
    </div>
  );
}

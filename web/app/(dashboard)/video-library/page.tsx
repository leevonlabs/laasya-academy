import React from 'react';
import VideoLibraryClient from '@/components/video-library/VideoLibraryClient';
import { getCoursesWithDetails, getVideoLibraryItems } from '@/lib/videoLibrary';

export const dynamic = 'force-dynamic';

export default async function VideoLibraryPage() {
  const [courses, items] = await Promise.all([
    getCoursesWithDetails(),
    getVideoLibraryItems(),
  ]);

  return <VideoLibraryClient initialCourses={courses} initialItems={items} />;
}

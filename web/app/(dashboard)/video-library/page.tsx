import React from 'react';
import VideoLibraryClient from '@/components/video-library/VideoLibraryClient';
import { getCoursesWithDetails, getVideoLibraryItems, getGuruComplianceData } from '@/lib/videoLibrary';

export const revalidate = 10;

export default async function VideoLibraryPage() {
  const [courses, items, initialCompliance] = await Promise.all([
    getCoursesWithDetails(),
    getVideoLibraryItems(),
    getGuruComplianceData(),
  ]);

  return (
    <VideoLibraryClient
      initialCourses={courses}
      initialItems={items}
      initialCompliance={initialCompliance}
    />
  );
}


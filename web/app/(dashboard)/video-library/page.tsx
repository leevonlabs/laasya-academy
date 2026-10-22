import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import VideoLibraryClient from '@/components/video-library/VideoLibraryClient';
import { getCoursesWithDetails, getVideoLibraryItems, getGuruComplianceData } from '@/lib/videoLibrary';

export const revalidate = 10;

export default async function VideoLibraryPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    redirect('/login');
  }

  const canDelete = user.role === 'owner' || Boolean(user.canDelete);

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
      canDelete={canDelete}
    />
  );
}


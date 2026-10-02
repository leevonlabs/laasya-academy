import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAnnouncements } from '@/lib/announcements';
import { getCourses, getBatches } from '@/lib/academy';
import AnnouncementsClient from '@/components/announcements/AnnouncementsClient';

export const revalidate = 0; // Dynamic real-time data

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  const [announcements, courses, batches] = await Promise.all([
    getAnnouncements(),
    getCourses(),
    getBatches()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <AnnouncementsClient 
        initialAnnouncements={announcements}
        courses={courses}
        batches={batches}
      />
    </div>
  );
}

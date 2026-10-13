import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAnnouncements } from '@/lib/announcements';
import { getCourses, getBatches } from '@/lib/academy';
import AdvertisementsClient from '@/components/advertisements/AdvertisementsClient';

export const revalidate = 15;

export default async function AdvertisementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  const [announcements, courses, batches] = await Promise.all([
    getAnnouncements({ announcementType: 'banner' }),
    getCourses(),
    getBatches()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <AdvertisementsClient 
        initialAnnouncements={announcements}
        courses={courses}
        batches={batches}
      />
    </div>
  );
}

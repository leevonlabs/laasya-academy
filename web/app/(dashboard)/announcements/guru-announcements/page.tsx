import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAnnouncements } from '@/lib/announcements';
import { getCourses, getBatches, getTrainers, getStudentRecipients } from '@/lib/academy';
import AnnouncementsClient from '@/components/announcements/AnnouncementsClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function GuruAnnouncementsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    redirect('/login');
  }

  const canDelete = user.role === 'owner' || Boolean(user.canDelete);

  const [announcements, courses, batches, trainers, students] = await Promise.all([
    getAnnouncements({ announcementType: 'message' }),
    getCourses(),
    getBatches(),
    getTrainers(),
    getStudentRecipients()
  ]);

  return (
    <div className="w-full flex-1 flex flex-col">
      <AnnouncementsClient 
        initialAnnouncements={announcements}
        courses={courses}
        batches={batches}
        trainers={trainers}
        students={students}
        defaultTab="guru_sent"
        defaultViewMode="chat"
        canDelete={canDelete}
        userRole={user.role}
      />
    </div>
  );
}

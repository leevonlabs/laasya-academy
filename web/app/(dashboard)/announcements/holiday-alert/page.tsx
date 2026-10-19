import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getHolidayAlerts } from '@/lib/holidayTally';
import { getCourses, getBatches, getTrainers, getStudents } from '@/lib/academy';
import HolidayAlertClient from '@/components/announcements/HolidayAlertClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function HolidayAlertPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  const [alerts, courses, batches, trainers, students] = await Promise.all([
    getHolidayAlerts(),
    getCourses(),
    getBatches(),
    getTrainers(),
    getStudents()
  ]);

  return (
    <div className="w-full flex-1 flex flex-col">
      <HolidayAlertClient
        initialAlerts={alerts}
        courses={courses}
        batches={batches}
        trainers={trainers}
        students={students}
      />
    </div>
  );
}

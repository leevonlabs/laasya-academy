import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTallyClasses, getHolidayAlerts, getGuruAbsences } from '@/lib/holidayTally';
import { getCourses, getBatches, getTrainers, getStudents, getRooms, getGuruAttendanceAuditRecords } from '@/lib/academy';
import TallyClassesClient from '@/components/announcements/TallyClassesClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function TallyClassesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  const [tallyClasses, holidayAlerts, guruAbsences, courses, batches, trainers, students, rooms, missedGuruSessions] = await Promise.all([
    getTallyClasses(),
    getHolidayAlerts(),
    getGuruAbsences(),
    getCourses(),
    getBatches(),
    getTrainers(),
    getStudents(),
    getRooms(),
    getGuruAttendanceAuditRecords({ status: 'absent' })
  ]);

  return (
    <div className="w-full flex-1 flex flex-col">
      <TallyClassesClient
        initialTallyClasses={tallyClasses}
        holidayAlerts={holidayAlerts}
        initialGuruAbsences={guruAbsences}
        guruMissedSessions={missedGuruSessions}
        courses={courses}
        batches={batches}
        trainers={trainers}
        students={students}
        rooms={rooms}
      />
    </div>
  );
}

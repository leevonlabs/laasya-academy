import React from 'react';
import { getAttendanceAuditRecords, getGuruAttendanceAuditRecords, getCourses, getBatches, getStudents, getTrainers } from '@/lib/academy';
import AttendanceListClient from '@/components/attendance/AttendanceListClient';

export const revalidate = 15;

export default async function AttendancePage() {
  const [auditRecords, guruAuditRecords, courses, batches, students, trainers] = await Promise.all([
    getAttendanceAuditRecords(),
    getGuruAttendanceAuditRecords(),
    getCourses(),
    getBatches(),
    getStudents(),
    getTrainers()
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AttendanceListClient 
        initialAuditRecords={auditRecords} 
        initialGuruAuditRecords={guruAuditRecords}
        courses={courses} 
        batches={batches}
        students={students}
        trainers={trainers}
      />
    </div>
  );
}

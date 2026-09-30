import React from 'react';
import { getAttendanceAuditRecords, getCourses, getBatches, getStudents } from '@/lib/academy';
import AttendanceListClient from '@/components/attendance/AttendanceListClient';

export const revalidate = 0;

export default async function AttendancePage() {
  const [auditRecords, courses, batches, students] = await Promise.all([
    getAttendanceAuditRecords(),
    getCourses(),
    getBatches(),
    getStudents()
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AttendanceListClient 
        initialAuditRecords={auditRecords} 
        courses={courses} 
        batches={batches}
        students={students}
      />
    </div>
  );
}

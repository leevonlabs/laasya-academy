import React from 'react';
import { getAttendanceAuditRecords, getCourses, getBatches } from '@/lib/academy';
import AttendanceListClient from '@/components/attendance/AttendanceListClient';

export const revalidate = 0;

export default async function AttendancePage() {
  const [auditRecords, courses, batches] = await Promise.all([
    getAttendanceAuditRecords(),
    getCourses(),
    getBatches()
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AttendanceListClient 
        initialAuditRecords={auditRecords} 
        courses={courses} 
        batches={batches}
      />
    </div>
  );
}

import { getAttendanceRecords, getCourses } from '@/lib/academy';
import AttendanceListClient from '@/components/attendance/AttendanceListClient';

export const revalidate = 0;

export default async function AttendancePage() {
  const [records, courses] = await Promise.all([
    getAttendanceRecords(),
    getCourses(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AttendanceListClient initialRecords={records} initialCourses={courses} />
    </div>
  );
}

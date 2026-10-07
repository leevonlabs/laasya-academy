import React from 'react';
import { getSessions, getRooms } from '@/lib/academy';
import ScheduleListClient from '@/components/schedule/ScheduleListClient';

export const revalidate = 15;

export default async function SchedulePage() {
  const [sessions, rooms] = await Promise.all([
    getSessions(),
    getRooms()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ScheduleListClient initialSessions={sessions} initialRooms={rooms} />
    </div>
  );
}

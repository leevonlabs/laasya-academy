import React from 'react';
import { getSessions } from '@/lib/academy';
import ScheduleListClient from '@/components/schedule/ScheduleListClient';

export const revalidate = 0;

export default async function SchedulePage() {
  const sessions = await getSessions();

  return (
    <div className="max-w-7xl mx-auto">
      <ScheduleListClient initialSessions={sessions} />
    </div>
  );
}

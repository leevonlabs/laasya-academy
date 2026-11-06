import React from 'react';
import TimetableView from '@/components/batches/TimetableView';
import { getBatches } from '@/lib/academy';

export const metadata = {
  title: 'Weekly Timetable | Laasya Cultural Academy',
  description: 'Full weekly master class schedule across all courses, batches, gurus, and rooms.'
};

export const revalidate = 15;

export default async function TimetablePage() {
  const batches = await getBatches();

  return (
    <div className="max-w-7xl mx-auto">
      <TimetableView batches={batches} />
    </div>
  );
}

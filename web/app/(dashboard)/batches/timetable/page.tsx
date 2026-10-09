import React from 'react';
import TimetableView from '@/components/batches/TimetableView';
import Link from 'next/link';

export const metadata = {
  title: 'Weekly Timetable | Laasya Cultural Academy',
  description: 'Full weekly master class schedule across all courses, batches, gurus, and rooms.'
};

export default function TimetablePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <TimetableView />
    </div>
  );
}

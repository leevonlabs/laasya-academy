import React from 'react';
import { getBatches, getCourses, getTrainers } from '@/lib/academy';
import BatchesListClient from '@/components/batches/BatchesListClient';

export const revalidate = 0;

export default async function BatchesPage() {
  const batches = await getBatches();
  const courses = await getCourses();
  const trainers = await getTrainers();

  return (
    <div className="max-w-7xl mx-auto">
      <BatchesListClient initialBatches={batches} courses={courses} trainers={trainers} />
    </div>
  );
}

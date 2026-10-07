import React from 'react';
import { getTrainers, getCourses, getBatches } from '@/lib/academy';
import TrainersListClient from '@/components/trainers/TrainersListClient';

export const revalidate = 15;

export default async function TrainersPage() {
  const [trainers, courses, batches] = await Promise.all([
    getTrainers(),
    getCourses(),
    getBatches()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <TrainersListClient 
        initialTrainers={trainers} 
        courses={courses}
        batches={batches}
      />
    </div>
  );
}

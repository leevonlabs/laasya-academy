import React from 'react';
import { getTrainers } from '@/lib/academy';
import TrainersListClient from '@/components/trainers/TrainersListClient';

export const revalidate = 0;

export default async function TrainersPage() {
  const trainers = await getTrainers();

  return (
    <div className="max-w-7xl mx-auto">
      <TrainersListClient initialTrainers={trainers} />
    </div>
  );
}

import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTrainers, getCourses, getBatches } from '@/lib/academy';
import TrainersListClient from '@/components/trainers/TrainersListClient';

export const revalidate = 15;

export default async function TrainersPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    redirect('/login');
  }

  const canDelete = user.role === 'owner' || Boolean(user.canDelete);

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
        canDelete={canDelete}
      />
    </div>
  );
}

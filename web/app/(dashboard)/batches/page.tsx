import React from 'react';
import { getBatches, getCourses, getTrainers, getRooms } from '@/lib/academy';
import { getCurrentUser } from '@/lib/auth';
import BatchesListClient from '@/components/batches/BatchesListClient';

export const revalidate = 15;

export default async function BatchesPage() {
  const [user, batches, courses, trainers, rooms] = await Promise.all([
    getCurrentUser(),
    getBatches(),
    getCourses(),
    getTrainers(),
    getRooms()
  ]);

  const canDelete = user?.role === 'owner' || Boolean(user?.canDelete);

  return (
    <div className="max-w-7xl mx-auto">
      <BatchesListClient 
        initialBatches={batches} 
        courses={courses} 
        trainers={trainers} 
        initialRooms={rooms} 
        canDelete={canDelete}
      />
    </div>
  );
}

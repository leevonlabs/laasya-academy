import React from 'react';
import { getBatches, getCourses, getTrainers, getRooms } from '@/lib/academy';
import BatchesListClient from '@/components/batches/BatchesListClient';

export const revalidate = 15;

export default async function BatchesPage() {
  const [batches, courses, trainers, rooms] = await Promise.all([
    getBatches(),
    getCourses(),
    getTrainers(),
    getRooms()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <BatchesListClient 
        initialBatches={batches} 
        courses={courses} 
        trainers={trainers} 
        initialRooms={rooms} 
      />
    </div>
  );
}

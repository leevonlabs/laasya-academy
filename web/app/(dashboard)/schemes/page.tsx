import React from 'react';
import { getSchemes, getCourses, getBatches } from '@/lib/academy';
import SchemesListClient from '@/components/schemes/SchemesListClient';

export const revalidate = 15;

export default async function SchemesPage() {
  const [schemes, courses, batches] = await Promise.all([
    getSchemes(),
    getCourses(),
    getBatches()
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <SchemesListClient
        initialSchemes={schemes}
        courses={courses}
        batches={batches}
      />
    </div>
  );
}

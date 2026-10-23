import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Faculty } from '@/components/landing/Faculty';
import { Contact, Footer } from '@/components/landing/Sections';
import { getTrainers } from '@/lib/academy';

export const metadata: Metadata = {
  title: 'Our Gurus & Faculty | Laasya Cultural Academy',
  description:
    'Meet the renowned gurus and master instructors of Laasya Cultural Academy Bangalore in classical dance, vocal music, instruments, visual arts, and yoga.',
};

export const revalidate = 60;

export default async function GurusPage() {
  const trainers = await getTrainers().catch(() => []);

  const serializedTrainers = trainers.map((t) => ({
    id: t.id,
    full_name: t.full_name,
    code: t.code,
    display_title: t.display_title,
    specializations: t.specializations,
    bio: t.bio,
    avatar_url: t.avatar_url,
    batches_assigned: t.batches_assigned,
    assigned_batches: (t.assigned_batches || []).map((ab: any) => ({
      id: ab.id,
      name: ab.name,
      code: ab.code,
      course_id: ab.course_id,
      course_title: ab.course_title,
      days_of_week: ab.days_of_week,
      room_or_hall: ab.room_or_hall,
    })),
    is_active: t.is_active,
  }));

  return (
    <div className="landing-page-root min-h-screen bg-[#FAF5F7] text-[#220314]">
      <Navbar />
      <main className="pt-20 sm:pt-24">
        <Faculty initialTrainers={serializedTrainers} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

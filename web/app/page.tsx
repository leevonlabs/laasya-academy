import React from 'react';
import LandingPageClient from '@/components/landing/LandingPageClient';
import { getCourses, getBatches, getTrainers, getPublicAcademyProfile } from '@/lib/academy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laasya Cultural Academy | Unleash Your Talent | Bangalore',
  description:
    'Premier cultural education academy in Bangalore since 2022. Offering classical dance, Carnatic music, instruments, visual arts, yoga, and martial arts.',
  keywords: [
    'Laasya Cultural Academy',
    'Bharatanatyam Bangalore',
    'Carnatic Music Kannamangala',
    'Drawing Art Classes Bangalore',
    'Karate Kalaripayattu Bangalore',
    'Music Academy Seegehalli',
    'Chess Coaching Bangalore',
  ],
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [courses, batches, trainers, contactProfile] = await Promise.all([
    getCourses().catch(() => []),
    getBatches().catch(() => []),
    getTrainers().catch(() => []),
    getPublicAcademyProfile().catch(() => ({
      full_name: 'Laasya Cultural Academy',
      designation: 'Academy Administration',
      whatsapp_number: '+91 8151 998 899',
      contacts: [{ title: 'Office Desk & Admissions', phone: '+91 8151 998 899' }],
      emails: [{ title: 'Official Inquiries', email: 'admin@laasyaacademy.com' }],
      campus_address: 'VV Maple Hub, 2nd Floor, Kannamangala, Bangalore 560115',
      map_url: 'https://maps.app.goo.gl/BXwHcSPeUzExxR6V7',
    })),
  ]);

  // Clean serialization for Client Components
  const serializedCourses = courses.map((c) => ({
    id: c.id,
    title: c.title,
    code: c.code,
    category: c.category,
    description: c.description,
    monthly_fee: c.monthly_fee,
    is_active: c.is_active,
    batch_count: c.batch_count,
    image_url: c.image_url,
  }));

  const serializedBatches = batches.map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
    course_id: b.course_id,
    course_title: b.course_title,
    trainer_id: b.trainer_id,
    trainer_name: b.trainer_name,
    days_of_week: b.days_of_week,
    start_time: b.start_time,
    end_time: b.end_time,
    room_or_hall: b.room_or_hall,
    description: b.description,
    monthly_fee: b.monthly_fee,
    max_capacity: b.max_capacity,
    enrolled_count: b.enrolled_count,
    is_active: b.is_active,
  }));

  const serializedTrainers = trainers.map((t) => ({
    id: t.id,
    full_name: t.full_name,
    code: t.code,
    display_title: t.display_title,
    experience: t.experience,
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
    <LandingPageClient
      initialCourses={serializedCourses}
      initialBatches={serializedBatches}
      initialTrainers={serializedTrainers}
      contactProfile={contactProfile}
    />
  );
}

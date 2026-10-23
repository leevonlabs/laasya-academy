import React from 'react';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Programs } from '@/components/landing/Programs';
import { Contact, Footer } from '@/components/landing/Sections';
import { EnquiryProvider } from '@/components/landing/EnquiryContext';
import { EnquiryModal } from '@/components/landing/EnquiryModal';
import { getCourses, getBatches } from '@/lib/academy';

export const metadata: Metadata = {
  title: 'All Courses & Batches | Laasya Cultural Academy',
  description:
    'Explore classical dance, Carnatic music, visual arts, and fitness courses with available batches at Laasya Academy Bangalore.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProgramsPage() {
  const [courses, batches] = await Promise.all([
    getCourses().catch(() => []),
    getBatches().catch(() => []),
  ]);

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

  return (
    <EnquiryProvider>
      <div className="landing-page-root min-h-screen bg-[#FAF5F7] text-[#220314]">
        <Navbar />
        <main className="pt-20 sm:pt-24">
          <Programs initialCourses={serializedCourses} initialBatches={serializedBatches} />
          <Contact />
        </main>
        <Footer />
        <EnquiryModal />
      </div>
    </EnquiryProvider>
  );
}

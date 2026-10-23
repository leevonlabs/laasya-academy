import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, Calendar, MapPin, ArrowLeft, BookOpen } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Contact, Footer } from '@/components/landing/Sections';
import { EnquiryProvider } from '@/components/landing/EnquiryContext';
import { EnquiryModal } from '@/components/landing/EnquiryModal';
import { getTrainers } from '@/lib/academy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const trainers = await getTrainers().catch(() => []);
  const guru = trainers.find((t) => t.id === id || t.code?.toLowerCase() === id.toLowerCase());

  if (!guru) {
    return { title: 'Guru Profile | Laasya Cultural Academy' };
  }

  return {
    title: `${guru.full_name} — ${guru.display_title || 'Faculty Guru'} | Laasya Cultural Academy`,
    description: `Learn under Guru ${guru.full_name} (${guru.display_title || 'Faculty'}). ${guru.experience || 'Experienced Master'} in ${guru.specializations?.join(', ') || 'Classical Arts'}.`,
  };
}

function getGuruImage(name: string, avatarUrl?: string): string {
  if (avatarUrl && avatarUrl.trim()) return avatarUrl.trim();
  const n = (name || '').toLowerCase();
  if (n.includes('manikandan')) return '/images/gurus/manikandan.jpg';
  if (n.includes('dipan') || n.includes('sarkar')) return '/images/gurus/dipayan_sarkar.jpg';
  if (n.includes('satish') || n.includes('sathish')) return '/images/gurus/sathish_kale.jpg';
  if (n.includes('sai') || n.includes('krishna')) return '/images/gurus/sai_krishna.jpg';
  if (n.includes('nandana')) return '/images/unr05837.jpg';
  if (n.includes('amrutha')) return '/images/unr05834.jpg';
  if (n.includes('vismaya')) return '/images/unr05149.jpg';
  if (n.includes('kavya')) return '/images/unr05952.jpg';
  if (n.includes('amos') || n.includes('sahil')) return '/images/unr05482.jpg';
  if (n.includes('vrushhabh')) return '/images/courses/kalari.jpg';
  if (n.includes('balraj')) return '/images/courses/karate.jpg';
  if (n.includes('karthik') || n.includes('uday') || n.includes('manjunath')) {
    return '/images/courses/western_dance.jpg';
  }
  return '/images/courses/laasya_bharatanatyam.jpg';
}

function formatDays(days: any): string {
  if (!days) return 'Flexible Days';
  if (Array.isArray(days)) {
    if (days.length === 7) return 'All 7 Days';
    if (days.length === 5 && days.includes('Monday') && days.includes('Friday')) return 'Mon to Fri';
    if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) return 'Sat & Sun (Weekend)';
    return days.map((d: string) => d.substring(0, 3)).join(', ');
  }
  return String(days);
}

export default async function GuruDetailPage({ params }: PageProps) {
  const { id } = await params;
  const trainers = await getTrainers().catch(() => []);
  const guru = trainers.find((t) => t.id === id || t.code?.toLowerCase() === id.toLowerCase());

  if (!guru) {
    notFound();
  }

  const imageSrc = getGuruImage(guru.full_name, guru.avatar_url);
  const assignedBatches = guru.assigned_batches || [];

  return (
    <EnquiryProvider>
      <div className="landing-page-root min-h-screen bg-[#FAF5F7] text-[#220314]">
        <Navbar />

        <main className="pt-24 sm:pt-28 pb-20">
          <div className="mx-auto max-w-[1650px] px-4 sm:px-8 lg:px-12 xl:px-16">
            {/* Back Navigation */}
            <div className="mb-8">
              <Link
                href="/#faculty"
                className="inline-flex items-center gap-2 rounded-full border border-[#D4BAC7] bg-white px-5 py-2 text-xs sm:text-sm font-semibold text-[#8A064D] hover:bg-[#8A064D] hover:text-white transition-all shadow-sm cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to All Gurus</span>
              </Link>
            </div>

            {/* Profile Card */}
            <div className="overflow-hidden rounded-3xl border border-[#D4BAC7]/70 bg-white shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Guru Image Column */}
                <div className="relative md:col-span-5 bg-muted">
                  <div className="relative aspect-[4/5] md:h-full w-full overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={guru.full_name}
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3d0c34]/90 via-[#3d0c34]/20 to-transparent" />
                    <span className="absolute bottom-4 left-4 rounded-full bg-[#3d0c34]/90 px-4 py-1.5 text-xs font-bold text-[#fbf0b9] backdrop-blur-md shadow">
                      {guru.display_title || 'Faculty Guru'}
                    </span>
                  </div>
                </div>

                {/* Guru Information Column */}
                <div className="p-6 sm:p-10 md:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Guru Experience badge in place of Guru ID */}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-1 text-xs font-bold text-[#220314] shadow-gold">
                        <Award className="h-3.5 w-3.5" />
                        {guru.experience || '10+ Years Experience'}
                      </span>
                      <span className="rounded-full bg-[#8A064D]/10 px-3 py-1 text-xs font-bold text-[#8A064D]">
                        {assignedBatches.length} Batch{assignedBatches.length !== 1 ? 'es' : ''} Assigned
                      </span>
                    </div>

                    <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-[#220314]">
                      {guru.full_name}
                    </h1>

                    <p className="mt-1 text-sm font-bold uppercase tracking-wider text-[#8A064D]">
                      {guru.display_title || 'Master Faculty Mentor'}
                    </p>

                    {/* Specializations */}
                    {guru.specializations && guru.specializations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {guru.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="rounded-full border border-[#8A064D]/30 bg-[#8A064D]/10 px-3 py-1 text-xs font-bold text-[#8A064D]"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Biography */}
                    <div className="mt-6 border-t border-[#D4BAC7]/60 pt-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E3955] mb-2">
                        Artist Biography &amp; Pedagogy
                      </h3>
                      <p className="text-sm sm:text-base leading-relaxed text-[#59424F] whitespace-pre-line">
                        {guru.bio ||
                          `${guru.full_name} is an esteemed mentor at Laasya Cultural Academy, guiding students with authentic shastras and artistic excellence.`}
                      </p>
                    </div>
                  </div>

                  {/* Academy Studio Info (No guru private phone/email) */}
                  <div className="mt-8 rounded-2xl bg-[#FAF5F7] border border-[#D4BAC7]/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#220314]">
                      <MapPin className="h-4 w-4 text-[#8A064D]" />
                      <span>Campus: VV Maple Hub, Kannamangala, Bangalore</span>
                    </div>
                    <p className="mt-1 text-[0.7rem] text-[#6E3955]">
                      All classes are conducted in mirror-fitted, air-ventilated cultural studios.
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Batches Section (NO TIMINGS) */}
              <div className="border-t border-[#D4BAC7]/60 bg-[#FAF5F7]/60 p-6 sm:p-10">
                <h2 className="font-display text-2xl font-bold text-[#220314] flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-[#8A064D]" />
                  <span>Batches Mentored by {guru.full_name} ({assignedBatches.length})</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#6E3955]">
                  Select any batch from the course catalog or contact administration for trial sessions.
                </p>

                {assignedBatches.length > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {assignedBatches.map((batch: any) => (
                      <div
                        key={batch.id}
                        className="rounded-2xl border border-[#D4BAC7] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-lg font-bold text-[#220314]">
                            {batch.name}
                          </h4>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800">
                            Active
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-bold text-[#8A064D]">
                          {batch.course_title}
                        </p>

                        <div className="mt-3 space-y-1.5 text-xs text-[#6E3955]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#8A064D]" />
                            <span>Days: {formatDays(batch.days_of_week)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#8A064D]" />
                            <span className="truncate">{batch.room_or_hall || 'Studio'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-[#D4BAC7] bg-white p-6 text-center text-sm text-[#6E3955]">
                    <p className="font-bold text-[#220314]">
                      Special masterclasses and workshops are scheduled per term.
                    </p>
                    <p className="mt-1 text-xs">
                      Please get in touch with reception to request batch timings with {guru.full_name}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Contact />
        <Footer />
        <EnquiryModal />
      </div>
    </EnquiryProvider>
  );
}

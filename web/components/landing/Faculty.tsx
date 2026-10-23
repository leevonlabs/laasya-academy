'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Calendar, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

export interface TrainerItem {
  id: string;
  full_name: string;
  code?: string;
  display_title?: string;
  experience?: string;
  specializations?: string[];
  bio?: string;
  avatar_url?: string;
  batches_assigned?: number;
  assigned_batches?: any[];
  is_active?: boolean;
}

interface FacultyProps {
  initialTrainers?: TrainerItem[];
}

function getGuruImage(trainer: TrainerItem): string {
  // 1. Priority: If avatar is uploaded in admin login, ALWAYS display it
  if (trainer.avatar_url && trainer.avatar_url.trim()) {
    return trainer.avatar_url.trim();
  }

  // 2. Curated default fallbacks
  const name = (trainer.full_name || '').toLowerCase();
  if (name.includes('manikandan')) return '/images/gurus/manikandan.jpg';
  if (name.includes('dipan') || name.includes('sarkar')) return '/images/gurus/dipayan_sarkar.jpg';
  if (name.includes('satish') || name.includes('sathish')) return '/images/gurus/sathish_kale.jpg';
  if (name.includes('sai') || name.includes('krishna')) return '/images/gurus/sai_krishna.jpg';
  if (name.includes('nandana')) return '/images/unr05837.jpg';
  if (name.includes('amrutha')) return '/images/unr05834.jpg';
  if (name.includes('vismaya')) return '/images/unr05149.jpg';
  if (name.includes('kavya')) return '/images/unr05952.jpg';
  if (name.includes('amos') || name.includes('sahil')) return '/images/unr05482.jpg';
  if (name.includes('vrushhabh')) return '/images/courses/kalari.jpg';
  if (name.includes('balraj')) return '/images/courses/karate.jpg';
  if (name.includes('karthik') || name.includes('uday') || name.includes('manjunath')) {
    return '/images/courses/western_dance.jpg';
  }

  return '/images/courses/laasya_bharatanatyam.jpg';
}

function GuruCard({ member, delay }: { member: TrainerItem; delay: number }) {
  const imageSrc = getGuruImage(member);
  const batchesCount = member.batches_assigned || (member.assigned_batches ? member.assigned_batches.length : 0);

  return (
    <Reveal delay={delay} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#D4BAC7]/70 bg-white shadow-warm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-gold">
        {/* Aspect Ratio Container (No floating emojis) */}
        <Link href={`/gurus/${member.id}`} className="block relative aspect-[4/3] w-full overflow-hidden bg-[#FAF5F7]">
          <img
            src={imageSrc}
            alt={member.full_name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3d0c34]/90 via-[#3d0c34]/20 to-transparent" />

          {/* Role badge */}
          <span className="absolute bottom-3.5 left-3.5 rounded-full bg-[#3d0c34]/90 px-3 py-0.5 text-[0.65rem] sm:text-xs font-bold text-[#fbf0b9] backdrop-blur-md shadow">
            {member.display_title || member.specializations?.[0] || 'Faculty Guru'}
          </span>

          {/* Guru Experience badge in place of Guru ID */}
          <span className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 sm:px-3 py-0.5 sm:py-1 text-[0.65rem] sm:text-[0.7rem] font-bold text-[#220314] shadow-gold">
            <Award className="h-3 w-3" />
            {member.experience || '10+ Years Experience'}
          </span>
        </Link>

        {/* Content Body */}
        <div className="flex flex-1 flex-col p-5 sm:p-6 pt-4 sm:pt-5">
          <div className="flex items-center justify-between gap-1">
            <Link href={`/gurus/${member.id}`} className="hover:text-[#8A064D] transition-colors min-w-0">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#220314] truncate">
                {member.full_name}
              </h3>
            </Link>
            {batchesCount > 0 && (
              <span className="shrink-0 flex items-center gap-1 rounded-full bg-[#8A064D]/10 px-2 py-0.5 text-[0.65rem] sm:text-xs font-bold text-[#8A064D]">
                <Calendar className="h-3 w-3" />
                {batchesCount} Batch{batchesCount > 1 ? 'es' : ''}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#8A064D]">
            {member.display_title || 'Faculty Guru'}
          </p>

          {/* Specialization Tags from Admin */}
          {member.specializations && member.specializations.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {member.specializations.map((spec) => (
                <span
                  key={spec}
                  className="rounded-full border border-[#8A064D]/30 bg-[#8A064D]/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-[#8A064D]"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Bio from Admin */}
          <Link href={`/gurus/${member.id}`} className="mt-3.5 block group-hover:text-[#220314]">
            <p className="text-xs sm:text-sm leading-relaxed text-[#59424F] line-clamp-3 hover:text-[#220314] transition-colors">
              {member.bio ||
                `${member.full_name} is an esteemed mentor at Laasya Cultural Academy, guiding students with authentic shastras and artistic excellence.`}
            </p>
          </Link>

          {/* Bottom Action: View Full Profile */}
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#D4BAC7]/50">
            <span className="text-[0.7rem] sm:text-xs font-bold text-[#6E3955]">
              {member.experience || 'Certified Faculty'}
            </span>

            <Link
              href={`/gurus/${member.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-stage-gradient px-3.5 sm:px-4 py-1.5 sm:py-2 text-[0.7rem] sm:text-xs font-bold text-white shadow-warm hover:scale-[1.03] transition-all cursor-pointer"
            >
              <span>View Full Bio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function Faculty({ initialTrainers }: FacultyProps) {
  const [trainers, setTrainers] = useState<TrainerItem[]>(initialTrainers || []);

  useEffect(() => {
    if (!initialTrainers || initialTrainers.length === 0) {
      fetch('/api/trainers')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setTrainers(data);
        })
        .catch(() => {});
    }
  }, [initialTrainers]);

  return (
    <section id="faculty" className="scroll-mt-24 bg-[#F5ECEF] py-16 sm:py-24 lg:py-28">
      {/* Utilized full container width (max-w-[1650px]) */}
      <div className="mx-auto max-w-[1650px] px-4 sm:px-8 lg:px-12 xl:px-16">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#8A064D]">
              Our Esteemed Gurus &amp; Faculty
            </p>
            <h2 className="mt-2.5 sm:mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#220314]">
              Learn from Accomplished Masters
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#6E3955]">
              Dedicated performers, certified masters, and passionate mentors
              registered across our academy disciplines. Click any profile to read their full artistic biography.
            </p>
          </div>
        </Reveal>

        {/* 4 GRIDS IN EACH ROW on Large Screens (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4) */}
        <div className="mt-10 sm:mt-14 grid gap-5 sm:gap-6 xl:gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trainers.map((member, i) => (
            <GuruCard key={member.id} member={member} delay={(i % 4) * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}

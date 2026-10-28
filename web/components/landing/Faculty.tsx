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
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white shadow-warm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-gold">
        {/* Aspect Ratio Container: 4:5 vertical portrait matching Admin Login exactly */}
        <Link 
          href={`/gurus/${member.id}`} 
          className="block relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-[#3D0322] via-[#590231] to-[#1A010F]"
        >
          <img
            src={imageSrc}
            alt={member.full_name}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3d0c34]/90 via-[#3d0c34]/20 to-transparent" />

          {/* Role badge */}
          <span className="absolute bottom-2 left-2 sm:bottom-3.5 sm:left-3.5 rounded-full bg-[#3d0c34]/90 px-2 py-0.5 sm:px-3 sm:py-0.5 text-[0.55rem] sm:text-xs font-bold text-[#fbf0b9] backdrop-blur-md shadow truncate max-w-[85%]">
            {member.display_title || member.specializations?.[0] || 'Faculty Guru'}
          </span>

          {/* Guru Experience badge */}
          <span className="absolute right-2 top-2 sm:right-3.5 sm:top-3.5 flex items-center gap-1 rounded-full bg-gold-gradient px-1.5 py-0.5 sm:px-3 sm:py-1 text-[0.55rem] sm:text-[0.7rem] font-bold text-[#220314] shadow-gold">
            <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="truncate">{member.experience || '10+ Yrs'}</span>
          </span>
        </Link>

        {/* Content Body */}
        <div className="flex flex-1 flex-col p-2.5 sm:p-5 sm:pt-4">
          <div className="flex items-center justify-between gap-1">
            <Link href={`/gurus/${member.id}`} className="hover:text-[#8A064D] transition-colors min-w-0">
              <h3 className="font-display text-xs sm:text-xl font-bold text-[#220314] truncate">
                {member.full_name}
              </h3>
            </Link>
            {batchesCount > 0 && (
              <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-[#8A064D]/10 px-1.5 py-0.5 text-[0.55rem] sm:text-xs font-bold text-[#8A064D]">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>{batchesCount}B</span>
              </span>
            )}
          </div>

          <p className="mt-0.5 sm:mt-1 text-[0.62rem] sm:text-xs font-bold uppercase tracking-wider text-[#8A064D] truncate">
            {member.display_title || 'Faculty Guru'}
          </p>

          {/* Specialization Tags (Shown on Tablet/Desktop, or 1 tag on Mobile) */}
          {member.specializations && member.specializations.length > 0 && (
            <div className="mt-1 sm:mt-2.5 flex flex-wrap gap-1">
              {member.specializations.slice(0, 2).map((spec) => (
                <span
                  key={spec}
                  className="rounded-full border border-[#8A064D]/30 bg-[#8A064D]/10 px-1.5 py-0.5 text-[0.58rem] sm:text-[0.65rem] font-bold text-[#8A064D] truncate max-w-full"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Bio (Desktop/Tablet only to keep mobile cards neat and compact) */}
          <Link href={`/gurus/${member.id}`} className="mt-2 sm:mt-3.5 hidden sm:block group-hover:text-[#220314]">
            <p className="text-xs sm:text-sm leading-relaxed text-[#59424F] line-clamp-3 hover:text-[#220314] transition-colors">
              {member.bio ||
                `${member.full_name} is an esteemed mentor at Laasya Cultural Academy, guiding students with authentic shastras and artistic excellence.`}
            </p>
          </Link>

          {/* Bottom Action: View Full Profile */}
          <div className="mt-auto pt-2 sm:pt-4 flex items-center justify-between border-t border-[#D4BAC7]/50">
            <span className="text-[0.6rem] sm:text-xs font-bold text-[#6E3955] truncate">
              {member.experience || 'Certified'}
            </span>

            <Link
              href={`/gurus/${member.id}`}
              className="inline-flex items-center gap-1 rounded-xl sm:rounded-full bg-stage-gradient px-2 sm:px-4 py-1 sm:py-2 text-[0.62rem] sm:text-xs font-bold text-white shadow-warm hover:scale-[1.03] transition-all cursor-pointer shrink-0"
            >
              <span>View Bio</span>
              <ArrowRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
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
    <section id="faculty" className="scroll-mt-20 bg-[#F5ECEF] py-8 sm:py-20 lg:py-24">
      {/* Utilized full container width (max-w-[1650px]) */}
      <div className="mx-auto max-w-[1650px] px-3 sm:px-8 lg:px-12 xl:px-16">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[0.65rem] sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#8A064D]">
              Our Esteemed Gurus &amp; Faculty
            </p>
            <h2 className="mt-1.5 sm:mt-3 font-display text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#220314]">
              Learn from Accomplished Masters
            </h2>
            <p className="mt-2 sm:mt-4 text-xs sm:text-base text-[#6E3955]">
              Dedicated performers, certified masters, and passionate mentors
              registered across our academy disciplines. Click any profile to read their full artistic biography.
            </p>
          </div>
        </Reveal>

        {/* 2 GRIDS IN EACH ROW ON MOBILE, 3-4 on Tablet/Desktop */}
        <div className="mt-6 sm:mt-12 grid gap-2.5 sm:gap-6 xl:gap-7 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {trainers.map((member, i) => (
            <GuruCard key={member.id} member={member} delay={(i % 4) * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}

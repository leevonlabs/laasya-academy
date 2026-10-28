'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

const slides = [
  { image: '/images/unr05917.jpg', alt: 'Students in classical dance costumes' },
  { image: '/images/unr05840.jpg', alt: 'Laasya students on stage' },
  { image: '/images/unr05716.jpg', alt: 'Art classroom at Laasya' },
];

export function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      6000
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      id="home"
      className="relative flex min-h-[70svh] sm:min-h-[100svh] items-center overflow-hidden"
    >
      <div className="absolute inset-0">
        {slides.map((slide, i) => (
          <div
            key={slide.image}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000',
              i === active ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className={cn(
                'h-full w-full object-cover',
                i === active && 'animate-hero-zoom'
              )}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#4d1544]/75 via-transparent to-[#4d1544]/40" />
      </div>

      <div className="relative mx-auto w-full max-w-[1650px] px-3 pb-8 pt-16 sm:px-8 sm:pb-20 sm:pt-28 lg:px-12 xl:px-16">
        <div className="max-w-4xl">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#D4AF37]/50 bg-[#4d1544]/60 px-3 py-1 sm:px-5 sm:py-2 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.25em] text-[#fbf0b9] backdrop-blur-md">
              • Nurturing Creativity &amp; Excellence
            </span>
          </Reveal>
          <Reveal delay={150}>
            <h1 className="mt-2.5 sm:mt-6 font-display text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] text-white">
              Unleash Your{' '}
              <span className="bg-gold-text font-display italic">Talent</span>
            </h1>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-2.5 sm:mt-6 max-w-2xl text-xs sm:text-base md:text-lg leading-relaxed text-white/90">
              Welcome to Laasya Cultural Academy. We offer premium training in
              Classical Dance, Vocal Music, Instruments, Visual Arts, and
              Martial Arts to inspire young minds, build lifelong confidence,
              and foster creative discipline.
            </p>
          </Reveal>
          <Reveal delay={450}>
            <div className="mt-4 sm:mt-10 flex flex-row flex-wrap gap-2.5 sm:gap-4">
              <a
                href="#programs"
                className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-4 py-2 sm:px-8 sm:py-3.5 text-xs sm:text-base font-bold text-[#220314] shadow-gold transition-transform hover:scale-[1.04] text-center"
              >
                Explore Courses
              </a>
              <a
                href="#faculty"
                className="inline-flex items-center justify-center rounded-full border border-white/70 bg-black/20 backdrop-blur-xs px-4 py-2 sm:px-8 sm:py-3.5 text-xs sm:text-base font-bold text-white transition-colors hover:bg-white hover:text-black text-center"
              >
                Meet Gurus
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

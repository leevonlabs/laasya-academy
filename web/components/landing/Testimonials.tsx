'use client';

import { testimonials } from '@/data/site';
import { Reveal } from './Reveal';

export function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 py-24 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#8A064D]">
              Testimonials
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-[#220314] sm:text-5xl">
              What Our Parents Say
            </h2>
            <p className="mt-4 text-[#6E3955]">
              Real feedback from families who trust Laasya Academy with their
              children's creative growth and artistic journey.
            </p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={(i % 2) * 120}>
              <figure className="flex h-full flex-col rounded-3xl border border-[#D4BAC7]/70 bg-[#FAF5F7] p-7 shadow-warm">
                <span
                  aria-label="5 out of 5 stars"
                  className="bg-gold-text text-xl tracking-widest font-bold"
                >
                  ★★★★★
                </span>
                <blockquote className="mt-4 flex-1 text-sm sm:text-base leading-relaxed text-[#59424F]">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-[#D4BAC7]/60 pt-4">
                  <p className="font-display text-base font-bold text-[#220314]">
                    {t.name}
                  </p>
                  <p className="text-xs font-semibold text-[#8A064D]">{t.context}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { ShieldCheck, Award, MapPin, Phone, Mail, Navigation, ExternalLink, MessageCircle } from 'lucide-react';
import { Reveal } from './Reveal';
import type { PublicAcademyProfile } from '@/lib/academy';

export function Stats() {
  return (
    <section className="relative z-10 -mt-8 sm:-mt-14">
      <div className="mx-auto max-w-[1650px] px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-2 gap-3 sm:gap-6 rounded-3xl border border-[#D4BAC7]/60 bg-white/95 p-4 sm:p-8 shadow-warm backdrop-blur-md sm:grid-cols-4">
          {[
            { value: '18+', label: 'Art Disciplines', sub: 'Dance, Music & Arts' },
            { value: '14+', label: 'Certified Gurus', sub: 'Experienced Masters' },
            { value: '500+', label: 'Trained Disciples', sub: 'Children & Adults' },
            { value: '100%', label: 'Dedicated Studios', sub: 'Mirror-fitted halls' },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 80}>
              <div className="text-center p-2">
                <p className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-[#8A064D]">
                  {stat.value}
                </p>
                <p className="mt-1 font-display text-xs sm:text-sm md:text-base font-bold text-[#220314]">
                  {stat.label}
                </p>
                <p className="text-[0.65rem] sm:text-xs text-[#6E3955] mt-0.5">{stat.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Story() {
  return (
    <section id="story" className="scroll-mt-20 py-8 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1650px] px-3 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-[#D4BAC7] shadow-warm">
                <img
                  src="/images/unr05837.jpg"
                  alt="Laasya Academy classical dance session"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -right-5 hidden rounded-2xl bg-[#3d0c34] p-5 text-white shadow-xl sm:block max-w-[240px]">
                <p className="font-display text-xl sm:text-2xl font-bold text-[#fbf0b9]">
                  Guru-Shishya
                </p>
                <p className="mt-1 text-xs text-white/80">
                  Parampara rooted in classical discipline and stage confidence.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#8A064D]">
                Our Sacred Heritage
              </p>
              <h2 className="mt-2.5 sm:mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#220314]">
                Nurturing India's Timeless Arts with Heart &amp; Soul
              </h2>
              <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-[#59424F]">
                Founded with a vision to preserve and celebrate India's rich cultural
                legacy, <strong>Laasya Cultural Academy</strong> provides authentic,
                disciplined training in classical dance, Carnatic music, instrumental arts,
                fine arts, and traditional martial arts.
              </p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-[#59424F]">
                Our certified gurus nurture every disciple with patience, guiding them
                from basic footwork and swaras through to stage performances, arangetram,
                and accredited grade certifications.
              </p>

              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-[#D4BAC7]/70 bg-white p-4 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-[#8A064D]" />
                  <p className="mt-2 font-display text-base font-bold text-[#220314]">
                    Certified Curriculum
                  </p>
                  <p className="text-xs text-[#6E3955]">
                    Structured progression mapped to university and board exams.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D4BAC7]/70 bg-white p-4 shadow-sm">
                  <Award className="h-6 w-6 text-[#8A064D]" />
                  <p className="mt-2 font-display text-base font-bold text-[#220314]">
                    Stage Opportunities
                  </p>
                  <p className="text-xs text-[#6E3955]">
                    Annual academy festivals, temple programs, and cultural showcases.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function WhyUs() {
  const pillars = [
    {
      title: 'Master Faculty Mentors',
      desc: 'Learn directly from accomplished stage performers and dedicated gurus with deep traditional mastery.',
    },
    {
      title: 'Dedicated Cultural Studios',
      desc: 'Spacious, well-ventilated, wooden & mirror-fitted dance halls and sound-balanced music studios.',
    },
    {
      title: 'Stage Readiness & Confidence',
      desc: 'Regular in-house concerts, stage showcases, and annual celebrations to build public performance confidence.',
    },
    {
      title: 'Structured Grade Exams',
      desc: 'Formal evaluation cycles, grade certifications, and progress records tracked through our academy portal.',
    },
    {
      title: 'Flexible Weekend & Weekday Batches',
      desc: 'Convenient batches designed for school-going children, teens, and working professionals alike.',
    },
    {
      title: 'Holistic Character Growth',
      desc: 'Developing focus, cultural reverence, patience, and artistic excellence through regular practice.',
    },
  ];

  return (
    <section className="bg-[#FAF5F7] py-8 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1650px] px-3 sm:px-8 lg:px-12 xl:px-16">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#8A064D]">
              Why Choose Laasya
            </p>
            <h2 className="mt-2.5 sm:mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#220314]">
              An Environment Where Art &amp; Tradition Flourish
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#6E3955]">
              Every child has an innate rhythm. We provide the mentorship, stage, and guidance
              to bring it alive.
            </p>
          </div>
        </Reveal>

        <div className="mt-6 sm:mt-14 grid gap-2.5 sm:gap-6 grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 70}>
              <div className="h-full rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white p-3.5 sm:p-7 shadow-warm transition-transform hover:-translate-y-1">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gold-gradient text-xs sm:text-sm font-bold text-[#220314] shadow-gold">
                  0{i + 1}
                </div>
                <h3 className="mt-2.5 sm:mt-4 font-display text-xs sm:text-lg lg:text-xl font-bold text-[#220314] leading-snug">
                  {pillar.title}
                </h3>
                <p className="mt-1.5 sm:mt-2 text-[10.5px] sm:text-sm leading-relaxed text-[#59424F] line-clamp-3 sm:line-clamp-none">
                  {pillar.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Gallery() {
  return (
    <section id="gallery" className="scroll-mt-20 py-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1650px] px-3 sm:px-8 lg:px-12 xl:px-16">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#8A064D]">
              Gallery Showcase
            </p>
            <h2 className="mt-2 sm:mt-3 font-display text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#220314]">
              Moments of Creation &amp; Performance
            </h2>
            <p className="mt-2 sm:mt-4 text-xs sm:text-base text-[#6E3955]">
              Where practice meets presentation — glimpses of life at Laasya.
            </p>
          </div>
        </Reveal>

        {/* Bento Grid: Left card on desktop, compact 2-column photos on mobile */}
        <div className="mt-6 sm:mt-14 grid gap-2.5 sm:gap-6 grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left card */}
          <div className="lg:col-span-5 h-full">
            <Reveal delay={100}>
              <div className="group relative h-full min-h-[220px] sm:min-h-[460px] lg:min-h-[580px] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 shadow-warm bg-white">
                <img
                  src="/images/unr05952.jpg"
                  alt="Classical dance student stretching and posing"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Reveal>
          </div>

          {/* Right column: 2 side-by-side on top + 1 wide banner on bottom */}
          <div className="lg:col-span-7 flex flex-col gap-2.5 sm:gap-6 justify-between">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-6">
              <Reveal delay={160}>
                <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 shadow-warm aspect-[4/3] bg-white">
                  <img
                    src="/images/unr05837.jpg"
                    alt="Classical dance mudras"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </Reveal>
              <Reveal delay={220}>
                <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 shadow-warm aspect-[4/3] bg-white">
                  <img
                    src="/images/unr05149.jpg"
                    alt="Student dancer in traditional costume"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </Reveal>
            </div>

            {/* Bottom wide performance banner */}
            <Reveal delay={280}>
              <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 shadow-warm aspect-[16/8] sm:aspect-[16/7.5] flex-1 bg-white">
                <img
                  src="/images/krishna_dance.jpg"
                  alt="Krishnarpanam Annual Stage Performance"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-stage-gradient py-8 sm:py-16 lg:py-20">
      <Reveal>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Ready to Begin Your Artistic Journey?
          </h2>
          <p className="mt-3 sm:mt-4 text-white/85 text-sm sm:text-base md:text-lg">
            Enrollments are open for all 18 cultural art and fitness
            disciplines. Let's unleash your child's hidden talents together.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="#programs"
              className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-8 py-3.5 text-xs sm:text-sm font-bold text-[#220314] shadow-gold transition-transform hover:scale-[1.05]"
            >
              View Available Batches
            </a>
            <a
              href="#faculty"
              className="inline-flex items-center justify-center rounded-full border border-white/70 px-8 py-3.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#220314]"
            >
              Meet Our Gurus
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Contact({ contactProfile }: { contactProfile?: PublicAcademyProfile }) {
  const wa = contactProfile?.whatsapp_number || '+91 8151 998 899';
  const cleanWa = wa.replace(/\D/g, '');
  const campusAddress = contactProfile?.campus_address || 'VV Maple Hub, 2nd Floor above Mayura Bakery, Doddabanahalli Kannamangala, Bangalore 560115';
  const addressLines = campusAddress.split(',').map(s => s.trim()).filter(Boolean);

  // Filter public office contacts to exclude developer number and avoid duplicate WhatsApp display
  const otherContacts = (contactProfile?.contacts || []).filter(
    (c: any) => c && c.phone && !c.phone.includes('7780763121') && !c.phone.includes(wa)
  );

  const emailList = (contactProfile?.emails || []).map(e => e.email).filter(Boolean);
  const displayEmails = emailList.length > 0 ? emailList : ['admin@laasyaacademy.com'];
  const mapUrl = contactProfile?.map_url || 'https://maps.app.goo.gl/BXwHcSPeUzExxR6V7';

  return (
    <section id="contact" className="scroll-mt-20 py-6 sm:py-20 lg:py-24 bg-[#FAF5F7]">
      <div className="mx-auto max-w-[1650px] px-3 sm:px-8 lg:px-12 xl:px-16">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#8A064D]">
              Get In Touch
            </p>
            <h2 className="mt-2 sm:mt-3 font-display text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#220314]">
              Visit Our Campus
            </h2>
            <p className="mt-2 sm:mt-4 text-xs sm:text-base text-[#6E3955]">
              We invite you to tour our academy studio, meet the teachers, and
              choose the perfect art forms for your child.
            </p>
          </div>
        </Reveal>

        {/* Contact Info Cards: Compact & mobile-friendly */}
        <div className="mt-6 sm:mt-14 grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-3">
          {/* Card 1: Academy Address */}
          <Reveal delay={0}>
            <div className="h-full rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white p-4 sm:p-8 text-center shadow-warm flex flex-col justify-between">
              <div>
                <span className="mx-auto flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-[#220314]" />
                </span>
                <h3 className="mt-3 sm:mt-4 font-display text-base sm:text-xl font-bold text-[#220314]">
                  Academy Address
                </h3>
                <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                  {addressLines.map((line, idx) => (
                    <p key={idx} className="text-xs sm:text-sm text-[#6E3955]">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Phone & WhatsApp */}
          <Reveal delay={100}>
            <div className="h-full rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white p-4 sm:p-8 text-center shadow-warm flex flex-col justify-between">
              <div>
                <span className="mx-auto flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-[#220314]" />
                </span>
                <h3 className="mt-3 sm:mt-4 font-display text-base sm:text-xl font-bold text-[#220314]">
                  Phone &amp; WhatsApp
                </h3>
                <div className="mt-2.5 sm:mt-3 space-y-2">
                  <a
                    href={`https://wa.me/${cleanWa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs sm:text-sm transition-colors border border-emerald-300 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366]" />
                    <span>WhatsApp: {wa}</span>
                  </a>
                  {otherContacts.map((c: any, idx: number) => (
                    <p key={idx} className="text-xs sm:text-sm text-[#6E3955]">
                      <span className="font-semibold text-[#8A064D]">{c.title}:</span>{' '}
                      <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="hover:underline font-mono">
                        {c.phone}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Card 3: Email Inquiries */}
          <Reveal delay={200}>
            <div className="h-full rounded-2xl sm:rounded-3xl border border-[#D4BAC7]/70 bg-white p-4 sm:p-8 text-center shadow-warm flex flex-col justify-between">
              <div>
                <span className="mx-auto flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-[#220314]" />
                </span>
                <h3 className="mt-3 sm:mt-4 font-display text-base sm:text-xl font-bold text-[#220314]">
                  Email Inquiries
                </h3>
                <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                  {displayEmails.map((emailStr, idx) => (
                    <a
                      key={idx}
                      href={`mailto:${emailStr}`}
                      className="mt-0.5 sm:mt-1 block text-xs sm:text-sm font-medium text-[#8A064D] hover:underline"
                    >
                      {emailStr}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Interactive Google Maps View Section */}
        <Reveal delay={200}>
          <div className="mt-5 sm:mt-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4BAC7] sm:border-2 bg-white shadow-xl">
            {/* Map Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-6 bg-[#3d0c34] text-white">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold shrink-0">
                  <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-[#220314]" />
                </span>
                <div>
                  <h3 className="font-display text-sm sm:text-xl font-bold text-[#fbf0b9]">
                    Laasya Cultural Academy · Campus Location
                  </h3>
                  <p className="text-[0.68rem] sm:text-xs text-white/80 line-clamp-1 sm:line-clamp-none">
                    {campusAddress}
                  </p>
                </div>
              </div>

              {/* Direct Maps Link Button */}
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-gold-gradient px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-[#220314] shadow-gold hover:scale-[1.03] transition-transform shrink-0 self-start sm:self-auto"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </a>
            </div>

            {/* Google Maps Embed Iframe */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full min-h-[220px] sm:min-h-[380px] bg-[#FAF5F7]">
              <iframe
                title="Laasya Cultural Academy Campus Google Map"
                src="https://maps.google.com/maps?q=Laasya+Cultural+Academy,+VV+Maple+Hub,+Kannamangala,+Bangalore+560115&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ contactProfile }: { contactProfile?: PublicAcademyProfile }) {
  const wa = contactProfile?.whatsapp_number || '+91 8151 998 899';
  const cleanWa = wa.replace(/\D/g, '');
  const publicContacts = (contactProfile?.contacts || []).filter(
    (c: any) => c && c.phone && !c.phone.includes('7780763121')
  );
  const emails = contactProfile?.emails || [{ title: 'Official Inquiries', email: 'admin@laasyaacademy.com' }];
  const campusAddress = contactProfile?.campus_address || 'VV Maple Hub, 2nd Floor, Kannamangala, Bangalore 560115';

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/share/1Dvap6Up7t/',
      hoverBg: 'hover:bg-[#1877F2] hover:border-[#1877F2]',
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/laasyaculturalacademy?igsh=dWV2dnhiemFlMW13',
      hoverBg: 'hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:border-transparent',
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@laasyaculturalacademy?si=XXlr_gTbFxFuvK6N',
      hoverBg: 'hover:bg-[#FF0000] hover:border-[#FF0000]',
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      href: `https://wa.me/${cleanWa}`,
      hoverBg: 'hover:bg-[#25D366] hover:border-[#25D366]',
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-[#2a0624] pb-6 sm:pb-8 pt-7 sm:pt-16 text-white border-t border-white/10">
      <div className="mx-auto max-w-[1650px] px-4 sm:px-8 lg:px-12 xl:px-16 grid gap-6 sm:gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Socials */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <img
                src="/images/laasya_logo.png"
                alt="Laasya Cultural Academy logo"
                className="h-10 w-10 sm:h-14 sm:w-14 object-contain rounded-full bg-white/10 p-1 shrink-0"
              />
              <div>
                <p className="font-display text-base sm:text-lg font-bold text-[#fbf0b9] leading-tight">
                  Laasya Cultural Academy
                </p>
                <p className="text-[0.52rem] sm:text-[0.6rem] font-medium uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[#e8c078]">
                  Unleash Your Talent
                </p>
              </div>
            </div>
            <p className="mt-2.5 sm:mt-4 text-xs sm:text-sm leading-snug sm:leading-relaxed text-white/75 line-clamp-2 sm:line-clamp-none">
              Bangalore's premier fine arts sanctuary delivering authentic mastery in Classical Dance, Vocal Music, Instruments, Visual Arts, and Martial Arts.
            </p>
          </div>

          {/* Social Media Links */}
          <div className="mt-4 sm:mt-6">
            <p className="hidden sm:block text-xs font-semibold uppercase tracking-wider text-[#fbf0b9]/90 mb-3">
              Follow &amp; Connect With Us
            </p>
            <div className="flex items-center gap-2 sm:gap-2.5">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.name}
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/85 shadow-sm transition-all duration-300 hover:scale-110 hover:text-white hover:shadow-lg ${s.hoverBg}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links (Hidden on mobile per UI request; displayed on desktop) */}
        <div className="hidden md:block">
          <h3 className="font-display text-sm sm:text-base font-semibold text-[#fbf0b9] border-b border-white/10 pb-2">
            Quick Links
          </h3>
          <ul className="mt-4 space-y-2.5 text-xs sm:text-sm">
            {[
              { label: 'Home', href: '/#home' },
              { label: 'About Us', href: '/#story' },
              { label: 'Courses & Batches', href: '/#programs' },
              { label: 'Our Gurus', href: '/#faculty' },
              { label: 'Contact & Campus Map', href: '/contact' },
              { label: 'Portals & App Login', href: '/login' },
            ].map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-white/75 transition-colors hover:text-[#fbf0b9] hover:translate-x-1 inline-block transform duration-150"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Art Disciplines (Hidden on mobile per UI request; displayed on desktop) */}
        <div className="hidden md:block">
          <h3 className="font-display text-sm sm:text-base font-semibold text-[#fbf0b9] border-b border-white/10 pb-2">
            Art Disciplines
          </h3>
          <ul className="mt-4 space-y-2 text-xs sm:text-sm text-white/75">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8c078] shrink-0" />
              <span>Bharatanatyam, Kuchipudi, Mohiniyattam</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8c078] shrink-0" />
              <span>Carnatic Classical Vocal &amp; Western Music</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8c078] shrink-0" />
              <span>Keyboard, Piano, Violin &amp; Guitar</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8c078] shrink-0" />
              <span>Traditional Drawing, Sketching &amp; Oil Painting</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8c078] shrink-0" />
              <span>Karate, Kalaripayattu &amp; Yoga</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8c078] shrink-0" />
              <span>Chess &amp; Strategic Mind Sports</span>
            </li>
          </ul>
        </div>

        {/* Timings & WhatsApp Banner (Hidden on mobile per UI request; displayed on desktop) */}
        <div className="hidden md:block">
          <h3 className="font-display text-sm sm:text-base font-semibold text-[#fbf0b9] border-b border-white/10 pb-2">
            Campus Timings &amp; Visits
          </h3>
          <div className="mt-4 space-y-2 text-xs sm:text-sm text-white/75">
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <p className="font-semibold text-white">Monday – Friday</p>
              <p className="text-white/80">08:30 AM – 08:30 PM</p>
              <div className="my-2 border-t border-white/10" />
              <p className="font-semibold text-white">Saturday &amp; Sunday</p>
              <p className="text-white/80">07:30 AM – 08:30 PM</p>
            </div>
            <a
              href={`https://wa.me/${cleanWa}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#20ba59] transition-all cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Instant WhatsApp Inquiry</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar with all registered academy contacts displayed */}
      <div className="mx-auto mt-6 sm:mt-12 max-w-[1650px] px-4 sm:px-8 lg:px-12 xl:px-16 border-t border-white/10 pt-4 sm:pt-6">
        {/* Dynamic Registered Academy Contacts from Admin Profile */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-y-2.5 gap-x-6 text-xs text-white/80 pb-3 sm:pb-4 border-b border-white/10 mb-3 sm:mb-4">
          {/* Mobile Clean Contact Bar (< md) */}
          <div className="flex md:hidden flex-col items-center gap-2.5 w-full text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href="/contact"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold-gradient text-[#220314] font-bold text-xs shadow-gold hover:scale-105 transition"
              >
                <MapPin className="h-3 w-3" />
                <span>Contact &amp; Campus Map</span>
              </a>
              <a
                href={`https://wa.me/${cleanWa}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white font-bold text-xs hover:bg-[#20ba59] transition"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp Us</span>
              </a>
            </div>
            <p className="text-[11px] text-white/70 line-clamp-1">
              📍 {campusAddress}
            </p>
          </div>

          {/* Desktop Full Contact Row (>= md) */}
          <div className="hidden md:flex flex-wrap items-center justify-start gap-x-4 gap-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e8c078]">Official Contacts:</span>
            <a
              href="/contact"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-gradient text-[#220314] font-bold text-[11px] shadow-gold hover:scale-105 transition"
            >
              <MapPin className="h-3 w-3" />
              <span>Contact Page</span>
            </a>
            <a
              href={`https://wa.me/${cleanWa}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[#25D366] hover:underline font-semibold"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp: {wa}</span>
            </a>
            {publicContacts.map((c: any, i: number) => (
              <span key={`btm-c-${i}`} className="inline-flex items-center gap-1.5 text-white/90">
                <span className="text-white/40">•</span>
                <span className="text-[#fbf0b9] font-medium">{c.title}:</span>
                <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="hover:underline font-mono">
                  {c.phone}
                </a>
              </span>
            ))}
            {emails.map((e: any, i: number) => (
              <span key={`btm-e-${i}`} className="inline-flex items-center gap-1.5 text-white/90">
                <span className="text-white/40">•</span>
                <span className="text-[#fbf0b9] font-medium">{e.title}:</span>
                <a href={`mailto:${e.email}`} className="hover:underline">
                  {e.email}
                </a>
              </span>
            ))}
          </div>
          <div className="hidden md:block text-[11px] text-white/70 text-right shrink-0">
            <span>📍 {campusAddress}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left text-xs text-white/60">
          <p className="text-[11px] sm:text-xs">
            &copy; {new Date().getFullYear()} <span className="text-[#fbf0b9] font-medium">Laasya Cultural Academy</span>. All rights reserved. Unleash Your Talent.
          </p>
          {/* Desktop social text links (hidden on mobile to prevent duplicate repetition) */}
          <div className="hidden md:flex flex-wrap items-center justify-center gap-4 text-xs">
            <a
              href="https://www.facebook.com/share/1Dvap6Up7t/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#fbf0b9] transition-colors"
            >
              Facebook
            </a>
            <span className="text-white/30">•</span>
            <a
              href="https://www.instagram.com/laasyaculturalacademy?igsh=dWV2dnhiemFlMW13"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#fbf0b9] transition-colors"
            >
              Instagram
            </a>
            <span className="text-white/30">•</span>
            <a
              href="https://youtube.com/@laasyaculturalacademy?si=XXlr_gTbFxFuvK6N"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#fbf0b9] transition-colors"
            >
              YouTube
            </a>
            <span className="text-white/30">•</span>
            <a
              href={`https://wa.me/${cleanWa}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#25D366] hover:underline font-semibold transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

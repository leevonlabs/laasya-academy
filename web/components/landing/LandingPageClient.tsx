'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import {
  Stats,
  Story,
  WhyUs,
  Gallery,
  CtaBanner,
  Contact,
  Footer,
} from './Sections';
import { Programs, type CourseItem, type BatchItem } from './Programs';
import { Faculty, type TrainerItem } from './Faculty';
import { AppShowcase } from './AppShowcase';
import { EnquiryProvider } from './EnquiryContext';
import { EnquiryModal } from './EnquiryModal';
import { AiChatWidget } from './AiChatWidget';

interface LandingPageClientProps {
  initialCourses?: CourseItem[];
  initialBatches?: BatchItem[];
  initialTrainers?: TrainerItem[];
}

export default function LandingPageClient({
  initialCourses,
  initialBatches,
  initialTrainers,
}: LandingPageClientProps) {
  return (
    <EnquiryProvider>
      <div className="landing-page-root min-h-screen bg-[#FAF5F7] text-[#220314] selection:bg-[#8A064D] selection:text-white">
        <Navbar />
        <main>
          <Hero />
          <Stats />
          <Story />
          <AppShowcase />
          <Programs initialCourses={initialCourses} initialBatches={initialBatches} />
          <Faculty initialTrainers={initialTrainers} />
          <WhyUs />
          <Gallery />
          <CtaBanner />
          <Contact />
        </main>
        <Footer />
        <EnquiryModal />
        <AiChatWidget />
      </div>
    </EnquiryProvider>
  );
}

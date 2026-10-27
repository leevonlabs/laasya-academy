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
import type { PublicAcademyProfile } from '@/lib/academy';

interface LandingPageClientProps {
  initialCourses?: CourseItem[];
  initialBatches?: BatchItem[];
  initialTrainers?: TrainerItem[];
  contactProfile?: PublicAcademyProfile;
}

export default function LandingPageClient({
  initialCourses,
  initialBatches,
  initialTrainers,
  contactProfile,
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
          <Contact contactProfile={contactProfile} />
        </main>
        <Footer contactProfile={contactProfile} />
        <EnquiryModal whatsappNumber={contactProfile?.whatsapp_number} />
        <AiChatWidget 
          whatsappNumber={contactProfile?.whatsapp_number} 
          campusAddress={contactProfile?.campus_address} 
        />
      </div>
    </EnquiryProvider>
  );
}

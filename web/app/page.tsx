import React from 'react';
import LandingPageClient from '@/components/landing/LandingPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laasya Cultural Academy | Unleash Your Talent | Bangalore',
  description: 'Premier cultural education academy in Bangalore since 2022. Offering 18 structured programs in Classical Dance, Carnatic Music, Instruments, Fine Arts, Martial Arts, Yoga, and Chess.',
  keywords: [
    'Laasya Cultural Academy',
    'Bharatanatyam Bangalore',
    'Carnatic Music Kannamangala',
    'Drawing Art Classes Bangalore',
    'Karate Kalaripayattu Bangalore',
    'Music Academy Seegehalli',
    'Chess Coaching Bangalore'
  ],
};

export default function HomePage() {
  return <LandingPageClient />;
}

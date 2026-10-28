import React from 'react';
import type { Metadata } from 'next';
import { getPublicAcademyProfile } from '@/lib/academy';
import { ContactPageClient } from '@/components/contact/ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us & Campus Location | Laasya Cultural Academy',
  description:
    'Visit Laasya Cultural Academy at VV Maple Hub, Kannamangala, Bangalore. Check studio hours, phone numbers, WhatsApp admissions, and interactive campus map.',
  keywords: [
    'Laasya Cultural Academy Contact',
    'Kannamangala Dance Academy',
    'Bangalore Classical Music School',
    'Laasya Campus Address',
  ],
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContactPage() {
  const contactProfile = await getPublicAcademyProfile().catch(() => ({
    full_name: 'Laasya Cultural Academy',
    designation: 'Academy Administration',
    whatsapp_number: '+91 8151 998 899',
    contacts: [{ title: 'Office Desk & Admissions', phone: '+91 8151 998 899' }],
    emails: [{ title: 'Official Inquiries', email: 'admin@laasyaacademy.com' }],
    campus_address: 'VV Maple Hub, 2nd Floor, Kannamangala, Bangalore 560115',
    map_url: 'https://maps.app.goo.gl/BXwHcSPeUzExxR6V7',
  }));

  return <ContactPageClient contactProfile={contactProfile} />;
}

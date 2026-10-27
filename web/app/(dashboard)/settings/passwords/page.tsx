import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStudentPasswords, getGuruPasswords } from '@/lib/passwords';
import SettingsClient from '@/components/settings/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function PasswordsSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect(user?.role === 'receptionist' ? '/reception-profile' : '/login');
  }

  const [students, gurus] = await Promise.all([
    getStudentPasswords(),
    getGuruPasswords()
  ]);

  return (
    <SettingsClient 
      initialSection="passwords" 
      initialStudents={students} 
      initialGurus={gurus} 
    />
  );
}

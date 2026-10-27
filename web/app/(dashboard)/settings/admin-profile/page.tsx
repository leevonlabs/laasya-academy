import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStudentPasswords, getGuruPasswords } from '@/lib/passwords';
import SettingsClient from '@/components/settings/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminProfileSettingsPage() {
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
      initialSection="admin-profile" 
      initialStudents={students} 
      initialGurus={gurus} 
    />
  );
}

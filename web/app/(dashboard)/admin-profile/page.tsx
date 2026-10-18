import React from 'react';
import { getStudentPasswords, getGuruPasswords } from '@/lib/passwords';
import SettingsClient from '@/components/settings/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
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

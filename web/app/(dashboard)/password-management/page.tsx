import React from 'react';
import { getStudentPasswords, getGuruPasswords } from '@/lib/passwords';
import SettingsClient from '@/components/settings/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function PasswordManagementPage() {
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

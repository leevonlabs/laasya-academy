import React from 'react';
import { getStudentPasswords, getGuruPasswords } from '@/lib/passwords';
import SettingsClient from '@/components/settings/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [students, gurus] = await Promise.all([
    getStudentPasswords(),
    getGuruPasswords()
  ]);

  return <SettingsClient initialStudents={students} initialGurus={gurus} />;
}

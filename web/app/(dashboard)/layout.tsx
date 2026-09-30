import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Route protection: If not logged in as owner, redirect to login
  if (!user || user.role !== 'owner') {
    redirect('/login');
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}

import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ActiveLoginsClient from '@/components/active-logins/ActiveLoginsClient';

export const dynamic = 'force-dynamic';

export default async function ActiveLoginsPage() {
  const user = await getCurrentUser();
  if (!user || !['owner', 'admin', 'developer'].includes(user.role?.toLowerCase())) {
    redirect(user?.role === 'receptionist' ? '/reception-profile' : '/login');
  }

  return <ActiveLoginsClient />;
}

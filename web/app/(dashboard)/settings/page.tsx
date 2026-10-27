import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SettingsRootPage() {
  const user = await getCurrentUser();
  if (user?.role === 'receptionist') {
    redirect('/reception-profile');
  }
  redirect('/admin-profile');
}

import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import ReceptionProfileClient from '@/components/reception/ReceptionProfileClient';

export const dynamic = 'force-dynamic';

export default async function ReceptionProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // If user is receptionist, fetch by user.userId; if owner, fetch first or active receptionist or allow viewing
  let receptionist = null;
  if (user.role === 'receptionist') {
    receptionist = await queryOne<any>(`
      SELECT id, full_name, age, phone, alternative_phone, email, address, allowed_pages, is_active, monthly_salary, created_at, updated_at
      FROM public.receptionists
      WHERE id = $1
    `, [user.userId]);
  } else if (user.role === 'owner') {
    receptionist = await queryOne<any>(`
      SELECT id, full_name, age, phone, alternative_phone, email, address, allowed_pages, is_active, monthly_salary, created_at, updated_at
      FROM public.receptionists
      ORDER BY created_at DESC
      LIMIT 1
    `);
  }

  if (!receptionist) {
    // Fallback info if no record found
    receptionist = {
      id: user.userId,
      full_name: user.fullName || 'Receptionist',
      phone: user.email?.split('@')[0] || '',
      email: user.email,
      age: 26,
      alternative_phone: '9848022338',
      address: 'Main Front Desk, Laasya Cultural Academy, Hyderabad',
      allowed_pages: user.allowedPages || ['/overview', '/schedule', '/attendance', '/students', '/fees'],
      is_active: true,
      monthly_salary: 20000,
      created_at: new Date().toISOString()
    };
  }

  const salaries = await query<any>(`
    SELECT id, receptionist_id, month_year, amount, status, payment_date, payment_mode, notes, created_at
    FROM public.receptionist_salaries
    WHERE receptionist_id = $1
    ORDER BY created_at DESC
  `, [receptionist.id]);

  return (
    <ReceptionProfileClient 
      receptionist={receptionist}
      salaries={salaries}
      currentUserRole={user.role}
    />
  );
}

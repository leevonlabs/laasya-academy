import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import ReceptionClient from '@/components/reception/ReceptionClient';

export const dynamic = 'force-dynamic';

export default async function ReceptionSalariesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    redirect('/overview');
  }

  const receptionists = await query<any>(`
    SELECT id, full_name, age, phone, alternative_phone, email, address, password_hash, allowed_pages, is_active, monthly_salary, created_at, updated_at
    FROM public.receptionists
    ORDER BY created_at DESC
  `);

  const salaries = await query<any>(`
    SELECT 
      s.id,
      s.receptionist_id,
      s.month_year,
      s.amount,
      s.status,
      s.payment_date,
      s.payment_mode,
      s.notes,
      s.created_at,
      r.full_name as receptionist_name,
      r.phone as receptionist_phone,
      r.email as receptionist_email,
      r.monthly_salary
    FROM public.receptionist_salaries s
    JOIN public.receptionists r ON s.receptionist_id = r.id
    ORDER BY s.created_at DESC
  `);

  return (
    <ReceptionClient 
      initialReceptionists={receptionists} 
      initialSalaries={salaries}
      defaultTab="salaries"
    />
  );
}

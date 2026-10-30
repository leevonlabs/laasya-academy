import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import GuruSalarySlipViewClient from '@/components/finance/GuruSalarySlipViewClient';

export const dynamic = 'force-dynamic';

export default async function SalarySlipPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    redirect('/login');
  }

  const params = await searchParams;
  const voucherId = typeof params.id === 'string' ? params.id : '';
  const month = typeof params.month === 'string' ? params.month : '';
  const guruName = typeof params.guruName === 'string' ? params.guruName : '';
  const vNo = typeof params.vNo === 'string' ? params.vNo : '';

  return (
    <div className="max-w-6xl mx-auto py-4">
      <GuruSalarySlipViewClient 
        voucherId={voucherId}
        month={month}
        guruName={guruName}
        vNo={vNo}
      />
    </div>
  );
}

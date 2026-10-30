import React from 'react';
import GuruSalarySlipViewClient from '@/components/finance/GuruSalarySlipViewClient';

export const dynamic = 'force-dynamic';

export default async function SalarySlipPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const voucherId = typeof params.id === 'string' ? params.id : '';
  const month = typeof params.month === 'string' ? params.month : '';
  const guruName = typeof params.guruName === 'string' ? params.guruName : '';
  const vNo = typeof params.vNo === 'string' ? params.vNo : '';

  return (
    <div className="min-h-screen bg-[#FDF8FA] py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <GuruSalarySlipViewClient 
          voucherId={voucherId}
          month={month}
          guruName={guruName}
          vNo={vNo}
        />
      </div>
    </div>
  );
}

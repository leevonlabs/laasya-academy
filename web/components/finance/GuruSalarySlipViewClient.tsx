'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Building, 
  Phone, 
  Mail, 
  ExternalLink 
} from 'lucide-react';

interface Props {
  voucherId: string;
  month?: string;
  guruName?: string;
  vNo?: string;
}

export default function GuruSalarySlipViewClient({
  voucherId,
  month = '',
  guruName = '',
  vNo = ''
}: Props) {
  const [downloading, setDownloading] = useState(false);

  const pdfUrl = `/api/finance/salaries/pdf?voucherId=${encodeURIComponent(voucherId)}&month=${encodeURIComponent(month)}&guruName=${encodeURIComponent(guruName)}&voucherNumber=${encodeURIComponent(vNo)}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Salary_Slip_${(guruName || 'Guru').replace(/[^a-zA-Z0-9_-]/g, '_')}_${(month || 'Payroll').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#F0D5E4] shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/salaries"
            className="p-2.5 rounded-2xl bg-[#FFF9FB] hover:bg-[#FCE7F3] text-[#8A064D] border border-[#F0D5E4] transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Salaries</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Settled Payment Slip
              </span>
              {month && (
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                  {month}
                </span>
              )}
            </div>
            <h1 className="text-lg font-black text-[#2D041A] tracking-tight mt-0.5">
              {guruName ? `${guruName} — Official Payslip` : 'Guru Honorarium & Salary Slip'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Download PDF Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4.5 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#F9E33A]" />
            <span>{downloading ? 'Preparing PDF...' : 'Download PDF'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print</span>
          </button>

          {/* Open Raw PDF Button */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-medium transition flex items-center justify-center shadow-xs"
            title="Open Full PDF in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF Viewer Frame */}
      <div className="bg-white rounded-3xl border border-[#F0D5E4] overflow-hidden shadow-xs p-2">
        <iframe
          src={pdfUrl}
          className="w-full h-[82vh] rounded-2xl border border-gray-100 bg-white shadow-inner"
          title="Official Guru Salary Slip PDF"
        />
      </div>

      {/* Footer Info Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 px-4 py-2 bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]/60 print:hidden">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-700">Laasya Cultural Academy</span>
          <span>•</span>
          <span>Society Reg. No: REG/HYD/2018/84920</span>
        </div>
        <div className="flex items-center gap-4 mt-1 sm:mt-0">
          <span>Official Admissions Desk: +91 8151 998 899</span>
          <span>•</span>
          <span>Hyderabad & Bangalore Campuses</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Banknote, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Printer, 
  Download, 
  Layers, 
  FileText,
  Building,
  User,
  X
} from 'lucide-react';
import { AVAILABLE_MODULES } from './ReceptionClient';

interface Props {
  receptionist: any;
  salaries: any[];
  currentUserRole: string;
}

export default function ReceptionProfileClient({ receptionist, salaries, currentUserRole }: Props) {
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  const allowedPagesSet = new Set<string>(
    Array.isArray(receptionist.allowed_pages) 
      ? receptionist.allowed_pages 
      : typeof receptionist.allowed_pages === 'string'
        ? JSON.parse(receptionist.allowed_pages || '[]')
        : []
  );

  const accessibleModules = AVAILABLE_MODULES.filter(m => 
    allowedPagesSet.has(m.href) || allowedPagesSet.has(m.label)
  );

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#590231] via-[#750341] to-[#8A064D] text-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#F9E33A]/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 md:w-20 md:h-20 rounded-2xl bg-[#F9E33A] text-[#590231] font-black flex items-center justify-center text-2xl md:text-3xl shadow-md border-2 border-white/30 shrink-0">
              {receptionist.full_name?.slice(0, 2)?.toUpperCase() || 'RC'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-[#F9E33A] text-[#590231] text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full">
                  Front Desk Receptionist
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  receptionist.is_active !== false 
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' 
                    : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${receptionist.is_active !== false ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {receptionist.is_active !== false ? 'Active Account' : 'Inactive'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {receptionist.full_name}
              </h1>
              <p className="text-white/70 text-xs mt-1 flex items-center gap-2">
                <span>Laasya Cultural Academy Front Office</span>
                <span>•</span>
                <span>ID: {receptionist.id?.slice(0, 8)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUserRole === 'owner' && (
              <Link
                href="/reception"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <span>Manage All Staff</span>
              </Link>
            )}
            <div className="bg-[#420124]/60 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/10 text-right">
              <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Monthly Salary</p>
              <p className="text-lg font-black text-[#F9E33A]">
                ₹{(Number(receptionist.monthly_salary) || 20000).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs">
            <h3 className="text-sm font-extrabold text-[#2A0418] uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#8A064D]" />
              <span>Personal & Contact Info</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Full Name</p>
                <p className="font-bold text-gray-900 mt-0.5">{receptionist.full_name}</p>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Age</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  {receptionist.age ? `${receptionist.age} Years` : 'Not specified'}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Primary Contact</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <a href={`tel:${receptionist.phone}`} className="font-bold text-gray-900 hover:text-[#8A064D]">
                    {receptionist.phone}
                  </a>
                </div>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Alternative Contact</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-bold text-gray-900">
                    {receptionist.alternative_phone || 'None provided'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Email Address</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
                  <span className="font-bold text-gray-900 truncate">
                    {receptionist.email || `${receptionist.phone}@laasyaacademy.com`}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Residential Address</p>
                <div className="flex items-start gap-2 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-gray-700">
                    {receptionist.address || 'Front Office Desk, Laasya Cultural Academy, Hyderabad'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Account Status</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] mt-1 ${
                  receptionist.is_active !== false 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{receptionist.is_active !== false ? 'Active & Permitted' : 'Access Suspended'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Academy Role Notice */}
          <div className="bg-[#FFF2F8] rounded-3xl p-5 border border-[#F0D5E4] text-xs text-[#590231]">
            <div className="flex items-center gap-2 font-black mb-1">
              <ShieldCheck className="w-4 h-4 text-[#8A064D]" />
              <span>Reception Authorization</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#70043E]">
              This account has verified front desk access to handle student communications, daily schedules, fees, and assigned administrative modules as designated by the Academy Director.
            </p>
          </div>
        </div>

        {/* Right Columns: Permitted Modules & Salary History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Permitted Modules Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#2A0418] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#8A064D]" />
                  <span>Permitted Pages & Modules ({accessibleModules.length})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pages accessible under your assigned receptionist permissions:
                </p>
              </div>
            </div>

            {accessibleModules.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4 text-center">
                No custom pages assigned yet. Please contact the Academy Director.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accessibleModules.map(mod => {
                  const Icon = mod.icon;
                  return (
                    <Link
                      key={mod.href}
                      href={mod.href}
                      className="group p-3.5 rounded-2xl border border-gray-100 hover:border-[#8A064D]/30 bg-gray-50/60 hover:bg-[#FFF2F8] transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white group-hover:bg-[#8A064D] text-[#8A064D] group-hover:text-white flex items-center justify-center border border-gray-200 group-hover:border-[#8A064D] transition shrink-0 shadow-2xs">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 group-hover:text-[#8A064D] transition">
                            {mod.label}
                          </p>
                          <p className="text-[10px] text-gray-400 line-clamp-1">
                            {mod.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#8A064D] transition shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Salary Notices & Pay Slips */}
          <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#2A0418] uppercase tracking-wider flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[#8A064D]" />
                  <span>Salary Notices & Pay Slips ({salaries.length})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Monthly compensation notices and payment slips issued by the academy:
                </p>
              </div>
            </div>

            {salaries.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-700">No salary notices issued yet.</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Monthly salary slips will appear here once released by administration.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {salaries.map(sal => (
                  <div 
                    key={sal.id}
                    className="p-4 rounded-2xl border border-[#F0D5E4] bg-white hover:bg-[#FFF2F8]/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-xs shrink-0">
                        ₹
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-gray-900">
                            {sal.month_year}
                          </p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            sal.status === 'Paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sal.status || 'Issued'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Paid via {sal.payment_mode || 'Bank Transfer'} • Date: {sal.payment_date || new Date(sal.created_at).toISOString().split('T')[0]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        <p className="text-xs font-black text-[#590231]">
                          ₹{Number(sal.amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Net Pay</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSlip(sal)}
                        className="h-8 px-3 rounded-xl bg-[#FFF2F8] hover:bg-[#FFE5F0] text-[#8A064D] border border-[#F0D5E4] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Slip</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay Slip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 print:m-0 print:border-none print:shadow-none">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#590231] to-[#8A064D] text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F9E33A]" />
                <h3 className="text-sm font-black tracking-wide uppercase">Official Salary Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Content */}
            <div className="p-6 space-y-6">
              <div className="text-center pb-4 border-b border-gray-200">
                <h2 className="text-lg font-black text-[#590231] tracking-tight">
                  LAASYA CULTURAL ACADEMY
                </h2>
                <p className="text-[11px] text-gray-500">
                  Front Desk Staff Monthly Compensation Notice
                </p>
                <span className="inline-block mt-2 bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-3 py-1 rounded-full text-xs font-black">
                  Salary Notice for {selectedSlip.month_year}
                </span>
              </div>

              {/* Staff Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">Staff Name</p>
                  <p className="font-bold text-gray-900 mt-0.5">{receptionist.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">Designation</p>
                  <p className="font-bold text-gray-900 mt-0.5">Front Desk Receptionist</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">Contact Number</p>
                  <p className="font-bold text-gray-900 mt-0.5">{receptionist.phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">Payment Mode</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedSlip.payment_mode || 'Bank Transfer'}</p>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Base Monthly Salary:</span>
                  <span className="font-bold text-gray-900">₹{Number(selectedSlip.amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Allowances & Incentives:</span>
                  <span className="font-bold text-gray-900">₹0.00</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Deductions:</span>
                  <span className="font-bold text-gray-900">₹0.00</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-200 text-sm font-black">
                  <span className="text-[#590231]">Total Net Disbursed:</span>
                  <span className="text-emerald-700">₹{Number(selectedSlip.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {selectedSlip.notes && (
                <div className="bg-[#FFFDF7] p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold mb-0.5">Remarks / Notice:</p>
                  <p>{selectedSlip.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
                <span>Authorized Signature: Academy Director</span>
                <span>Status: {selectedSlip.status || 'Paid'}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintSlip}
                className="px-4 py-2 rounded-xl bg-[#590231] text-white hover:bg-[#750341] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

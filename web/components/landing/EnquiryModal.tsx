'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, MessageCircle, Trash2, Calendar, User, Phone, Sparkles } from 'lucide-react';
import { useEnquiry } from './EnquiryContext';

export function EnquiryModal() {
  const {
    isModalOpen,
    closeEnquiryModal,
    selectedBatches,
    removeBatch,
    clearBatches,
  } = useEnquiry();

  const [studentName, setStudentName] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      setErrorMsg('Please enter student name.');
      return;
    }
    if (!contact.trim() || contact.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit contact number.');
      return;
    }

    setErrorMsg('');

    // Construct formatted WhatsApp message
    let message = `*Admissions Enquiry — Laasya Cultural Academy*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 *Student Name:* ${studentName.trim()}\n`;
    message += `⚧ *Gender:* ${gender}\n`;
    if (age.trim()) {
      message += `🎂 *Age:* ${age.trim()} years\n`;
    }
    message += `📞 *Contact Phone:* ${contact.trim()}\n`;

    if (selectedBatches.length > 0) {
      message += `\n📚 *Selected Courses & Batches (${selectedBatches.length}):*\n`;
      selectedBatches.forEach((b, idx) => {
        message += `${idx + 1}. *${b.courseTitle}* — ${b.name}`;
        if (b.trainerName) message += ` (Guru: ${b.trainerName})`;
        if (b.monthlyFee) message += ` [₹${b.monthlyFee}/mo]`;
        message += `\n`;
      });
    } else {
      message += `\n📚 *Enquiry:* General admission & course exploration\n`;
    }

    if (note.trim()) {
      message += `\n💬 *Additional Note:* ${note.trim()}\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Please provide admission details, fee breakdown, and schedule confirmation.`;

    const waUrl = `https://wa.me/918151998899?text=${encodeURIComponent(message)}`;

    setSubmitted(true);
    window.open(waUrl, '_blank');

    setTimeout(() => {
      setSubmitted(false);
      closeEnquiryModal();
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-in fade-in"
      onClick={closeEnquiryModal}
    >
      <div
        className="relative max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-3xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#FAF2F6] via-[#FDF8FA] to-[#F5EBF1] p-5 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeEnquiryModal}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[#220314] hover:bg-gray-200 cursor-pointer transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-gradient text-2xl shadow-gold shrink-0">
            ✍️
          </span>
          <div>
            <h3 className="font-display text-2xl font-bold text-[#220314]">
              Send Admission Enquiry
            </h3>
            <p className="text-xs text-[#6E3955]">
              Direct enquiry to Academy Admin WhatsApp (+91 8151 998 899)
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="my-10 text-center animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="font-display text-xl font-bold text-[#220314]">
              Enquiry Form Submitted!
            </h4>
            <p className="mt-2 text-sm text-[#6E3955]">
              WhatsApp has been opened with your pre-filled enquiry. Our admin will get back to you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Selected Batches Box */}
            <div className="rounded-2xl border border-[#D4BAC7]/70 bg-[#FAF5F7] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A064D] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Selected Batches ({selectedBatches.length})
                </span>
                {selectedBatches.length > 0 && (
                  <button
                    type="button"
                    onClick={clearBatches}
                    className="text-[0.7rem] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedBatches.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {selectedBatches.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#D4BAC7]/60 bg-white p-2.5 shadow-sm text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#220314] truncate">
                          {b.courseTitle} · <span className="text-[#8A064D]">{b.name}</span>
                        </p>
                        <p className="text-[0.7rem] text-[#6E3955] truncate">
                          {b.trainerName ? `Guru: ${b.trainerName}` : 'Academy Mentor'}
                          {b.monthlyFee ? ` · ₹${b.monthlyFee}/month` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBatch(b.id)}
                        className="rounded-lg p-1.5 text-[#6E3955] hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors"
                        title="Remove batch"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-[#6E3955]">
                  <p className="font-semibold text-[#220314]">No batches selected yet.</p>
                  <p className="text-[0.7rem] mt-0.5">
                    You can select batches directly from the Courses section, or proceed with a general enquiry below.
                  </p>
                </div>
              )}
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-[#220314] mb-1">
                Student Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E3955]" />
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-[#D4BAC7] bg-white py-2.5 pl-10 pr-4 text-sm text-[#220314] focus:border-[#8A064D] focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20"
                />
              </div>
            </div>

            {/* Gender and Age Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#220314] mb-1">
                  Gender
                </label>
                <div className="flex gap-2">
                  {(['Female', 'Male', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                        gender === g
                          ? 'bg-[#8A064D] text-white shadow-sm'
                          : 'border border-[#D4BAC7] bg-white text-[#6E3955] hover:border-[#8A064D]/50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#220314] mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="3"
                  max="99"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-[#D4BAC7] bg-white py-2.5 px-3.5 text-sm text-[#220314] focus:border-[#8A064D] focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-[#220314] mb-1">
                Contact Phone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E3955]" />
                <input
                  type="tel"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder=""
                  className="w-full rounded-xl border border-[#D4BAC7] bg-white py-2.5 pl-10 pr-4 text-sm text-[#220314] focus:border-[#8A064D] focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20"
                />
              </div>
            </div>

            {/* Additional Note */}
            <div>
              <label className="block text-xs font-bold text-[#220314] mb-1">
                Additional Questions or Note (Optional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder=""
                className="w-full rounded-xl border border-[#D4BAC7] bg-white p-3 text-sm text-[#220314] focus:border-[#8A064D] focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-3.5 text-sm font-bold text-[#220314] shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 fill-[#220314]" />
                <span>Submit Enquiry via WhatsApp</span>
              </button>
              <p className="mt-2 text-center text-[0.7rem] text-[#6E3955]">
                Opens WhatsApp with pre-filled enquiry to Laasya Academy desk (+91 8151 998 899).
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

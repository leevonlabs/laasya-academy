import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Laasya Cultural Academy',
  description: 'Terms and Conditions of Enrollment and Digital Portal Use for Laasya Cultural Academy.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FDF8FA] text-[#1F2937] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-[#F0D5E4] p-6 sm:p-10">
        <div className="border-b border-[#F0D5E4] pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-3 h-8 bg-[#8A064D] rounded-full inline-block"></span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#590231]">
              Terms &amp; Conditions
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Last Updated: October 2026 • Official Terms of Enrollment &amp; Service
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-[#374151]">
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Laasya Cultural Academy mobile applications (Android and iOS) or web management portal, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions and our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              2. User Roles &amp; Authenticated Access
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Disciple &amp; Student Portal:</strong> Reserved exclusively for enrolled students and registered parents/guardians to review schedules, track attendance, download fee receipts, and receive real-time class conclusion pickup chimes.
              </li>
              <li>
                <strong>Guru &amp; Faculty Portal:</strong> Strictly restricted to verified faculty members for taking daily roll calls, managing course curricula, and publishing class completion notices.
              </li>
              <li>
                Users must safeguard their login credentials and not share accounts across differing roles.
              </li>
            </ul>
          </section>

          <section className="bg-[#FFF5F8] border border-[#F0D5E4] rounded-xl p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-bold text-[#8A064D] mb-2">
              3. Class Completion Alerts &amp; Parental Pickup Responsibilities
            </h2>
            <p className="mb-2">
              Our academy utilizes an automated notification alert with a custom audio chime when an instructor concludes a class session:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Gurus take classroom attendance and conclude each batch session by triggering the &ldquo;Class Completed&rdquo; alert.</li>
              <li>Parents and guardians are expected to arrive punctually upon receiving the class completion notification to collect their child safely from the studio premises.</li>
              <li>The Academy maintains secure studio facilities during class hours; parents are responsible for timely child transportation following class conclusion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              4. Tuition Fees, Billing &amp; Receipts
            </h2>
            <p>
              Academy tuition fees must be remitted punctually as per the student&apos;s enrolled course schedule. Official digital tax invoices and payment vouchers are automatically generated and made available for PDF download through the disciple payments tab.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              5. Intellectual Property &amp; Video Library
            </h2>
            <p>
              Choreography, classical instructional recordings, theory syllabus, and academy stage performance footage made available via the digital vault remain the exclusive intellectual property of Laasya Cultural Academy and may not be copied, broadcast, or republished without written authorization.
            </p>
          </section>

          <section className="border-t border-[#F0D5E4] pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              6. Contact Information
            </h2>
            <div className="bg-[#FAF5F7] p-4 rounded-xl border border-[#F0D5E4] text-xs sm:text-sm space-y-1">
              <p className="font-bold text-[#590231]">Laasya Cultural Academy</p>
              <p>VV Maple Hub, 2nd Floor, Kannamangala, Bengaluru, Karnataka - 560067</p>
              <p>Email: <a href="mailto:info@laasyaacademy.com" className="text-[#8A064D] underline font-semibold">info@laasyaacademy.com</a></p>
              <p>Phone: +91 81519 98899 / +91 98480 12345</p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-[#F0D5E4] flex justify-between items-center text-xs text-[#6B7280]">
          <Link href="/privacy" className="text-[#8A064D] hover:underline font-semibold">
            ← View Privacy Policy
          </Link>
          <p>© {new Date().getFullYear()} Laasya Cultural Academy. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

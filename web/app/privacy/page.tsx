import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Laasya Cultural Academy',
  description: 'Official Privacy Policy of Laasya Cultural Academy covering child safety, class pickup vocal chimes, and data protection.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDF8FA] text-[#1F2937] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-[#F0D5E4] p-6 sm:p-10">
        <div className="border-b border-[#F0D5E4] pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-3 h-8 bg-[#8A064D] rounded-full inline-block"></span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#590231]">
              Laasya Cultural Academy Privacy Policy
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Last Updated: October 2026 • Compliant with Google Play & Apple App Store Guidelines
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-[#374151]">
          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              1. Institutional Overview & Scope
            </h2>
            <p>
              Laasya Cultural Academy (&quot;we&quot;, &quot;our&quot;, or &quot;the Academy&quot;) is a premier classical performing arts institution providing accredited training in Bharatanatyam, Kuchipudi, Carnatic Classical Vocal, Western & Classical instruments, and cultural arts. This Privacy Policy governs the collection, processing, and safeguarding of personal data collected through our mobile applications (Android and iOS) and web administration portal.
            </p>
          </section>

          <section className="bg-[#FFF5F8] border border-[#F0D5E4] rounded-xl p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-bold text-[#8A064D] mb-2 flex items-center gap-2">
              <span>🔔</span> 2. Class Completion Audio Alerts & Child Pickup Notifications
            </h2>
            <p className="mb-2">
              To guarantee child safety and timely pickup from our academy studios, our mobile application implements time-critical notification services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Vocal Pickup Chime:</strong> When an assigned Guru concludes a class session by pressing &ldquo;Class Completed&rdquo;, the system immediately broadcasts an alert accompanied by a custom vocal chime (&ldquo;<em>Class is over, hooray hooray! Parents come and pick us today! Laasya kids are ready to go, come collect your child, hello!</em>&rdquo;).
              </li>
              <li>
                <strong>Audible Notice for Parents:</strong> This audible alert rings on enrolled disciples&apos; and parents&apos; devices to notify them that the scheduled class has ended and to collect their child from the academy premises safely.
              </li>
              <li>
                <strong>No Battery Drain / No Background Tracking:</strong> The application does not require a permanent background service or invasive background tracking. The alerts rely on standard Google Play (FCM / WorkManager) and Apple (APNs / UNUserNotificationCenter) notification protocols.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              3. Protection of Minor Disciples (COPPA, GDPR-K & Indian DPDP Act)
            </h2>
            <p className="mb-2">
              A significant number of disciples studying classical fine arts at our academy are minors under the age of 18:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Accounts for minor disciples are authorized exclusively by registered parents/guardians during academy enrollment.</li>
              <li>Disciple records (full name, roll number, guardian mobile number, batch schedule, and attendance logs) are utilized strictly for educational purposes and physical campus safety.</li>
              <li>We never sell, rent, license, or monetize disciple or family data to any third party.</li>
              <li>We do not display child contact information publicly and do not permit behavioral ad tracking.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              4. Information Collected
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Account Credentials:</strong> Student Roll Number, Registered Mobile Number, and encrypted authentication passwords.</li>
              <li><strong>Disciple Profile:</strong> Full name, age, gender, guardian name, registered telephone number, and course batch enrollments.</li>
              <li><strong>Attendance & Academic Records:</strong> Class session timestamps, attendance check-in status (Present/Absent), and course progression marked by faculty Gurus.</li>
              <li><strong>Profile Media:</strong> Optional user-uploaded avatar photographs for academy identification.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              5. Device Permissions & Transparency
            </h2>
            <p className="mb-2">
              Our mobile applications request only necessary permissions compliant with Google Play and Apple App Store policies:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Notifications (POST_NOTIFICATIONS):</strong> Used solely to alert parents when a class concludes, deliver live roll-call confirmations, and broadcast academy circulars.</li>
              <li><strong>Camera (Optional):</strong> Used only when taking a profile photo or scanning classroom QR check-ins.</li>
              <li><strong>Photos / Media (Optional):</strong> Used strictly for selecting profile photos and downloading fee receipts/invoices.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              6. Data Security & Encryption
            </h2>
            <p>
              Data is transmitted using TLS/SSL encryption and stored in SOC2/ISO-certified cloud data centers with AES-256 encryption at rest. Strict Row-Level Security (RLS) ensures that disciples and parents access only their personal enrollment data.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              7. User Rights & Data Deletion
            </h2>
            <p>
              Parents and disciples may review, update, or request the complete deletion of their account records at any time upon leaving the academy. To request data deletion, contact our administration desk.
            </p>
          </section>

          <section className="border-t border-[#F0D5E4] pt-6">
            <h2 className="text-base sm:text-lg font-bold text-[#590231] mb-2">
              8. Grievance Officer & Academy Contact
            </h2>
            <div className="bg-[#FAF5F7] p-4 rounded-xl border border-[#F0D5E4] text-xs sm:text-sm space-y-1">
              <p className="font-bold text-[#590231]">Laasya Cultural Academy</p>
              <p>VV Maple Hub, 2nd Floor, Kannamangala, Bengaluru, Karnataka - 560067</p>
              <p>Email: <a href="mailto:privacy@laasyaacademy.com" className="text-[#8A064D] underline font-semibold">privacy@laasyaacademy.com</a> / <a href="mailto:info@laasyaacademy.com" className="text-[#8A064D] underline font-semibold">info@laasyaacademy.com</a></p>
              <p>Telephone: +91 81519 98899 / +91 98480 12345</p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-[#F0D5E4] flex justify-between items-center text-xs text-[#6B7280]">
          <Link href="/terms" className="text-[#8A064D] hover:underline font-semibold">
            View Terms &amp; Conditions →
          </Link>
          <p>© {new Date().getFullYear()} Laasya Cultural Academy. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

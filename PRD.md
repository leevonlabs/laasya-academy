# PRD: Laasya Academy ERP - Reliable Notifications Architecture

## Task 1: Fix Database Realtime & RLS Policies [COMPLETED]
Resolve the Supabase Realtime blockage so events are delivered over WebSocket.
- [x] Add an `anon` SELECT policy to `public.session_alerts` in Supabase PostgreSQL.
- [x] Add `public.announcements` to the `supabase_realtime` publication.
- [x] Test query with unauthenticated client to ensure rows and realtime change payloads are received.

## Task 2: Consolidate Mobile Notification Services (Ponytail Cleanup) [COMPLETED]
Eliminate duplicate listeners, competing timers, and fragmented deduplication keys.
- [x] Merge `SessionAlertListener.dart` and `AlarmService.dart` into a single `NotificationService.dart`.
- [x] Unify the deduplication key to `laasya_notif_seen_<id>` across Dart and Android SharedPreferences.
- [x] Expand startup alert freshness window to 30 minutes in `StudentMainScaffold` and `TrainerMainScaffold`.

## Task 3: Fix Android Native Notification Channel & Background Reliability [COMPLETED]
Align `MainActivity.kt` and `LaasyaAlertService.kt` with clean system notification behavior.
- [x] Use dynamic backend URL matching `ApiConstants.baseUrl` instead of hardcoding production Vercel.
- [x] Configure notification channels with system ringtone and vibration (`laasya_classes` and `laasya_announcements`).
- [x] Add `AlarmManager` resurrection on `onTaskRemoved` so notifications survive when closed from slides.
- [x] Ensure notification taps deep-link directly to `/attendance` (for classes/attendance) and `/messages` (for announcements).

## Task 4: Enforce Strict Role-Based Rules [COMPLETED]
Ensure Guru and Student logins behave according to business logic.
- [x] Student Login: Receives class completion alerts and personal attendance confirmations.
- [x] Guru Login: Receives official academy announcements and circular notices. NEVER plays student pickup alarms or class concluded alerts.

## Task 5: End-to-End Verification Across App States [COMPLETED]
Verify notification delivery and test criteria across operational states:
- [x] Database policies and publication verification.
- [x] Mobile build and lint verification (zero warnings/errors).
- [x] API endpoint response check (Next.js build succeeded with 50 routes).

## Task 6: Guru Production Data Synchronization (No Mocks) [COMPLETED]
Eliminate all mock/random course & batch fallbacks and connect Guru portal to live database:
- [x] Removed 700 lines of hardcoded mock courses/students in `trainer_data_store.dart`.
- [x] Fixed `api/trainer/batches/route.ts` to match trainer by UUID, phone, or name, and removed random fallback batch generation.
- [x] Fixed `api/finance/trainer-salaries/route.ts` to pull real records from `public.guru_salary_records`.
- [x] Fixed `mobile-login` fallback counts (`?? 0` instead of `|| 1`).
- [x] Ensured role `trainer` is sent in login and trainer ID is propagated in all queries.

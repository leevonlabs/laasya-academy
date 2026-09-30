# Laasya Cultural Academy (లాస్య సాంస్కృతిక అకాడమి)
## Complete Academy Management System

A multi-role Academy Management System tailored for traditional and contemporary performing arts, music, martial arts, and mind sports.

* **Slogan**: *"Unlock Your Talent"*
* **Official Website**: `www.laasyaacademy.com`
* **Color Palette**: Deep Berry Plum (`#8A064D`), Dark Wine Plum (`#590231`), Radiant Cultural Gold (`#F9E33A`), Warm Cream (`#FFF9FB`).

---

## Architecture & Repositories

### 1. Database & Backend (`supabase/`)
* **Database**: PostgreSQL hosted on Supabase (Project ID: `bhpqzrcohjigkkpmcdsy`).
* **Tables (8)**: `profiles`, `courses`, `trainers`, `students`, `batches`, `batch_enrollments`, `class_sessions`, `attendance`.
* **Seed Data**: Preloaded with all **18 Academy courses** (Classical Dance, Modern & Fitness, Vocal & Music, Musical Instruments, Martial Arts, Fine Arts & Mind Sports).
* **Security**: Row Level Security (RLS) active on all tables. Students have zero direct write permission on attendance; student check-ins are verified exclusively via the secure PostgreSQL function `student_self_check_in(p_session_id, p_code)`.

### 2. Owner Web Portal (`web/`)
* **Technology**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide icons.
* **Live Local Server**: `http://localhost:3000`
* **Director Credentials**:
  - **Email**: `director@laasyaacademy.com`
  - **Password**: `Laasya@Owner2026`
* **Key Features**:
  - **Overview**: Academy KPI cards, live session monitor, discipline charts.
  - **Courses**: 18-course catalog with search, category filtering, and interactive fee/duration editor.
  - **Trainers**: Faculty directory, art discipline tags, batch counts, new instructor registration.
  - **Students**: Student roster with roll numbers (`LCA-XXXXX`), parent contacts, batch enrollments.
  - **Batches**: Weekly recurring slots, hall allocations, student capacity progress bars.
  - **Schedule**: Real-time class session runner with the prominent **6-digit Student Check-in PIN**.
  - **Attendance**: Complete audit log with status badges (`present`, `absent`, `late`) and **CSV export**.
  - **Settings**: Brand color swatches and Supabase connection status.

### 3. Mobile Application (`mobile/`)
* **Technology**: Flutter, Dart, Supabase Flutter SDK (`supabase_flutter`).
* **Roles**:
  - **Trainer**: Daily schedule, active batch rosters, start class session, display 6-digit PIN, 1-tap single/bulk attendance marking.
  - **Student**: Enrolled disciplines, self check-in via 6-digit PIN keypad, attendance percentage progress ring, and personal attendance history log.
* **Test Accounts Pre-configured**:
  - **Trainer**: `radhika.dance@laasyaacademy.com` / `Trainer@123`
  - **Student**: `ananya.rao@example.com` / `Student@123`

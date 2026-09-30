# Laasya Cultural Academy - Supabase Database Setup Guide

This folder contains the complete database foundation for the **Laasya Cultural Academy** management system.

---

## Files Overview

1. [migrations/20261001000001_initial_schema.sql](file:///d:/laasya%20academy/supabase/migrations/20261001000001_initial_schema.sql):
   * Creates 8 core tables: `profiles`, `courses`, `trainers`, `students`, `batches`, `batch_enrollments`, `class_sessions`, `attendance`.
   * Sets up foreign keys, cascading rules, `CHECK` constraints, and performance indexes.
   * Auto-creates user profiles on `auth.users` signup.

2. [migrations/20261001000002_row_level_security.sql](file:///d:/laasya%20academy/supabase/migrations/20261001000002_row_level_security.sql):
   * Enables PostgreSQL Row Level Security (RLS) across all tables.
   * Restricts trainers strictly to their assigned batches.
   * Prevents students from directly modifying attendance.
   * Provides the secure RPC function `student_self_check_in(p_session_id, p_code)`.

3. [migrations/20261001000003_seed_courses.sql](file:///d:/laasya%20academy/supabase/migrations/20261001000003_seed_courses.sql):
   * Seeds all 18 official Academy courses from the catalog with codes, categories, and monthly fees.

4. [complete_setup.sql](file:///d:/laasya%20academy/supabase/complete_setup.sql):
   * Combined single-file version of all 3 migrations for 1-click execution in Supabase Dashboard.

---

## How to Apply to Your Supabase Project

### Method 1: Via Supabase Dashboard SQL Editor (Easiest & Recommended)
1. Open your browser and navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Select your **Laasya Cultural Academy** project.
3. In the left navigation menu, click on the **SQL Editor** icon (shaped like a terminal/code bracket `>_`).
4. Click **New Query** (top left).
5. Open [complete_setup.sql](file:///d:/laasya%20academy/supabase/complete_setup.sql), copy the entire contents, and paste it into the query editor.
6. Click the green **Run** button (or press `Ctrl + Enter`).
7. You should see `Success. No rows returned` in the output panel.
8. Go to the **Table Editor** in the left menu to verify all 8 tables and the 18 preloaded courses!

---

### Method 2: Applying Migrations Sequentially
If you prefer running individual migration files step-by-step:
1. Run [20261001000001_initial_schema.sql](file:///d:/laasya%20academy/supabase/migrations/20261001000001_initial_schema.sql) first.
2. Run [20261001000002_row_level_security.sql](file:///d:/laasya%20academy/supabase/migrations/20261001000002_row_level_security.sql) second.
3. Run [20261001000003_seed_courses.sql](file:///d:/laasya%20academy/supabase/migrations/20261001000003_seed_courses.sql) third.

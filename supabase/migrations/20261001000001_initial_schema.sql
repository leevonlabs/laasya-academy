-- ==============================================================================
-- LAASYA CULTURAL ACADEMY (లాస్య సాంస్కృతిక అకాడమి)
-- Migration 01: Initial Schema (Tables, Constraints, Indexes & Triggers)
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Common Utility Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'trainer', 'student')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN (
    'Classical Dance',
    'Modern Dance & Fitness',
    'Vocal & Music',
    'Musical Instruments',
    'Martial Arts',
    'Fine Arts',
    'Mind Sports'
  )),
  description TEXT,
  duration_months INT DEFAULT 12,
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_fee >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses(is_active);

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. TRAINERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  specializations TEXT[] DEFAULT '{}',
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trainers_profile_id ON public.trainers(profile_id);
CREATE INDEX IF NOT EXISTS idx_trainers_is_active ON public.trainers(is_active);

CREATE TRIGGER set_trainers_updated_at
  BEFORE UPDATE ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. STUDENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE,
  parent_name TEXT,
  emergency_contact TEXT,
  date_of_birth DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. BATCHES TABLE (Recurring class slots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  days_of_week TEXT[] NOT NULL DEFAULT '{}', -- e.g. ARRAY['Monday', 'Wednesday']
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_or_hall TEXT DEFAULT 'Main Hall',
  max_capacity INT NOT NULL DEFAULT 20 CHECK (max_capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_batch_schedule_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_batches_course_id ON public.batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_trainer_id ON public.batches(trainer_id);
CREATE INDEX IF NOT EXISTS idx_batches_is_active ON public.batches(is_active);

CREATE TRIGGER set_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 8. BATCH ENROLLMENTS TABLE (Students in Batches)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'dropped')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_batch_student_enrollment UNIQUE (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_batch_id ON public.batch_enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.batch_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.batch_enrollments(status);

CREATE TRIGGER set_batch_enrollments_updated_at
  BEFORE UPDATE ON public.batch_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 9. CLASS SESSIONS TABLE (Individual class instances)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE RESTRICT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  check_in_code TEXT, -- 6-digit PIN or dynamic token generated by trainer
  session_topic_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_batch_session_slot UNIQUE (batch_id, session_date, start_time),
  CONSTRAINT check_session_schedule_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_sessions_batch_id ON public.class_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_trainer_id ON public.class_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON public.class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.class_sessions(status);

CREATE TRIGGER set_class_sessions_updated_at
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 10. ATTENDANCE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIMESTAMPTZ,
  check_in_method TEXT DEFAULT 'trainer_manual' CHECK (check_in_method IN ('trainer_manual', 'student_code', 'student_qr')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_session_student_attendance UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

CREATE TRIGGER set_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 11. TRIGGER: Auto-create Profile and Sub-records on User Signup
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  user_full_name TEXT;
BEGIN
  -- Read role from auth metadata, default to 'student'
  assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF assigned_role NOT IN ('owner', 'trainer', 'student') THEN
    assigned_role := 'student';
  END IF;

  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Insert profile
  INSERT INTO public.profiles (id, role, full_name, email, phone)
  VALUES (
    NEW.id,
    assigned_role,
    user_full_name,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone;

  -- Automatically initialize trainer or student entity
  IF assigned_role = 'trainer' THEN
    INSERT INTO public.trainers (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF assigned_role = 'student' THEN
    INSERT INTO public.students (profile_id, roll_number)
    VALUES (NEW.id, 'LCA-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'))
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

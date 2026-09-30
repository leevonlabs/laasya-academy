-- ==============================================================================
-- LAASYA CULTURAL ACADEMY (లాస్య సాంస్కృతిక అకాడమి)
-- COMPLETE DATABASE SETUP SCRIPT (Combined Migrations 01 + 02 + 03)
-- You can run this entire script at once in the Supabase Dashboard SQL Editor!
-- ==============================================================================

-- ==============================================================================
-- PART 1: EXTENSIONS & UTILITIES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- PART 2: CORE TABLES & INDEXES
-- ==============================================================================

-- 1. PROFILES
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

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. COURSES
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

DROP TRIGGER IF EXISTS set_courses_updated_at ON public.courses;
CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. TRAINERS
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

DROP TRIGGER IF EXISTS set_trainers_updated_at ON public.trainers;
CREATE TRIGGER set_trainers_updated_at
  BEFORE UPDATE ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. STUDENTS
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

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. BATCHES
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  days_of_week TEXT[] NOT NULL DEFAULT '{}',
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

DROP TRIGGER IF EXISTS set_batches_updated_at ON public.batches;
CREATE TRIGGER set_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. BATCH ENROLLMENTS
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

DROP TRIGGER IF EXISTS set_batch_enrollments_updated_at ON public.batch_enrollments;
CREATE TRIGGER set_batch_enrollments_updated_at
  BEFORE UPDATE ON public.batch_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. CLASS SESSIONS
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE RESTRICT,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  check_in_code TEXT,
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

DROP TRIGGER IF EXISTS set_class_sessions_updated_at ON public.class_sessions;
CREATE TRIGGER set_class_sessions_updated_at
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. ATTENDANCE
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

DROP TRIGGER IF EXISTS set_attendance_updated_at ON public.attendance;
CREATE TRIGGER set_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- PART 3: AUTH SIGNUP TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  user_full_name TEXT;
BEGIN
  assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF assigned_role NOT IN ('owner', 'trainer', 'student') THEN
    assigned_role := 'student';
  END IF;

  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_trainer_id()
RETURNS UUID AS $$
  SELECT id FROM public.trainers WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- COURSES POLICIES
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "courses_owner_insert" ON public.courses;
CREATE POLICY "courses_owner_insert" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "courses_owner_update" ON public.courses;
CREATE POLICY "courses_owner_update" ON public.courses FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "courses_owner_delete" ON public.courses;
CREATE POLICY "courses_owner_delete" ON public.courses FOR DELETE TO authenticated USING (public.is_owner());

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (
  public.is_owner()
  OR id = auth.uid()
  OR (
    public.get_current_role() = 'trainer'
    AND id IN (
      SELECT s.profile_id
      FROM public.students s
      JOIN public.batch_enrollments be ON be.student_id = s.id
      JOIN public.batches b ON b.id = be.batch_id
      WHERE b.trainer_id = public.get_current_trainer_id()
    )
  )
  OR (
    public.get_current_role() = 'student'
    AND id IN (
      SELECT t.profile_id
      FROM public.trainers t
      JOIN public.batches b ON b.trainer_id = t.id
      JOIN public.batch_enrollments be ON be.batch_id = b.id
      WHERE be.student_id = public.get_current_student_id()
    )
  )
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (
  public.is_owner() OR id = auth.uid()
) WITH CHECK (
  public.is_owner() OR (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "profiles_owner_delete" ON public.profiles;
CREATE POLICY "profiles_owner_delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_owner());

-- TRAINERS POLICIES
DROP POLICY IF EXISTS "trainers_select_policy" ON public.trainers;
CREATE POLICY "trainers_select_policy" ON public.trainers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "trainers_insert_policy" ON public.trainers;
CREATE POLICY "trainers_insert_policy" ON public.trainers FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "trainers_update_policy" ON public.trainers;
CREATE POLICY "trainers_update_policy" ON public.trainers FOR UPDATE TO authenticated
  USING (public.is_owner() OR profile_id = auth.uid())
  WITH CHECK (public.is_owner() OR profile_id = auth.uid());

DROP POLICY IF EXISTS "trainers_delete_policy" ON public.trainers;
CREATE POLICY "trainers_delete_policy" ON public.trainers FOR DELETE TO authenticated USING (public.is_owner());

-- STUDENTS POLICIES
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
CREATE POLICY "students_select_policy" ON public.students FOR SELECT TO authenticated USING (
  public.is_owner()
  OR profile_id = auth.uid()
  OR (
    public.get_current_role() = 'trainer'
    AND id IN (
      SELECT be.student_id
      FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id
      WHERE b.trainer_id = public.get_current_trainer_id()
    )
  )
);

DROP POLICY IF EXISTS "students_owner_insert" ON public.students;
CREATE POLICY "students_owner_insert" ON public.students FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "students_owner_update" ON public.students;
CREATE POLICY "students_owner_update" ON public.students FOR UPDATE TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "students_owner_delete" ON public.students;
CREATE POLICY "students_owner_delete" ON public.students FOR DELETE TO authenticated USING (public.is_owner());

-- BATCHES POLICIES
DROP POLICY IF EXISTS "batches_select_policy" ON public.batches;
CREATE POLICY "batches_select_policy" ON public.batches FOR SELECT TO authenticated USING (
  public.is_owner()
  OR trainer_id = public.get_current_trainer_id()
  OR id IN (
    SELECT be.batch_id
    FROM public.batch_enrollments be
    WHERE be.student_id = public.get_current_student_id()
  )
);

DROP POLICY IF EXISTS "batches_owner_insert" ON public.batches;
CREATE POLICY "batches_owner_insert" ON public.batches FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "batches_owner_update" ON public.batches;
CREATE POLICY "batches_owner_update" ON public.batches FOR UPDATE TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "batches_owner_delete" ON public.batches;
CREATE POLICY "batches_owner_delete" ON public.batches FOR DELETE TO authenticated USING (public.is_owner());

-- BATCH ENROLLMENTS POLICIES
DROP POLICY IF EXISTS "batch_enrollments_select_policy" ON public.batch_enrollments;
CREATE POLICY "batch_enrollments_select_policy" ON public.batch_enrollments FOR SELECT TO authenticated USING (
  public.is_owner()
  OR batch_id IN (
    SELECT id FROM public.batches WHERE trainer_id = public.get_current_trainer_id()
  )
  OR student_id = public.get_current_student_id()
);

DROP POLICY IF EXISTS "batch_enrollments_owner_insert" ON public.batch_enrollments;
CREATE POLICY "batch_enrollments_owner_insert" ON public.batch_enrollments FOR INSERT TO authenticated WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "batch_enrollments_owner_update" ON public.batch_enrollments;
CREATE POLICY "batch_enrollments_owner_update" ON public.batch_enrollments FOR UPDATE TO authenticated
  USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "batch_enrollments_owner_delete" ON public.batch_enrollments;
CREATE POLICY "batch_enrollments_owner_delete" ON public.batch_enrollments FOR DELETE TO authenticated USING (public.is_owner());

-- CLASS SESSIONS POLICIES
DROP POLICY IF EXISTS "class_sessions_select_policy" ON public.class_sessions;
CREATE POLICY "class_sessions_select_policy" ON public.class_sessions FOR SELECT TO authenticated USING (
  public.is_owner()
  OR trainer_id = public.get_current_trainer_id()
  OR batch_id IN (
    SELECT be.batch_id FROM public.batch_enrollments be
    WHERE be.student_id = public.get_current_student_id()
  )
);

DROP POLICY IF EXISTS "class_sessions_trainer_insert" ON public.class_sessions;
CREATE POLICY "class_sessions_trainer_insert" ON public.class_sessions FOR INSERT TO authenticated WITH CHECK (
  public.is_owner()
  OR (
    trainer_id = public.get_current_trainer_id()
    AND batch_id IN (
      SELECT id FROM public.batches WHERE trainer_id = public.get_current_trainer_id()
    )
  )
);

DROP POLICY IF EXISTS "class_sessions_trainer_update" ON public.class_sessions;
CREATE POLICY "class_sessions_trainer_update" ON public.class_sessions FOR UPDATE TO authenticated
  USING (
    public.is_owner()
    OR trainer_id = public.get_current_trainer_id()
  )
  WITH CHECK (
    public.is_owner()
    OR trainer_id = public.get_current_trainer_id()
  );

DROP POLICY IF EXISTS "class_sessions_owner_delete" ON public.class_sessions;
CREATE POLICY "class_sessions_owner_delete" ON public.class_sessions FOR DELETE TO authenticated USING (public.is_owner());

-- ATTENDANCE POLICIES (STRICT: NO DIRECT STUDENT WRITE)
DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance;
CREATE POLICY "attendance_select_policy" ON public.attendance FOR SELECT TO authenticated USING (
  public.is_owner()
  OR session_id IN (
    SELECT id FROM public.class_sessions WHERE trainer_id = public.get_current_trainer_id()
  )
  OR student_id = public.get_current_student_id()
);

-- Only Owner or Assigned Trainer can insert attendance
DROP POLICY IF EXISTS "attendance_trainer_insert" ON public.attendance;
CREATE POLICY "attendance_trainer_insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (
  public.is_owner()
  OR session_id IN (
    SELECT id FROM public.class_sessions WHERE trainer_id = public.get_current_trainer_id()
  )
);

-- Only Owner or Assigned Trainer can update attendance
DROP POLICY IF EXISTS "attendance_trainer_update" ON public.attendance;
CREATE POLICY "attendance_trainer_update" ON public.attendance FOR UPDATE TO authenticated
  USING (
    public.is_owner()
    OR session_id IN (
      SELECT id FROM public.class_sessions WHERE trainer_id = public.get_current_trainer_id()
    )
  )
  WITH CHECK (
    public.is_owner()
    OR session_id IN (
      SELECT id FROM public.class_sessions WHERE trainer_id = public.get_current_trainer_id()
    )
  );

DROP POLICY IF EXISTS "attendance_owner_delete" ON public.attendance;
CREATE POLICY "attendance_owner_delete" ON public.attendance FOR DELETE TO authenticated USING (public.is_owner());

-- ==============================================================================
-- PART 5: SECURE STUDENT SELF CHECK-IN RPC FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.student_self_check_in(
  p_session_id UUID,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_student_id UUID;
  v_batch_id UUID;
  v_session_date DATE;
  v_session_status TEXT;
  v_correct_code TEXT;
  v_is_enrolled BOOLEAN;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
  -- 1. Identify current student
  SELECT id INTO v_student_id
  FROM public.students
  WHERE profile_id = auth.uid();

  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only registered students can check in.'
    );
  END IF;

  -- 2. Fetch session details
  SELECT batch_id, session_date, status, check_in_code
  INTO v_batch_id, v_session_date, v_session_status, v_correct_code
  FROM public.class_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Class session not found.'
    );
  END IF;

  -- 3. Verify session is currently active
  IF v_session_status != 'in_progress' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Check-in is only allowed when class is in progress.'
    );
  END IF;

  -- 4. Verify today's date
  IF v_session_date != CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session date does not match today.'
    );
  END IF;

  -- 5. Verify batch enrollment
  SELECT EXISTS (
    SELECT 1 FROM public.batch_enrollments
    WHERE batch_id = v_batch_id
      AND student_id = v_student_id
      AND status = 'active'
  ) INTO v_is_enrolled;

  IF NOT v_is_enrolled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You are not actively enrolled in this batch.'
    );
  END IF;

  -- 6. Verify PIN / QR code
  IF v_correct_code IS NULL OR TRIM(UPPER(v_correct_code)) != TRIM(UPPER(p_code)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid check-in code. Please check with your trainer.'
    );
  END IF;

  -- 7. Record Attendance securely
  INSERT INTO public.attendance (
    session_id,
    student_id,
    status,
    check_in_time,
    check_in_method
  )
  VALUES (
    p_session_id,
    v_student_id,
    'present',
    v_now,
    'student_code'
  )
  ON CONFLICT (session_id, student_id) DO UPDATE
  SET status = 'present',
      check_in_time = v_now,
      check_in_method = 'student_code',
      updated_at = v_now;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Checked in successfully! Attendance marked as Present.',
    'check_in_time', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.student_self_check_in(UUID, TEXT) TO authenticated;

-- ==============================================================================
-- PART 6: SEED DATA (18 ACADEMY COURSES)
-- ==============================================================================
INSERT INTO public.courses (title, code, category, description, duration_months, monthly_fee, is_active)
VALUES
  -- Classical Dance
  ('Bharathanatyam', 'LCA-BN01', 'Classical Dance', 'Traditional Indian classical dance form originating in Tamil Nadu, emphasizing footwork, expressions (Abhinaya), and mudras.', 12, 2000.00, true),
  ('Kuchupudi', 'LCA-KP01', 'Classical Dance', 'Renowned classical dance tradition of Andhra Pradesh, blending rhythmic footwork, storytelling, and fluid movements.', 12, 2000.00, true),
  ('Mohiniyatam', 'LCA-MY01', 'Classical Dance', 'Classical dance of Kerala characterized by graceful, swaying body movements and delicate expressions.', 12, 2000.00, true),
  ('Semi Classical', 'LCA-SC01', 'Classical Dance', 'A blend of pure classical techniques with contemporary rhythms and modern expressive dance choreography.', 6, 1800.00, true),

  -- Modern Dance & Fitness
  ('Western Dance', 'LCA-WD01', 'Modern Dance & Fitness', 'Dynamic choreography covering Hip-Hop, Contemporary, Freestyle, and Jazz dance routines.', 6, 1800.00, true),
  ('Zumba', 'LCA-ZB01', 'Modern Dance & Fitness', 'High-energy aerobic fitness dance program incorporating Latin and international rhythms for cardio and toning.', 3, 1500.00, true),
  ('Yoga', 'LCA-YG01', 'Modern Dance & Fitness', 'Holistic mind and body wellness practice encompassing Asanas, Pranayama breathing, flexibility, and meditation.', 6, 1500.00, true),
  ('Gymnastic', 'LCA-GM01', 'Modern Dance & Fitness', 'Fundamental acrobatic training, balance, agility, flexibility, and core strength conditioning for young learners.', 12, 2200.00, true),

  -- Vocal & Music
  ('Carnatic Music', 'LCA-CM01', 'Vocal & Music', 'Traditional South Indian classical vocal training, covering Swaras, Ragas, Talas, Geethams, and Varnams.', 12, 2000.00, true),

  -- Musical Instruments
  ('Keyboard', 'LCA-KB01', 'Musical Instruments', 'Western electronic keyboard training covering finger drills, staff notation, chords, scales, and popular melodies.', 12, 2200.00, true),
  ('Guitar', 'LCA-GT01', 'Musical Instruments', 'Acoustic and classical guitar fundamentals, rhythm strums, chord transitions, fingerpicking, and song accompaniment.', 12, 2200.00, true),
  ('Ukulele', 'LCA-UK01', 'Musical Instruments', 'Fun and accessible 4-string Hawaiian instrument training, focusing on quick chords, rhythmic strumming, and singing along.', 6, 1800.00, true),
  ('Violin', 'LCA-VN01', 'Musical Instruments', 'Disciplined bowed string instrument training in Carnatic or Western styles, bowing techniques, and intonation.', 12, 2500.00, true),

  -- Martial Arts
  ('Kalari', 'LCA-KL01', 'Martial Arts', 'Kalaripayattu, the ancient martial art of Kerala, known for its flexibility routines (Meipayattu), strikes, and defense.', 12, 2000.00, true),
  ('Karatte', 'LCA-KT01', 'Martial Arts', 'Traditional martial arts focusing on self-defense, discipline, punches, kicks, belt gradings, and Katas.', 12, 1800.00, true),

  -- Fine Arts & Mind Sports
  ('Drawing', 'LCA-DR01', 'Fine Arts', 'Foundation sketching, pencil shading, color theory, perspective drawing, and creative visualization.', 6, 1200.00, true),
  ('Art and Craft', 'LCA-AC01', 'Fine Arts', 'Hands-on creative crafts including origami, clay modelling, mixed media painting, DIY decor, and paper art.', 6, 1200.00, true),
  ('Chess', 'LCA-CH01', 'Mind Sports', 'Strategic mind sport training covering openings, tactics, middle-game positioning, endgame mastery, and tournament preparation.', 6, 1500.00, true)
ON CONFLICT (title) DO UPDATE
SET category = EXCLUDED.category,
    description = EXCLUDED.description,
    duration_months = EXCLUDED.duration_months,
    monthly_fee = EXCLUDED.monthly_fee,
    is_active = EXCLUDED.is_active;

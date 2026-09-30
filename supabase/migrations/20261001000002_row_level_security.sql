-- ==============================================================================
-- LAASYA CULTURAL ACADEMY (లాస్య సాంస్కృతిక అకాడమి)
-- Migration 02: Row Level Security (RLS) Policies & Secure RPC Check-in
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. SECURITY HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Returns current user's role ('owner', 'trainer', 'student')
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns true if current user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns trainer ID for the logged-in user
CREATE OR REPLACE FUNCTION public.get_current_trainer_id()
RETURNS UUID AS $$
  SELECT id FROM public.trainers WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns student ID for the logged-in user
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS UUID AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. COURSES POLICIES
-- ------------------------------------------------------------------------------
-- Everyone (all authenticated users) can view active courses
CREATE POLICY "courses_select_policy"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (true);

-- Only owner can insert, update or delete courses
CREATE POLICY "courses_owner_insert"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "courses_owner_update"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "courses_owner_delete"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 4. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- View profiles:
-- 1. Owner can view all profiles
-- 2. Users can view their own profile
-- 3. Trainers can view student profiles in their assigned batches
-- 4. Students can view trainer profiles who teach their enrolled batches
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR id = auth.uid()
    OR (
      -- Trainer viewing enrolled student profiles
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
      -- Student viewing trainer profiles
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

-- Profile update:
-- 1. Owner can update any profile
-- 2. Users can update their own profile (cannot alter role)
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_owner() OR id = auth.uid()
  )
  WITH CHECK (
    public.is_owner() OR (
      id = auth.uid()
      AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Only owner can delete profiles
CREATE POLICY "profiles_owner_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 5. TRAINERS POLICIES
-- ------------------------------------------------------------------------------
-- Authenticated users can view active trainers
CREATE POLICY "trainers_select_policy"
  ON public.trainers
  FOR SELECT
  TO authenticated
  USING (true);

-- Owner has full modification rights; trainer can update own bio/specializations
CREATE POLICY "trainers_insert_policy"
  ON public.trainers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "trainers_update_policy"
  ON public.trainers
  FOR UPDATE
  TO authenticated
  USING (public.is_owner() OR profile_id = auth.uid())
  WITH CHECK (public.is_owner() OR profile_id = auth.uid());

CREATE POLICY "trainers_delete_policy"
  ON public.trainers
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 6. STUDENTS POLICIES
-- ------------------------------------------------------------------------------
-- Owner sees all; Trainer sees students in their batches; Student sees self
CREATE POLICY "students_select_policy"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
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

-- Only owner can insert, update or delete student records
CREATE POLICY "students_owner_insert"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "students_owner_update"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "students_owner_delete"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 7. BATCHES POLICIES
-- ------------------------------------------------------------------------------
-- Owner sees all batches
-- Trainers only see their assigned batches
-- Students only see batches they are enrolled in
CREATE POLICY "batches_select_policy"
  ON public.batches
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR trainer_id = public.get_current_trainer_id()
    OR id IN (
      SELECT be.batch_id
      FROM public.batch_enrollments be
      WHERE be.student_id = public.get_current_student_id()
    )
  );

-- Only owner can create, modify, or delete batches
CREATE POLICY "batches_owner_insert"
  ON public.batches
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "batches_owner_update"
  ON public.batches
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "batches_owner_delete"
  ON public.batches
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 8. BATCH ENROLLMENTS POLICIES
-- ------------------------------------------------------------------------------
-- Owner sees all enrollments
-- Trainer sees enrollments for their assigned batches
-- Student sees only their own enrollments
CREATE POLICY "batch_enrollments_select_policy"
  ON public.batch_enrollments
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR batch_id IN (
      SELECT id FROM public.batches WHERE trainer_id = public.get_current_trainer_id()
    )
    OR student_id = public.get_current_student_id()
  );

-- Only owner manages enrollments
CREATE POLICY "batch_enrollments_owner_insert"
  ON public.batch_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "batch_enrollments_owner_update"
  ON public.batch_enrollments
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "batch_enrollments_owner_delete"
  ON public.batch_enrollments
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 9. CLASS SESSIONS POLICIES
-- ------------------------------------------------------------------------------
-- Owner sees all sessions
-- Trainer sees sessions for their assigned batches
-- Student sees sessions for their enrolled batches
CREATE POLICY "class_sessions_select_policy"
  ON public.class_sessions
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR trainer_id = public.get_current_trainer_id()
    OR batch_id IN (
      SELECT be.batch_id FROM public.batch_enrollments be
      WHERE be.student_id = public.get_current_student_id()
    )
  );

-- Owner can insert/update any session
-- Trainer can ONLY insert/update sessions for their assigned batches
CREATE POLICY "class_sessions_trainer_insert"
  ON public.class_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_owner()
    OR (
      trainer_id = public.get_current_trainer_id()
      AND batch_id IN (
        SELECT id FROM public.batches WHERE trainer_id = public.get_current_trainer_id()
      )
    )
  );

CREATE POLICY "class_sessions_trainer_update"
  ON public.class_sessions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_owner()
    OR trainer_id = public.get_current_trainer_id()
  )
  WITH CHECK (
    public.is_owner()
    OR trainer_id = public.get_current_trainer_id()
  );

CREATE POLICY "class_sessions_owner_delete"
  ON public.class_sessions
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 10. ATTENDANCE POLICIES (STRICT ATTENDANCE CONTROL)
-- ------------------------------------------------------------------------------
-- SELECT:
-- 1. Owner can view all attendance records
-- 2. Trainer can view attendance records for their assigned sessions
-- 3. Student can ONLY view their own attendance records
CREATE POLICY "attendance_select_policy"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR session_id IN (
      SELECT id FROM public.class_sessions WHERE trainer_id = public.get_current_trainer_id()
    )
    OR student_id = public.get_current_student_id()
  );

-- INSERT:
-- Owner or Trainer assigned to the session ONLY.
-- Notice: NO POLICY FOR STUDENTS! Students CANNOT directly insert into attendance.
CREATE POLICY "attendance_trainer_insert"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_owner()
    OR session_id IN (
      SELECT id FROM public.class_sessions WHERE trainer_id = public.get_current_trainer_id()
    )
  );

-- UPDATE:
-- Owner or Trainer assigned to the session ONLY.
-- Notice: NO POLICY FOR STUDENTS! Students CANNOT directly update attendance to 'present'.
CREATE POLICY "attendance_trainer_update"
  ON public.attendance
  FOR UPDATE
  TO authenticated
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

-- DELETE: Owner only
CREATE POLICY "attendance_owner_delete"
  ON public.attendance
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 11. SECURE RPC: Student Self Check-In Function
-- ------------------------------------------------------------------------------
-- Students check in via this controlled SECURITY DEFINER function.
-- Direct table write permissions are completely blocked for students.
-- This function verifies:
--   1. Caller is an authenticated student
--   2. Student is actively enrolled in this session's batch
--   3. Session is in_progress and session_date matches today
--   4. The 6-digit PIN matches the trainer's active check_in_code
-- ------------------------------------------------------------------------------
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

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.student_self_check_in(UUID, TEXT) TO authenticated;

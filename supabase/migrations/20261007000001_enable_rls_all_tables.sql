-- ==============================================================================
-- LAASYA CULTURAL ACADEMY (లాస్య సాంస్కృతిక అకాడమి)
-- Migration: Enable Row Level Security (RLS) on all public tables & add security policies
-- Resolves Supabase Security Advisory: rls_disabled_in_public
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL 11 REMAINING PUBLIC TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru_salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru_salary_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_reminders ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. POLICIES: ANNOUNCEMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
DROP POLICY IF EXISTS "announcements_owner_insert" ON public.announcements;
DROP POLICY IF EXISTS "announcements_owner_update" ON public.announcements;
DROP POLICY IF EXISTS "announcements_owner_delete" ON public.announcements;

CREATE POLICY "announcements_select_policy"
  ON public.announcements
  FOR SELECT
  USING (
    public.is_owner()
    OR (
      is_deleted = false
      AND status = 'published'
      AND (publish_date IS NULL OR publish_date <= CURRENT_DATE)
    )
  );

CREATE POLICY "announcements_owner_insert"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "announcements_owner_update"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "announcements_owner_delete"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 3. POLICIES: COURSE CATEGORIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "course_categories_select_policy" ON public.course_categories;
DROP POLICY IF EXISTS "course_categories_owner_insert" ON public.course_categories;
DROP POLICY IF EXISTS "course_categories_owner_update" ON public.course_categories;
DROP POLICY IF EXISTS "course_categories_owner_delete" ON public.course_categories;

-- Anyone can view course categories
CREATE POLICY "course_categories_select_policy"
  ON public.course_categories
  FOR SELECT
  USING (true);

CREATE POLICY "course_categories_owner_insert"
  ON public.course_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "course_categories_owner_update"
  ON public.course_categories
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "course_categories_owner_delete"
  ON public.course_categories
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 4. POLICIES: ROOMS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rooms_select_policy" ON public.rooms;
DROP POLICY IF EXISTS "rooms_owner_insert" ON public.rooms;
DROP POLICY IF EXISTS "rooms_owner_update" ON public.rooms;
DROP POLICY IF EXISTS "rooms_owner_delete" ON public.rooms;

-- Authenticated users (trainers, students, owner) can view studio rooms
CREATE POLICY "rooms_select_policy"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rooms_owner_insert"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "rooms_owner_update"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "rooms_owner_delete"
  ON public.rooms
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 5. POLICIES: EXPENSE CATEGORIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "expense_categories_select_policy" ON public.expense_categories;
DROP POLICY IF EXISTS "expense_categories_owner_insert" ON public.expense_categories;
DROP POLICY IF EXISTS "expense_categories_owner_update" ON public.expense_categories;
DROP POLICY IF EXISTS "expense_categories_owner_delete" ON public.expense_categories;

CREATE POLICY "expense_categories_select_policy"
  ON public.expense_categories
  FOR SELECT
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "expense_categories_owner_insert"
  ON public.expense_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "expense_categories_owner_update"
  ON public.expense_categories
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "expense_categories_owner_delete"
  ON public.expense_categories
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 6. POLICIES: EXPENSES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "expenses_select_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_owner_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_owner_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_owner_delete" ON public.expenses;

CREATE POLICY "expenses_select_policy"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "expenses_owner_insert"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "expenses_owner_update"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "expenses_owner_delete"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 7. POLICIES: EXPENSE AUDIT LOGS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "expense_audit_logs_select_policy" ON public.expense_audit_logs;
DROP POLICY IF EXISTS "expense_audit_logs_owner_insert" ON public.expense_audit_logs;
DROP POLICY IF EXISTS "expense_audit_logs_owner_update" ON public.expense_audit_logs;
DROP POLICY IF EXISTS "expense_audit_logs_owner_delete" ON public.expense_audit_logs;

CREATE POLICY "expense_audit_logs_select_policy"
  ON public.expense_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "expense_audit_logs_owner_insert"
  ON public.expense_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "expense_audit_logs_owner_update"
  ON public.expense_audit_logs
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "expense_audit_logs_owner_delete"
  ON public.expense_audit_logs
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 8. POLICIES: GURU SALARY RECORDS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "guru_salary_records_select_policy" ON public.guru_salary_records;
DROP POLICY IF EXISTS "guru_salary_records_owner_insert" ON public.guru_salary_records;
DROP POLICY IF EXISTS "guru_salary_records_owner_update" ON public.guru_salary_records;
DROP POLICY IF EXISTS "guru_salary_records_owner_delete" ON public.guru_salary_records;

CREATE POLICY "guru_salary_records_select_policy"
  ON public.guru_salary_records
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR (trainer_id = public.get_current_trainer_id())
  );

CREATE POLICY "guru_salary_records_owner_insert"
  ON public.guru_salary_records
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "guru_salary_records_owner_update"
  ON public.guru_salary_records
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "guru_salary_records_owner_delete"
  ON public.guru_salary_records
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 9. POLICIES: GURU SALARY ADVANCES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "guru_salary_advances_select_policy" ON public.guru_salary_advances;
DROP POLICY IF EXISTS "guru_salary_advances_insert_policy" ON public.guru_salary_advances;
DROP POLICY IF EXISTS "guru_salary_advances_owner_update" ON public.guru_salary_advances;
DROP POLICY IF EXISTS "guru_salary_advances_owner_delete" ON public.guru_salary_advances;

CREATE POLICY "guru_salary_advances_select_policy"
  ON public.guru_salary_advances
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR (trainer_id = public.get_current_trainer_id())
  );

CREATE POLICY "guru_salary_advances_insert_policy"
  ON public.guru_salary_advances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_owner()
    OR (trainer_id = public.get_current_trainer_id())
  );

CREATE POLICY "guru_salary_advances_owner_update"
  ON public.guru_salary_advances
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "guru_salary_advances_owner_delete"
  ON public.guru_salary_advances
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 10. POLICIES: STUDENT FEE INVOICES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "student_fee_invoices_select_policy" ON public.student_fee_invoices;
DROP POLICY IF EXISTS "student_fee_invoices_owner_insert" ON public.student_fee_invoices;
DROP POLICY IF EXISTS "student_fee_invoices_owner_update" ON public.student_fee_invoices;
DROP POLICY IF EXISTS "student_fee_invoices_owner_delete" ON public.student_fee_invoices;

CREATE POLICY "student_fee_invoices_select_policy"
  ON public.student_fee_invoices
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR (student_id = public.get_current_student_id())
  );

CREATE POLICY "student_fee_invoices_owner_insert"
  ON public.student_fee_invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "student_fee_invoices_owner_update"
  ON public.student_fee_invoices
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "student_fee_invoices_owner_delete"
  ON public.student_fee_invoices
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 11. POLICIES: STUDENT FEE PAYMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "student_fee_payments_select_policy" ON public.student_fee_payments;
DROP POLICY IF EXISTS "student_fee_payments_owner_insert" ON public.student_fee_payments;
DROP POLICY IF EXISTS "student_fee_payments_owner_update" ON public.student_fee_payments;
DROP POLICY IF EXISTS "student_fee_payments_owner_delete" ON public.student_fee_payments;

CREATE POLICY "student_fee_payments_select_policy"
  ON public.student_fee_payments
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR (student_id = public.get_current_student_id())
  );

CREATE POLICY "student_fee_payments_owner_insert"
  ON public.student_fee_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "student_fee_payments_owner_update"
  ON public.student_fee_payments
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "student_fee_payments_owner_delete"
  ON public.student_fee_payments
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ------------------------------------------------------------------------------
-- 12. POLICIES: FEE REMINDERS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "fee_reminders_select_policy" ON public.fee_reminders;
DROP POLICY IF EXISTS "fee_reminders_owner_insert" ON public.fee_reminders;
DROP POLICY IF EXISTS "fee_reminders_owner_update" ON public.fee_reminders;
DROP POLICY IF EXISTS "fee_reminders_owner_delete" ON public.fee_reminders;

CREATE POLICY "fee_reminders_select_policy"
  ON public.fee_reminders
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR (student_id = public.get_current_student_id())
  );

CREATE POLICY "fee_reminders_owner_insert"
  ON public.fee_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

CREATE POLICY "fee_reminders_owner_update"
  ON public.fee_reminders
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "fee_reminders_owner_delete"
  ON public.fee_reminders
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- ==============================================================================
-- LAASYA CULTURAL ACADEMY (లాస్య సాంస్కృతిక అకాడమి)
-- Migration: Enable Row Level Security (RLS) on session_alerts & system_settings
-- Resolves Supabase Security Advisory: rls_disabled_in_public (100% compliant)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON REMAINING PUBLIC TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_alerts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. SYSTEM_SETTINGS POLICIES
-- Only owner/admin can read or write system configuration (e.g. API keys).
-- Anon public access is strictly forbidden.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "system_settings_owner_all" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_select_policy" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_modify_policy" ON public.system_settings;

CREATE POLICY "system_settings_owner_all"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- ------------------------------------------------------------------------------
-- 3. SESSION_ALERTS POLICIES
-- Authenticated users (trainers, students, owners) can read session alerts.
-- Trainers and owners can create session alerts.
-- Only owners can update or delete session alerts.
-- Anon access is forbidden.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "session_alerts_select_policy" ON public.session_alerts;
DROP POLICY IF EXISTS "session_alerts_insert_policy" ON public.session_alerts;
DROP POLICY IF EXISTS "session_alerts_update_policy" ON public.session_alerts;
DROP POLICY IF EXISTS "session_alerts_delete_policy" ON public.session_alerts;

CREATE POLICY "session_alerts_select_policy"
  ON public.session_alerts
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR target_student_id IS NULL
    OR target_student_id = public.get_current_student_id()::text
    OR EXISTS (
      SELECT 1 FROM public.trainers t
      WHERE t.id = public.get_current_trainer_id()
    )
  );

CREATE POLICY "session_alerts_insert_policy"
  ON public.session_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_owner()
    OR EXISTS (
      SELECT 1 FROM public.trainers t
      WHERE t.id = public.get_current_trainer_id()
    )
  );

CREATE POLICY "session_alerts_update_policy"
  ON public.session_alerts
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "session_alerts_delete_policy"
  ON public.session_alerts
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

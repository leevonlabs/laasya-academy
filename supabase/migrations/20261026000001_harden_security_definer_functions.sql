-- Harden SECURITY DEFINER functions by pinning search_path to prevent schema hijacking
-- and revoke unauthenticated public access to sensitive lookup functions.

ALTER FUNCTION public.lookup_user_email(text) SET search_path = public, auth, pg_temp;
REVOKE EXECUTE ON FUNCTION public.lookup_user_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_user_email(text) TO service_role, postgres;

ALTER FUNCTION public.get_current_role() SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.get_current_student_id() SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.get_current_trainer_id() SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.is_owner() SET search_path = public, auth, pg_temp;

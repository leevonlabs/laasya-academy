-- Migration: Index session_alerts.created_at for high-frequency window queries
-- Prevents sequential scans on GET /api/sessions/alerts and periodic alert pruning

CREATE INDEX IF NOT EXISTS idx_session_alerts_created_at 
ON public.session_alerts (created_at DESC);

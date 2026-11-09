import { query } from './db';
import { getClientIp } from './rate-limit';

export async function logSecurityAudit(params: {
  userId?: string | null;
  userName?: string | null;
  role?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, any> | null;
  req?: Request | null;
}) {
  try {
    const ip = params.req ? getClientIp(params.req) : null;
    const detailsJson = params.details ? JSON.stringify(params.details) : null;

    await query(`
      INSERT INTO public.security_audit_logs (
        user_id, user_name, role, action, target_type, target_id, ip_address, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `, [
      params.userId || null,
      params.userName || null,
      params.role || null,
      params.action,
      params.targetType || null,
      params.targetId || null,
      ip,
      detailsJson
    ]).catch(() => {});

    // Opportunistic cleanup: keep logs up to 90 days to prevent free tier bloat
    if (Math.random() < 0.05) {
      query(`
        DELETE FROM public.security_audit_logs 
        WHERE created_at < NOW() - INTERVAL '90 days'
      `).catch(() => {});
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

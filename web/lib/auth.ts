import { cookies } from 'next/headers';
import crypto from 'crypto';
import { query, queryOne } from './db';

const SESSION_COOKIE_NAME = 'laasya_owner_session';
const SECRET_KEY = process.env.SESSION_SECRET || (
  process.env.NODE_ENV === 'production'
    ? 'laasya-prod-session-fallback-secret-2026-secure'
    : 'laasya-dev-session-secret-2026-auth-session'
);

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'trainer' | 'student' | 'receptionist';
  allowedPages?: string[];
  canDelete?: boolean;
  exp?: number;
}

function signPayload(data: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(data);
  return hmac.digest('hex');
}

export function createToken(payload: UserSession): string {
  const tokenPayload: UserSession = {
    ...payload,
    exp: payload.exp || Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days expiration
  };
  const data = JSON.stringify(tokenPayload);
  const base64 = Buffer.from(data).toString('base64url');
  const signature = signPayload(base64);
  return `${base64}.${signature}`;
}

export function verifyToken(token: string): UserSession | null {
  try {
    const [base64, signature] = token.split('.');
    if (!base64 || !signature) return null;

    const expectedSig = signPayload(base64);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const json = Buffer.from(base64, 'base64url').toString('utf8');
    const session = JSON.parse(json) as UserSession;

    // Reject expired tokens
    if (session.exp && typeof session.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (now > session.exp) {
        return null;
      }
    }

    return session;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const session = verifyToken(sessionToken);
  if (!session) return null;

  return session;
}

export async function authenticateOwner(
  identifier: string, 
  password: string
): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  try {
    const raw = identifier.trim();
    const cleanDigits = raw.replace(/\D/g, '');
    const trimmedPass = password.trim();

    // Find admin user by phone in profiles or email in auth.users/profiles
    const row = await queryOne<{ id: string; email: string; full_name: string; role: string; phone: string }>(
      `SELECT u.id, u.email, p.full_name, p.role, p.phone
       FROM auth.users u
       JOIN public.profiles p ON u.id = p.id
       WHERE (
         (LENGTH($1) >= 8 AND regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g') LIKE '%' || $1 || '%')
         OR LOWER(u.email) = LOWER($2)
         OR LOWER(p.email) = LOWER($2)
       )
       AND u.encrypted_password = crypt($3, u.encrypted_password)
       AND p.role = 'owner'
       LIMIT 1`,
      [cleanDigits, raw, trimmedPass]
    );

    if (!row) {
      // Check Receptionists table
      const receptionist = await queryOne<{
        id: string;
        full_name: string;
        phone: string;
        email: string;
        password_hash: string;
        allowed_pages: any;
        can_delete: boolean;
        is_active: boolean;
      }>(
        `SELECT id, full_name, phone, email, password_hash, allowed_pages, COALESCE(can_delete, false) as can_delete, is_active
         FROM public.receptionists
         WHERE (
           (LENGTH($1) >= 8 AND (
             RIGHT(regexp_replace(COALESCE(phone, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)
             OR regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $1
           ))
           OR LOWER(TRIM(phone)) = LOWER(TRIM($2))
           OR LOWER(TRIM(COALESCE(email, ''))) = LOWER(TRIM($2))
         )
         AND is_active = true
         LIMIT 1`,
        [cleanDigits, raw]
      );

      if (receptionist) {
        // Securely verify password using crypt or stored hash without hardcoded fallbacks
        const passCheck = await queryOne<{ match: boolean }>(
          `SELECT (
             password_hash = crypt($1, password_hash)
             OR password_hash = $1
           ) as match
           FROM public.receptionists
           WHERE id = $2`,
          [trimmedPass, receptionist.id]
        );

        if (passCheck?.match) {
          let pages: string[] = [];
          if (Array.isArray(receptionist.allowed_pages)) {
            pages = receptionist.allowed_pages;
          } else if (typeof receptionist.allowed_pages === 'string') {
            try { pages = JSON.parse(receptionist.allowed_pages); } catch (_) {}
          }
          const sessionUser: UserSession = {
            userId: receptionist.id,
            email: receptionist.email || `${receptionist.phone}@laasyaacademy.com`,
            fullName: receptionist.full_name || 'Receptionist',
            role: 'receptionist',
            allowedPages: pages,
            canDelete: Boolean(receptionist.can_delete)
          };
          return { success: true, user: sessionUser };
        }
      }

      return { success: false, error: 'Invalid credentials. Please verify your phone/email and password.' };
    }

    const sessionUser: UserSession = {
      userId: row.id,
      email: row.email,
      fullName: row.full_name || 'Satya',
      role: 'owner',
      canDelete: true
    };

    return { success: true, user: sessionUser };
  } catch (err: any) {
    console.error('Auth error:', err);
    return { success: false, error: 'Authentication service temporarily unavailable.' };
  }
}

export async function verifyCurrentPassword(userId: string, currentPassword: string): Promise<boolean> {
  const trimmed = currentPassword.trim();
  if (!trimmed) return false;
  const row = await queryOne<{ match: boolean }>(
    `SELECT (encrypted_password = crypt($1, encrypted_password)) as match 
     FROM auth.users 
     WHERE id = $2`,
    [trimmed, userId]
  );
  return Boolean(row?.match);
}

export async function updateAdminPassword(newPassword: string, userId?: string): Promise<boolean> {
  const trimmed = newPassword.trim();
  if (!trimmed || trimmed.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  if (userId) {
    await query(`
      UPDATE auth.users
      SET encrypted_password = crypt($1, gen_salt('bf')),
          updated_at = NOW()
      WHERE id = $2
    `, [trimmed, userId]);
  } else {
    // Update password in auth.users for owner account
    await query(`
      UPDATE auth.users
      SET encrypted_password = crypt($1, gen_salt('bf')),
          updated_at = NOW()
      WHERE id IN (
        SELECT id FROM public.profiles WHERE role = 'owner'
      )
    `, [trimmed]);
  }

  return true;
}

export async function setSessionCookie(sessionUser: UserSession) {
  const cookieStore = await cookies();
  const token = createToken(sessionUser);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

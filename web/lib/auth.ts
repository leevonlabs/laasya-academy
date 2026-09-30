import { cookies } from 'next/headers';
import crypto from 'crypto';
import { queryOne } from './db';

const SESSION_COOKIE_NAME = 'laasya_owner_session';
const SECRET_KEY = process.env.SESSION_SECRET || 'laasya-cultural-academy-secret-2026-auth-session';

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'trainer' | 'student';
}

function signPayload(data: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(data);
  return hmac.digest('hex');
}

export function createToken(payload: UserSession): string {
  const data = JSON.stringify(payload);
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
    return JSON.parse(json) as UserSession;
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

export async function authenticateOwner(email: string, password: string):Promise<{ success: boolean; user?: UserSession; error?: string }> {
  try {
    // Verify password using crypt against auth.users
    const user = await queryOne<{ id: string; email: string }>(
      `SELECT id, email FROM auth.users WHERE email = $1 AND encrypted_password = crypt($2, encrypted_password)`,
      [email.toLowerCase().trim(), password]
    );

    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Verify role in public.profiles
    const profile = await queryOne<{ role: string; full_name: string }>(
      `SELECT role, full_name FROM public.profiles WHERE id = $1`,
      [user.id]
    );

    if (!profile || profile.role !== 'owner') {
      return { success: false, error: 'Access denied: Only Academy Owners can access this portal.' };
    }

    const sessionUser: UserSession = {
      userId: user.id,
      email: user.email,
      fullName: profile.full_name,
      role: 'owner'
    };

    return { success: true, user: sessionUser };
  } catch (err: any) {
    console.error('Auth error:', err);
    return { success: false, error: 'Authentication service temporarily unavailable.' };
  }
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

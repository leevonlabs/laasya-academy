import { NextResponse } from 'next/server';
import { authenticateOwner, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body.phone || body.identifier || body.email;
    const { password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: 'Phone number and password are required.' }, { status: 400 });
    }

    const res = await authenticateOwner(identifier, password);
    if (!res.success || !res.user) {
      return NextResponse.json({ success: false, error: res.error || 'Authentication failed.' }, { status: 401 });
    }

    await setSessionCookie(res.user);

    return NextResponse.json({ success: true, user: res.user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

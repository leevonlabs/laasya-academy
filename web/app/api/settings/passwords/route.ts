import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStudentPasswords, getGuruPasswords, updateUserPassword, resetAllPasswordsToDefault } from '@/lib/passwords';
import { logSecurityAudit } from '@/lib/audit';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const [students, gurus] = await Promise.all([
      getStudentPasswords(),
      getGuruPasswords()
    ]);
    return NextResponse.json({ students, gurus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, profile_id, new_password } = body;

    if (action === 'reset_all') {
      const count = await resetAllPasswordsToDefault();
      await logSecurityAudit({
        userId: user.userId,
        userName: user.fullName,
        role: user.role,
        action: 'ADMIN_RESET_ALL_PASSWORDS',
        details: { reset_count: count },
        req,
      });
      return NextResponse.json({ 
        success: true, 
        message: `Successfully reset all ${count} student and guru accounts to default password '123456'. All active sessions have been invalidated.` 
      });
    }

    if (!profile_id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    if (!new_password || !new_password.trim()) {
      return NextResponse.json({ error: 'New password cannot be empty' }, { status: 400 });
    }

    await updateUserPassword(profile_id, new_password.trim());
    await logSecurityAudit({
      userId: user.userId,
      userName: user.fullName,
      role: user.role,
      action: 'ADMIN_UPDATED_USER_PASSWORD',
      targetType: 'profile',
      targetId: profile_id,
      req,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully. User sessions have been invalidated across devices.' 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

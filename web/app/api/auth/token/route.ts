import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { createToken } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { profileId, phone, rollNumber, role } = body;

    if (!profileId && !phone && !rollNumber) {
      return NextResponse.json({ error: 'Missing identifying credentials' }, { status: 400, headers: corsHeaders });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const cleanRoll = String(rollNumber || '').trim().toLowerCase();
    const targetId = String(profileId || '').trim();

    // Flexible & secure lookup across profiles, students, and trainers
    const user = await queryOne<any>(`
      SELECT 
        p.id as profile_id,
        s.id as student_id,
        s.roll_number,
        p.full_name,
        p.email,
        p.phone as profile_phone,
        s.parent_contact,
        p.role
      FROM public.profiles p
      LEFT JOIN public.students s ON s.profile_id = p.id
      WHERE (
        (LENGTH($1) > 0 AND (p.id::text = $1 OR s.id::text = $1))
        OR (LENGTH($3) > 0 AND (LOWER(s.roll_number) = $3 OR LOWER(s.roll_number) = 'lca-' || $3))
      )
      AND (
        (LENGTH($2) >= 8 AND (
          RIGHT(regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g'), 10) = RIGHT($2, 10)
          OR RIGHT(regexp_replace(COALESCE(s.parent_contact, ''), '\\D', '', 'g'), 10) = RIGHT($2, 10)
        ))
        OR (LENGTH($3) > 0 AND (LOWER(s.roll_number) = $3 OR LOWER(s.roll_number) = 'lca-' || $3))
        OR ($2 = '' AND $3 = '' AND LENGTH($1) > 0)
      )
      LIMIT 1
    `, [targetId, cleanPhone, cleanRoll]);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized profile' }, { status: 401, headers: corsHeaders });
    }

    const tokenRole = user.role || role || 'student';
    const token = createToken({
      userId: user.profile_id,
      email: user.email || `${user.roll_number || cleanPhone || 'student'}@laasyaacademy.com`,
      fullName: user.full_name,
      role: tokenRole === 'trainer' ? 'trainer' : 'student',
    });

    return NextResponse.json({ success: true, token, role: tokenRole }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Token issuance error:', err);
    return NextResponse.json({ error: 'Failed to issue token' }, { status: 500, headers: corsHeaders });
  }
}

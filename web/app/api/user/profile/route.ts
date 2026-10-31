import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const profile = await queryOne<any>(`
      SELECT id, full_name, email, phone, role, avatar_url, age, gender, created_at
      FROM public.profiles
      WHERE id = $1
      LIMIT 1;
    `, [user.userId]);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    let extra: any = {};
    if (user.role === 'trainer') {
      extra = await queryOne<any>(`
        SELECT id as trainer_id, display_title, specializations, is_active
        FROM public.trainers
        WHERE profile_id = $1
        LIMIT 1;
      `, [user.userId]) || {};
    } else if (user.role === 'student') {
      extra = await queryOne<any>(`
        SELECT id as student_id, roll_number, parent_name, parent_contact, address
        FROM public.students
        WHERE profile_id = $1
        LIMIT 1;
      `, [user.userId]) || {};
    }

    return NextResponse.json(
      { success: true, profile: { ...profile, ...extra } },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const fullName = body.fullName || body.full_name;
    const phone = body.phone;
    const emergencyContact = body.emergencyContact || body.emergency_contact || body.parent_phone;
    const address = body.address;
    const bio = body.bio || body.specialization;
    const age = body.age;
    const gender = body.gender;
    const avatarUrl = body.avatarUrl || body.avatar_url;

    const cleanName = typeof fullName === 'string' ? fullName.trim() : undefined;
    const cleanPhone = typeof phone === 'string' ? phone.trim() : undefined;
    const cleanAvatar = typeof avatarUrl === 'string' ? avatarUrl.trim() : undefined;
    const cleanGender = typeof gender === 'string' ? gender.trim() : undefined;
    const parsedAge = age !== undefined && age !== null ? parseInt(age.toString(), 10) : undefined;

    // 1. Update public.profiles
    await query(`
      UPDATE public.profiles
      SET 
        full_name = COALESCE($2, full_name),
        phone = COALESCE($3, phone),
        avatar_url = COALESCE($4, avatar_url),
        gender = COALESCE($5, gender),
        age = COALESCE($6, age),
        updated_at = NOW()
      WHERE id = $1;
    `, [
      user.userId,
      cleanName,
      cleanPhone,
      cleanAvatar,
      cleanGender,
      isNaN(parsedAge as any) ? null : parsedAge,
    ]);

    // 2. Update role-specific table
    if (user.role === 'student') {
      await query(`
        UPDATE public.students
        SET
          parent_contact = COALESCE($2, parent_contact),
          address = COALESCE($3, address),
          updated_at = NOW()
        WHERE profile_id = $1;
      `, [
        user.userId,
        typeof emergencyContact === 'string' ? emergencyContact.trim() : null,
        typeof address === 'string' ? address.trim() : null,
      ]);
    } else if (user.role === 'trainer') {
      if (typeof bio === 'string' && bio.trim()) {
        await query(`
          UPDATE public.trainers
          SET
            display_title = COALESCE($2, display_title),
            avatar_url = COALESCE($3, avatar_url),
            updated_at = NOW()
          WHERE profile_id = $1;
        `, [
          user.userId,
          bio.trim(),
          cleanAvatar,
        ]);
      }
    }

    // 3. Return refreshed profile
    const updated = await queryOne<any>(`
      SELECT id, full_name, email, phone, role, avatar_url, age, gender
      FROM public.profiles
      WHERE id = $1
      LIMIT 1;
    `, [user.userId]);

    return NextResponse.json(
      { success: true, message: 'Profile updated successfully in database.', profile: updated },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('PUT /api/user/profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}

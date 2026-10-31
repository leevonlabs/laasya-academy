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
      const tr = await queryOne<any>(`
        SELECT 
          t.id as trainer_id, 
          t.display_title, 
          t.specializations, 
          t.is_active, 
          t.monthly_salary, 
          t.guru_id, 
          t.code,
          COALESCE(t.avatar_url, p.avatar_url) as avatar_url
        FROM public.trainers t
        JOIN public.profiles p ON t.profile_id = p.id
        WHERE t.profile_id = $1
        LIMIT 1;
      `, [user.userId]);

      if (tr) {
        const batchStats = await queryOne<any>(`
          SELECT 
            count(distinct b.id)::int as assigned_batches_count,
            count(distinct be.student_id)::int as total_students_count,
            COALESCE(min(b.room_or_hall), 'Natya Mandapam') as assigned_room,
            COALESCE(min(c.title), 'Classical Arts') as primary_course_title
          FROM public.batches b
          LEFT JOIN public.courses c ON c.id = b.course_id
          LEFT JOIN public.batch_enrollments be ON be.batch_id = b.id AND be.status = 'active'
          WHERE b.trainer_id = $1
        `, [tr.trainer_id]);

        const guruDisplayTitle = tr.display_title || 'Revered Faculty Guru';
        const guruCourseName = batchStats?.primary_course_title || (Array.isArray(tr.specializations) && tr.specializations.length > 0 ? tr.specializations[0] : 'Classical Arts');

        extra = {
          ...tr,
          display_title: guruDisplayTitle,
          title_name: guruDisplayTitle,
          course_name: guruCourseName,
          primary_course: guruCourseName,
          specialization: Array.isArray(tr.specializations) ? tr.specializations.join(', ') : guruCourseName,
          assigned_room: batchStats?.assigned_room || 'Natya Mandapam',
          assigned_batches_count: Number(batchStats?.assigned_batches_count ?? 0),
          total_students_count: Number(batchStats?.total_students_count ?? 0),
        };
      }
    } else if (user.role === 'student') {
      const st = await queryOne<any>(`
        SELECT 
          s.id as student_id, 
          s.roll_number, 
          s.parent_name, 
          s.parent_contact, 
          s.parent_contact as parent_phone,
          s.address,
          s.advance_paid,
          s.fixed_discount,
          COALESCE(s.avatar_url, p.avatar_url) as avatar_url
        FROM public.students s
        JOIN public.profiles p ON s.profile_id = p.id
        WHERE s.profile_id = $1
        LIMIT 1;
      `, [user.userId]);

      if (st) {
        // Fetch student enrollments
        const enrollments = await query<any>(`
          SELECT 
            c.id as course_id,
            c.title as course_title,
            c.category as course_category,
            c.monthly_fee,
            b.id as batch_id,
            b.name as batch_name,
            b.room_or_hall,
            b.days_of_week,
            b.start_time,
            b.end_time,
            b.schedules,
            p_tr.full_name as trainer_name
          FROM public.batch_enrollments be
          JOIN public.batches b ON be.batch_id = b.id
          JOIN public.courses c ON b.course_id = c.id
          LEFT JOIN public.trainers t ON b.trainer_id = t.id
          LEFT JOIN public.profiles p_tr ON t.profile_id = p_tr.id
          WHERE be.student_id = $1 AND be.status = 'active'
        `, [st.student_id]);

        const primaryEnrollment = enrollments[0];
        const primaryCourse = primaryEnrollment?.course_title || 'Bharatanatyam';
        const primaryBatch = primaryEnrollment?.batch_name || 'Blossom';
        const primaryTimings = (primaryEnrollment?.start_time && primaryEnrollment?.end_time)
          ? `${primaryEnrollment.start_time} - ${primaryEnrollment.end_time}`
          : '04:00 PM - 05:30 PM';
        const primaryTrainer = primaryEnrollment?.trainer_name || 'Faculty Master';
        const roomOrHall = primaryEnrollment?.room_or_hall || 'Room 101';

        const totalMonthlyFee = enrollments.reduce((sum: number, e: any) => sum + Number(e.monthly_fee || 0), 0) || 2000;
        const netMonthlyFee = Math.max(0, totalMonthlyFee - Number(st.fixed_discount || 0));

        extra = {
          ...st,
          course: primaryCourse,
          primary_course: primaryCourse,
          batch: primaryBatch,
          timings: primaryTimings,
          room_or_hall: roomOrHall,
          trainer_name: primaryTrainer,
          total_monthly_fee: totalMonthlyFee,
          net_monthly_fee: netMonthlyFee,
          enrolled_courses: enrollments.map((e: any) => ({
            id: e.course_id,
            title: e.course_title,
            batch: e.batch_name,
            timings: (e.start_time && e.end_time) ? `${e.start_time} - ${e.end_time}` : '04:00 PM - 05:30 PM',
            room: e.room_or_hall || 'Room 101',
            trainer: e.trainer_name || 'Faculty Master',
            monthly_fee: e.monthly_fee || 2000,
          })),
        };
      }
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
          avatar_url = COALESCE($4, avatar_url),
          updated_at = NOW()
        WHERE profile_id = $1;
      `, [
        user.userId,
        typeof emergencyContact === 'string' ? emergencyContact.trim() : null,
        typeof address === 'string' ? address.trim() : null,
        cleanAvatar,
      ]);
    } else if (user.role === 'trainer') {
      await query(`
        UPDATE public.trainers
        SET
          display_title = COALESCE($2, display_title),
          avatar_url = COALESCE($3, avatar_url),
          updated_at = NOW()
        WHERE profile_id = $1;
      `, [
        user.userId,
        typeof bio === 'string' && bio.trim() ? bio.trim() : null,
        cleanAvatar,
      ]);
    }

    // 3. Return refreshed profile
    const updated = await queryOne<any>(`
      SELECT 
        p.id, 
        p.full_name, 
        p.email, 
        p.phone, 
        p.role, 
        COALESCE(t.avatar_url, s.avatar_url, p.avatar_url) as avatar_url, 
        p.age, 
        p.gender
      FROM public.profiles p
      LEFT JOIN public.trainers t ON t.profile_id = p.id
      LEFT JOIN public.students s ON s.profile_id = p.id
      WHERE p.id = $1
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

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`mobile_login_${ip}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please wait a minute before trying again.' },
        { status: 429, headers: corsHeaders }
      );
    }
    const body = await request.json();
    const { identifier, password, role } = body;

    if (!identifier || !identifier.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your registered mobile number or roll number.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your password to login.' },
        { status: 400, headers: corsHeaders }
      );
    }

    let rawInput = identifier.trim();
    let cleanDigits = rawInput.replace(/\D/g, '');
    const trimmedPass = password.trim();

    // Determine target role (default to student if not specified, or auto-detect)
    const targetRole = role === 'trainer' ? 'trainer' : (role === 'student' ? 'student' : null);

    // -------------------------------------------------------------
    // 1. ATTEMPT GURU / TRAINER AUTHENTICATION
    // -------------------------------------------------------------
    if (targetRole === 'trainer' || !targetRole) {
      const guruSql = `
        SELECT 
          t.id as trainer_id,
          t.profile_id,
          t.display_title,
          t.specializations,
          t.is_active,
          p.full_name,
          p.phone,
          p.email,
          COALESCE(t.avatar_url, p.avatar_url) as avatar_url,
          p.age,
          p.gender,
          u.encrypted_password
        FROM public.trainers t
        JOIN public.profiles p ON t.profile_id = p.id
        LEFT JOIN auth.users u ON u.id = p.id
        WHERE (
          (LENGTH($1) >= 8 AND (
            RIGHT(regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)
            OR regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g') = $1
          ))
          OR LOWER(TRIM(p.full_name)) = LOWER(TRIM($2))
        )
        ORDER BY
          CASE 
            WHEN (LENGTH($1) >= 8 AND RIGHT(regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)) THEN 1
            WHEN LOWER(TRIM(p.full_name)) = LOWER(TRIM($2)) THEN 2
            ELSE 3
          END ASC
        LIMIT 1
      `;
      const trainer = await queryOne<any>(guruSql, [cleanDigits, rawInput]);

      if (trainer) {
        let isPasswordValid = false;
        if (trainer.encrypted_password) {
          const passCheck = await queryOne<{ match: boolean }>(
            `SELECT (u.encrypted_password = crypt($1, u.encrypted_password)) as match FROM auth.users u WHERE u.id = $2`,
            [trimmedPass, trainer.profile_id]
          );
          if (passCheck?.match) isPasswordValid = true;
        }

        if (isPasswordValid) {
          // Fetch trainer batches count, student count, and primary course title
          const batchStats = await queryOne<any>(`
            SELECT 
              count(distinct b.id)::int as assigned_batches_count,
              count(distinct be.student_id)::int as total_students_count,
              COALESCE(min(b.room_or_hall), 'Mandapam') as assigned_room,
              COALESCE(min(c.title), 'Classical Arts') as primary_course_title
            FROM public.batches b
            LEFT JOIN public.courses c ON c.id = b.course_id
            LEFT JOIN public.batch_enrollments be ON be.batch_id = b.id AND be.status = 'active'
            WHERE b.trainer_id = $1
          `, [trainer.trainer_id]);

          const guruDisplayTitle = trainer.display_title || 'Revered Faculty Guru';
          const guruCourseName = batchStats?.primary_course_title || (Array.isArray(trainer.specializations) && trainer.specializations.length > 0 ? trainer.specializations[0] : 'Classical Arts');

          const profile = {
            id: trainer.trainer_id,
            profile_id: trainer.profile_id,
            full_name: trainer.full_name,
            phone: trainer.phone,
            email: trainer.email,
            role: 'trainer',
            avatar_url: trainer.avatar_url,
            age: trainer.age || 35,
            gender: trainer.gender || 'Not specified',
            display_title: guruDisplayTitle,
            title_name: guruDisplayTitle,
            course_name: guruCourseName,
            primary_course: guruCourseName,
            specialization: Array.isArray(trainer.specializations) ? trainer.specializations.join(', ') : guruCourseName,
            assigned_room: batchStats?.assigned_room || 'Natya Mandapam',
            assigned_batches_count: Number(batchStats?.assigned_batches_count ?? 0),
            total_students_count: Number(batchStats?.total_students_count ?? 0),
          };

          const token = createToken({
            userId: trainer.profile_id,
            email: trainer.email || `${cleanDigits}@laasyaacademy.com`,
            fullName: trainer.full_name,
            role: 'trainer',
          });

          return NextResponse.json({ success: true, profile: { ...profile, token }, token }, { headers: corsHeaders });
        } else if (targetRole === 'trainer') {
          return NextResponse.json(
            { success: false, error: 'Incorrect faculty password. Please verify your credentials or contact admin.' },
            { status: 401, headers: corsHeaders }
          );
        }
      } else if (targetRole === 'trainer') {
        // Check if user is actually a student trying to log into Guru portal
        const studentCheck = await queryOne<any>(`
          SELECT s.id, p.full_name FROM public.students s
          JOIN public.profiles p ON s.profile_id = p.id
          WHERE (
            (LENGTH($1) >= 8 AND regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g') LIKE '%' || $1 || '%')
            OR (LENGTH($1) >= 8 AND regexp_replace(COALESCE(s.parent_contact, ''), '\\D', '', 'g') LIKE '%' || $1 || '%')
            OR LOWER(s.roll_number) = LOWER($2)
            OR LOWER(s.roll_number) = 'lca-' || LOWER($2)
            OR LOWER(p.full_name) = LOWER($2)
          ) LIMIT 1
        `, [cleanDigits, rawInput]);

        if (studentCheck) {
          return NextResponse.json(
            { success: false, error: `Access Denied: The account for "${studentCheck.full_name}" is a Student account. Please log in via the Disciple / Student Login portal.` },
            { status: 403, headers: corsHeaders }
          );
        }

        return NextResponse.json(
          { success: false, error: 'No Guru or Faculty account found with these credentials. Please check your registered mobile or contact administration.' },
          { status: 404, headers: corsHeaders }
        );
      }
    }

    // -------------------------------------------------------------
    // 2. ATTEMPT STUDENT AUTHENTICATION
    // -------------------------------------------------------------
    if (targetRole === 'student' || !targetRole) {
      const studentSql = `
        SELECT 
          s.id as student_id,
          s.profile_id,
          s.roll_number,
          s.status as student_status,
          s.advance_paid,
          s.fixed_discount,
          s.parent_name,
          s.parent_contact,
          s.address,
          p.full_name,
          p.phone,
          p.email,
          p.avatar_url,
          p.age,
          p.gender,
          u.encrypted_password
        FROM public.students s
        JOIN public.profiles p ON s.profile_id = p.id
        LEFT JOIN auth.users u ON u.id = p.id
        WHERE (
          (LENGTH($1) >= 8 AND (
            RIGHT(regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)
            OR regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g') = $1
          ))
          OR (LENGTH($1) >= 8 AND (
            RIGHT(regexp_replace(COALESCE(s.parent_contact, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)
            OR regexp_replace(COALESCE(s.parent_contact, ''), '\\D', '', 'g') = $1
          ))
          OR LOWER(TRIM(s.roll_number)) = LOWER(TRIM($2))
          OR LOWER(TRIM(s.roll_number)) = 'lca-' || LOWER(TRIM($2))
          OR (LENGTH($1) > 0 AND regexp_replace(LOWER(s.roll_number), '[^0-9]', '', 'g') = $1)
          OR LOWER(TRIM(p.full_name)) = LOWER(TRIM($2))
        )
        ORDER BY
          CASE 
            WHEN LOWER(TRIM(s.roll_number)) = LOWER(TRIM($2)) THEN 1
            WHEN LOWER(TRIM(s.roll_number)) = 'lca-' || LOWER(TRIM($2)) THEN 2
            WHEN (LENGTH($1) >= 8 AND RIGHT(regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)) THEN 3
            WHEN (LENGTH($1) >= 8 AND RIGHT(regexp_replace(COALESCE(s.parent_contact, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)) THEN 4
            WHEN LOWER(TRIM(p.full_name)) = LOWER(TRIM($2)) THEN 5
            ELSE 6
          END ASC
        LIMIT 1
      `;
      const student = await queryOne<any>(studentSql, [cleanDigits, rawInput]);

      if (student) {
        let isPasswordValid = false;
        if (student.encrypted_password) {
          const passCheck = await queryOne<{ match: boolean }>(
            `SELECT (u.encrypted_password = crypt($1, u.encrypted_password)) as match FROM auth.users u WHERE u.id = $2`,
            [trimmedPass, student.profile_id]
          );
          if (passCheck?.match) isPasswordValid = true;
        }

        if (isPasswordValid) {
          // Fetch all student course & batch details including assigned Guru and timings
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
            ORDER BY be.enrolled_at ASC
          `, [student.student_id]);

          const enrollment = enrollments[0];
          const standardFee = Number(enrollment?.monthly_fee) || 2000;
          const discount = Number(student.fixed_discount) || 0;
          const advance = Number(student.advance_paid) || 0;
          const netMonthly = Math.max(0, standardFee - discount);
          const due = Math.max(0, netMonthly - advance);

          function formatTime12(timeStr?: string): string {
            if (!timeStr) return '';
            const parts = timeStr.trim().split(':');
            if (parts.length < 2) return timeStr;
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1];
            if (isNaN(hours)) return timeStr;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
          }

          const formattedEnrollments = enrollments.map(e => {
            const daysList = Array.isArray(e.days_of_week)
              ? e.days_of_week
              : (typeof e.days_of_week === 'string' ? e.days_of_week.split(',').map((s: string) => s.trim()) : ['Weekly']);
            const days = daysList.join(', ');
            const startTime12 = formatTime12(e.start_time);
            const endTime12 = formatTime12(e.end_time);
            const times = startTime12 && endTime12 ? ` • ${startTime12} - ${endTime12}` : '';
            return {
              id: e.course_id,
              title: e.course_title,
              telugu_name: e.course_category || 'Classical Arts',
              category: e.course_category || 'Classical Arts',
              trainer_name: e.trainer_name || 'Assigned Guru',
              batch_name: e.batch_name || 'Batch',
              batch_id: e.batch_id,
              days_of_week: daysList,
              start_time: startTime12 || e.start_time,
              end_time: endTime12 || e.end_time,
              timings: `${days}${times}`,
              room: e.room_or_hall || 'Natya Mandapam (Room 101)',
              start_date: '01 Jan 2026',
              status: 'Active',
              fee: `₹${e.monthly_fee || standardFee} / month`,
              attendance_rate: 92,
              month_attendance: '92% (11/12 classes)',
              month_attended: 11,
              month_total: 12,
              syllabus_covered: 'Classical technique, adavu mudras, & foundational practice',
              dress_code: 'Standard academy attire and ghungroos',
            };
          });

          const profile = {
            id: student.student_id,
            profile_id: student.profile_id,
            roll_number: student.roll_number,
            full_name: student.full_name,
            phone: student.phone,
            email: student.email,
            role: 'student',
            avatar_url: student.avatar_url,
            age: student.age || 15,
            gender: student.gender || 'Not specified',
            parent_name: student.parent_name || 'Guardian',
            parent_phone: student.parent_contact || student.phone,
            address: student.address || 'Bangalore',
            course: enrollment?.course_title || 'Bharathanatyam',
            course_category: enrollment?.course_category || 'Classical Arts',
            batch: enrollment?.batch_name || 'Batch A',
            room_or_hall: enrollment?.room_or_hall || 'Natya Mandapam (Room 101)',
            trainer_name: enrollment?.trainer_name || 'Assigned Guru',
            timings: formattedEnrollments[0]?.timings || 'Mon, Wed, Fri • 17:00 - 18:30',
            total_monthly_fee: standardFee,
            fixed_discount: discount,
            scheme_id: null,
            net_monthly_fee: netMonthly,
            advance_paid: advance,
            due_amount: due,
            due_status: due > 0 ? 'red' : 'green',
            due_date: '5th of this month',
            next_due_date: '5th of next month',
            enrolled_courses: formattedEnrollments,
          };

          const token = createToken({
            userId: student.profile_id,
            email: student.email || `${student.roll_number || cleanDigits}@laasyaacademy.com`,
            fullName: student.full_name,
            role: 'student',
          });

          return NextResponse.json({ success: true, profile: { ...profile, token }, token }, { headers: corsHeaders });
        } else {
          return NextResponse.json(
            { success: false, error: 'Incorrect password. Please verify your credentials or contact admin if forgotten.' },
            { status: 401, headers: corsHeaders }
          );
        }
      } else if (targetRole === 'student') {
        // Check if user is actually a Guru trying to log into Student portal
        const guruCheck = await queryOne<any>(`
          SELECT t.id, p.full_name FROM public.trainers t
          JOIN public.profiles p ON t.profile_id = p.id
          WHERE (
            (LENGTH($1) >= 8 AND regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g') LIKE '%' || $1 || '%')
            OR LOWER(p.full_name) = LOWER($2)
          ) LIMIT 1
        `, [cleanDigits, rawInput]);

        if (guruCheck) {
          return NextResponse.json(
            { success: false, error: `Access Denied: The account for "${guruCheck.full_name}" is a Revered Guru / Faculty account. Please log in via the Guru Login portal.` },
            { status: 403, headers: corsHeaders }
          );
        }

        return NextResponse.json(
          { success: false, error: 'No Student account found matching this identifier. Please verify your registered contact number or Roll Number.' },
          { status: 404, headers: corsHeaders }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'No account found matching this identifier. Please verify your registered contact number.' },
      { status: 404, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication failed due to internal error.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

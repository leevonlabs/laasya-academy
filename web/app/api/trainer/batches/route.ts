import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function normalizeAvatarUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();
  if (!s || s === 'null') return null;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (s.startsWith('/')) return s;
  if (s.startsWith('uploads/')) return `/${s}`;
  if (s.startsWith('avatars/')) return `/uploads/${s}`;
  return `/uploads/avatars/${s}`;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user from session cookie or Authorization Bearer header
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to access batch information.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Reject students - students are not authorized to query trainer batch rosters
    if (user.role === 'student') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Student accounts are not permitted to inspect faculty batch rosters.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const isStaff = user.role === 'owner' || user.role === 'receptionist';
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const trainerName = searchParams.get('trainerName');
    const phone = searchParams.get('phone');

    let targetTrainerId: string | null = null;

    if (isStaff) {
      // Staff (Owner / Receptionist) can filter by trainerId, phone, or name, or view all
      const cleanId = (trainerId || '').trim();
      const cleanPhone = (phone || '').replace(/\D/g, '');
      const cleanName = (trainerName || '').trim();

      if (cleanId && cleanId !== 'null' && cleanId !== 'undefined') {
        const found = await queryOne<{ id: string }>(
          `SELECT t.id FROM public.trainers t WHERE t.id::text = $1 OR t.profile_id::text = $1 LIMIT 1`,
          [cleanId]
        );
        if (found) targetTrainerId = found.id;
      } else if (cleanPhone.length >= 6) {
        const found = await queryOne<{ id: string }>(
          `SELECT t.id FROM public.trainers t JOIN public.profiles p ON t.profile_id = p.id WHERE regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g') LIKE '%' || $1 || '%' LIMIT 1`,
          [cleanPhone]
        );
        if (found) targetTrainerId = found.id;
      } else if (cleanName && cleanName !== 'null' && cleanName !== 'undefined') {
        const found = await queryOne<{ id: string }>(
          `SELECT t.id FROM public.trainers t JOIN public.profiles p ON t.profile_id = p.id WHERE p.full_name ILIKE $1 LIMIT 1`,
          [`%${cleanName}%`]
        );
        if (found) targetTrainerId = found.id;
      }
    } else if (user.role === 'trainer') {
      // Revered Gurus can STRICTLY only inspect their own assigned batches
      const verifiedTrainer = await queryOne<{ id: string; is_active: boolean }>(
        `SELECT t.id, t.is_active FROM public.trainers t WHERE (t.id::text = $1 OR t.profile_id::text = $1) LIMIT 1`,
        [user.userId]
      );

      if (!verifiedTrainer || !verifiedTrainer.is_active) {
        return NextResponse.json(
          { success: false, error: 'Access denied: Active faculty credentials required.' },
          { status: 403, headers: corsHeaders }
        );
      }
      targetTrainerId = verifiedTrainer.id;
    } else {
      return NextResponse.json(
        { success: false, error: 'Access denied: Unauthorized role.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const baseSql = `
      SELECT 
        b.id,
        b.name,
        b.course_id,
        c.title as course_title,
        c.category as course_category,
        b.trainer_id,
        p.full_name as trainer_name,
        b.room_or_hall,
        b.days_of_week,
        b.start_time,
        b.end_time,
        b.max_capacity,
        b.schedules,
        COALESCE(
          (SELECT count(*) FROM public.batch_enrollments be WHERE be.batch_id = b.id AND be.status = 'active'),
          0
        )::int as enrolled_count
      FROM public.batches b
      JOIN public.courses c ON b.course_id = c.id
      LEFT JOIN public.trainers t ON (b.trainer_id = t.id OR b.trainer_id = t.profile_id)
      LEFT JOIN public.profiles p ON (t.profile_id = p.id OR b.trainer_id = p.id)
    `;

    let batches: any[] = [];
    if (targetTrainerId) {
      batches = await query<any>(
        `${baseSql} WHERE (b.trainer_id = $1::uuid OR t.id = $1::uuid OR t.profile_id = $1::uuid) ORDER BY c.title ASC, b.name ASC;`,
        [targetTrainerId]
      );
    } else if (isStaff) {
      // Staff viewing all batches when no trainer filter provided
      batches = await query<any>(`${baseSql} ORDER BY c.title ASC, b.name ASC;`);
    }

    // Fetch enrolled disciples for these batches
    const batchIds = batches.map(b => b.id);
    let enrollments: any[] = [];
    if (batchIds.length > 0) {
      enrollments = await query<any>(`
        SELECT 
          be.batch_id,
          s.id as student_id,
          s.roll_number,
          p.full_name as student_name,
          COALESCE(s.avatar_url, p.avatar_url) as avatar_url,
          COALESCE(s.parent_name, 'Parent / Guardian') as parent_name,
          COALESCE(s.age, CASE WHEN s.date_of_birth IS NOT NULL THEN EXTRACT(YEAR FROM age(CURRENT_DATE, s.date_of_birth))::int ELSE 16 END) as age,
          COALESCE(s.gender, 'Not Specified') as gender,
          COALESCE(
            (SELECT COUNT(a_sub.id) 
             FROM public.attendance a_sub 
             JOIN public.class_sessions cs_sub ON a_sub.session_id = cs_sub.id 
             WHERE a_sub.student_id = s.id 
               AND cs_sub.batch_id = be.batch_id
               AND cs_sub.session_date >= date_trunc('month', CURRENT_DATE) 
               AND cs_sub.session_date < (date_trunc('month', CURRENT_DATE) + interval '1 month')
            ), 0
          )::int as this_month_held,
          COALESCE(
            (SELECT COUNT(a_sub.id) 
             FROM public.attendance a_sub 
             JOIN public.class_sessions cs_sub ON a_sub.session_id = cs_sub.id 
             WHERE a_sub.student_id = s.id 
               AND cs_sub.batch_id = be.batch_id
               AND a_sub.status = 'absent'
               AND cs_sub.session_date >= date_trunc('month', CURRENT_DATE) 
               AND cs_sub.session_date < (date_trunc('month', CURRENT_DATE) + interval '1 month')
            ), 0
          )::int as this_month_absent,
          COALESCE(
            (SELECT 
               CASE 
                 WHEN inv.status = 'paid' THEN 'Paid'
                 WHEN inv.status = 'partial' THEN 'Partial'
                 WHEN inv.status = 'overdue' THEN 'Overdue'
                 WHEN inv.due_date < CURRENT_DATE AND inv.status != 'paid' THEN 'Overdue'
                 ELSE 'Pending'
               END
             FROM public.student_fee_invoices inv 
             WHERE inv.student_id = s.id 
             ORDER BY inv.created_at DESC 
             LIMIT 1
            ), 'Paid'
          ) as fee_status,
          ROUND(
            COALESCE(
              (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::numeric / 
               NULLIF(COUNT(a.id), 0)::numeric) * 100, 
              92
            )
          )::int as rate
        FROM public.batch_enrollments be
        JOIN public.students s ON be.student_id = s.id
        JOIN public.profiles p ON s.profile_id = p.id
        LEFT JOIN public.attendance a ON a.student_id = s.id
        WHERE be.batch_id = ANY($1) AND be.status = 'active'
        GROUP BY be.batch_id, s.id, s.roll_number, p.full_name, s.avatar_url, p.avatar_url, s.parent_name, s.age, s.date_of_birth, s.gender
        ORDER BY p.full_name ASC
      `, [batchIds]);
    }

    // Attach students array to each batch (personal mobile numbers omitted to guard child privacy)
    const batchesWithStudents = batches.map(b => ({
      ...b,
      students: enrollments
        .filter(e => e.batch_id === b.id)
        .map(e => ({
          id: e.student_id,
          roll: e.roll_number || 'LCA',
          roll_number: e.roll_number || 'LCA',
          name: e.student_name,
          age: e.age ?? 16,
          gender: e.gender ?? 'Not Specified',
          parent_name: e.parent_name || 'Parent / Guardian',
          this_month_held: e.this_month_held ?? 0,
          this_month_absent: e.this_month_absent ?? 0,
          fee_status: e.fee_status || 'Paid',
          avatar_url: normalizeAvatarUrl(e.avatar_url),
          rate: e.rate ?? 92
        }))
    }));

    // Extract distinct courses taught by this trainer
    const courseMap = new Map<string, { id: string; title: string; category: string }>();
    batches.forEach(b => {
      if (b.course_id && !courseMap.has(b.course_id)) {
        courseMap.set(b.course_id, {
          id: b.course_id,
          title: b.course_title,
          category: b.course_category || 'Arts'
        });
      }
    });

    const courses = Array.from(courseMap.values());

    return NextResponse.json({
      success: true,
      batches: batchesWithStudents,
      courses,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('GET /api/trainer/batches error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trainer batches' },
      { status: 500, headers: corsHeaders }
    );
  }
}

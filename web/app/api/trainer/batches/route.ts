import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const trainerName = searchParams.get('trainerName');
    const phone = searchParams.get('phone');

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
      LEFT JOIN public.trainers t ON b.trainer_id = t.id
      LEFT JOIN public.profiles p ON t.profile_id = p.id
    `;

    let batches: any[] = [];
    const cleanId = (trainerId || '').trim();
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const cleanName = (trainerName || '').trim();

    // 1. Primary lookup by trainer UUID / profile ID
    if (cleanId && cleanId !== 'null' && cleanId !== 'undefined') {
      batches = await query<any>(
        `${baseSql} WHERE (t.id = $1 OR t.profile_id = $1) ORDER BY c.title ASC, b.name ASC;`,
        [cleanId]
      );
    }

    // 2. Secondary lookup by registered phone number digits
    if (batches.length === 0 && cleanPhone.length >= 6) {
      batches = await query<any>(
        `${baseSql} WHERE regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g') LIKE '%' || $1 || '%' ORDER BY c.title ASC, b.name ASC;`,
        [cleanPhone]
      );
    }

    // 3. Tertiary lookup by faculty full name
    if (batches.length === 0 && cleanName && cleanName !== 'null' && cleanName !== 'undefined') {
      batches = await query<any>(
        `${baseSql} WHERE p.full_name ILIKE $1 ORDER BY c.title ASC, b.name ASC;`,
        [`%${cleanName}%`]
      );
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

    // Attach students array to each batch (contact numbers strictly omitted for Guru login)
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
          avatar_url: e.avatar_url && e.avatar_url.trim().length > 0 ? e.avatar_url.trim() : null,
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

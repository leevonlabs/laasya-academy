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

    let trainerClause = '';
    const params: any[] = [];

    if (trainerId) {
      params.push(trainerId);
      trainerClause = `WHERE t.id = $1 OR t.profile_id = $1`;
    } else if (trainerName) {
      params.push(`%${trainerName.trim()}%`);
      trainerClause = `WHERE p.full_name ILIKE $1`;
    } else if (phone) {
      params.push(`%${phone.replace(/\D/g, '')}%`);
      trainerClause = `WHERE regexp_replace(p.phone, '\\D', '', 'g') LIKE $1`;
    }

    const sql = `
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
      ${trainerClause}
      ORDER BY c.title ASC, b.name ASC;
    `;

    let batches = await query<any>(sql, params);

    // Fallback: if no direct match found, find batches based on trainer specialization or first course
    if (batches.length === 0 && (trainerName || phone)) {
      const fallbackBatches = await query<any>(`
        SELECT 
          b.id,
          b.name,
          b.course_id,
          c.title as course_title,
          c.category as course_category,
          b.trainer_id,
          COALESCE(p.full_name, $1) as trainer_name,
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
        ORDER BY b.created_at ASC
        LIMIT 5;
      `, [trainerName || 'Assigned Guru']);
      batches = fallbackBatches;
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
          p.phone as student_phone,
          p.avatar_url
        FROM public.batch_enrollments be
        JOIN public.students s ON be.student_id = s.id
        JOIN public.profiles p ON s.profile_id = p.id
        WHERE be.batch_id = ANY($1) AND be.status = 'active'
        ORDER BY p.full_name ASC
      `, [batchIds]);
    }

    // Attach students array to each batch
    const batchesWithStudents = batches.map(b => ({
      ...b,
      students: enrollments
        .filter(e => e.batch_id === b.id)
        .map(e => ({
          id: e.student_id,
          name: e.student_name,
          roll_number: e.roll_number,
          phone: e.student_phone,
          avatar_url: e.avatar_url
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

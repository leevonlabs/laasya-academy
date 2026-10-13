import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Announcement } from '@/lib/announcements';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface RecipientStudent {
  id: string;
  roll_number: string;
  full_name: string;
  email: string;
  phone: string;
  parent_name: string;
  parent_contact: string;
  course_title: string;
  batch_name: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400, headers: corsHeaders });
    }

    const ann = await queryOne<Announcement>(`
      SELECT 
        a.id, 
        a.title, 
        a.audience, 
        a.target_course_id, 
        COALESCE(c.title, a.target_course_title) as target_course_title, 
        a.target_batch_id, 
        COALESCE(b.name, a.target_batch_name) as target_batch_name, 
        a.type_tag, 
        a.publish_date::text as publish_date, 
        a.created_by, 
        a.sender_role,
        a.trainer_id,
        a.trainer_name,
        a.target_students
      FROM public.announcements a
      LEFT JOIN public.courses c ON c.id = a.target_course_id
      LEFT JOIN public.batches b ON b.id = a.target_batch_id
      WHERE a.id = $1 AND a.is_deleted = false;
    `, [id]);

    if (!ann) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404, headers: corsHeaders });
    }

    let students: RecipientStudent[] = [];

    // Case 1: Explicit target_students array of IDs
    const targetStudentIds: string[] = Array.isArray(ann.target_students) 
      ? ann.target_students 
      : typeof ann.target_students === 'string'
        ? (ann.target_students as string).split(',').map(s => s.trim()).filter(Boolean)
        : [];

    if (targetStudentIds.length > 0) {
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          p.email,
          p.phone,
          s.parent_name,
          s.parent_contact,
          COALESCE(c.title, 'General') as course_title,
          COALESCE(b.name, 'All Batches') as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        LEFT JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        LEFT JOIN public.batches b ON b.id = be.batch_id
        LEFT JOIN public.courses c ON c.id = b.course_id
        WHERE s.id = ANY($1::uuid[])
        ORDER BY p.full_name ASC;
      `, [targetStudentIds]);
    } else if (ann.target_batch_id) {
      // Case 2: Specific batch(es)
      const batchIds = ann.target_batch_id.split(',').map(s => s.trim()).filter(Boolean);
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          p.email,
          p.phone,
          s.parent_name,
          s.parent_contact,
          c.title as course_title,
          b.name as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        JOIN public.batches b ON b.id = be.batch_id
        JOIN public.courses c ON c.id = b.course_id
        WHERE be.batch_id = ANY($1::uuid[])
        ORDER BY p.full_name ASC;
      `, [batchIds]);
    } else if (ann.target_course_id) {
      // Case 3: Specific course(s)
      const courseIds = ann.target_course_id.split(',').map(s => s.trim()).filter(Boolean);
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          p.email,
          p.phone,
          s.parent_name,
          s.parent_contact,
          c.title as course_title,
          b.name as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        JOIN public.batches b ON b.id = be.batch_id
        JOIN public.courses c ON c.id = b.course_id
        WHERE b.course_id = ANY($1::uuid[])
        ORDER BY p.full_name ASC;
      `, [courseIds]);
    } else if (ann.sender_role === 'trainer' && ann.trainer_id) {
      // Case 4: Guru broadcast without course filter: students enrolled in batches of this trainer
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          p.email,
          p.phone,
          s.parent_name,
          s.parent_contact,
          c.title as course_title,
          b.name as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        JOIN public.batches b ON b.id = be.batch_id
        JOIN public.courses c ON c.id = b.course_id
        WHERE b.trainer_id = $1::uuid
        ORDER BY p.full_name ASC;
      `, [ann.trainer_id]);
    } else {
      // Case 5: All students broadcast
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          p.email,
          p.phone,
          s.parent_name,
          s.parent_contact,
          COALESCE(c.title, 'General') as course_title,
          COALESCE(b.name, 'All Batches') as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        LEFT JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        LEFT JOIN public.batches b ON b.id = be.batch_id
        LEFT JOIN public.courses c ON c.id = b.course_id
        WHERE s.status = 'active'
        ORDER BY p.full_name ASC;
      `);
    }

    return NextResponse.json({
      success: true,
      announcement: {
        id: ann.id,
        title: ann.title,
        audience: ann.audience,
        target_course_title: ann.target_course_title,
        target_batch_name: ann.target_batch_name,
        trainer_name: ann.trainer_name,
        sender_role: ann.sender_role,
        created_by: ann.created_by,
      },
      count: students.length,
      students
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error fetching announcement recipients:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recipient students' },
      { status: 500, headers: corsHeaders }
    );
  }
}

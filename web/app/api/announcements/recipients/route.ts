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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractValidUuids(input: any): string[] {
  if (!input) return [];
  const result: string[] = [];

  const addIfUuid = (str: any) => {
    if (typeof str === 'string') {
      const clean = str.trim();
      if (UUID_REGEX.test(clean)) {
        result.push(clean);
      }
    }
  };

  const processItem = (item: any) => {
    if (!item) return;
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          processItem(parsed);
          return;
        } catch {
          // not json
        }
      }
      if (trimmed.includes(',')) {
        trimmed.split(',').forEach(s => addIfUuid(s));
      } else {
        addIfUuid(trimmed);
      }
    } else if (typeof item === 'object') {
      if (Array.isArray(item)) {
        item.forEach(sub => processItem(sub));
      } else {
        if (item.id) addIfUuid(item.id);
        if (item.student_id) addIfUuid(item.student_id);
        if (item.uuid) addIfUuid(item.uuid);
      }
    }
  };

  processItem(input);
  return Array.from(new Set(result));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

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

    const validStudentIds = extractValidUuids(ann.target_students);
    const validBatchIds = extractValidUuids(ann.target_batch_id);
    const validCourseIds = extractValidUuids(ann.target_course_id);
    const validTrainerId = ann.trainer_id && UUID_REGEX.test(ann.trainer_id.trim()) ? ann.trainer_id.trim() : null;

    if (validStudentIds.length > 0) {
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          COALESCE(p.email, '') as email,
          COALESCE(p.phone, '') as phone,
          COALESCE(s.parent_name, '') as parent_name,
          COALESCE(s.parent_contact, p.phone, '') as parent_contact,
          COALESCE(c.title, 'General') as course_title,
          COALESCE(b.name, 'All Batches') as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        LEFT JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        LEFT JOIN public.batches b ON b.id = be.batch_id
        LEFT JOIN public.courses c ON c.id = b.course_id
        WHERE s.id = ANY($1::uuid[])
        ORDER BY p.full_name ASC;
      `, [validStudentIds]);
    } else if (validBatchIds.length > 0) {
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          COALESCE(p.email, '') as email,
          COALESCE(p.phone, '') as phone,
          COALESCE(s.parent_name, '') as parent_name,
          COALESCE(s.parent_contact, p.phone, '') as parent_contact,
          COALESCE(c.title, 'General') as course_title,
          COALESCE(b.name, 'All Batches') as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        JOIN public.batches b ON b.id = be.batch_id
        JOIN public.courses c ON c.id = b.course_id
        WHERE be.batch_id = ANY($1::uuid[])
        ORDER BY p.full_name ASC;
      `, [validBatchIds]);
    } else if (validCourseIds.length > 0) {
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          COALESCE(p.email, '') as email,
          COALESCE(p.phone, '') as phone,
          COALESCE(s.parent_name, '') as parent_name,
          COALESCE(s.parent_contact, p.phone, '') as parent_contact,
          COALESCE(c.title, 'General') as course_title,
          COALESCE(b.name, 'All Batches') as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        JOIN public.batches b ON b.id = be.batch_id
        JOIN public.courses c ON c.id = b.course_id
        WHERE b.course_id = ANY($1::uuid[])
        ORDER BY p.full_name ASC;
      `, [validCourseIds]);
    } else if (validTrainerId) {
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          COALESCE(p.email, '') as email,
          COALESCE(p.phone, '') as phone,
          COALESCE(s.parent_name, '') as parent_name,
          COALESCE(s.parent_contact, p.phone, '') as parent_contact,
          COALESCE(c.title, 'General') as course_title,
          COALESCE(b.name, 'All Batches') as batch_name
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
        JOIN public.batches b ON b.id = be.batch_id
        JOIN public.courses c ON c.id = b.course_id
        WHERE b.trainer_id = $1::uuid
        ORDER BY p.full_name ASC;
      `, [validTrainerId]);
    } else {
      students = await query<RecipientStudent>(`
        SELECT DISTINCT
          s.id,
          s.roll_number,
          p.full_name,
          COALESCE(p.email, '') as email,
          COALESCE(p.phone, '') as phone,
          COALESCE(s.parent_name, '') as parent_name,
          COALESCE(s.parent_contact, p.phone, '') as parent_contact,
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
      count: students.length,
      students
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recipients' },
      { status: 500, headers: corsHeaders }
    );
  }
}

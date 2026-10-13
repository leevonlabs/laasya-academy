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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get('announcementId');
    const batchId = searchParams.get('batchId');

    if (announcementId) {
      const ann = await queryOne<any>(`
        SELECT id, title, target_students, target_student_names, target_batch_id, target_course_id, audience
        FROM public.announcements
        WHERE id = $1
      `, [announcementId]);

      if (!ann) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404, headers: corsHeaders });
      }

      // 1. If explicit target_students array exists
      let directRecipients: any[] = [];
      if (ann.target_students) {
        if (typeof ann.target_students === 'string') {
          try {
            directRecipients = JSON.parse(ann.target_students);
          } catch (_) {}
        } else if (Array.isArray(ann.target_students)) {
          directRecipients = ann.target_students;
        }
      }

      if (directRecipients.length > 0) {
        return NextResponse.json({
          success: true,
          recipients: directRecipients,
          source: 'explicit_selection'
        }, { headers: corsHeaders });
      }

      // 2. If target_batch_id exists
      if (ann.target_batch_id) {
        const batchStudents = await query<any>(`
          SELECT s.id, s.roll_number, p.full_name as name, p.phone, p.email
          FROM public.batch_enrollments be
          JOIN public.students s ON s.id = be.student_id
          JOIN public.profiles p ON p.id = s.profile_id
          WHERE be.batch_id = $1 AND be.status = 'active'
          ORDER BY p.full_name ASC
        `, [ann.target_batch_id]);

        return NextResponse.json({
          success: true,
          recipients: batchStudents,
          source: 'batch_enrollment'
        }, { headers: corsHeaders });
      }

      // 3. If target_course_id exists
      if (ann.target_course_id) {
        const courseStudents = await query<any>(`
          SELECT DISTINCT s.id, s.roll_number, p.full_name as name, p.phone, p.email
          FROM public.batches b
          JOIN public.batch_enrollments be ON be.batch_id = b.id AND be.status = 'active'
          JOIN public.students s ON s.id = be.student_id
          JOIN public.profiles p ON p.id = s.profile_id
          WHERE b.course_id = $1
          ORDER BY p.full_name ASC
        `, [ann.target_course_id]);

        return NextResponse.json({
          success: true,
          recipients: courseStudents,
          source: 'course_enrollment'
        }, { headers: corsHeaders });
      }

      // 4. Fallback for All Students audience
      const allActiveStudents = await query<any>(`
        SELECT s.id, s.roll_number, p.full_name as name, p.phone, p.email
        FROM public.students s
        JOIN public.profiles p ON p.id = s.profile_id
        WHERE s.status = 'active'
        ORDER BY p.full_name ASC
      `);

      return NextResponse.json({
        success: true,
        recipients: allActiveStudents,
        source: 'all_students'
      }, { headers: corsHeaders });
    }

    if (batchId) {
      const batchStudents = await query<any>(`
        SELECT s.id, s.roll_number, p.full_name as name, p.phone, p.email
        FROM public.batch_enrollments be
        JOIN public.students s ON s.id = be.student_id
        JOIN public.profiles p ON p.id = s.profile_id
        WHERE be.batch_id = $1 AND be.status = 'active'
        ORDER BY p.full_name ASC
      `, [batchId]);

      return NextResponse.json({
        success: true,
        recipients: batchStudents,
        source: 'batch_enrollment'
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'announcementId or batchId required' }, { status: 400, headers: corsHeaders });
  } catch (error: any) {
    console.error('Error fetching announcement recipients:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

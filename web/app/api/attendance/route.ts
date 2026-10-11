import { NextRequest, NextResponse } from 'next/server';
import { getAttendanceAuditRecords } from '@/lib/academy';
import { query, queryOne } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || searchParams.get('student_id');

    // 1. If fetching attendance history for a specific student
    if (studentId) {
      const historySql = `
        SELECT 
          a.id,
          a.status,
          a.check_in_time,
          a.check_in_method,
          cs.session_date,
          c.title as course_title,
          b.name as batch_name,
          COALESCE(p_tr.full_name, 'Assigned Guru') as trainer_name
        FROM public.attendance a
        JOIN public.class_sessions cs ON a.session_id = cs.id
        JOIN public.batches b ON cs.batch_id = b.id
        JOIN public.courses c ON b.course_id = c.id
        LEFT JOIN public.trainers t ON b.trainer_id = t.id
        LEFT JOIN public.profiles p_tr ON t.profile_id = p_tr.id
        WHERE a.student_id = $1 OR a.student_id IN (
          SELECT s.id FROM public.students s WHERE s.profile_id = $1 OR s.roll_number = $1
        )
        ORDER BY cs.session_date DESC, a.check_in_time DESC
        LIMIT 50;
      `;
      const rows = await query<any>(historySql, [studentId]);
      const formatted = rows.map((r: any) => {
        const d = r.session_date ? new Date(r.session_date) : new Date();
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
        return {
          id: r.id,
          status: r.status,
          check_in_method: r.check_in_method || 'trainer_manual',
          course_title: r.course_title,
          batch_name: r.batch_name,
          trainer_name: r.trainer_name,
          date: dateStr,
          date_iso: r.session_date ? r.session_date.toString().split('T')[0] : '',
          time: timeStr,
        };
      });

      return NextResponse.json({ success: true, history: formatted }, { headers: corsHeaders });
    }

    // 2. Default audit view for admin portal
    const courseId = searchParams.get('courseId') || searchParams.get('course_id') || undefined;
    const startDate = searchParams.get('startDate') || searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('endDate') || searchParams.get('end_date') || undefined;
    const dateFilter = searchParams.get('dateFilter') || searchParams.get('date') || undefined;

    const records = await getAttendanceAuditRecords({
      courseId,
      startDate,
      endDate,
      dateFilter
    });

    return NextResponse.json(records, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batch_id, batch_name, course_title, trainer_name, records } = body;

    if (!batch_id || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'batch_id and records array are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const guruName = trainer_name || 'Assigned Guru';
    const cTitle = course_title || 'Classical Arts';
    const bName = batch_name || 'Class Session';

    // 1. Get or create today's class_session for this batch
    let session = await queryOne<{ id: string }>(`
      SELECT id FROM public.class_sessions
      WHERE batch_id = $1 AND session_date = CURRENT_DATE
      LIMIT 1;
    `, [batch_id]);

    if (!session) {
      session = await queryOne<{ id: string }>(`
        INSERT INTO public.class_sessions (
          batch_id, session_date, start_time, end_time, status, created_at, updated_at
        ) VALUES (
          $1, CURRENT_DATE, '17:00:00', '18:30:00', 'completed', NOW(), NOW()
        )
        RETURNING id;
      `, [batch_id]);
    }

    if (!session) {
      throw new Error('Failed to initialize session record in database.');
    }

    const sessionId = session.id;

    // 2. Upsert each student attendance record
    for (const rec of records) {
      const studentId = rec.student_id || rec.id;
      const status = rec.status === 'absent' ? 'absent' : 'present';
      const studentName = rec.name || rec.student_name || 'Disciple';
      const rollNumber = (rec.roll || rec.roll_number || '').toString();

      // Delete existing entry if any for today's session to allow updating
      await query(`
        DELETE FROM public.attendance WHERE session_id = $1 AND student_id = $2;
      `, [sessionId, studentId]);

      await query(`
        INSERT INTO public.attendance (
          session_id, student_id, status, check_in_time, check_in_method, remarks, created_at, updated_at
        ) VALUES (
          $1, $2, $3, NOW(), 'trainer_manual', $4, NOW(), NOW()
        );
      `, [sessionId, studentId, status, `Marked by Guru ${guruName}`]);

      // 3. Create real-time attendance notification in session_alerts for the student app
      const statusUpper = status.toUpperCase();
      const statusMsg = `Attendance Marked: You have been marked ${statusUpper} for ${cTitle} (${bName}) on ${todayStr} by Guru ${guruName}.`;

      await query(`
        INSERT INTO public.session_alerts (
          batch_id, batch_name, course_title, trainer_name, message, alert_type, target_student_id, student_status, target_roll_number, target_student_name, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'attendance_marked', $6, $7, $8, $9, NOW()
        );
      `, [batch_id, bName, cTitle, guruName, statusMsg, studentId, status, rollNumber, studentName]);

      // 4. Create announcement notice so it appears in Notifications tab
      try {
        await query(`
          INSERT INTO public.announcements (
            title, message, audience, target_batch_name, target_course_title,
            type_tag, announcement_type, sender_role, trainer_name,
            publish_date, expiry_date, status, delivery_status, created_by, created_at, updated_at
          ) VALUES (
            $1, $2, 'Selected course or batch', $3, $4,
            'General', 'notification', 'trainer', $5,
            $6, $6, 'Published', 'System verified (Delivered)', $5, NOW(), NOW()
          );
        `, [
          `Attendance: ${statusUpper} - ${cTitle}`,
          `Dear ${studentName}, your attendance for today's session in ${cTitle} (${bName}) has been marked as ${statusUpper} by Guru ${guruName}.`,
          bName,
          cTitle,
          guruName,
          todayStr
        ]);
      } catch (annErr) {
        console.warn('Could not insert attendance announcement copy:', annErr);
      }
    }

    return NextResponse.json({ success: true, count: records.length }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Submit attendance error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

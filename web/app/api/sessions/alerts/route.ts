import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { sendFcmToBatch } from '@/lib/fcm';

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
    const body = await request.json();
    const { batch_id, batch_name, course_title, trainer_name, message } = body;

    if (!batch_id || !batch_name || !course_title) {
      return NextResponse.json(
        { success: false, error: 'batch_id, batch_name, and course_title are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const alertMessage = message || `Class Completed! Please come to collect your child. The ${course_title} (${batch_name}) session has concluded. Please take your child back from the academy hall safely.`;

    // 1. Insert into session_alerts table
    const alert = await queryOne<any>(`
      INSERT INTO public.session_alerts (batch_id, batch_name, course_title, trainer_name, message, alert_type, created_at)
      VALUES ($1, $2, $3, $4, $5, 'class_closed', NOW())
      RETURNING id, batch_id, batch_name, course_title, trainer_name, message, alert_type, created_at;
    `, [batch_id, batch_name, course_title, trainer_name || 'Assigned Guru', alertMessage]);

    // 2. Also log as a live announcement notification so it appears in notices
    try {
      const today = new Date().toISOString().split('T')[0];
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
        `Class Completed: ${course_title} (${batch_name})`,
        alertMessage,
        batch_name,
        course_title,
        trainer_name || 'Assigned Guru',
        today
      ]);
    } catch (annError) {
      console.warn('Could not insert alert announcement copy:', annError);
    }

    // 3. Send real-time FCM Push Notification to all students/parents in this batch
    sendFcmToBatch(batch_id, {
      title: `Class Completed: ${course_title}`,
      body: alertMessage,
      data: {
        type: 'class_closed',
        batch_id: String(batch_id),
        batch_name: String(batch_name),
        course_title: String(course_title)
      }
    }).catch(fcmErr => console.error('[FCM] Error sending session alert push:', fcmErr));

    return NextResponse.json({ success: true, alert }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Session alert error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger session alert.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchIdsParam = searchParams.get('batchIds');
    const studentIdParam = searchParams.get('studentId') || searchParams.get('student_id');
    const rollParam = searchParams.get('rollNumber') || searchParams.get('roll');
    const nameParam = searchParams.get('name') || searchParams.get('studentName');
    const phoneParam = searchParams.get('phone');
    const secondsParam = parseInt(searchParams.get('sinceSeconds') || '1800', 10);
    const windowSeconds = isNaN(secondsParam) || secondsParam < 10 ? 1800 : Math.min(secondsParam, 3600);

    const alerts = await query<any>(`
      SELECT id, batch_id, batch_name, course_title, trainer_name, message, COALESCE(alert_type, 'class_closed') AS alert_type, 
             target_student_id, student_status, target_roll_number, target_student_name, created_at,
             (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS created_at_ms
      FROM public.session_alerts
      WHERE created_at >= NOW() - ($1 || ' seconds')::interval
      ORDER BY created_at DESC
      LIMIT 50;
    `, [windowSeconds]);

    const roleParam = (searchParams.get('role') || 'student').toLowerCase();
    const isTrainer = roleParam === 'trainer' || roleParam === 'guru' || roleParam === 'faculty';

    // Resolve student identifiers and batch enrollments from DB if student info provided
    const studentDbIds: string[] = [];
    const studentBatchIds: string[] = [];
    const studentRolls: string[] = [];
    const studentNames: string[] = [];
    const studentBatchNames: string[] = [];
    const studentCourseTitles: string[] = [];

    const cleanPhone = (phoneParam || '').replace(/\D/g, '');
    const matchCriteria = [studentIdParam, rollParam].filter(Boolean) as string[];

    if (matchCriteria.length > 0 || cleanPhone.length >= 8) {
      try {
        const studentRows = await query<any>(`
          SELECT s.id, s.profile_id, s.roll_number, p.full_name, be.batch_id,
                 b.name AS batch_name, c.title AS course_title
          FROM public.students s
          JOIN public.profiles p ON s.profile_id = p.id
          LEFT JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
          LEFT JOIN public.batches b ON b.id = be.batch_id
          LEFT JOIN public.courses c ON c.id = b.course_id
          WHERE s.id::text = ANY($1::text[]) 
             OR s.profile_id::text = ANY($1::text[]) 
             OR LOWER(s.roll_number) = ANY(SELECT LOWER(x) FROM unnest($1::text[]) x)
             OR (LENGTH($2) >= 8 AND regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g') LIKE '%' || $2 || '%');
        `, [matchCriteria, cleanPhone]);

        studentRows.forEach(r => {
          if (r.id) studentDbIds.push(r.id.toLowerCase());
          if (r.profile_id) studentDbIds.push(r.profile_id.toLowerCase());
          if (r.roll_number) {
            studentRolls.push(r.roll_number.toLowerCase());
            studentRolls.push(r.roll_number.replace(/\D/g, '')); // e.g. "001" or "1"
          }
          if (r.full_name) studentNames.push(r.full_name.toLowerCase());
          if (r.batch_id) studentBatchIds.push(r.batch_id.toLowerCase());
          if (r.batch_name) studentBatchNames.push(r.batch_name.toLowerCase());
          if (r.course_title) studentCourseTitles.push(r.course_title.toLowerCase());
        });
      } catch (dbErr) {
        console.warn('Error querying student enrollment context for alerts:', dbErr);
      }
    }

    const allowedBatchIds = (batchIdsParam && batchIdsParam.trim() && batchIdsParam !== 'all')
      ? batchIdsParam.split(',').map(s => s.trim().toLowerCase())
      : [];

    const filtered = alerts.filter(a => {
      const bId = (a.batch_id || '').toLowerCase();
      const targetId = (a.target_student_id || '').toLowerCase();
      const targetRoll = (a.target_roll_number || '').toLowerCase();
      const targetRollDigits = targetRoll.replace(/\D/g, '');
      const targetName = (a.target_student_name || '').toLowerCase();
      const aCourse = (a.course_title || '').toLowerCase();
      const aBatch = (a.batch_name || '').toLowerCase();

      // Guru/Trainer role: receives admin announcements, notices, and messages
      if (isTrainer) {
        if (
          a.alert_type === 'message' || 
          a.alert_type === 'announcement' || 
          a.alert_type === 'admin_alert' ||
          a.alert_type === 'holiday_alert' ||
          a.alert_type === 'tally_class' ||
          a.alert_type === 'session_cancellation' ||
          a.alert_type === 'video_shared'
        ) {
          if (!bId || bId === 'all') return true;
          if (allowedBatchIds.length > 0 && !allowedBatchIds.includes(bId)) {
            return false;
          }
          return true;
        }
        return false;
      }

      // Student role:
      if (a.alert_type === 'attendance_marked') {
        // Attendance alert is STRICTLY PERSONAL - ONLY match if targeted to this disciple!
        // 1. Direct ID match
        if (studentIdParam && targetId === studentIdParam.trim().toLowerCase()) return true;
        if (targetId && studentDbIds.includes(targetId)) return true;

        // 2. Roll number match (e.g. LCA-001 vs LCA-1 or pure digits)
        if (rollParam && (targetRoll === rollParam.trim().toLowerCase() || (targetRollDigits && targetRollDigits === rollParam.replace(/\D/g, '')))) return true;
        if (studentRolls.some(r => r && (targetRoll === r || targetRollDigits === r))) return true;

        // 3. Name match
        if (nameParam && targetName) {
          const np = nameParam.trim().toLowerCase();
          if (targetName.includes(np) || np.includes(targetName)) return true;
        }
        if (studentNames.some(n => n && targetName && (targetName.includes(n) || n.includes(targetName)))) return true;

        return false;
      }

      if (
        a.alert_type === 'message' || 
        a.alert_type === 'announcement' ||
        a.alert_type === 'holiday_alert' ||
        a.alert_type === 'tally_class' ||
        a.alert_type === 'session_cancellation' ||
        a.alert_type === 'video_shared'
      ) {
        const isGuruSender = a.trainer_name && !a.trainer_name.toLowerCase().includes('director') && !a.trainer_name.toLowerCase().includes('admin');
        if (isGuruSender) {
          if (!bId || bId === 'all') return true;
          return allowedBatchIds.includes(bId) || studentBatchIds.includes(bId) || studentBatchNames.some(bn => bn.includes(aBatch) || aBatch.includes(bn));
        }
        // Broadcasts from Admin / Academy Director
        if (!bId || bId === 'all') return true;
        if (allowedBatchIds.includes(bId) || studentBatchIds.includes(bId)) return true;
        if (studentBatchNames.some(bn => bn.includes(aBatch) || aBatch.includes(bn))) return true;
        if (studentCourseTitles.some(ct => ct.includes(aCourse) || aCourse.includes(ct))) return true;
        return true; // General announcements are visible to disciples
      }

      // Class closed alert:
      if (a.alert_type === 'class_closed') {
        // If client requested 'all' batches or client batches are empty
        if (!batchIdsParam || batchIdsParam.toLowerCase() === 'all' || allowedBatchIds.length === 0) {
          // If we have student's course or batch enrollments from DB, check if they overlap
          if (studentCourseTitles.length > 0 || studentBatchNames.length > 0 || studentBatchIds.length > 0) {
            const courseMatch = studentCourseTitles.some(ct => ct && (aCourse.includes(ct) || ct.includes(aCourse)));
            const batchMatch = studentBatchNames.some(bn => bn && (aBatch.includes(bn) || bn.includes(aBatch)));
            const idMatch = bId === 'all' || (bId && (studentBatchIds.includes(bId) || allowedBatchIds.includes(bId)));
            if (courseMatch || batchMatch || idMatch) return true;
          }
          // Default allow if query did not specify narrow batchIds
          return true;
        }

        if (bId === 'all') return true;
        if (allowedBatchIds.includes(bId)) return true;
        if (studentBatchIds.includes(bId)) return true;
        if (studentBatchNames.some(bn => bn && (aBatch.includes(bn) || bn.includes(aBatch)))) return true;
        if (studentCourseTitles.some(ct => ct && (aCourse.includes(ct) || ct.includes(aCourse)))) return true;

        return false;
      }

      return false;
    });

    // Deduplicate: only return the latest single alert per batch/student to prevent alert loops
    const deduplicated: any[] = [];
    const seen = new Set<string>();

    for (const a of filtered) {
      const key = a.alert_type === 'attendance_marked'
        ? `att:${a.batch_id}:${a.target_student_id || a.target_roll_number || 'stu'}`
        : (a.alert_type === 'class_closed'
            ? `closed:${a.batch_id}`
            : `alert:${a.alert_type}:${a.id || Math.random()}`);

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(a);
      }
    }

    return NextResponse.json({ success: true, alerts: deduplicated }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Fetch session alerts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch session alerts.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

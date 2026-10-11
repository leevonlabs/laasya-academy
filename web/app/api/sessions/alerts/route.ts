import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

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

    const alertMessage = message || `The ${course_title} (${batch_name}) class session has concluded. Parents are requested to pick up their child safely.`;

    // 1. Insert into session_alerts table
    const alert = await queryOne<any>(`
      INSERT INTO public.session_alerts (batch_id, batch_name, course_title, trainer_name, message, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, batch_id, batch_name, course_title, trainer_name, message, created_at;
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
      SELECT id, batch_id, batch_name, course_title, trainer_name, message, alert_type, 
             target_student_id, student_status, target_roll_number, target_student_name, created_at
      FROM public.session_alerts
      WHERE created_at >= NOW() - ($1 || ' seconds')::interval
      ORDER BY created_at DESC
      LIMIT 50;
    `, [windowSeconds]);

    // Resolve student identifiers and batch enrollments from DB if student info provided
    const studentDbIds: string[] = [];
    const studentBatchIds: string[] = [];
    const studentRolls: string[] = [];
    const studentNames: string[] = [];

    const cleanPhone = (phoneParam || '').replace(/\D/g, '');
    const matchCriteria = [studentIdParam, rollParam].filter(Boolean) as string[];

    if (matchCriteria.length > 0 || cleanPhone.length >= 8) {
      try {
        const studentRows = await query<any>(`
          SELECT s.id, s.profile_id, s.roll_number, p.full_name, be.batch_id
          FROM public.students s
          JOIN public.profiles p ON s.profile_id = p.id
          LEFT JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
          WHERE s.id = ANY($1) 
             OR s.profile_id = ANY($1) 
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

      if (a.alert_type === 'attendance_marked') {
        // 1. Direct ID match
        if (studentIdParam && targetId === studentIdParam.trim().toLowerCase()) return true;
        if (targetId && studentDbIds.includes(targetId)) return true;

        // 2. Roll number match (e.g. LCA-001 vs LCA-1 or pure digits)
        if (rollParam && (targetRoll === rollParam.trim().toLowerCase() || (targetRollDigits && targetRollDigits === rollParam.replace(/\D/g, '')))) return true;
        if (studentRolls.some(r => r && (targetRoll === r || targetRollDigits === r))) return true;

        // 3. Name match
        if (nameParam && targetName && targetName.includes(nameParam.trim().toLowerCase())) return true;
        if (studentNames.some(n => n && targetName && targetName.includes(n))) return true;

        // 4. Batch match fallback if student is enrolled in this batch
        if (allowedBatchIds.length > 0 && allowedBatchIds.includes(bId)) return true;
        if (studentBatchIds.length > 0 && studentBatchIds.includes(bId)) return true;

        return false;
      }

      // Class closed alert: matches if student is enrolled in this batch or all batches allowed
      if (allowedBatchIds.length === 0 && studentBatchIds.length === 0) return true; // 'all'
      if (allowedBatchIds.length > 0 && allowedBatchIds.includes(bId)) return true;
      if (studentBatchIds.length > 0 && studentBatchIds.includes(bId)) return true;

      return false;
    });

    return NextResponse.json({ success: true, alerts: filtered }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Fetch session alerts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch session alerts.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

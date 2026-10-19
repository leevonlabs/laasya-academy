import { query, queryOne } from './db';
import { sendFcmToBatch, sendFcmToCourse, sendFcmToRole } from './fcm';

export interface HolidayAlert {
  id: string;
  holiday_date: string;
  title: string;
  reason: string;
  target_course_ids: string[];
  target_course_titles: string[];
  target_batch_ids: string[];
  target_batch_names: string[];
  affected_guru_ids: string[];
  affected_guru_names: string[];
  status: 'Scheduled' | 'Active' | 'Passed' | 'Cancelled';
  is_broadcast_sent: boolean;
  image_url?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TallyClass {
  id: string;
  holiday_alert_id?: string | null;
  cancellation_type?: 'holiday' | 'guru_absence' | 'general';
  absent_guru_name?: string | null;
  batch_id: string;
  batch_name: string;
  batch_code?: string;
  course_id: string;
  course_title: string;
  course_code?: string;
  trainer_id: string;
  trainer_name: string;
  original_date?: string | null;
  rescheduled_date: string;
  start_time: string;
  end_time: string;
  room_or_hall: string;
  reason?: string | null;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  students_count: number;
  is_notified: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GuruAbsence {
  id: string;
  trainer_id: string;
  trainer_name: string;
  batch_id: string;
  batch_name: string;
  course_id: string;
  course_title: string;
  absence_date: string;
  reason: string;
  status: 'Pending Reschedule' | 'Rescheduled';
  tally_class_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Helper for day of week name
export const getDayName = (dStr: string) => {
  try {
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
  } catch {
    return '';
  }
};

// -------------------------------------------------------------
// GET HOLIDAY ALERTS
// -------------------------------------------------------------
export async function getHolidayAlerts(): Promise<HolidayAlert[]> {
  try {
    const rows = await query<any>(`
      SELECT 
        id,
        holiday_date::text as holiday_date,
        title,
        reason,
        target_course_ids,
        target_course_titles,
        target_batch_ids,
        target_batch_names,
        affected_guru_ids,
        affected_guru_names,
        status,
        is_broadcast_sent,
        image_url,
        created_by,
        created_at::text as created_at,
        updated_at::text as updated_at
      FROM public.holiday_alerts
      ORDER BY holiday_date DESC, created_at DESC;
    `);

    const todayStr = new Date().toISOString().split('T')[0];

    return rows.map(r => {
      let currentStatus = r.status || 'Scheduled';
      if (currentStatus !== 'Cancelled') {
        if (r.holiday_date === todayStr) {
          currentStatus = 'Active';
        } else if (r.holiday_date < todayStr) {
          currentStatus = 'Passed';
        } else {
          currentStatus = 'Scheduled';
        }
      }

      return {
        ...r,
        target_course_ids: Array.isArray(r.target_course_ids) ? r.target_course_ids : (typeof r.target_course_ids === 'string' ? JSON.parse(r.target_course_ids || '[]') : []),
        target_course_titles: Array.isArray(r.target_course_titles) ? r.target_course_titles : (typeof r.target_course_titles === 'string' ? JSON.parse(r.target_course_titles || '[]') : []),
        target_batch_ids: Array.isArray(r.target_batch_ids) ? r.target_batch_ids : (typeof r.target_batch_ids === 'string' ? JSON.parse(r.target_batch_ids || '[]') : []),
        target_batch_names: Array.isArray(r.target_batch_names) ? r.target_batch_names : (typeof r.target_batch_names === 'string' ? JSON.parse(r.target_batch_names || '[]') : []),
        affected_guru_ids: Array.isArray(r.affected_guru_ids) ? r.affected_guru_ids : (typeof r.affected_guru_ids === 'string' ? JSON.parse(r.affected_guru_ids || '[]') : []),
        affected_guru_names: Array.isArray(r.affected_guru_names) ? r.affected_guru_names : (typeof r.affected_guru_names === 'string' ? JSON.parse(r.affected_guru_names || '[]') : []),
        status: currentStatus
      };
    });
  } catch (error) {
    console.error('Error fetching holiday alerts:', error);
    return [];
  }
}

// -------------------------------------------------------------
// CREATE HOLIDAY ALERT & DISPATCH BROADCASTS
// -------------------------------------------------------------
export async function createHolidayAlert(data: {
  holiday_date: string;
  title: string;
  reason: string;
  target_course_ids: string[];
  target_course_titles: string[];
  target_batch_ids: string[];
  target_batch_names: string[];
  affected_guru_ids: string[];
  affected_guru_names: string[];
  image_url?: string | null;
  created_by?: string;
  send_instant?: boolean;
  send_scheduled_12am?: boolean;
}): Promise<HolidayAlert> {
  const holidayDate = data.holiday_date;
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const status = holidayDate === todayStr ? 'Active' : holidayDate < todayStr ? 'Passed' : 'Scheduled';

  const [row] = await query<any>(`
    INSERT INTO public.holiday_alerts (
      holiday_date,
      title,
      reason,
      target_course_ids,
      target_course_titles,
      target_batch_ids,
      target_batch_names,
      affected_guru_ids,
      affected_guru_names,
      status,
      is_broadcast_sent,
      image_url,
      created_by
    ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, true, $11, $12)
    RETURNING 
      id,
      holiday_date::text as holiday_date,
      title,
      reason,
      target_course_ids,
      target_course_titles,
      target_batch_ids,
      target_batch_names,
      affected_guru_ids,
      affected_guru_names,
      status,
      is_broadcast_sent,
      image_url,
      created_by,
      created_at::text as created_at,
      updated_at::text as updated_at;
  `, [
    holidayDate,
    data.title.trim(),
    data.reason.trim(),
    JSON.stringify(data.target_course_ids || []),
    JSON.stringify(data.target_course_titles || []),
    JSON.stringify(data.target_batch_ids || []),
    JSON.stringify(data.target_batch_names || []),
    JSON.stringify(data.affected_guru_ids || []),
    JSON.stringify(data.affected_guru_names || []),
    status,
    data.image_url || null,
    data.created_by || 'Admin'
  ]);

  const targetCourseTitlesStr = (data.target_course_titles || []).join(', ');
  const targetBatchNamesStr = (data.target_batch_names || []).join(', ');

  const holidayDayName = getDayName(holidayDate);

  // Compute day before holiday for 6:00 PM reminder
  const [hY, hM, hD] = holidayDate.split('-').map(Number);
  const prevDate = new Date(hY, hM - 1, hD);
  prevDate.setDate(prevDate.getDate() - 1);
  const dayBeforeHolidayStr = prevDate.toISOString().split('T')[0];

  // 1 & 2. Dispatch announcements per affected batch so ONLY enrolled students & assigned gurus receive messages
  for (let i = 0; i < data.target_batch_ids.length; i++) {
    const bId = data.target_batch_ids[i];
    const bName = data.target_batch_names[i] || 'Batch';
    const cId = data.target_course_ids[i] || data.target_course_ids[0] || null;
    const cTitle = data.target_course_titles[i] || data.target_course_titles[0] || 'Academy Course';
    const guruName = data.affected_guru_names[i] || 'Faculty Guru';

    // Instant holiday notice: Title, Holiday Date & Day, Reason (and Image)
    if (data.send_instant !== false) {
      const instantMessage = `Holiday Alert: ${data.title.trim()}

Holiday Date: ${holidayDate} (${holidayDayName})

Reason:
${data.reason.trim()}`;

      try {
        await query(`
          INSERT INTO public.announcements (
            title,
            message,
            audience,
            target_course_id,
            target_course_title,
            target_batch_id,
            target_batch_name,
            type_tag,
            publish_date,
            publish_time,
            status,
            delivery_status,
            announcement_type,
            image_url,
            created_by,
            sender_role
          ) VALUES ($1, $2, 'Selected course or batch', $3, $4, $5, $6, 'Holiday', $7, $8, 'Published', 'System verified (Delivered)', 'message', $9, $10, 'admin');
        `, [
          `Holiday Notice: ${data.title.trim()}`,
          instantMessage,
          cId,
          cTitle,
          bId,
          bName,
          todayStr,
          currentTimeStr,
          data.image_url || null,
          data.created_by || 'Admin'
        ]);
      } catch (annErr) {
        console.warn('Could not insert instant announcement for batch:', bId, annErr);
      }
    }

    // Day before holiday at 6:00 PM Reminder announcement
    if (dayBeforeHolidayStr >= todayStr && holidayDate > todayStr) {
      const reminderMessage = `★ REMINDER: HOLIDAY TOMORROW ★

Holiday Alert: ${data.title.trim()}

Holiday Date: ${holidayDate} (${holidayDayName})

Reason:
${data.reason.trim()}`;

      const isPast6pmToday = (dayBeforeHolidayStr === todayStr && now.getHours() >= 18);

      try {
        await query(`
          INSERT INTO public.announcements (
            title,
            message,
            audience,
            target_course_id,
            target_course_title,
            target_batch_id,
            target_batch_name,
            type_tag,
            publish_date,
            publish_time,
            status,
            delivery_status,
            announcement_type,
            image_url,
            created_by,
            sender_role
          ) VALUES ($1, $2, 'Selected course or batch', $3, $4, $5, $6, 'Holiday', $7, '18:00:00', $8, $9, 'message', $10, $11, 'admin');
        `, [
          `Reminder: Holiday Tomorrow - ${data.title.trim()}`,
          reminderMessage,
          cId,
          cTitle,
          bId,
          bName,
          dayBeforeHolidayStr,
          isPast6pmToday ? 'Published' : 'Scheduled',
          isPast6pmToday ? 'System verified (Delivered)' : 'Queued for 6:00 PM Dispatch',
          data.image_url || null,
          data.created_by || 'Admin'
        ]);
      } catch (remErr) {
        console.warn('Could not insert 6 PM reminder announcement for batch:', bId, remErr);
      }
    }

    // 12:00 AM on holiday date announcement
    if (data.send_scheduled_12am !== false && holidayDate > todayStr) {
      const dayOfHolidayMessage = `★ HOLIDAY TODAY ★

Holiday Alert: ${data.title.trim()}

Holiday Date: ${holidayDate} (${holidayDayName})

Reason:
${data.reason.trim()}`;

      try {
        await query(`
          INSERT INTO public.announcements (
            title,
            message,
            audience,
            target_course_id,
            target_course_title,
            target_batch_id,
            target_batch_name,
            type_tag,
            publish_date,
            publish_time,
            status,
            delivery_status,
            announcement_type,
            image_url,
            created_by,
            sender_role
          ) VALUES ($1, $2, 'Selected course or batch', $3, $4, $5, $6, 'Holiday', $7, '00:00:00', 'Scheduled', 'Queued for Scheduled Dispatch', 'message', $8, $9, 'admin');
        `, [
          `Holiday Today: ${data.title.trim()}`,
          dayOfHolidayMessage,
          cId,
          cTitle,
          bId,
          bName,
          holidayDate,
          data.image_url || null,
          data.created_by || 'Admin'
        ]);
      } catch (schedErr) {
        console.warn('Could not insert scheduled 12 AM announcement for batch:', bId, schedErr);
      }
    }

    // Realtime session_alert for each affected batch
    try {
      await query(`
        INSERT INTO public.session_alerts (
          batch_id,
          batch_name,
          course_title,
          trainer_name,
          message,
          alert_type,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, 'announcement', NOW());
      `, [
        bId,
        bName,
        cTitle,
        guruName,
        `HOLIDAY ALERT: ${data.title.trim()} on ${holidayDate} (${holidayDayName}). Reason: ${data.reason.trim()}`
      ]);
    } catch (alertErr) {
      console.warn('Could not insert session_alert for batch', bId, alertErr);
    }

    // Push notification to batch
    sendFcmToBatch(bId, {
      title: `Holiday Alert: ${data.title.trim()}`,
      body: `Holiday on ${holidayDate} (${holidayDayName}). ${data.reason.trim()}`,
      data: {
        type: 'holiday_alert',
        holiday_date: holidayDate,
        batch_id: bId
      }
    }).catch(e => console.error('[FCM] Error notifying batch of holiday:', e));
  }

  // Also notify gurus directly via FCM
  sendFcmToRole('trainer', {
    title: `Faculty Holiday Alert: ${data.title.trim()}`,
    body: `Holiday declared on ${holidayDate} for batches: ${targetBatchNamesStr || 'Selected Batches'}.`,
    data: {
      type: 'holiday_alert',
      holiday_date: holidayDate
    }
  }).catch(e => console.error('[FCM] Error notifying gurus of holiday:', e));

  return {
    ...row,
    target_course_ids: Array.isArray(row.target_course_ids) ? row.target_course_ids : [],
    target_course_titles: Array.isArray(row.target_course_titles) ? row.target_course_titles : [],
    target_batch_ids: Array.isArray(row.target_batch_ids) ? row.target_batch_ids : [],
    target_batch_names: Array.isArray(row.target_batch_names) ? row.target_batch_names : [],
    affected_guru_ids: Array.isArray(row.affected_guru_ids) ? row.affected_guru_ids : [],
    affected_guru_names: Array.isArray(row.affected_guru_names) ? row.affected_guru_names : []
  };
}

// -------------------------------------------------------------
// UPDATE HOLIDAY ALERT
// -------------------------------------------------------------
export async function updateHolidayAlert(data: {
  id: string;
  holiday_date: string;
  title: string;
  reason: string;
  target_course_ids: string[];
  target_course_titles: string[];
  target_batch_ids: string[];
  target_batch_names: string[];
  affected_guru_ids: string[];
  affected_guru_names: string[];
  image_url?: string | null;
}): Promise<HolidayAlert> {
  const [row] = await query<any>(`
    UPDATE public.holiday_alerts
    SET 
      holiday_date = $2,
      title = $3,
      reason = $4,
      target_course_ids = $5::jsonb,
      target_course_titles = $6::jsonb,
      target_batch_ids = $7::jsonb,
      target_batch_names = $8::jsonb,
      affected_guru_ids = $9::jsonb,
      affected_guru_names = $10::jsonb,
      image_url = $11,
      updated_at = NOW()
    WHERE id = $1
    RETURNING 
      id,
      holiday_date::text as holiday_date,
      title,
      reason,
      target_course_ids,
      target_course_titles,
      target_batch_ids,
      target_batch_names,
      affected_guru_ids,
      affected_guru_names,
      status,
      is_broadcast_sent,
      image_url,
      created_by,
      created_at::text as created_at,
      updated_at::text as updated_at;
  `, [
    data.id,
    data.holiday_date,
    data.title.trim(),
    data.reason.trim(),
    JSON.stringify(data.target_course_ids || []),
    JSON.stringify(data.target_course_titles || []),
    JSON.stringify(data.target_batch_ids || []),
    JSON.stringify(data.target_batch_names || []),
    JSON.stringify(data.affected_guru_ids || []),
    JSON.stringify(data.affected_guru_names || []),
    data.image_url || null
  ]);

  return {
    ...row,
    target_course_ids: Array.isArray(row.target_course_ids) ? row.target_course_ids : [],
    target_course_titles: Array.isArray(row.target_course_titles) ? row.target_course_titles : [],
    target_batch_ids: Array.isArray(row.target_batch_ids) ? row.target_batch_ids : [],
    target_batch_names: Array.isArray(row.target_batch_names) ? row.target_batch_names : [],
    affected_guru_ids: Array.isArray(row.affected_guru_ids) ? row.affected_guru_ids : [],
    affected_guru_names: Array.isArray(row.affected_guru_names) ? row.affected_guru_names : []
  };
}

// -------------------------------------------------------------
// DELETE HOLIDAY ALERT
// -------------------------------------------------------------
export async function deleteHolidayAlert(id: string): Promise<boolean> {
  await query('DELETE FROM public.holiday_alerts WHERE id = $1', [id]);
  return true;
}

// -------------------------------------------------------------
// GET TALLY CLASSES
// -------------------------------------------------------------
export async function getTallyClasses(): Promise<TallyClass[]> {
  try {
    const rows = await query<any>(`
      SELECT 
        tc.id,
        tc.holiday_alert_id,
        tc.cancellation_type,
        tc.absent_guru_name,
        tc.batch_id,
        tc.batch_name,
        tc.batch_code,
        tc.course_id,
        tc.course_title,
        tc.course_code,
        tc.trainer_id,
        tc.trainer_name,
        tc.original_date::text as original_date,
        tc.rescheduled_date::text as rescheduled_date,
        tc.start_time::text as start_time,
        tc.end_time::text as end_time,
        tc.room_or_hall,
        tc.reason,
        tc.status,
        tc.students_count,
        tc.is_notified,
        tc.created_by,
        tc.created_at::text as created_at,
        tc.updated_at::text as updated_at
      FROM public.tally_classes tc
      ORDER BY tc.rescheduled_date DESC, tc.start_time ASC;
    `);

    const todayStr = new Date().toISOString().split('T')[0];

    return rows.map(r => {
      let st = r.status || 'Scheduled';
      if (st === 'Scheduled' && r.rescheduled_date < todayStr) {
        st = 'Completed';
      }
      return {
        ...r,
        status: st
      };
    });
  } catch (error) {
    console.error('Error fetching tally classes:', error);
    return [];
  }
}

// -------------------------------------------------------------
// CREATE TALLY CLASS
// -------------------------------------------------------------
export async function createTallyClass(data: {
  holiday_alert_id?: string | null;
  cancellation_type?: 'holiday' | 'guru_absence' | 'general';
  absent_guru_name?: string | null;
  guru_absence_id?: string | null;
  batch_id: string;
  batch_name: string;
  batch_code?: string;
  course_id: string;
  course_title: string;
  course_code?: string;
  trainer_id: string;
  trainer_name: string;
  original_date?: string | null;
  rescheduled_date: string;
  start_time: string;
  end_time: string;
  room_or_hall: string;
  reason?: string | null;
  students_count?: number;
  created_by?: string;
}): Promise<TallyClass> {
  const [row] = await query<any>(`
    INSERT INTO public.tally_classes (
      holiday_alert_id,
      cancellation_type,
      absent_guru_name,
      batch_id,
      batch_name,
      batch_code,
      course_id,
      course_title,
      course_code,
      trainer_id,
      trainer_name,
      original_date,
      rescheduled_date,
      start_time,
      end_time,
      room_or_hall,
      reason,
      status,
      students_count,
      is_notified,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'Scheduled', $18, true, $19)
    RETURNING 
      id,
      holiday_alert_id,
      cancellation_type,
      absent_guru_name,
      batch_id,
      batch_name,
      batch_code,
      course_id,
      course_title,
      course_code,
      trainer_id,
      trainer_name,
      original_date::text as original_date,
      rescheduled_date::text as rescheduled_date,
      start_time::text as start_time,
      end_time::text as end_time,
      room_or_hall,
      reason,
      status,
      students_count,
      is_notified,
      created_by,
      created_at::text as created_at,
      updated_at::text as updated_at;
  `, [
    data.holiday_alert_id || null,
    data.cancellation_type || 'holiday',
    data.absent_guru_name || null,
    data.batch_id,
    data.batch_name,
    data.batch_code || null,
    data.course_id,
    data.course_title,
    data.course_code || null,
    data.trainer_id,
    data.trainer_name,
    data.original_date || null,
    data.rescheduled_date,
    data.start_time,
    data.end_time,
    data.room_or_hall,
    data.reason || 'Compensation class for cancelled/holiday session',
    data.students_count || 0,
    data.created_by || 'Admin'
  ]);

  // If this tally class is tied to a guru absence record, update its status
  if (data.guru_absence_id) {
    try {
      await query(`
        UPDATE public.guru_absences 
        SET status = 'Rescheduled', tally_class_id = $1, updated_at = NOW() 
        WHERE id = $2
      `, [row.id, data.guru_absence_id]);
    } catch (e) {
      console.warn('Could not link guru absence to tally class:', e);
    }
  }

  // Dispatch announcement notification to batch students & guru
  let cancelledRef = data.original_date ? `${data.original_date}` : 'Previously Scheduled Session';
  if (data.holiday_alert_id) {
    try {
      const [ha] = await query<{ title: string }>(`SELECT title FROM public.holiday_alerts WHERE id = $1`, [data.holiday_alert_id]);
      if (ha?.title) {
        cancelledRef = `${data.original_date || ''} (${ha.title})`;
      }
    } catch (_) {}
  } else if (data.cancellation_type === 'guru_absence') {
    cancelledRef = `${data.original_date || ''} (Guru Absence - ${data.absent_guru_name || data.trainer_name})`;
  }

  const reschedDayName = getDayName(data.rescheduled_date);

  const extraClassTitle = `Extra Class: ${data.batch_name}`;
  const extraClassMsg = `★ EXTRA CLASS ANNOUNCEMENT ★

Reschedule of class that was cancelled on: ${cancelledRef}

• Course: ${data.course_title}
• Batch: ${data.batch_name}
• Rescheduled Date: ${data.rescheduled_date} (${reschedDayName})
• Class Timings: ${data.start_time.substring(0, 5)} - ${data.end_time.substring(0, 5)}
• Studio Room: ${data.room_or_hall}
• Assigned Guru: ${data.trainer_name}
${data.reason ? `• Remarks: ${data.reason}\n` : ''}
Please attend on time. Attendance will be recorded for this class.`;

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Instant Extra Class notification
    await query(`
      INSERT INTO public.announcements (
        title,
        message,
        audience,
        target_course_id,
        target_course_title,
        target_batch_id,
        target_batch_name,
        type_tag,
        publish_date,
        publish_time,
        status,
        delivery_status,
        announcement_type,
        created_by,
        sender_role
      ) VALUES ($1, $2, 'Selected course or batch', $3, $4, $5, $6, 'Schedule change', $7, $8, 'Published', 'System verified (Delivered)', 'message', $9, 'admin');
    `, [
      extraClassTitle,
      extraClassMsg,
      data.course_id,
      data.course_title,
      data.batch_id,
      data.batch_name,
      todayStr,
      currentTimeStr,
      data.created_by || 'Admin'
    ]);

    // Scheduled 6:00 PM reminder the day before the rescheduled date
    const [rY, rM, rD] = data.rescheduled_date.split('-').map(Number);
    const prevReschedDate = new Date(rY, rM - 1, rD);
    prevReschedDate.setDate(prevReschedDate.getDate() - 1);
    const dayBeforeReschedStr = prevReschedDate.toISOString().split('T')[0];

    if (dayBeforeReschedStr >= todayStr && data.rescheduled_date > todayStr) {
      const reminderMsg = `★ REMINDER: EXTRA CLASS TOMORROW ★

Reschedule of class that was cancelled on: ${cancelledRef}

• Course: ${data.course_title}
• Batch: ${data.batch_name}
• Rescheduled Date: ${data.rescheduled_date} (${reschedDayName})
• Class Timings: ${data.start_time.substring(0, 5)} - ${data.end_time.substring(0, 5)}
• Studio Room: ${data.room_or_hall}
• Assigned Guru: ${data.trainer_name}
${data.reason ? `• Remarks: ${data.reason}\n` : ''}
Please attend on time. Attendance will be recorded for this class.`;

      const isPast6pmToday = (dayBeforeReschedStr === todayStr && now.getHours() >= 18);

      try {
        await query(`
          INSERT INTO public.announcements (
            title,
            message,
            audience,
            target_course_id,
            target_course_title,
            target_batch_id,
            target_batch_name,
            type_tag,
            publish_date,
            publish_time,
            status,
            delivery_status,
            announcement_type,
            created_by,
            sender_role
          ) VALUES ($1, $2, 'Selected course or batch', $3, $4, $5, $6, 'Schedule change', $7, '18:00:00', $8, $9, 'message', $10, 'admin');
        `, [
          `Reminder: Extra Class Tomorrow - ${data.batch_name}`,
          reminderMsg,
          data.course_id,
          data.course_title,
          data.batch_id,
          data.batch_name,
          dayBeforeReschedStr,
          isPast6pmToday ? 'Published' : 'Scheduled',
          isPast6pmToday ? 'System verified (Delivered)' : 'Queued for 6:00 PM Dispatch',
          data.created_by || 'Admin'
        ]);
      } catch (remErr) {
        console.warn('Could not insert 6 PM reminder announcement for extra class:', remErr);
      }
    }

    // Session alert for realtime popup in student and guru apps
    await query(`
      INSERT INTO public.session_alerts (
        batch_id,
        batch_name,
        course_title,
        trainer_name,
        message,
        alert_type,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, 'announcement', NOW());
    `, [
      data.batch_id,
      data.batch_name,
      data.course_title,
      data.trainer_name,
      `EXTRA CLASS SCHEDULED: ${data.batch_name} rescheduled to ${data.rescheduled_date} (${data.start_time.substring(0, 5)} - ${data.end_time.substring(0, 5)}) in ${data.room_or_hall}. Cancelled class ref: ${cancelledRef}.`
    ]);

    // Push notification to batch
    sendFcmToBatch(data.batch_id, {
      title: extraClassTitle,
      body: `Rescheduled to ${data.rescheduled_date} (${data.start_time.substring(0, 5)} - ${data.end_time.substring(0, 5)}) in ${data.room_or_hall}. Please attend on time.`,
      data: {
        type: 'tally_class',
        batch_id: data.batch_id,
        rescheduled_date: data.rescheduled_date
      }
    }).catch(e => console.error('[FCM] Error notifying batch of tally class:', e));
  } catch (err) {
    console.warn('Error broadcasting tally class announcement:', err);
  }

  return row;
}

// -------------------------------------------------------------
// DELETE TALLY CLASS
// -------------------------------------------------------------
export async function deleteTallyClass(id: string): Promise<boolean> {
  // If tied to guru absence, revert guru absence status to 'Pending Reschedule'
  try {
    await query(`
      UPDATE public.guru_absences 
      SET status = 'Pending Reschedule', tally_class_id = NULL, updated_at = NOW() 
      WHERE tally_class_id = $1
    `, [id]);
  } catch (e) {
    console.warn('Error updating linked guru absence on delete tally class:', e);
  }
  await query('DELETE FROM public.tally_classes WHERE id = $1', [id]);
  return true;
}

// -------------------------------------------------------------
// UPDATE TALLY CLASS STATUS
// -------------------------------------------------------------
export async function updateTallyClassStatus(id: string, status: 'Scheduled' | 'Completed' | 'Cancelled'): Promise<boolean> {
  await query('UPDATE public.tally_classes SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  return true;
}

// -------------------------------------------------------------
// UPDATE TALLY CLASS DETAILS (For Edit Reschedule)
// -------------------------------------------------------------
export async function updateTallyClassDetails(id: string, data: {
  rescheduled_date?: string;
  start_time?: string;
  end_time?: string;
  room_or_hall?: string;
  reason?: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled';
}): Promise<TallyClass | null> {
  const fields: string[] = [];
  const params: any[] = [];
  if (data.rescheduled_date) {
    params.push(data.rescheduled_date);
    fields.push(`rescheduled_date = $${params.length}`);
  }
  if (data.start_time) {
    params.push(data.start_time);
    fields.push(`start_time = $${params.length}`);
  }
  if (data.end_time) {
    params.push(data.end_time);
    fields.push(`end_time = $${params.length}`);
  }
  if (data.room_or_hall) {
    params.push(data.room_or_hall);
    fields.push(`room_or_hall = $${params.length}`);
  }
  if (data.reason !== undefined) {
    params.push(data.reason);
    fields.push(`reason = $${params.length}`);
  }
  if (data.status) {
    params.push(data.status);
    fields.push(`status = $${params.length}`);
  }
  if (fields.length === 0) return null;
  params.push(id);
  const sql = `
    UPDATE public.tally_classes 
    SET ${fields.join(', ')}, updated_at = NOW() 
    WHERE id = $${params.length} 
    RETURNING 
      id,
      holiday_alert_id,
      cancellation_type,
      absent_guru_name,
      batch_id,
      batch_name,
      batch_code,
      course_id,
      course_title,
      course_code,
      trainer_id,
      trainer_name,
      original_date::text as original_date,
      rescheduled_date::text as rescheduled_date,
      start_time::text as start_time,
      end_time::text as end_time,
      room_or_hall,
      reason,
      status,
      students_count,
      is_notified,
      created_by,
      created_at::text as created_at,
      updated_at::text as updated_at;
  `;
  const [row] = await query<any>(sql, params);
  return row || null;
}

// -------------------------------------------------------------
// GURU ABSENCES
// -------------------------------------------------------------
export async function getGuruAbsences(): Promise<GuruAbsence[]> {
  try {
    const rows = await query<any>(`
      SELECT 
        id,
        trainer_id,
        trainer_name,
        batch_id,
        batch_name,
        course_id,
        course_title,
        absence_date::text as absence_date,
        reason,
        status,
        tally_class_id,
        created_by,
        created_at::text as created_at,
        updated_at::text as updated_at
      FROM public.guru_absences
      ORDER BY absence_date DESC, created_at DESC;
    `);
    return rows;
  } catch (error) {
    console.error('Error fetching guru absences:', error);
    return [];
  }
}

export async function createGuruAbsence(data: {
  trainer_id: string;
  trainer_name: string;
  batch_id: string;
  batch_name: string;
  course_id: string;
  course_title: string;
  absence_date: string;
  reason: string;
  created_by?: string;
}): Promise<GuruAbsence> {
  const [row] = await query<any>(`
    INSERT INTO public.guru_absences (
      trainer_id,
      trainer_name,
      batch_id,
      batch_name,
      course_id,
      course_title,
      absence_date,
      reason,
      status,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending Reschedule', $9)
    RETURNING 
      id,
      trainer_id,
      trainer_name,
      batch_id,
      batch_name,
      course_id,
      course_title,
      absence_date::text as absence_date,
      reason,
      status,
      tally_class_id,
      created_by,
      created_at::text as created_at,
      updated_at::text as updated_at;
  `, [
    data.trainer_id,
    data.trainer_name,
    data.batch_id,
    data.batch_name,
    data.course_id,
    data.course_title,
    data.absence_date,
    data.reason.trim(),
    data.created_by || 'Admin'
  ]);

  // Notify students of this batch about the class cancellation due to guru absence
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const cancelMsg = `[Faculty Absence Notice]\n\nDear Students,\n\nClass for ${data.batch_name} (${data.course_title}) on ${data.absence_date} is CANCELLED due to absence / leave of Guru ${data.trainer_name}.\n\nReason: ${data.reason.trim()}\n\nA clash-free tally / compensation class will be scheduled and announced shortly.`;

    await query(`
      INSERT INTO public.announcements (
        title,
        message,
        audience,
        target_course_id,
        target_course_title,
        target_batch_id,
        target_batch_name,
        type_tag,
        publish_date,
        publish_time,
        status,
        delivery_status,
        announcement_type,
        created_by,
        sender_role
      ) VALUES ($1, $2, 'Selected course or batch', $3, $4, $5, $6, 'Cancellation', $7, $8, 'Published', 'System verified (Delivered)', 'message', $9, 'admin');
    `, [
      `Class Cancelled: ${data.batch_name} (${data.absence_date})`,
      cancelMsg,
      data.course_id,
      data.course_title,
      data.batch_id,
      data.batch_name,
      todayStr,
      timeStr,
      data.created_by || 'Admin'
    ]);

    await query(`
      INSERT INTO public.session_alerts (
        batch_id,
        batch_name,
        course_title,
        trainer_name,
        message,
        alert_type,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, 'announcement', NOW());
    `, [
      data.batch_id,
      data.batch_name,
      data.course_title,
      data.trainer_name,
      `CLASS CANCELLED: ${data.batch_name} on ${data.absence_date} due to Guru ${data.trainer_name} absence. Compensation class will be rescheduled.`
    ]);

    sendFcmToBatch(data.batch_id, {
      title: `Class Cancelled: ${data.batch_name}`,
      body: `Class on ${data.absence_date} cancelled due to Guru absence. ${data.reason}`,
      data: {
        type: 'session_cancellation',
        batch_id: data.batch_id,
        absence_date: data.absence_date
      }
    }).catch(e => console.error('[FCM] Error notifying batch of guru absence cancellation:', e));
  } catch (err) {
    console.warn('Error broadcasting guru absence announcement:', err);
  }

  return row;
}

export async function deleteGuruAbsence(id: string): Promise<boolean> {
  await query('DELETE FROM public.guru_absences WHERE id = $1', [id]);
  return true;
}

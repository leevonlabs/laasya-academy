import { query, queryOne } from './db';

export interface VideoLibraryItem {
  id: string;
  title: string;
  category: 'event_folder' | 'event_video' | 'student_folder' | 'guru_share' | string;
  drive_url?: string | null;
  youtube_url?: string | null;
  shared_by_type?: 'admin' | 'guru' | string;
  trainer_id?: string | null;
  trainer_name?: string | null;
  description?: string | null;
  event_name?: string | null;
  event_date?: string | null;
  target_student_id?: string | null;
  target_student_name?: string | null;
  target_student_roll?: string | null;
  target_students?: any[] | null;
  target_student_names?: string | null;
  target_course_id?: string | null;
  target_course_title?: string | null;
  target_batch_id?: string | null;
  target_batch_name?: string | null;
  target_courses?: Array<{ id: string; title: string }> | null;
  thumbnail_url?: string | null;
  is_active?: boolean;
  access_level?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CourseBatchItem {
  id: string;
  name: string;
  trainer_name?: string | null;
  room?: string | null;
  timings?: string | null;
}

export interface CourseWithDetails {
  id: string;
  title: string;
  category: string;
  image_url?: string | null;
  description?: string | null;
  batches: CourseBatchItem[];
  student_count: number;
  folder_count: number;
}

export interface EnrolledStudent {
  student_id: string;
  roll_number: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  batch_id: string;
  batch_name: string;
  enrollment_status: string;
}

export interface GuruComplianceDisciple {
  student_id: string;
  roll_number: string;
  student_name: string;
  avatar_url?: string | null;
  batch_id: string;
  batch_name: string;
  course_id?: string | null;
  course_title?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  video_id?: string;
  video_title?: string;
  drive_url?: string | null;
  youtube_url?: string | null;
  event_date?: string | null;
  created_at?: string | null;
  category?: string | null;
  description?: string | null;
  all_matching_videos?: Array<{
    id: string;
    title: string;
    drive_url?: string | null;
    youtube_url?: string | null;
    event_date?: string | null;
    created_at?: string | null;
  }>;
}

export interface GuruComplianceItem {
  trainer_id: string;
  full_name: string;
  display_title: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  specializations: string[];
  courses: Array<{ id: string; title: string; category: string }>;
  assigned_batches_count: number;
  assigned_batches: Array<{ id: string; name: string; course_title: string }>;
  total_students: number;
  received_count: number;
  missing_count: number;
  compliance_rate: number;
  compliance_status: 'completed' | 'partial' | 'pending' | 'no_students';
  received_disciples: GuruComplianceDisciple[];
  missing_disciples: GuruComplianceDisciple[];
  shared_videos_count: number;
  shared_videos: any[];
}

export interface GuruComplianceSummary {
  total_gurus: number;
  completed_gurus: number;
  partial_gurus: number;
  pending_gurus: number;
  total_students: number;
  total_received: number;
  total_missing: number;
  overall_compliance_rate: number;
}


// -----------------------------------------------------------------------------
export async function getVideoLibraryItems(filters?: {
  courseId?: string;
  courseTitle?: string;
  batchId?: string;
  search?: string;
  category?: string;
  sharedByType?: string; // 'admin' | 'guru' | 'all'
  trainerId?: string;
}): Promise<VideoLibraryItem[]> {
  try {
    let sql = `
      SELECT *
      FROM video_library
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters?.category && filters.category !== 'all') {
      sql += ` AND category = $${idx}`;
      params.push(filters.category);
      idx++;
    }

    if (filters?.sharedByType && filters.sharedByType !== 'all') {
      sql += ` AND shared_by_type = $${idx}`;
      params.push(filters.sharedByType);
      idx++;
    }

    if (filters?.trainerId) {
      sql += ` AND trainer_id = $${idx}`;
      params.push(filters.trainerId);
      idx++;
    }

    if (filters?.courseId) {
      sql += ` AND (
        target_course_id = $${idx} 
        OR target_courses @> jsonb_build_array(jsonb_build_object('id', $${idx}::text))
        OR access_level = 'All Students'
      )`;
      params.push(filters.courseId);
      idx++;
    }

    if (filters?.courseTitle) {
      sql += ` AND (
        target_course_title ILIKE $${idx}
        OR access_level = 'All Students'
        OR target_courses::text ILIKE $${idx}
      )`;
      params.push(`%${filters.courseTitle}%`);
      idx++;
    }

    if (filters?.batchId) {
      sql += ` AND (target_batch_id = $${idx} OR target_batch_id IS NULL OR target_batch_name = 'All Batches')`;
      params.push(filters.batchId);
      idx++;
    }

    if (filters?.search) {
      sql += ` AND (
        title ILIKE $${idx} 
        OR event_name ILIKE $${idx} 
        OR target_course_title ILIKE $${idx}
        OR description ILIKE $${idx}
        OR trainer_name ILIKE $${idx}
      )`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    sql += ` ORDER BY created_at DESC;`;

    return await query<VideoLibraryItem>(sql, params);
  } catch (error) {
    console.error('Error in getVideoLibraryItems:', error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// GET ALL COURSES WITH BATCHES & COUNTS
// -----------------------------------------------------------------------------
export async function getCoursesWithDetails(): Promise<CourseWithDetails[]> {
  try {
    const sql = `
      SELECT 
        c.id,
        c.title,
        c.category,
        c.image_url,
        c.description,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', b.id,
            'name', b.name,
            'trainer_name', p.full_name,
            'room', b.room_or_hall,
            'timings', concat(b.start_time, ' - ', b.end_time)
          )) FROM batches b 
          LEFT JOIN trainers t ON b.trainer_id = t.id 
          LEFT JOIN profiles p ON t.profile_id = p.id 
          WHERE b.course_id = c.id),
          '[]'::json
        ) as batches,
        COALESCE(
          (SELECT count(DISTINCT be.student_id)
           FROM batches b 
           JOIN batch_enrollments be ON be.batch_id = b.id AND be.status = 'active'
           WHERE b.course_id = c.id),
          0
        )::int as student_count,
        COALESCE(
          (SELECT count(*)
           FROM video_library vl
           WHERE (
             vl.target_course_id = c.id 
             OR vl.target_courses @> jsonb_build_array(jsonb_build_object('id', c.id::text)) 
             OR vl.access_level = 'All Students'
           )
           AND (vl.category = 'event_folder' OR vl.category IS NULL)
          ),
          0
        )::int as folder_count
      FROM courses c
      ORDER BY c.title ASC;
    `;
    const rows = await query<any>(sql);
    return rows.map(r => ({
      ...r,
      student_count: Number(r.student_count || 0),
      folder_count: Number(r.folder_count || 0),
      batches: Array.isArray(r.batches) ? r.batches : [],
    }));
  } catch (error) {
    console.error('Error in getCoursesWithDetails:', error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// GET ENROLLED STUDENTS FOR A COURSE & BATCH
// -----------------------------------------------------------------------------
export async function getStudentsForCourse(courseId: string, batchId?: string): Promise<EnrolledStudent[]> {
  try {
    let sql = `
      SELECT 
        s.id as student_id,
        s.roll_number,
        s.avatar_url,
        p.full_name,
        p.phone,
        p.email,
        b.id as batch_id,
        b.name as batch_name,
        be.status as enrollment_status
      FROM batch_enrollments be
      JOIN batches b ON be.batch_id = b.id
      JOIN students s ON be.student_id = s.id
      JOIN profiles p ON s.profile_id = p.id
      WHERE b.course_id = $1
    `;
    const params: any[] = [courseId];

    if (batchId && batchId !== 'all') {
      sql += ` AND b.id = $2`;
      params.push(batchId);
    }

    sql += ` ORDER BY b.name ASC, p.full_name ASC;`;

    return await query<EnrolledStudent>(sql, params);
  } catch (error) {
    console.error('Error in getStudentsForCourse:', error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// CREATE AN EVENT FOLDER LINK (SINGLE COURSE OR BATCH)
// -----------------------------------------------------------------------------
function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

export async function createEventFolder(data: {
  title: string;
  drive_url?: string | null;
  youtube_url?: string | null;
  shared_by_type?: string;
  trainer_id?: string | null;
  trainer_name?: string | null;
  category?: string;
  description?: string;
  event_name?: string;
  event_date?: string;
  target_course_id?: string | null;
  target_course_title?: string | null;
  target_batch_id?: string | null;
  target_batch_name?: string | null;
  target_students?: any[] | null;
  target_student_names?: string | null;
  access_level?: string;
  created_by?: string;
}): Promise<VideoLibraryItem | null> {
  try {
    const category = data.category || (data.shared_by_type === 'guru' ? 'performance' : 'event_folder');
    const validCourseId = isValidUuid(data.target_course_id) ? data.target_course_id : null;
    const validBatchId = isValidUuid(data.target_batch_id) ? data.target_batch_id : null;

    const singleStudent = (data.target_students && data.target_students.length === 1) ? data.target_students[0] : null;
    const targetStudentId = (data as any).target_student_id || singleStudent?.id || null;
    const targetStudentName = (data as any).target_student_name || singleStudent?.name || null;
    const targetStudentRoll = (data as any).target_student_roll || singleStudent?.roll_number || null;

    const sql = `
      INSERT INTO video_library (
        title,
        category,
        drive_url,
        youtube_url,
        shared_by_type,
        trainer_id,
        trainer_name,
        description,
        event_name,
        event_date,
        target_course_id,
        target_course_title,
        target_batch_id,
        target_batch_name,
        access_level,
        created_by,
        target_students,
        target_student_names,
        target_student_id,
        target_student_name,
        target_student_roll,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18, $19, $20, $21, true, NOW(), NOW())
      RETURNING *;
    `;
    const params = [
      data.title,
      category,
      data.drive_url || null,
      data.youtube_url || null,
      data.shared_by_type || 'admin',
      data.trainer_id || null,
      data.trainer_name || null,
      data.description || '',
      data.event_name || data.title,
      data.event_date || new Date().toISOString().split('T')[0],
      validCourseId,
      data.target_course_title || null,
      validBatchId,
      data.target_batch_name || 'All Batches',
      data.access_level || (validBatchId ? 'Batch' : validCourseId ? 'Course' : 'All Students'),
      data.created_by || data.trainer_name || 'Academy Owner',
      JSON.stringify(data.target_students || []),
      data.target_student_names || (singleStudent ? singleStudent.name : null),
      targetStudentId,
      targetStudentName,
      targetStudentRoll,
    ];
    const item = await queryOne<VideoLibraryItem>(sql, params);


    try {
      const isGuru = data.shared_by_type === 'guru' || Boolean(data.trainer_id);
      const senderRole = isGuru ? 'Guru' : 'Admin';
      const senderName = isGuru ? (data.trainer_name || 'Guru') : (data.created_by || 'Academy Administration');
      const urlText = data.drive_url || data.youtube_url || '';
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const annTitle = `Video: ${data.title.trim()}`;
      const annMessage = `New video shared by ${senderName} (${senderRole}):\n\nTitle: ${data.title.trim()}\nCourse: ${data.target_course_title || 'Classical Arts'}\nBatch: ${data.target_batch_name || 'All Batches'}${urlText ? `\nLink: ${urlText}` : ''}${data.description ? `\n\nNotes:\n${data.description.trim()}` : ''}`;

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
        ) VALUES ($1, $2, 'Selected course or batch', $3, $4, $5, $6, 'Video', $7, $8, 'Published', 'System verified (Delivered)', 'message', $9, $10);
      `, [
        annTitle,
        annMessage,
        validCourseId,
        data.target_course_title || null,
        validBatchId,
        data.target_batch_name || 'All Batches',
        todayStr,
        currentTimeStr,
        senderName,
        isGuru ? 'trainer' : 'admin'
      ]);

      await query(`
        INSERT INTO public.session_alerts (
          batch_id, batch_name, course_title, trainer_name, message, alert_type, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'video_shared', NOW());
      `, [
        validBatchId || 'all',
        data.target_batch_name || 'All Batches',
        `New Video: ${data.title.trim()}`,
        senderName,
        `"${data.title}" was shared by ${senderName} (${senderRole}).${urlText ? ` Link: ${urlText}` : ''}`
      ]);
    } catch (alertErr) {
      console.warn('Could not insert announcement or session_alert for video link:', alertErr);
    }

    return item;
  } catch (error) {
    console.error('Error in createEventFolder:', error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// CREATE UNIVERSAL / MULTI-COURSE EVENT FOLDERS
// -----------------------------------------------------------------------------
export async function createUniversalEventFolders(data: {
  title: string;
  drive_url?: string | null;
  youtube_url?: string | null;
  shared_by_type?: string;
  trainer_id?: string | null;
  trainer_name?: string | null;
  description?: string;
  event_name?: string;
  event_date?: string;
  selected_courses: Array<{ id: string; title: string }>;
  created_by?: string;
}): Promise<VideoLibraryItem[]> {
  try {
    const isAll = data.selected_courses.length >= 8;
    const accessLevel = isAll ? 'All Students' : 'Multiple Courses';

    const sql = `
      INSERT INTO video_library (
        title,
        category,
        drive_url,
        youtube_url,
        shared_by_type,
        trainer_id,
        trainer_name,
        description,
        event_name,
        event_date,
        target_courses,
        target_course_id,
        target_course_title,
        target_batch_name,
        access_level,
        created_by,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, 'event_folder', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'All Batches', $13, $14, true, NOW(), NOW())
      RETURNING *;
    `;
    const params = [
      data.title,
      data.drive_url || null,
      data.youtube_url || null,
      data.shared_by_type || 'admin',
      data.trainer_id || null,
      data.trainer_name || null,
      data.description || '',
      data.event_name || data.title,
      data.event_date || new Date().toISOString().split('T')[0],
      JSON.stringify(data.selected_courses),
      data.selected_courses.length === 1 ? data.selected_courses[0].id : null,
      data.selected_courses.length === 1 ? data.selected_courses[0].title : (isAll ? 'All Academy Courses' : `${data.selected_courses.length} Selected Courses`),
      accessLevel,
      data.created_by || 'Academy Owner',
    ];

    const inserted = await query<VideoLibraryItem>(sql, params);

    try {
      const isGuru = data.shared_by_type === 'guru' || Boolean(data.trainer_id);
      const senderRole = isGuru ? 'Guru' : 'Admin';
      const senderName = isGuru ? (data.trainer_name || 'Guru') : (data.created_by || 'Academy Administration');
      const urlText = data.drive_url || data.youtube_url || '';
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const annTitle = `Video: ${data.title.trim()}`;
      const annMessage = `New video shared across courses by ${senderName} (${senderRole}):\n\nTitle: ${data.title.trim()}${urlText ? `\nLink: ${urlText}` : ''}${data.description ? `\n\nNotes:\n${data.description.trim()}` : ''}`;

      await query(`
        INSERT INTO public.announcements (
          title,
          message,
          audience,
          type_tag,
          publish_date,
          publish_time,
          status,
          delivery_status,
          announcement_type,
          created_by,
          sender_role
        ) VALUES ($1, $2, 'All students and gurus', 'Video', $3, $4, 'Published', 'System verified (Delivered)', 'message', $5, $6);
      `, [
        annTitle,
        annMessage,
        todayStr,
        currentTimeStr,
        senderName,
        isGuru ? 'trainer' : 'admin'
      ]);

      await query(`
        INSERT INTO public.session_alerts (
          batch_id, batch_name, course_title, trainer_name, message, alert_type, created_at
        ) VALUES ('all', 'All Batches', $1, $2, $3, 'video_shared', NOW());
      `, [
        `New Video: ${data.title.trim()}`,
        senderName,
        `"${data.title}" was shared across all courses by ${senderName} (${senderRole}).${urlText ? ` Link: ${urlText}` : ''}`
      ]);
    } catch (alertErr) {
      console.warn('Could not insert announcement or session_alert for universal video link:', alertErr);
    }

    return inserted;
  } catch (error) {
    console.error('Error in createUniversalEventFolders:', error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// DELETE EVENT FOLDER ITEM
// -----------------------------------------------------------------------------
export async function deleteVideoLibraryItem(id: string): Promise<boolean> {
  try {
    const sql = `DELETE FROM video_library WHERE id = $1 RETURNING id;`;
    const res = await query(sql, [id]);
    return res.length > 0;
  } catch (error) {
    console.error('Error in deleteVideoLibraryItem:', error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// UPDATE EVENT FOLDER ITEM
// -----------------------------------------------------------------------------
export async function updateVideoLibraryItem(id: string, data: Partial<VideoLibraryItem>): Promise<VideoLibraryItem | null> {
  try {
    const sql = `
      UPDATE video_library
      SET title = COALESCE($1, title),
          drive_url = $2,
          youtube_url = $3,
          event_name = COALESCE($4, event_name),
          event_date = COALESCE($5, event_date),
          description = COALESCE($6, description),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;
    const params = [
      data.title || null,
      data.drive_url !== undefined ? data.drive_url : null,
      data.youtube_url !== undefined ? data.youtube_url : null,
      data.event_name || data.title || null,
      data.event_date || null,
      data.description !== undefined ? data.description : null,
      id
    ];
    return await queryOne<VideoLibraryItem>(sql, params);
  } catch (error) {
    console.error('Error in updateVideoLibraryItem:', error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// GET GURU MONTHLY PERFORMANCE VIDEO COMPLIANCE
// -----------------------------------------------------------------------------
export async function getGuruComplianceData(options?: {
  month?: string;
  year?: string;
  trainerId?: string;
  trainerName?: string;
}): Promise<{
  month: string;
  year: string;
  summary: GuruComplianceSummary;
  gurus: GuruComplianceItem[];
}> {
  const currentDate = new Date();
  const monthParam = options?.month || (currentDate.getMonth() + 1).toString();
  const yearParam = options?.year || currentDate.getFullYear().toString();

  try {
    // 1. Fetch all active Gurus
    const trainersSql = `
      SELECT 
        t.id as trainer_id,
        t.profile_id,
        p.full_name,
        p.phone,
        p.email,
        COALESCE(t.avatar_url, p.avatar_url) as avatar_url,
        t.specializations,
        t.display_title,
        t.is_active
      FROM public.trainers t
      JOIN public.profiles p ON t.profile_id = p.id
      WHERE t.is_active = true
      ORDER BY p.full_name ASC;
    `;
    const trainers = await query<any>(trainersSql);

    // 2. Fetch all batches
    const batchesSql = `
      SELECT 
        b.id as batch_id,
        b.name as batch_name,
        b.course_id,
        c.title as course_title,
        c.category as course_category,
        b.trainer_id
      FROM public.batches b
      JOIN public.courses c ON b.course_id = c.id
      WHERE b.trainer_id IS NOT NULL;
    `;
    const allBatches = await query<any>(batchesSql);

    // 3. Fetch all active enrollments
    const studentsSql = `
      SELECT 
        be.batch_id,
        s.id as student_id,
        s.roll_number,
        p.full_name as student_name,
        COALESCE(s.avatar_url, p.avatar_url) as avatar_url,
        COALESCE(s.parent_name, 'Parent / Guardian') as parent_name,
        p.phone as student_phone,
        p.phone as parent_phone
      FROM public.batch_enrollments be
      JOIN public.students s ON be.student_id = s.id
      JOIN public.profiles p ON s.profile_id = p.id
      WHERE be.status = 'active';
    `;
    const allEnrollments = await query<any>(studentsSql);


    // 4. Fetch all guru video library items
    const videosSql = `
      SELECT 
        vl.id,
        vl.title,
        vl.category,
        vl.drive_url,
        vl.youtube_url,
        vl.shared_by_type,
        vl.trainer_id,
        vl.trainer_name,
        vl.description,
        vl.event_name,
        vl.event_date,
        vl.target_student_id,
        vl.target_student_name,
        vl.target_student_roll,
        vl.target_students,
        vl.target_student_names,
        vl.target_course_id,
        vl.target_course_title,
        vl.target_batch_id,
        vl.target_batch_name,
        vl.created_at
      FROM public.video_library vl
      WHERE (
        vl.shared_by_type = 'guru' 
        OR vl.category = 'guru_share' 
        OR vl.trainer_id IS NOT NULL
      )
      ORDER BY vl.created_at DESC;
    `;
    const allGuruVideos = await query<any>(videosSql);

    // Filter videos by month & year
    const filteredVideos = allGuruVideos.filter((v: any) => {
      const dateStr = v.event_date || v.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (monthParam !== 'all') {
        const m = (d.getMonth() + 1).toString();
        if (m !== monthParam) return false;
      }
      if (yearParam !== 'all') {
        const y = d.getFullYear().toString();
        if (y !== yearParam) return false;
      }
      return true;
    });

    const isVideoByTrainer = (video: any, trainer: any): boolean => {
      if (video.trainer_id && trainer.trainer_id && video.trainer_id === trainer.trainer_id) {
        return true;
      }
      const vName = (video.trainer_name || '').toLowerCase().trim();
      const tName = (trainer.full_name || '').toLowerCase().trim();
      if (vName && tName && (vName.includes(tName) || tName.includes(vName))) {
        return true;
      }
      return false;
    };

    const isStudentTargeted = (video: any, student: any): boolean => {
      if (video.target_student_id && video.target_student_id === student.student_id) {
        return true;
      }
      if (video.target_student_roll && student.roll_number && video.target_student_roll === student.roll_number) {
        return true;
      }
      if (video.target_students) {
        let list: any[] = [];
        if (Array.isArray(video.target_students)) {
          list = video.target_students;
        } else if (typeof video.target_students === 'string') {
          try {
            list = JSON.parse(video.target_students);
          } catch (_) {
            list = [];
          }
        }
        for (const ts of list) {
          if (!ts) continue;
          if (ts.id && ts.id === student.student_id) return true;
          if (ts.roll_number && student.roll_number && ts.roll_number === student.roll_number) return true;
          if (ts.name && student.student_name && ts.name.toLowerCase() === student.student_name.toLowerCase()) return true;
        }
      }
      if (video.target_student_names && student.student_name) {
        if (video.target_student_names.toLowerCase().includes(student.student_name.toLowerCase())) {
          return true;
        }
      }
      return false;
    };

    const gurusCompliance: GuruComplianceItem[] = trainers.map((trainer: any) => {
      const assignedBatches = allBatches.filter((b: any) => b.trainer_id === trainer.trainer_id);
      const batchIds = assignedBatches.map((b: any) => b.batch_id);

      const courseMap = new Map<string, { id: string; title: string; category: string }>();
      assignedBatches.forEach((b: any) => {
        if (b.course_id && !courseMap.has(b.course_id)) {
          courseMap.set(b.course_id, {
            id: b.course_id,
            title: b.course_title,
            category: b.course_category || 'Arts',
          });
        }
      });
      const courses = Array.from(courseMap.values());

      const enrolledStudentRows = allEnrollments.filter((e: any) => batchIds.includes(e.batch_id));
      
      // Group student enrollments across all batches under this Guru
      const studentEnrollmentMap = new Map<string, {
        student_id: string;
        roll_number: string;
        student_name: string;
        avatar_url?: string | null;
        parent_name?: string | null;
        parent_phone?: string | null;
        batches: Array<{
          batch_id: string;
          batch_name: string;
          course_id: string;
          course_title: string;
        }>;
      }>();

      enrolledStudentRows.forEach((row: any) => {
        const batch = assignedBatches.find((b: any) => b.batch_id === row.batch_id);
        if (!studentEnrollmentMap.has(row.student_id)) {
          studentEnrollmentMap.set(row.student_id, {
            student_id: row.student_id,
            roll_number: row.roll_number,
            student_name: row.student_name,
            avatar_url: row.avatar_url,
            parent_name: row.parent_name,
            parent_phone: row.parent_phone,
            batches: [],
          });
        }
        if (batch) {
          const entry = studentEnrollmentMap.get(row.student_id)!;
          if (!entry.batches.some(b => b.batch_id === batch.batch_id)) {
            entry.batches.push({
              batch_id: batch.batch_id,
              batch_name: batch.batch_name || 'Batch',
              course_id: batch.course_id || '',
              course_title: batch.course_title || 'Course',
            });
          }
        }
      });

      const assignedStudents = Array.from(studentEnrollmentMap.values());
      const trainerAllVideos = filteredVideos.filter((v: any) => isVideoByTrainer(v, trainer));
      // Compliance requirement: Every student must receive at least 1 individual performance video for EACH enrolled batch
      const trainerPerformanceVideos = trainerAllVideos.filter((v: any) => 
        (v.category === 'performance' || v.category === 'student_performance')
      );

      const receivedDisciples: GuruComplianceDisciple[] = [];
      const missingDisciples: GuruComplianceDisciple[] = [];

      assignedStudents.forEach((student) => {
        const pendingBatches: Array<{ batch_id: string; batch_name: string; course_id: string; course_title: string }> = [];
        const coveredBatches: Array<{ batch_id: string; batch_name: string; course_id: string; course_title: string }> = [];

        student.batches.forEach((b) => {
          const isCovered = trainerPerformanceVideos.some((v: any) => {
            if (!isStudentTargeted(v, student)) return false;
            // Matches if target_batch_id is null, 'all', or equals this batch_id
            return !v.target_batch_id || v.target_batch_id === 'all' || v.target_batch_id === b.batch_id;
          });
          if (isCovered) {
            coveredBatches.push(b);
          } else {
            pendingBatches.push(b);
          }
        });

        const allStudentMatchingVideos = trainerPerformanceVideos.filter((v: any) => isStudentTargeted(v, student));

        if (pendingBatches.length === 0 && student.batches.length > 0) {
          // Fully compliant student
          const primaryVideo = allStudentMatchingVideos[0];
          receivedDisciples.push({
            student_id: student.student_id,
            roll_number: student.roll_number,
            student_name: student.student_name,
            avatar_url: student.avatar_url,
            batch_id: student.batches[0]?.batch_id || '',
            batch_name: student.batches.map(b => b.batch_name).join(', '),
            course_id: student.batches[0]?.course_id || '',
            course_title: Array.from(new Set(student.batches.map(b => b.course_title))).join(', '),
            parent_name: student.parent_name,
            parent_phone: student.parent_phone,
            video_id: primaryVideo?.id,
            video_title: primaryVideo?.title,
            drive_url: primaryVideo?.drive_url,
            youtube_url: primaryVideo?.youtube_url,
            event_date: primaryVideo?.event_date,
            created_at: primaryVideo?.created_at,
            category: primaryVideo?.category,
            description: primaryVideo?.description,
            all_matching_videos: allStudentMatchingVideos.map((mv: any) => ({
              id: mv.id,
              title: mv.title,
              drive_url: mv.drive_url,
              youtube_url: mv.youtube_url,
              event_date: mv.event_date,
              created_at: mv.created_at,
            })),
          });
        } else {
          // Student is still pending at least one batch
          missingDisciples.push({
            student_id: student.student_id,
            roll_number: student.roll_number,
            student_name: student.student_name,
            avatar_url: student.avatar_url,
            batch_id: pendingBatches[0]?.batch_id || '',
            batch_name: pendingBatches.map(b => b.batch_name).join(', '),
            course_id: pendingBatches[0]?.course_id || '',
            course_title: Array.from(new Set(pendingBatches.map(b => b.course_title))).join(', '),
            parent_name: student.parent_name,
            parent_phone: student.parent_phone,
          });
        }
      });

      const totalStudents = assignedStudents.length;
      const receivedCount = receivedDisciples.length;
      const missingCount = missingDisciples.length;
      const complianceRate = totalStudents > 0 ? Math.round((receivedCount / totalStudents) * 100) : 100;

      let complianceStatus: 'completed' | 'partial' | 'pending' | 'no_students' = 'pending';
      if (totalStudents === 0) {
        complianceStatus = 'no_students';
      } else if (receivedCount === totalStudents) {
        complianceStatus = 'completed';
      } else if (receivedCount > 0) {
        complianceStatus = 'partial';
      } else {
        complianceStatus = 'pending';
      }

      return {
        trainer_id: trainer.trainer_id,
        full_name: trainer.full_name,
        display_title: trainer.display_title || 'Faculty Guru',
        phone: trainer.phone,
        email: trainer.email,
        avatar_url: trainer.avatar_url,
        specializations: Array.isArray(trainer.specializations) ? trainer.specializations : [],
        courses,
        assigned_batches_count: assignedBatches.length,
        assigned_batches: assignedBatches.map((b: any) => ({
          id: b.batch_id,
          name: b.batch_name,
          course_title: b.course_title,
        })),
        total_students: totalStudents,
        received_count: receivedCount,
        missing_count: missingCount,
        compliance_rate: complianceRate,
        compliance_status: complianceStatus,
        received_disciples: receivedDisciples,
        missing_disciples: missingDisciples,
        shared_videos_count: trainerAllVideos.length,
        shared_videos: trainerAllVideos,
      };
    });

    let finalGurus = gurusCompliance;
    if (options?.trainerId) {
      finalGurus = finalGurus.filter((g) => g.trainer_id === options.trainerId);
    } else if (options?.trainerName) {
      const q = options.trainerName.toLowerCase().trim();
      finalGurus = finalGurus.filter((g) => g.full_name.toLowerCase().includes(q));
    }

    const totalGurus = finalGurus.length;
    const completedGurus = finalGurus.filter((g) => g.compliance_status === 'completed' && g.total_students > 0).length;
    const partialGurus = finalGurus.filter((g) => g.compliance_status === 'partial').length;
    const pendingGurus = finalGurus.filter((g) => g.compliance_status === 'pending' && g.total_students > 0).length;

    const totalStudentsAcrossAll = finalGurus.reduce((acc, g) => acc + g.total_students, 0);
    const totalReceivedAcrossAll = finalGurus.reduce((acc, g) => acc + g.received_count, 0);
    const totalMissingAcrossAll = finalGurus.reduce((acc, g) => acc + g.missing_count, 0);
    const overallComplianceRate = totalStudentsAcrossAll > 0 
      ? Math.round((totalReceivedAcrossAll / totalStudentsAcrossAll) * 100) 
      : 100;

    return {
      month: monthParam,
      year: yearParam,
      summary: {
        total_gurus: totalGurus,
        completed_gurus: completedGurus,
        partial_gurus: partialGurus,
        pending_gurus: pendingGurus,
        total_students: totalStudentsAcrossAll,
        total_received: totalReceivedAcrossAll,
        total_missing: totalMissingAcrossAll,
        overall_compliance_rate: overallComplianceRate,
      },
      gurus: finalGurus,
    };
  } catch (error) {
    console.error('Error in getGuruComplianceData:', error);
    return {
      month: monthParam,
      year: yearParam,
      summary: {
        total_gurus: 0,
        completed_gurus: 0,
        partial_gurus: 0,
        pending_gurus: 0,
        total_students: 0,
        total_received: 0,
        total_missing: 0,
        overall_compliance_rate: 0,
      },
      gurus: [],
    };
  }
}


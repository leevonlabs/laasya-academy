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
    const category = data.category || (data.shared_by_type === 'guru' ? 'guru_share' : 'event_folder');
    const validCourseId = isValidUuid(data.target_course_id) ? data.target_course_id : null;
    const validBatchId = isValidUuid(data.target_batch_id) ? data.target_batch_id : null;

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
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18, true, NOW(), NOW())
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
      data.target_student_names || null,
    ];
    return await queryOne<VideoLibraryItem>(sql, params);
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

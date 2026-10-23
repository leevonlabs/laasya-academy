import { query, queryOne } from './db';

export interface Course {
  id: string;
  title: string;
  code: string;
  category: string;
  description: string;
  monthly_fee?: number;
  is_active: boolean;
  batch_count?: number;
  image_url?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  created_at?: string;
}

export interface TrainerBatchInfo {
  id: string;
  name: string;
  code?: string;
  course_id: string;
  course_title: string;
  course_code?: string;
  course_category?: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  room_or_hall: string;
  max_capacity?: number;
  enrolled_count?: number;
  schedules?: BatchScheduleSlot[];
}

export interface Trainer {
  id: string;
  profile_id: string;
  guru_id?: string;
  code?: string;
  full_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  avatar_url?: string;
  age?: number;
  gender?: 'male' | 'female' | 'trans';
  specializations: string[];
  display_title?: string;
  bio: string;
  experience?: string;
  is_active: boolean;
  joined_date: string;
  monthly_salary?: number;
  salary_payment_status?: 'paid' | 'pending';
  batches_assigned?: number;
  assigned_batches?: TrainerBatchInfo[];
}

export interface StudentEnrolledBatch {
  batch_id: string;
  batch_name: string;
  batch_code?: string;
  course_id: string;
  course_title: string;
  course_code?: string;
  course_category: string;
  monthly_fee: number;
  trainer_id: string;
  trainer_name: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  room_or_hall: string;
  enrollment_status: string;
  schedules?: BatchScheduleSlot[];
}

export interface Student {
  id: string;
  profile_id: string;
  roll_number: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  age?: number;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'trans';
  parent_name: string;
  parent_relation?: string;
  parent_contact?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended';
  enrollment_date: string;
  advance_paid?: number;
  fixed_discount?: number;
  total_monthly_fee?: number;
  due_amount?: number;
  due_date?: string;
  due_status?: 'green' | 'yellow' | 'red';
  enrolled_batches_count?: number;
  attendance_rate?: number;
  enrolled_batches?: StudentEnrolledBatch[];
  course_attendance?: StudentCourseAttendanceSummary[];
  total_attendance?: {
    this_month_held: number;
    this_month_absent: number;
    last_month_held: number;
    last_month_absent: number;
  };
}

export interface StudentCourseAttendanceSummary {
  course_id: string;
  course_title: string;
  this_month_held: number;
  this_month_absent: number;
  last_month_held: number;
  last_month_absent: number;
}

export interface BatchScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface Batch {
  id: string;
  code?: string;
  course_id: string;
  course_title: string;
  course_code?: string;
  course_category: string;
  trainer_id: string;
  trainer_name: string;
  name: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  room_or_hall: string;
  room?: string;
  monthly_fee?: number;
  gst_percent?: number;
  description?: string;
  max_capacity: number;
  is_active: boolean;
  enrolled_count: number;
  schedules?: BatchScheduleSlot[];
}

export interface Scheme {
  id: string;
  name: string;
  description: string;
  course_ids: string[];
  batch_ids: string[];
  total_monthly_fee: number;
  fixed_discount: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}


export interface ClassSession {
  id: string;
  batch_id: string;
  batch_name: string;
  course_title: string;
  trainer_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  room_or_hall?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  check_in_code: string;
  session_topic_notes: string;
  present_count?: number;
  total_enrolled?: number;
  is_rescheduled?: boolean;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  session_date: string;
  batch_name: string;
  course_title: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent';
  check_in_time: string | null;
  check_in_method: string;
  remarks: string | null;
}

// -------------------------------------------------------------
// METRICS
// -------------------------------------------------------------
export async function getDashboardMetrics() {
  const today = new Date().toISOString().split('T')[0];
  const rows = await query<{
    totalCourses: number;
    totalTrainers: number;
    totalStudents: number;
    activeBatches: number;
    todaySessionsCount: number;
    presentTodayCount: number;
  }>(`
    SELECT 
      (SELECT COUNT(*)::int FROM public.courses WHERE is_active = true) as "totalCourses",
      (SELECT COUNT(*)::int FROM public.trainers WHERE is_active = true) as "totalTrainers",
      (SELECT COUNT(*)::int FROM public.students WHERE status = 'active') as "totalStudents",
      (SELECT COUNT(*)::int FROM public.batches WHERE is_active = true) as "activeBatches",
      (SELECT COUNT(*)::int FROM public.class_sessions WHERE session_date = $1) as "todaySessionsCount",
      (SELECT COUNT(*)::int FROM public.attendance a JOIN public.class_sessions s ON s.id = a.session_id WHERE s.session_date = $1 AND a.status = 'present') as "presentTodayCount"
  `, [today]);

  const row = rows[0];
  return {
    totalCourses: Number(row?.totalCourses || 0),
    totalTrainers: Number(row?.totalTrainers || 0),
    totalStudents: Number(row?.totalStudents || 0),
    activeBatches: Number(row?.activeBatches || 0),
    todaySessionsCount: Number(row?.todaySessionsCount || 0),
    presentTodayCount: Number(row?.presentTodayCount || 0)
  };
}

// -------------------------------------------------------------
// COURSES
// -------------------------------------------------------------
// COURSES & CATEGORIES
// -------------------------------------------------------------
export async function getCourseCategories(): Promise<string[]> {
  try {
    const fromTable = await query<{ name: string }>('SELECT name FROM public.course_categories ORDER BY name ASC');
    const fromCourses = await query<{ category: string }>('SELECT DISTINCT category FROM public.courses WHERE category IS NOT NULL AND category != \'\'');
    
    const set = new Set<string>();
    fromTable.forEach(r => { if (r.name && r.name.trim()) set.add(r.name.trim()); });
    fromCourses.forEach(r => { if (r.category && r.category.trim()) set.add(r.category.trim()); });
    
    return Array.from(set).sort();
  } catch (err) {
    console.error('Error in getCourseCategories:', err);
    return [
      'Classical Dance',
      'Modern Dance & Fitness',
      'Vocal & Music',
      'Musical Instruments',
      'Martial Arts',
      'Fine Arts',
      'Mind Sports'
    ];
  }
}

export async function createCourseCategory(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be empty');
  await query(
    `INSERT INTO public.course_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
    [trimmed]
  );
  return trimmed;
}

export async function deleteCourseCategory(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be empty');
  // Remove from categories table
  await query(`DELETE FROM public.course_categories WHERE LOWER(name) = LOWER($1)`, [trimmed]);
  // Remove category from courses so they become 'No Category'
  await query(`UPDATE public.courses SET category = '' WHERE LOWER(category) = LOWER($1)`, [trimmed]);
}

export async function renameCourseCategory(oldName: string, newName: string): Promise<string> {
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();
  if (!trimmedOld || !trimmedNew) throw new Error('Category name cannot be empty');

  // Insert new category
  await query(
    `INSERT INTO public.course_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
    [trimmedNew]
  );
  // Delete old category
  await query(`DELETE FROM public.course_categories WHERE LOWER(name) = LOWER($1)`, [trimmedOld]);
  // Update courses referencing oldName
  await query(
    `UPDATE public.courses SET category = $1 WHERE LOWER(category) = LOWER($2)`,
    [trimmedNew, trimmedOld]
  );
  return trimmedNew;
}

const coursesCache = new Map<string, { data: Course[]; expiry: number }>();

export function invalidateAcademyCache() {
  coursesCache.clear();
}

export async function getStudentRecipients(): Promise<any[]> {
  const sql = `
    SELECT s.id, s.roll_number, p.full_name, p.phone, s.parent_name, s.parent_contact
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE s.status = 'active'
    ORDER BY 
      CASE WHEN s.roll_number ~ '^LCA-[0-9]+$' THEN CAST(SUBSTRING(s.roll_number FROM 5) AS INT) ELSE 999999 END ASC,
      p.full_name ASC;
  `;
  return query(sql);
}

export async function getCourses(category?: string): Promise<Course[]> {
  const cacheKey = category || 'all';
  const cached = coursesCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) return cached.data;
  let sql = `
    SELECT 
      c.id, c.title, c.code, COALESCE(c.category, '') as category, c.description, 
      c.monthly_fee, c.is_active, c.image_url,
      COUNT(b.id)::int as batch_count
    FROM public.courses c
    LEFT JOIN public.batches b ON b.course_id = c.id
  `;
  const params: any[] = [];
  if (category && category !== 'All') {
    if (category === 'No Category') {
      sql += ` WHERE (c.category IS NULL OR c.category = '' OR LOWER(c.category) = 'no category' OR LOWER(c.category) = 'uncategorized')`;
    } else {
      sql += ` WHERE c.category = $1`;
      params.push(category);
    }
  }
  sql += ` GROUP BY c.id ORDER BY c.category, c.title;`;
  const rows = await query<Course>(sql, params);
  coursesCache.set(cacheKey, { data: rows, expiry: Date.now() + 15000 });
  return rows;
}

export async function createCourse(data: {
  title: string;
  code?: string;
  category: string;
  description: string;
  monthly_fee?: number;
  image_url?: string;
}) {
  let courseCode = (data.code || '').trim().toLowerCase();
  if (!courseCode) {
    const baseSlug = (data.title || '').trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '').slice(0, 4) || 'crs';
    const existing = await query<{ code: string }>(`SELECT code FROM public.courses WHERE code LIKE $1`, [`${baseSlug}%`]);
    const existingCodes = new Set(existing.map(e => e.code?.toLowerCase()));
    if (!existingCodes.has(baseSlug)) {
      courseCode = baseSlug;
    } else {
      let counter = 2;
      while (existingCodes.has(`${baseSlug}${counter}`)) counter++;
      courseCode = `${baseSlug}${counter}`;
    }
  }

  return queryOne<Course>(`
    INSERT INTO public.courses (title, code, category, description, monthly_fee, is_active, image_url)
    VALUES ($1, $2, $3, $4, $5, true, $6)
    RETURNING *;
  `, [data.title, courseCode, data.category || '', data.description, data.monthly_fee || 0, data.image_url || null]);
}

export async function updateCourse(id: string, data: {
  title?: string;
  code?: string;
  category?: string;
  monthly_fee?: number;
  description?: string;
  is_active?: boolean;
  image_url?: string;
}) {
  const cleanCode = data.code ? data.code.trim().toLowerCase() : undefined;
  return queryOne<Course>(`
    UPDATE public.courses
    SET title = COALESCE($2, title),
        code = COALESCE($3, code),
        category = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE category END,
        monthly_fee = COALESCE($5, monthly_fee),
        description = COALESCE($6, description),
        is_active = COALESCE($7, is_active),
        image_url = CASE WHEN $8::text IS NOT NULL THEN $8 ELSE image_url END,
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, 
    data.title, 
    cleanCode, 
    data.category !== undefined ? data.category : null, 
    data.monthly_fee,
    data.description, 
    data.is_active,
    data.image_url !== undefined ? data.image_url : null
  ]);
}

export async function deleteCourse(id: string) {
  // Cascading cleanup of sessions and enrollments for any batches under this course
  await query(`DELETE FROM public.batch_enrollments WHERE batch_id IN (SELECT id FROM public.batches WHERE course_id = $1)`, [id]);
  await query(`DELETE FROM public.class_sessions WHERE batch_id IN (SELECT id FROM public.batches WHERE course_id = $1)`, [id]);
  await query(`DELETE FROM public.batches WHERE course_id = $1`, [id]);
  return queryOne<Course>(`
    DELETE FROM public.courses WHERE id = $1 RETURNING *;
  `, [id]);
}

// -------------------------------------------------------------
// TRAINERS
// -------------------------------------------------------------
export async function getTrainers(): Promise<Trainer[]> {
  const sql = `
    SELECT 
      t.id, t.profile_id, t.guru_id, COALESCE(t.guru_id, t.code) as code, p.full_name, p.email, p.phone,
      COALESCE(t.alternate_phone, p.alternate_phone) as alternate_phone,
      COALESCE(t.avatar_url, p.avatar_url) as avatar_url,
      COALESCE(t.age, p.age)::int as age,
      COALESCE(t.gender, p.gender) as gender,
      t.specializations, t.display_title, t.bio, t.experience, t.is_active, t.joined_date::text as joined_date,
      COALESCE(t.monthly_salary, 25000)::numeric as monthly_salary,
      COALESCE(
        (SELECT status FROM public.guru_salary_records WHERE trainer_id = t.id ORDER BY created_at DESC LIMIT 1),
        'pending'
      ) as salary_payment_status,
      COUNT(b.id)::int as batches_assigned,
      COALESCE(
        json_agg(
          json_build_object(
            'id', b.id,
            'name', b.name,
            'code', b.code,
            'course_id', b.course_id,
            'course_title', c.title,
            'course_code', c.code,
            'course_category', c.category,
            'days_of_week', b.days_of_week,
            'start_time', b.start_time,
            'end_time', b.end_time,
            'room_or_hall', b.room_or_hall,
            'max_capacity', b.max_capacity,
            'schedules', b.schedules,
            'enrolled_count', (SELECT COUNT(*)::int FROM public.batch_enrollments be WHERE be.batch_id = b.id AND be.status = 'active')
          )
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::json
      ) as assigned_batches
    FROM public.trainers t
    JOIN public.profiles p ON p.id = t.profile_id
    LEFT JOIN public.batches b ON b.trainer_id = t.id
    LEFT JOIN public.courses c ON c.id = b.course_id
    GROUP BY t.id, t.profile_id, t.guru_id, t.code, p.full_name, p.email, p.phone, t.alternate_phone, p.alternate_phone, t.avatar_url, p.avatar_url, t.age, p.age, t.gender, p.gender, t.specializations, t.display_title, t.bio, t.experience, t.is_active, t.joined_date, t.monthly_salary
    ORDER BY 
      CASE WHEN t.guru_id ~ '^GURU-[0-9]+$' THEN CAST(SUBSTRING(t.guru_id FROM 6) AS INT) ELSE 9999 END ASC,
      p.full_name;
  `;
  return query<Trainer>(sql);
}

export async function assertUniqueContactNumber(contact?: string | null, excludeProfileId?: string) {
  const trimmed = contact?.trim();
  if (!trimmed) return;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits || digits.length < 5) return;
  const suffix = digits.slice(-10);

  const sql = `
    SELECT id, full_name, role, phone 
    FROM public.profiles 
    WHERE (
      phone = $1 
      OR alternate_phone = $1
      OR regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $2
      OR regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') LIKE '%' || $3
    )
    ${excludeProfileId ? 'AND id != $4' : ''}
    LIMIT 1;
  `;
  const params = excludeProfileId ? [trimmed, digits, suffix, excludeProfileId] : [trimmed, digits, suffix];
  const rows = await query<{ id: string; full_name: string; role: string; phone: string }>(sql, params);

  if (rows.length > 0) {
    const existing = rows[0];
    const roleLabel = existing.role === 'trainer' ? 'Guru' : existing.role === 'student' ? 'Student' : 'User';
    throw new Error(`Contact number "${trimmed}" is already registered with ${roleLabel} "${existing.full_name}". Every student and guru must have a unique contact number.`);
  }
}

export async function createTrainer(data: {
  guru_id?: string;
  code?: string;
  full_name: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  specializations: string[];
  display_title?: string;
  bio?: string;
  experience?: string;
  monthly_salary?: number;
  is_active?: boolean;
}) {
  let finalGuruId = (data.guru_id || data.code || '').trim().toUpperCase();
  if (!finalGuruId) {
    const maxRow = await queryOne<{ max_num: number }>(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(guru_id FROM 6) AS INT)), 0) as max_num 
      FROM public.trainers 
      WHERE guru_id ~ '^GURU-[0-9]+$'
    `);
    const nextNum = Number(maxRow?.max_num || 0) + 1;
    finalGuruId = `GURU-${String(nextNum).padStart(3, '0')}`;
  }

  const cleanEmail = (data.email && data.email.trim())
    ? data.email.toLowerCase().trim()
    : `${data.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guru'}@laasyaacademy.com`;
  const cleanPhone = data.phone?.trim() || '+91 8151 998 899';
  const cleanAlternatePhone = data.alternate_phone?.trim() || null;

  // Enforce unique contact numbers for Gurus
  if (data.phone) await assertUniqueContactNumber(data.phone);
  if (cleanAlternatePhone) await assertUniqueContactNumber(cleanAlternatePhone);

  const displayTitle = data.display_title?.trim() || 'Revered Guru & Mentor';
  const monthlySalary = Number(data.monthly_salary) || 25000;
  const isActive = data.is_active !== undefined ? data.is_active : true;
  const age = data.age ? Number(data.age) : null;
  const gender = data.gender ? data.gender.toLowerCase() : null;
  const bio = data.bio?.trim() || '';

  // Create in auth.users first
  const [authUser] = await query<{ id: string }>(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      $1, crypt('Guru@123', gen_salt('bf')), now(),
      jsonb_build_object('full_name', $2::text, 'role', 'trainer', 'phone', $3::text),
      now(), now()
    ) RETURNING id;
  `, [cleanEmail, data.full_name, cleanPhone]);

  const uid = authUser.id;

  // Insert profile
  await query(`
    INSERT INTO public.profiles (id, full_name, email, phone, alternate_phone, role, avatar_url, age, gender)
    VALUES ($1, $2, $3, $4, $5, 'trainer', $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET 
      full_name = EXCLUDED.full_name, 
      phone = EXCLUDED.phone, 
      alternate_phone = COALESCE(EXCLUDED.alternate_phone, profiles.alternate_phone),
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
      age = COALESCE(EXCLUDED.age, profiles.age),
      gender = COALESCE(EXCLUDED.gender, profiles.gender);
  `, [uid, data.full_name, cleanEmail, cleanPhone, cleanAlternatePhone, data.avatar_url || null, age, gender]);

  // Insert trainer
  return queryOne<Trainer>(`
    INSERT INTO public.trainers (profile_id, guru_id, code, specializations, display_title, bio, is_active, monthly_salary, avatar_url, age, gender, alternate_phone, experience)
    VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *;
  `, [uid, finalGuruId, data.specializations, displayTitle, bio, isActive, monthlySalary, data.avatar_url || null, age, gender, cleanAlternatePhone, data.experience || '5+ Years']);
}

export async function updateTrainer(id: string, data: {
  guru_id?: string;
  code?: string;
  full_name?: string;
  display_title?: string;
  phone?: string;
  alternate_phone?: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  specializations?: string[];
  bio?: string;
  experience?: string;
  is_active?: boolean;
  monthly_salary?: number;
}) {
  const trainer = await queryOne<{ profile_id: string }>(
    'SELECT profile_id FROM public.trainers WHERE id = $1',
    [id]
  );
  if (!trainer) throw new Error('Guru not found');

  const age = data.age !== undefined ? (data.age ? Number(data.age) : null) : undefined;
  const gender = data.gender !== undefined ? (data.gender ? data.gender.toLowerCase() : null) : undefined;
  const alternatePhone = data.alternate_phone !== undefined ? (data.alternate_phone?.trim() || null) : undefined;
  const cleanGuruId = (data.guru_id || data.code)?.trim().toUpperCase() || undefined;

  // Enforce unique contact numbers on update
  if (data.phone) await assertUniqueContactNumber(data.phone, trainer.profile_id);
  if (alternatePhone) await assertUniqueContactNumber(alternatePhone, trainer.profile_id);

  await query(`
    UPDATE public.profiles
    SET full_name = COALESCE($2, full_name),
        phone = COALESCE($3, phone),
        alternate_phone = COALESCE($4, alternate_phone),
        avatar_url = COALESCE($5, avatar_url),
        age = COALESCE($6, age),
        gender = COALESCE($7, gender),
        updated_at = now()
    WHERE id = $1
  `, [
    trainer.profile_id, 
    data.full_name, 
    data.phone, 
    alternatePhone,
    data.avatar_url !== undefined ? data.avatar_url : null,
    age !== undefined ? age : null,
    gender !== undefined ? gender : null
  ]);

  return queryOne<Trainer>(`
    UPDATE public.trainers
    SET display_title = COALESCE($2, display_title),
        specializations = COALESCE($3, specializations),
        bio = COALESCE($4, bio),
        is_active = COALESCE($5, is_active),
        monthly_salary = COALESCE($6, monthly_salary),
        avatar_url = COALESCE($7, avatar_url),
        age = COALESCE($8, age),
        gender = COALESCE($9, gender),
        alternate_phone = COALESCE($10, alternate_phone),
        guru_id = COALESCE($11, guru_id),
        code = COALESCE($11, code),
        experience = COALESCE($12, experience),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, 
    data.display_title, 
    data.specializations, 
    data.bio !== undefined ? data.bio : null, 
    data.is_active, 
    data.monthly_salary, 
    data.avatar_url !== undefined ? data.avatar_url : null,
    age !== undefined ? age : null,
    gender !== undefined ? gender : null,
    alternatePhone,
    cleanGuruId,
    data.experience !== undefined ? data.experience : null
  ]);
}

export async function deleteTrainer(id: string) {
  // Cascading cleanup of dependencies
  await query(`DELETE FROM public.guru_salary_advances WHERE trainer_id = $1`, [id]);
  await query(`DELETE FROM public.guru_salary_records WHERE trainer_id = $1`, [id]);
  await query(`DELETE FROM public.class_sessions WHERE trainer_id = $1`, [id]);
  await query(`DELETE FROM public.batches WHERE trainer_id = $1`, [id]);
  const trainer = await queryOne<{ profile_id: string }>(`SELECT profile_id FROM public.trainers WHERE id = $1`, [id]);
  const deleted = await queryOne<Trainer>(`DELETE FROM public.trainers WHERE id = $1 RETURNING *;`, [id]);
  if (trainer?.profile_id) {
    await query(`DELETE FROM public.profiles WHERE id = $1`, [trainer.profile_id]);
    await query(`DELETE FROM auth.users WHERE id = $1`, [trainer.profile_id]);
  }
  return deleted;
}

// -------------------------------------------------------------
// ROOMS
// -------------------------------------------------------------
export async function getRooms(): Promise<Room[]> {
  return query<Room>('SELECT id, name, capacity, created_at FROM public.rooms ORDER BY name ASC');
}

export async function createRoom(name: string, capacity: number = 25): Promise<Room> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Room name cannot be empty');
  const room = await queryOne<Room>(`
    INSERT INTO public.rooms (name, capacity)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE SET capacity = EXCLUDED.capacity
    RETURNING *;
  `, [trimmed, capacity]);
  if (!room) throw new Error('Failed to create or update room');
  return room;
}

export async function deleteRoom(id: string): Promise<boolean> {
  await query('DELETE FROM public.rooms WHERE id = $1', [id]);
  return true;
}

export async function updateRoom(id: string, name: string, capacity?: number): Promise<Room> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Room name cannot be empty');
  const existing = await queryOne<Room>('SELECT * FROM public.rooms WHERE id = $1', [id]);
  if (!existing) throw new Error('Room not found');

  const room = await queryOne<Room>(`
    UPDATE public.rooms
    SET name = $1, capacity = COALESCE($2, capacity)
    WHERE id = $3
    RETURNING *;
  `, [trimmed, capacity !== undefined ? capacity : null, id]);

  if (!room) throw new Error('Failed to update room');

  // Also update batch room_or_hall if it matched existing room name
  if (existing.name !== trimmed) {
    await query(`
      UPDATE public.batches
      SET room_or_hall = $1
      WHERE room_or_hall = $2
    `, [trimmed, existing.name]);
  }

  return room;
}

// -------------------------------------------------------------
// STUDENTS
// -------------------------------------------------------------
export async function getStudents(): Promise<Student[]> {
  const sql = `
    SELECT 
      s.id, s.profile_id, s.roll_number, p.full_name, p.email, p.phone,
      COALESCE(s.avatar_url, p.avatar_url) as avatar_url,
      COALESCE(s.age, p.age)::int as age,
      TO_CHAR(s.date_of_birth, 'YYYY-MM-DD') as date_of_birth,
      COALESCE(s.gender, p.gender) as gender,
      s.parent_name, s.parent_relation, s.parent_contact, s.address, s.status, 
      TO_CHAR(s.enrollment_date, 'YYYY-MM-DD') as enrollment_date,
      COALESCE(s.advance_paid, 0)::numeric as advance_paid,
      COALESCE(s.fixed_discount, 0)::numeric as fixed_discount,
      COUNT(DISTINCT be.batch_id)::int as enrolled_batches_count,
      ROUND(
        COALESCE(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
           NULLIF(COUNT(a.id), 0)::numeric) * 100, 
          100
        )
      )::int as attendance_rate
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    LEFT JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'active'
    LEFT JOIN public.attendance a ON a.student_id = s.id
    GROUP BY s.id, s.profile_id, s.roll_number, p.full_name, p.email, p.phone, s.avatar_url, p.avatar_url, s.age, p.age, s.date_of_birth, s.gender, p.gender, s.parent_name, s.parent_relation, s.parent_contact, s.address, s.status, s.enrollment_date, s.advance_paid, s.fixed_discount
    ORDER BY 
      CASE WHEN s.roll_number ~ '^LCA-[0-9]+$' THEN CAST(SUBSTRING(s.roll_number FROM 5) AS INT) ELSE 999999 END ASC,
      p.full_name ASC;
  `;
  // Fetch students, batch enrollments, fee invoice summaries, and live course attendance counts concurrently
  const [students, enrollments, invoiceSummaries, attendanceSummaries] = await Promise.all([
    query<Student>(sql),
    query<{
      student_id: string;
      batch_id: string;
      batch_name: string;
      batch_code?: string;
      course_id: string;
      course_title: string;
      course_code?: string;
      course_category: string;
      monthly_fee: number;
      trainer_id: string;
      trainer_name: string;
      days_of_week: string[];
      start_time: string;
      end_time: string;
      room_or_hall: string;
      enrollment_status: string;
      schedules?: BatchScheduleSlot[];
    }>(`
      SELECT 
        be.student_id,
        b.id as batch_id,
        b.name as batch_name,
        b.code as batch_code,
        c.id as course_id,
        c.title as course_title,
        c.code as course_code,
        c.category as course_category,
        COALESCE(b.monthly_fee, c.monthly_fee, 0)::numeric as monthly_fee,
        t.id as trainer_id,
        tp.full_name as trainer_name,
        b.days_of_week,
        b.start_time,
        b.end_time,
        b.room_or_hall,
        b.schedules,
        be.status as enrollment_status
      FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id
      JOIN public.courses c ON c.id = b.course_id
      JOIN public.trainers t ON t.id = b.trainer_id
      JOIN public.profiles tp ON tp.id = t.profile_id
      WHERE be.status = 'active'
      ORDER BY b.start_time;
    `),
    query<{
      student_id: string;
      invoice_balance: string;
      has_overdue: number;
      earliest_due_date: string;
    }>(`
      SELECT 
        student_id, 
        SUM(balance_amount)::text as invoice_balance,
        MAX(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END)::int as has_overdue,
        MIN(due_date)::text as earliest_due_date
      FROM public.student_fee_invoices
      WHERE status IN ('unpaid', 'partial', 'overdue')
      GROUP BY student_id;
    `),
    query<StudentCourseAttendanceSummary & { student_id: string }>(`
      SELECT 
        be.student_id,
        b.course_id,
        c.title as course_title,
        COUNT(DISTINCT CASE 
          WHEN cs.session_date >= DATE_TRUNC('month', CURRENT_DATE) 
           AND cs.session_date <= CURRENT_DATE 
           AND COALESCE(att_held.has_attendance, false) = true
           AND COALESCE(hol_check.is_holiday, false) = false
           AND COALESCE(ga_check.is_guru_absent, false) = false
          THEN cs.id 
        END)::int as this_month_held,
        COUNT(DISTINCT CASE 
          WHEN cs.session_date >= DATE_TRUNC('month', CURRENT_DATE) 
           AND cs.session_date <= CURRENT_DATE 
           AND COALESCE(att_held.has_attendance, false) = true
           AND COALESCE(hol_check.is_holiday, false) = false
           AND COALESCE(ga_check.is_guru_absent, false) = false
           AND LOWER(a.status) = 'absent' 
          THEN cs.id 
        END)::int as this_month_absent,
        COUNT(DISTINCT CASE 
          WHEN cs.session_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
           AND cs.session_date < DATE_TRUNC('month', CURRENT_DATE) 
           AND COALESCE(att_held.has_attendance, false) = true
           AND COALESCE(hol_check.is_holiday, false) = false
           AND COALESCE(ga_check.is_guru_absent, false) = false
          THEN cs.id 
        END)::int as last_month_held,
        COUNT(DISTINCT CASE 
          WHEN cs.session_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
           AND cs.session_date < DATE_TRUNC('month', CURRENT_DATE) 
           AND COALESCE(att_held.has_attendance, false) = true
           AND COALESCE(hol_check.is_holiday, false) = false
           AND COALESCE(ga_check.is_guru_absent, false) = false
           AND LOWER(a.status) = 'absent' 
          THEN cs.id 
        END)::int as last_month_absent
      FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id
      JOIN public.courses c ON c.id = b.course_id
      LEFT JOIN public.class_sessions cs ON cs.batch_id = b.id
      LEFT JOIN LATERAL (
        SELECT true as has_attendance 
        FROM public.attendance att_sub 
        WHERE att_sub.session_id = cs.id 
        LIMIT 1
      ) att_held ON true
      LEFT JOIN LATERAL (
        SELECT true as is_holiday 
        FROM public.holiday_alerts ha 
        WHERE ha.holiday_date = cs.session_date 
          AND ha.status != 'Cancelled' 
          AND (ha.target_batch_ids ? cs.batch_id::text OR ha.target_course_ids ? b.course_id::text)
        LIMIT 1
      ) hol_check ON true
      LEFT JOIN LATERAL (
        SELECT true as is_guru_absent 
        FROM public.guru_absences ga 
        WHERE ga.absence_date = cs.session_date 
          AND ga.batch_id = cs.batch_id
        LIMIT 1
      ) ga_check ON true
      LEFT JOIN public.attendance a ON a.session_id = cs.id AND a.student_id = be.student_id
      WHERE be.status = 'active'
      GROUP BY be.student_id, b.course_id, c.title;
    `)
  ]);

  const enrollMap = new Map<string, StudentEnrolledBatch[]>();
  for (const row of enrollments) {
    if (!enrollMap.has(row.student_id)) {
      enrollMap.set(row.student_id, []);
    }
    enrollMap.get(row.student_id)!.push({
      batch_id: row.batch_id,
      batch_name: row.batch_name,
      course_id: row.course_id,
      course_title: row.course_title,
      course_category: row.course_category,
      monthly_fee: Number(row.monthly_fee),
      trainer_id: row.trainer_id,
      trainer_name: row.trainer_name,
      days_of_week: row.days_of_week || [],
      start_time: row.start_time,
      end_time: row.end_time,
      room_or_hall: row.room_or_hall,
      enrollment_status: row.enrollment_status,
      schedules: row.schedules || []
    });
  }

  const invoiceMap = new Map<string, { balance: number; hasOverdue: boolean; earliestDueDate: string }>();
  for (const inv of invoiceSummaries) {
    invoiceMap.set(inv.student_id, {
      balance: parseFloat(inv.invoice_balance || '0'),
      hasOverdue: inv.has_overdue === 1,
      earliestDueDate: inv.earliest_due_date
    });
  }

  const attMap = new Map<string, StudentCourseAttendanceSummary[]>();
  for (const att of attendanceSummaries) {
    if (!attMap.has(att.student_id)) {
      attMap.set(att.student_id, []);
    }
    attMap.get(att.student_id)!.push({
      course_id: att.course_id,
      course_title: att.course_title,
      this_month_held: Number(att.this_month_held || 0),
      this_month_absent: Number(att.this_month_absent || 0),
      last_month_held: Number(att.last_month_held || 0),
      last_month_absent: Number(att.last_month_absent || 0)
    });
  }

  // Calculate current month's due date formatted as "05 [month name]" (e.g. "05 Oct")
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  const currentMonthDueDate = `05 ${month}`; // e.g. "05 Oct"

  for (const st of students) {
    st.enrolled_batches = enrollMap.get(st.id) || [];
    st.course_attendance = attMap.get(st.id) || [];
    
    // Combined total attendance across all enrolled courses for this student
    st.total_attendance = st.course_attendance.reduce((acc, ca) => ({
      this_month_held: acc.this_month_held + (Number(ca.this_month_held) || 0),
      this_month_absent: acc.this_month_absent + (Number(ca.this_month_absent) || 0),
      last_month_held: acc.last_month_held + (Number(ca.last_month_held) || 0),
      last_month_absent: acc.last_month_absent + (Number(ca.last_month_absent) || 0),
    }), { this_month_held: 0, this_month_absent: 0, last_month_held: 0, last_month_absent: 0 });
    
    // Total Monthly Fee: sum of fees of all courses the student has joined
    const totalMonthly = st.enrolled_batches.reduce((sum, b) => sum + (Number(b.monthly_fee) || 0), 0);
    st.total_monthly_fee = totalMonthly;
    const fixedDiscount = Number(st.fixed_discount || 0);
    const netMonthly = Math.max(0, totalMonthly - fixedDiscount);

    const advPaid = Number(st.advance_paid || 0);
    const invData = invoiceMap.get(st.id);

    // Due amount: net monthly amount to be paid (for current month) - advance that paid
    let rawDue = netMonthly - advPaid;
    if (invData && invData.balance > netMonthly) {
      // If student has accumulated overdue invoices from past months
      rawDue = invData.balance - advPaid;
    }

    st.due_amount = rawDue;
    st.due_date = currentMonthDueDate;

    // Color indicator logic:
    // Green: Zero or negative due amount (fully paid or advance payment)
    // Yellow: Less than or equal to current monthly amount (and > 0)
    // Red: More than current month amount
    if (rawDue <= 0) {
      st.due_status = 'green';
    } else if (rawDue > netMonthly) {
      st.due_status = 'red';
    } else {
      st.due_status = 'yellow';
    }
  }

  return JSON.parse(JSON.stringify(students));
}

export async function createStudent(data: {
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  age?: number;
  date_of_birth?: string;
  gender?: string;
  parent_name: string;
  parent_relation?: string;
  parent_contact?: string;
  address?: string;
  emergency_contact?: string;
  joining_date?: string;
  advance_paid?: number;
  fixed_discount?: number;
  status?: 'active' | 'inactive' | 'suspended';
  batch_ids?: string[];
}) {
  // Automatically generate unique student ID in sequence: LCA-1, LCA-2, LCA-3...
  const rollRows = await query<{ roll_number: string }>(
    `SELECT roll_number FROM public.students WHERE roll_number ~ '^LCA-[0-9]+$'`
  );
  let maxId = 0;
  for (const r of rollRows) {
    const m = r.roll_number.match(/^LCA-(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxId) maxId = n;
    }
  }
  const rollNumber = `LCA-${maxId + 1}`;

  // Enforce unique contact numbers for Students
  if (data.phone) await assertUniqueContactNumber(data.phone);

  const cleanEmail = data.email.toLowerCase().trim();

  let authEmail = cleanEmail;
  const existingUser = await queryOne<{ id: string }>(
    `SELECT id FROM auth.users WHERE email = $1`,
    [cleanEmail]
  );
  if (existingUser) {
    authEmail = `${cleanEmail.split('@')[0]}.${Date.now().toString().slice(-4)}@${cleanEmail.split('@')[1]}`;
  }

  const [authUser] = await query<{ id: string }>(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      $1, crypt('Student@123', gen_salt('bf')), now(),
      jsonb_build_object('full_name', $2::text, 'role', 'student', 'phone', $3::text),
      now(), now()
    ) RETURNING id;
  `, [authEmail, data.full_name, data.phone]);

  const uid = authUser.id;
  const calculatedAge = data.date_of_birth ? Math.max(1, Math.floor((new Date().getTime() - new Date(data.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : null;
  const age = data.age ? Number(data.age) : calculatedAge;
  const gender = data.gender ? data.gender.toLowerCase() : null;

  await query(`
    INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, age, gender)
    VALUES ($1, $2, $3, $4, 'student', $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET 
      full_name = EXCLUDED.full_name, 
      phone = EXCLUDED.phone, 
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
      age = COALESCE(EXCLUDED.age, profiles.age),
      gender = COALESCE(EXCLUDED.gender, profiles.gender);
  `, [uid, data.full_name, cleanEmail, data.phone, data.avatar_url || null, age, gender]);

  const joiningDate = data.joining_date || new Date().toISOString().split('T')[0];
  const advancePaid = Number(data.advance_paid || 0);
  const fixedDiscount = Number(data.fixed_discount || 0);
  const studentStatus = data.status || 'active';
  const dob = data.date_of_birth?.trim() || null;

  const student = await queryOne<Student>(`
    INSERT INTO public.students (
      profile_id, roll_number, parent_name, parent_relation,
      parent_contact, address, emergency_contact, status, enrollment_date, advance_paid, fixed_discount, avatar_url, age, gender, date_of_birth
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::date)
    ON CONFLICT (profile_id) DO UPDATE SET
      parent_name = EXCLUDED.parent_name,
      parent_relation = EXCLUDED.parent_relation,
      parent_contact = EXCLUDED.parent_contact,
      address = EXCLUDED.address,
      emergency_contact = EXCLUDED.emergency_contact,
      status = EXCLUDED.status,
      enrollment_date = EXCLUDED.enrollment_date,
      advance_paid = EXCLUDED.advance_paid,
      fixed_discount = EXCLUDED.fixed_discount,
      avatar_url = COALESCE(EXCLUDED.avatar_url, students.avatar_url),
      age = COALESCE(EXCLUDED.age, students.age),
      gender = COALESCE(EXCLUDED.gender, students.gender),
      date_of_birth = COALESCE(EXCLUDED.date_of_birth, students.date_of_birth)
    RETURNING *;
  `, [
    uid, 
    rollNumber, 
    data.parent_name, 
    data.parent_relation || 'Parent',
    data.parent_contact || data.phone,
    data.address || 'Kannamangala, Bangalore',
    data.emergency_contact || data.parent_contact || data.phone,
    studentStatus,
    joiningDate,
    advancePaid,
    fixedDiscount,
    data.avatar_url || null,
    age,
    gender,
    dob
  ]);

  if (student && data.batch_ids && data.batch_ids.length > 0) {
    for (const bId of data.batch_ids) {
      await query(`
        INSERT INTO public.batch_enrollments (batch_id, student_id, status)
        VALUES ($1, $2, 'active')
        ON CONFLICT (batch_id, student_id) DO UPDATE SET status = 'active';
      `, [bId, student.id]);
    }
  }

  return {
    ...student,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    advance_paid: advancePaid,
    fixed_discount: fixedDiscount,
    avatar_url: data.avatar_url || null,
    age: age || undefined,
    date_of_birth: dob || undefined,
    gender: (gender as any) || undefined
  };
}

export async function updateStudent(id: string, data: {
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  age?: number;
  date_of_birth?: string;
  gender?: string;
  parent_name?: string;
  parent_relation?: string;
  parent_contact?: string;
  address?: string;
  joining_date?: string;
  advance_paid?: number;
  fixed_discount?: number;
  status?: 'active' | 'inactive' | 'suspended';
  batch_ids?: string[];
}) {
  const current = await queryOne<{ profile_id: string }>(
    `SELECT profile_id FROM public.students WHERE id = $1`,
    [id]
  );
  if (!current) throw new Error('Student not found');

  // Enforce unique contact numbers on update
  if (data.phone) await assertUniqueContactNumber(data.phone, current.profile_id);

  const calculatedAge = data.date_of_birth ? Math.max(1, Math.floor((new Date().getTime() - new Date(data.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : undefined;
  const age = data.age !== undefined ? (data.age ? Number(data.age) : null) : calculatedAge;
  const gender = data.gender !== undefined ? (data.gender ? data.gender.toLowerCase() : null) : undefined;
  const dob = data.date_of_birth !== undefined ? (data.date_of_birth?.trim() || null) : undefined;

  if (data.full_name || data.email || data.phone || data.avatar_url !== undefined || age !== undefined || gender !== undefined) {
    await query(`
      UPDATE public.profiles
      SET full_name = COALESCE($2, full_name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          avatar_url = COALESCE($5, avatar_url),
          age = COALESCE($6, age),
          gender = COALESCE($7, gender),
          updated_at = now()
      WHERE id = $1;
    `, [
      current.profile_id, 
      data.full_name, 
      data.email, 
      data.phone, 
      data.avatar_url !== undefined ? data.avatar_url : null,
      age !== undefined ? age : null,
      gender !== undefined ? gender : null
    ]);
  }

  const updated = await queryOne<Student>(`
    UPDATE public.students
    SET parent_name = COALESCE($2, parent_name),
        parent_relation = COALESCE($3, parent_relation),
        parent_contact = COALESCE($4, parent_contact),
        address = COALESCE($5, address),
        status = COALESCE($6, status),
        enrollment_date = COALESCE($7::date, enrollment_date),
        advance_paid = COALESCE($8, advance_paid),
        avatar_url = COALESCE($9, avatar_url),
        age = COALESCE($10, age),
        gender = COALESCE($11, gender),
        date_of_birth = COALESCE($12::date, date_of_birth),
        fixed_discount = COALESCE($13, fixed_discount),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, data.parent_name, data.parent_relation, data.parent_contact, 
    data.address, data.status, data.joining_date, data.advance_paid,
    data.avatar_url !== undefined ? data.avatar_url : null,
    age !== undefined ? age : null,
    gender !== undefined ? gender : null,
    dob,
    data.fixed_discount !== undefined ? data.fixed_discount : null
  ]);

  // Update batch enrollments if batch_ids provided
  if (data.batch_ids) {
    await query(`DELETE FROM public.batch_enrollments WHERE student_id = $1`, [id]);
    const enrollStatus = data.status === 'inactive' ? 'inactive' : 'active';
    for (const bId of data.batch_ids) {
      await query(`
        INSERT INTO public.batch_enrollments (batch_id, student_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (batch_id, student_id) DO UPDATE SET status = $3;
      `, [bId, id, enrollStatus]);
    }
  } else if (data.status) {
    // If only status changed (e.g. active to inactive toggle)
    await query(`
      UPDATE public.batch_enrollments
      SET status = $1
      WHERE student_id = $2;
    `, [data.status, id]);
  }

  const prof = await queryOne<{ full_name: string; email: string; phone: string; avatar_url: string }>(
    `SELECT full_name, email, phone, avatar_url FROM public.profiles WHERE id = $1`,
    [current.profile_id]
  );

  return {
    ...updated,
    full_name: prof?.full_name || data.full_name,
    email: prof?.email || data.email,
    phone: prof?.phone || data.phone,
    avatar_url: prof?.avatar_url || data.avatar_url || null
  };
}

export async function deleteStudent(id: string) {
  // Check if student has historical payment or attendance records
  const [att] = await query<{ count: string }>(`SELECT COUNT(*) as count FROM public.attendance WHERE student_id = $1`, [id]);
  const [inv] = await query<{ count: string }>(`SELECT COUNT(*) as count FROM public.student_fee_invoices WHERE student_id = $1`, [id]);
  const hasHistory = (parseInt(att?.count || '0', 10) > 0) || (parseInt(inv?.count || '0', 10) > 0);

  // Remove active batch enrollments
  await query(`DELETE FROM public.batch_enrollments WHERE student_id = $1`, [id]);

  if (hasHistory) {
    // Correctly preserve historical records: mark student as inactive
    return queryOne<Student>(`
      UPDATE public.students
      SET status = 'inactive', updated_at = now()
      WHERE id = $1
      RETURNING *;
    `, [id]);
  } else {
    // Safe to delete if no historical transactions
    return queryOne<Student>(`
      DELETE FROM public.students WHERE id = $1 RETURNING *;
    `, [id]);
  }
}

export async function enrollStudentInBatch(studentId: string, batchId: string) {
  return queryOne(`
    INSERT INTO public.batch_enrollments (batch_id, student_id, status)
    VALUES ($1, $2, 'active')
    ON CONFLICT (batch_id, student_id) DO UPDATE SET status = 'active'
    RETURNING *;
  `, [batchId, studentId]);
}

// -------------------------------------------------------------
// BATCHES
// -------------------------------------------------------------
export async function getBatches(): Promise<Batch[]> {
  const sql = `
    SELECT 
      b.id, b.code, b.course_id, c.title as course_title, c.code as course_code, c.category as course_category,
      b.trainer_id, p.full_name as trainer_name,
      b.name, b.days_of_week, b.start_time, b.end_time, b.room_or_hall,
      COALESCE(b.monthly_fee, 0)::numeric as monthly_fee,
      COALESCE(b.gst_percent, 18)::numeric as gst_percent,
      COALESCE(b.description, '') as description,
      b.max_capacity, b.is_active, b.schedules,
      COUNT(DISTINCT CASE WHEN st.status = 'active' THEN be.id END)::int as enrolled_count
    FROM public.batches b
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.trainers t ON t.id = b.trainer_id
    JOIN public.profiles p ON p.id = t.profile_id
    LEFT JOIN public.batch_enrollments be ON be.batch_id = b.id AND be.status = 'active'
    LEFT JOIN public.students st ON st.id = be.student_id
    GROUP BY b.id, b.code, b.course_id, c.title, c.code, c.category, b.trainer_id, p.full_name, b.monthly_fee, b.gst_percent, b.description, b.schedules
    ORDER BY b.start_time, b.name;
  `;
  return query<Batch>(sql);
}

export async function createBatch(data: {
  code?: string;
  course_id: string;
  trainer_id: string;
  name: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  room_or_hall: string;
  max_capacity: number;
  monthly_fee?: number;
  gst_percent?: number;
  description?: string;
  is_active?: boolean;
  schedules?: BatchScheduleSlot[];
}) {
  let batchCode = data.code?.trim().toLowerCase();
  if (!batchCode) {
    const crs = await queryOne<{ code: string }>(`SELECT code FROM public.courses WHERE id = $1`, [data.course_id]);
    const crsCode = (crs?.code || 'crs').toLowerCase();
    const existing = await query<{ code: string }>(`SELECT code FROM public.batches WHERE course_id = $1`, [data.course_id]);
    let maxNum = 0;
    for (const row of existing) {
      if (row.code) {
        const m = row.code.match(/-(\d+)$/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    batchCode = `${crsCode}-${maxNum + 1}`;
  }

  return queryOne<Batch>(`
    INSERT INTO public.batches (
      course_id, trainer_id, name, code, days_of_week, 
      start_time, end_time, room_or_hall, max_capacity, 
      monthly_fee, description, is_active, schedules
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `, [
    data.course_id, data.trainer_id, data.name, batchCode, data.days_of_week,
    data.start_time, data.end_time, data.room_or_hall, data.max_capacity,
    Number(data.monthly_fee || 0),
    Number(data.gst_percent !== undefined ? data.gst_percent : 18),
    data.description || '',
    data.is_active !== undefined ? data.is_active : true,
    JSON.stringify(data.schedules || [])
  ]);
}

export async function updateBatch(id: string, data: {
  code?: string;
  name?: string;
  course_id?: string;
  trainer_id?: string;
  days_of_week?: string[];
  start_time?: string;
  end_time?: string;
  room_or_hall?: string;
  max_capacity?: number;
  monthly_fee?: number;
  gst_percent?: number;
  description?: string;
  is_active?: boolean;
  schedules?: BatchScheduleSlot[];
}) {
  const cleanCode = data.code ? data.code.trim().toLowerCase() : undefined;
  return queryOne<Batch>(`
    UPDATE public.batches
    SET name = COALESCE($2, name),
        course_id = COALESCE($3, course_id),
        trainer_id = COALESCE($4, trainer_id),
        days_of_week = COALESCE($5, days_of_week),
        start_time = COALESCE($6, start_time),
        end_time = COALESCE($7, end_time),
        room_or_hall = COALESCE($8, room_or_hall),
        max_capacity = COALESCE($9, max_capacity),
        monthly_fee = COALESCE($10, monthly_fee),
        description = COALESCE($11, description),
        is_active = COALESCE($12, is_active),
        schedules = COALESCE($13::jsonb, schedules),
        code = COALESCE($14, code),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, data.name, data.course_id, data.trainer_id, data.days_of_week,
    data.start_time, data.end_time, data.room_or_hall, data.max_capacity,
    data.monthly_fee !== undefined ? data.monthly_fee : null,
    data.gst_percent !== undefined ? data.gst_percent : null,
    data.description !== undefined ? data.description : null,
    data.is_active !== undefined ? data.is_active : null,
    data.schedules ? JSON.stringify(data.schedules) : null,
    cleanCode
  ]);
}


export async function deleteBatch(id: string) {
  await query(`DELETE FROM public.batch_enrollments WHERE batch_id = $1`, [id]);
  await query(`DELETE FROM public.class_sessions WHERE batch_id = $1`, [id]);
  return queryOne<Batch>(`
    DELETE FROM public.batches WHERE id = $1 RETURNING *;
  `, [id]);
}

// -------------------------------------------------------------
// SESSIONS & ATTENDANCE
// -------------------------------------------------------------
export async function getSessions(dateFilter?: string, startDate?: string, endDate?: string, roomFilter?: string): Promise<ClassSession[]> {
  let targetDate = dateFilter;
  if (!targetDate && !startDate && !endDate) {
    targetDate = new Date().toISOString().split('T')[0];
  }

  let sql = `
    SELECT 
      s.id, s.batch_id, b.name as batch_name, c.title as course_title,
      b.room_or_hall,
      p.full_name as trainer_name, TO_CHAR(s.session_date, 'YYYY-MM-DD') as session_date,
      s.start_time, s.end_time,
      s.status, s.check_in_code, s.session_topic_notes,
      COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)::int as present_count,
      COUNT(DISTINCT be.id)::int as total_enrolled,
      COALESCE(tc_check.is_rescheduled, false) as is_rescheduled
    FROM public.class_sessions s
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.trainers t ON t.id = s.trainer_id
    JOIN public.profiles p ON p.id = t.profile_id
    LEFT JOIN public.batch_enrollments be ON be.batch_id = b.id AND be.status = 'active'
    LEFT JOIN public.attendance a ON a.session_id = s.id
    LEFT JOIN LATERAL (
      SELECT true as is_rescheduled
      FROM public.tally_classes tc
      WHERE tc.batch_id = s.batch_id AND tc.rescheduled_date = s.session_date AND tc.status = 'Scheduled'
      LIMIT 1
    ) tc_check ON true
    WHERE 1=1 AND b.is_active = true
  `;
  const params: any[] = [];
  if (startDate && endDate) {
    sql += ` AND s.session_date >= $1 AND s.session_date <= $2`;
    params.push(startDate, endDate);
  } else if (targetDate) {
    sql += ` AND s.session_date = $1`;
    params.push(targetDate);
  }

  if (roomFilter && roomFilter !== 'All' && roomFilter !== 'all' && roomFilter.trim() !== '') {
    params.push(roomFilter);
    sql += ` AND b.room_or_hall = $${params.length}`;
  }

  sql += `
    GROUP BY s.id, s.batch_id, b.name, c.title, b.room_or_hall, p.full_name, tc_check.is_rescheduled
    ORDER BY s.session_date ASC, s.start_time ASC;
  `;
  const sessions = await query<ClassSession>(sql, params);

  // Also include any active scheduled tally classes for this date
  try {
    let tallySql = `
      SELECT 
        tc.id as id,
        tc.batch_id,
        tc.batch_name,
        tc.course_title,
        tc.room_or_hall,
        tc.trainer_name,
        TO_CHAR(tc.rescheduled_date, 'YYYY-MM-DD') as session_date,
        tc.start_time::text as start_time,
        tc.end_time::text as end_time,
        'scheduled' as status,
        '' as check_in_code,
        COALESCE(tc.reason, 'Rescheduled / Tally Class') as session_topic_notes,
        0 as present_count,
        tc.students_count as total_enrolled,
        true as is_rescheduled
      FROM public.tally_classes tc
      WHERE tc.status = 'Scheduled'
    `;
    const tallyParams: any[] = [];
    if (startDate && endDate) {
      tallySql += ` AND tc.rescheduled_date >= $1 AND tc.rescheduled_date <= $2`;
      tallyParams.push(startDate, endDate);
    } else if (targetDate) {
      tallySql += ` AND tc.rescheduled_date = $1`;
      tallyParams.push(targetDate);
    }
    if (roomFilter && roomFilter !== 'All' && roomFilter !== 'all' && roomFilter.trim() !== '') {
      tallyParams.push(roomFilter);
      tallySql += ` AND tc.room_or_hall = $${tallyParams.length}`;
    }

    const tallyRows = await query<ClassSession>(tallySql, tallyParams);
    for (const tr of tallyRows) {
      const existsInSessions = sessions.some(s => s.batch_id === tr.batch_id && s.session_date === tr.session_date);
      if (!existsInSessions) {
        sessions.push(tr);
      }
    }
  } catch (tallyErr) {
    console.warn('Error fetching tally classes in getSessions:', tallyErr);
  }

  return sessions.sort((a, b) => (a.start_time > b.start_time ? 1 : -1));
}

export async function updateSessionStatus(sessionId: string, status: string, checkInCode?: string) {
  const code = checkInCode || Math.floor(100000 + Math.random() * 900000).toString();
  return queryOne<ClassSession>(`
    UPDATE public.class_sessions
    SET status = $2,
        check_in_code = COALESCE($3, check_in_code),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [sessionId, status, code]);
}

export async function getAttendanceRecords(sessionId?: string, dateFilter?: string): Promise<AttendanceRecord[]> {
  let sql = `
    SELECT 
      a.id, a.session_id, TO_CHAR(s.session_date, 'YYYY-MM-DD') as session_date,
      b.name as batch_name, c.title as course_title,
      st.id as student_id, p.full_name as student_name, st.roll_number,
      a.status, a.check_in_time, a.check_in_method, a.remarks
    FROM public.attendance a
    JOIN public.class_sessions s ON s.id = a.session_id
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.students st ON st.id = a.student_id
    JOIN public.profiles p ON p.id = st.profile_id
  `;
  const params: any[] = [];
  if (sessionId) {
    sql += ` WHERE a.session_id = $1`;
    params.push(sessionId);
  } else if (dateFilter) {
    sql += ` WHERE s.session_date = $1`;
    params.push(dateFilter);
  }
  sql += ` ORDER BY s.session_date DESC, a.check_in_time DESC NULLS LAST;`;
  return query<AttendanceRecord>(sql, params);
}

export interface AttendanceAuditRecord {
  id: string;
  session_id: string;
  session_date: string;
  batch_id: string;
  batch_name: string;
  course_id: string;
  course_title: string;
  course_code: string;
  course_category: string;
  trainer_id: string;
  trainer_name: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent';
  check_in_time?: string | null;
  check_in_method?: string | null;
  remarks?: string | null;
}

export async function getAttendanceAuditRecords(options?: {
  courseId?: string;
  startDate?: string;
  endDate?: string;
  dateFilter?: string;
}): Promise<AttendanceAuditRecord[]> {
  let sql = `
    SELECT 
      a.id, a.session_id, TO_CHAR(s.session_date, 'YYYY-MM-DD') as session_date,
      b.id as batch_id, b.name as batch_name,
      c.id as course_id, c.title as course_title, c.code as course_code, c.category as course_category,
      t.id as trainer_id, tp.full_name as trainer_name,
      st.id as student_id, p.full_name as student_name, st.roll_number,
      a.status, a.check_in_time::text as check_in_time, a.check_in_method, a.remarks
    FROM public.attendance a
    JOIN public.class_sessions s ON s.id = a.session_id
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.courses c ON c.id = b.course_id
    LEFT JOIN public.trainers t ON t.id = COALESCE(s.trainer_id, b.trainer_id)
    LEFT JOIN public.profiles tp ON tp.id = t.profile_id
    JOIN public.students st ON st.id = a.student_id
    JOIN public.profiles p ON p.id = st.profile_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (options?.courseId && options.courseId !== 'all') {
    params.push(options.courseId);
    sql += ` AND c.id = $${params.length}`;
  }
  if (options?.dateFilter) {
    params.push(options.dateFilter);
    sql += ` AND s.session_date = $${params.length}`;
  }
  if (options?.startDate) {
    params.push(options.startDate);
    sql += ` AND s.session_date >= $${params.length}`;
  }
  if (options?.endDate) {
    params.push(options.endDate);
    sql += ` AND s.session_date <= $${params.length}`;
  }
  sql += ` ORDER BY s.session_date DESC, c.title ASC, p.full_name ASC;`;
  const rows = await query<AttendanceAuditRecord>(sql, params);
  return JSON.parse(JSON.stringify(rows));
}

export interface GuruAttendanceAuditRecord {
  session_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  session_status: string;
  batch_id: string;
  batch_name: string;
  room_or_hall: string;
  course_id: string;
  course_title: string;
  trainer_id: string;
  trainer_name: string;
  trainer_title: string;
  specializations: string[] | null;
  marked_students_count: number;
  present_students_count: number;
  absent_students_count: number;
  total_enrolled: number;
  guru_status: 'present' | 'absent' | 'upcoming' | 'holiday';
}

export async function getGuruAttendanceAuditRecords(options?: {
  trainerId?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  dateFilter?: string;
  status?: string;
}): Promise<GuruAttendanceAuditRecord[]> {
  let sql = `
    SELECT 
      cs.id as session_id,
      TO_CHAR(cs.session_date, 'YYYY-MM-DD') as session_date,
      cs.start_time::text as start_time,
      cs.end_time::text as end_time,
      cs.status as session_status,
      b.id as batch_id,
      b.name as batch_name,
      COALESCE(b.room_or_hall, 'Mandapam') as room_or_hall,
      c.id as course_id,
      c.title as course_title,
      t.id as trainer_id,
      COALESCE(p.full_name, 'Assigned Guru') as trainer_name,
      COALESCE(t.display_title, 'Faculty Guru') as trainer_title,
      t.specializations,
      COALESCE(att_stats.marked_count, 0) as marked_students_count,
      COALESCE(att_stats.present_count, 0) as present_students_count,
      COALESCE(att_stats.absent_count, 0) as absent_students_count,
      COALESCE(enr_stats.enrolled_count, 0) as total_enrolled,
      CASE 
        WHEN COALESCE(att_stats.marked_count, 0) > 0 THEN 'present'
        WHEN COALESCE(hol_check.is_holiday, false) = true THEN 'holiday'
        ELSE 'absent'
      END as guru_status
    FROM public.class_sessions cs
    JOIN public.batches b ON cs.batch_id = b.id
    JOIN public.courses c ON b.course_id = c.id
    LEFT JOIN public.trainers t ON cs.trainer_id = t.id OR b.trainer_id = t.id
    LEFT JOIN public.profiles p ON t.profile_id = p.id
    LEFT JOIN LATERAL (
      SELECT 
        count(*)::int as marked_count,
        count(*) FILTER (WHERE a.status = 'present')::int as present_count,
        count(*) FILTER (WHERE a.status = 'absent')::int as absent_count
      FROM public.attendance a
      WHERE a.session_id = cs.id
    ) att_stats ON true
    LEFT JOIN LATERAL (
      SELECT count(*)::int as enrolled_count
      FROM public.batch_enrollments be
      WHERE be.batch_id = cs.batch_id AND be.status = 'active'
    ) enr_stats ON true
    LEFT JOIN LATERAL (
      SELECT true as is_holiday
      FROM public.holiday_alerts ha
      WHERE ha.holiday_date = cs.session_date
        AND ha.status != 'Cancelled'
        AND (ha.target_batch_ids ? cs.batch_id::text OR ha.target_course_ids ? b.course_id::text)
      LIMIT 1
    ) hol_check ON true
    LEFT JOIN LATERAL (
      SELECT true as has_alert
      FROM public.session_alerts sa
      WHERE (sa.batch_id = cs.batch_id::text OR sa.batch_name = b.name)
        AND sa.alert_type = 'class_closed'
        AND sa.created_at::date = cs.session_date
      LIMIT 1
    ) alert_check ON true
    WHERE cs.session_date <= CURRENT_DATE
  `;
  const params: any[] = [];
  if (options?.trainerId && options.trainerId !== 'all') {
    params.push(options.trainerId);
    sql += ` AND t.id = $${params.length}`;
  }
  if (options?.courseId && options.courseId !== 'all') {
    params.push(options.courseId);
    sql += ` AND c.id = $${params.length}`;
  }
  if (options?.dateFilter) {
    params.push(options.dateFilter);
    sql += ` AND cs.session_date = $${params.length}`;
  }
  if (options?.startDate) {
    params.push(options.startDate);
    sql += ` AND cs.session_date >= $${params.length}`;
  }
  if (options?.endDate) {
    params.push(options.endDate);
    sql += ` AND cs.session_date <= $${params.length}`;
  }

  sql += ` ORDER BY cs.session_date DESC, cs.start_time DESC;`;

  const rows = await query<GuruAttendanceAuditRecord>(sql, params);
  
  if (options?.status && options.status !== 'all') {
    return rows.filter(r => r.guru_status === options.status);
  }
  return rows;
}

// -------------------------------------------------------------
// SCHEMES
// -------------------------------------------------------------
export async function getSchemes(): Promise<Scheme[]> {
  const sql = `
    SELECT 
      id, 
      name, 
      COALESCE(description, '') as description, 
      COALESCE(course_ids, '[]'::jsonb) as course_ids, 
      COALESCE(batch_ids, '[]'::jsonb) as batch_ids, 
      COALESCE(total_monthly_fee, 0)::numeric as total_monthly_fee, 
      COALESCE(fixed_discount, 0)::numeric as fixed_discount, 
      COALESCE(is_active, true) as is_active, 
      TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
      TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
    FROM public.schemes
    ORDER BY created_at DESC;
  `;
  const rows = await query<any>(sql);
  return rows.map(r => ({
    ...r,
    course_ids: Array.isArray(r.course_ids) ? r.course_ids : (typeof r.course_ids === 'string' ? JSON.parse(r.course_ids) : []),
    batch_ids: Array.isArray(r.batch_ids) ? r.batch_ids : (typeof r.batch_ids === 'string' ? JSON.parse(r.batch_ids) : []),
    total_monthly_fee: Number(r.total_monthly_fee || 0),
    fixed_discount: Number(r.fixed_discount || 0),
    is_active: r.is_active !== false
  }));
}

export async function createScheme(data: {
  name: string;
  description?: string;
  course_ids: string[];
  batch_ids: string[];
  total_monthly_fee: number;
  fixed_discount: number;
  is_active?: boolean;
}) {
  return queryOne<Scheme>(`
    INSERT INTO public.schemes (
      name, description, course_ids, batch_ids, total_monthly_fee, fixed_discount, is_active
    )
    VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7)
    RETURNING *;
  `, [
    data.name.trim(),
    data.description || '',
    JSON.stringify(data.course_ids || []),
    JSON.stringify(data.batch_ids || []),
    Number(data.total_monthly_fee || 0),
    Number(data.fixed_discount || 0),
    data.is_active !== undefined ? data.is_active : true
  ]);
}

export async function updateScheme(id: string, data: {
  name?: string;
  description?: string;
  course_ids?: string[];
  batch_ids?: string[];
  total_monthly_fee?: number;
  fixed_discount?: number;
  is_active?: boolean;
}) {
  return queryOne<Scheme>(`
    UPDATE public.schemes
    SET name = COALESCE($2, name),
        description = COALESCE($3, description),
        course_ids = COALESCE($4::jsonb, course_ids),
        batch_ids = COALESCE($5::jsonb, batch_ids),
        total_monthly_fee = COALESCE($6, total_monthly_fee),
        fixed_discount = COALESCE($7, fixed_discount),
        is_active = COALESCE($8, is_active),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id,
    data.name ? data.name.trim() : null,
    data.description !== undefined ? data.description : null,
    data.course_ids ? JSON.stringify(data.course_ids) : null,
    data.batch_ids ? JSON.stringify(data.batch_ids) : null,
    data.total_monthly_fee !== undefined ? Number(data.total_monthly_fee) : null,
    data.fixed_discount !== undefined ? Number(data.fixed_discount) : null,
    data.is_active !== undefined ? data.is_active : null
  ]);
}

export async function deleteScheme(id: string) {
  return queryOne<Scheme>(`
    DELETE FROM public.schemes WHERE id = $1 RETURNING *;
  `, [id]);
}


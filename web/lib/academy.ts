import { query, queryOne } from './db';

export interface Course {
  id: string;
  title: string;
  code: string;
  category: string;
  description: string;
  duration_months: number;
  monthly_fee: number;
  is_active: boolean;
  batch_count?: number;
}

export interface Trainer {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone: string;
  specializations: string[];
  display_title?: string;
  bio: string;
  is_active: boolean;
  joined_date: string;
  batches_assigned?: number;
}

export interface Student {
  id: string;
  profile_id: string;
  roll_number: string;
  full_name: string;
  email: string;
  phone: string;
  parent_name: string;
  status: 'active' | 'inactive' | 'suspended';
  enrollment_date: string;
  enrolled_batches_count?: number;
  attendance_rate?: number;
}

export interface Batch {
  id: string;
  course_id: string;
  course_title: string;
  course_category: string;
  trainer_id: string;
  trainer_name: string;
  name: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  room_or_hall: string;
  max_capacity: number;
  is_active: boolean;
  enrolled_count: number;
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
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  check_in_code: string;
  session_topic_notes: string;
  present_count?: number;
  total_enrolled?: number;
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
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time: string | null;
  check_in_method: string;
  remarks: string | null;
}

// -------------------------------------------------------------
// METRICS
// -------------------------------------------------------------
export async function getDashboardMetrics() {
  const [coursesCount] = await query<{ count: string }>('SELECT COUNT(*) as count FROM public.courses WHERE is_active = true');
  const [trainersCount] = await query<{ count: string }>('SELECT COUNT(*) as count FROM public.trainers WHERE is_active = true');
  const [studentsCount] = await query<{ count: string }>('SELECT COUNT(*) as count FROM public.students WHERE status = \'active\'');
  const [batchesCount] = await query<{ count: string }>('SELECT COUNT(*) as count FROM public.batches WHERE is_active = true');
  
  const today = new Date().toISOString().split('T')[0];
  const [todaySessions] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM public.class_sessions WHERE session_date = $1',
    [today]
  );

  const [presentToday] = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM public.attendance a 
     JOIN public.class_sessions s ON s.id = a.session_id 
     WHERE s.session_date = $1 AND a.status = 'present'`,
    [today]
  );

  return {
    totalCourses: parseInt(coursesCount?.count || '0', 10),
    totalTrainers: parseInt(trainersCount?.count || '0', 10),
    totalStudents: parseInt(studentsCount?.count || '0', 10),
    activeBatches: parseInt(batchesCount?.count || '0', 10),
    todaySessionsCount: parseInt(todaySessions?.count || '0', 10),
    presentTodayCount: parseInt(presentToday?.count || '0', 10)
  };
}

// -------------------------------------------------------------
// COURSES
// -------------------------------------------------------------
export async function getCourses(category?: string): Promise<Course[]> {
  let sql = `
    SELECT 
      c.id, c.title, c.code, c.category, c.description, 
      c.duration_months, c.monthly_fee, c.is_active,
      COUNT(b.id)::int as batch_count
    FROM public.courses c
    LEFT JOIN public.batches b ON b.course_id = c.id
  `;
  const params: any[] = [];
  if (category && category !== 'All') {
    sql += ` WHERE c.category = $1`;
    params.push(category);
  }
  sql += ` GROUP BY c.id ORDER BY c.category, c.title;`;
  return query<Course>(sql, params);
}

export async function createCourse(data: {
  title: string;
  code: string;
  category: string;
  description: string;
  duration_months: number;
  monthly_fee: number;
}) {
  return queryOne<Course>(`
    INSERT INTO public.courses (title, code, category, description, duration_months, monthly_fee, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING *;
  `, [data.title, data.code, data.category, data.description, data.duration_months, data.monthly_fee]);
}

export async function updateCourse(id: string, data: Partial<Course>) {
  return queryOne<Course>(`
    UPDATE public.courses
    SET monthly_fee = COALESCE($2, monthly_fee),
        description = COALESCE($3, description),
        duration_months = COALESCE($4, duration_months),
        is_active = COALESCE($5, is_active),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [id, data.monthly_fee, data.description, data.duration_months, data.is_active]);
}

// -------------------------------------------------------------
// TRAINERS
// -------------------------------------------------------------
export async function getTrainers(): Promise<Trainer[]> {
  const sql = `
    SELECT 
      t.id, t.profile_id, p.full_name, p.email, p.phone,
      t.specializations, t.display_title, t.bio, t.is_active, t.joined_date::text as joined_date,
      COUNT(b.id)::int as batches_assigned
    FROM public.trainers t
    JOIN public.profiles p ON p.id = t.profile_id
    LEFT JOIN public.batches b ON b.trainer_id = t.id
    GROUP BY t.id, t.profile_id, p.full_name, p.email, p.phone, t.specializations, t.display_title, t.bio, t.is_active, t.joined_date
    ORDER BY p.full_name;
  `;
  return query<Trainer>(sql);
}

export async function createTrainer(data: {
  full_name: string;
  email?: string;
  phone?: string;
  specializations: string[];
  display_title?: string;
  bio: string;
}) {
  const cleanEmail = (data.email && data.email.trim())
    ? data.email.toLowerCase().trim()
    : `${data.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guru'}@laasyaacademy.com`;
  const cleanPhone = data.phone?.trim() || '+91 8151 998 899';
  const displayTitle = data.display_title?.trim() || 'Revered Guru & Mentor';

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
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES ($1, $2, $3, $4, 'trainer')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
  `, [uid, data.full_name, cleanEmail, cleanPhone]);

  // Insert trainer
  return queryOne<Trainer>(`
    INSERT INTO public.trainers (profile_id, specializations, display_title, bio, is_active)
    VALUES ($1, $2, $3, $4, true)
    RETURNING *;
  `, [uid, data.specializations, displayTitle, data.bio]);
}

export async function updateTrainer(id: string, data: {
  full_name?: string;
  display_title?: string;
  phone?: string;
  specializations?: string[];
  bio?: string;
  is_active?: boolean;
}) {
  const trainer = await queryOne<{ profile_id: string }>(
    'SELECT profile_id FROM public.trainers WHERE id = $1',
    [id]
  );
  if (!trainer) throw new Error('Guru not found');

  if (data.full_name || data.phone) {
    await query(`
      UPDATE public.profiles
      SET full_name = COALESCE($2, full_name),
          phone = COALESCE($3, phone),
          updated_at = now()
      WHERE id = $1
    `, [trainer.profile_id, data.full_name, data.phone]);
  }

  return queryOne<Trainer>(`
    UPDATE public.trainers
    SET display_title = COALESCE($2, display_title),
        specializations = COALESCE($3, specializations),
        bio = COALESCE($4, bio),
        is_active = COALESCE($5, is_active),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [id, data.display_title, data.specializations, data.bio, data.is_active]);
}

// -------------------------------------------------------------
// STUDENTS
// -------------------------------------------------------------
export async function getStudents(): Promise<Student[]> {
  const sql = `
    SELECT 
      s.id, s.profile_id, s.roll_number, p.full_name, p.email, p.phone,
      s.parent_name, s.status, s.enrollment_date::text as enrollment_date,
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
    GROUP BY s.id, s.profile_id, s.roll_number, p.full_name, p.email, p.phone, s.parent_name, s.status, s.enrollment_date
    ORDER BY p.full_name;
  `;
  return query<Student>(sql);
}

export async function createStudent(data: {
  full_name: string;
  email: string;
  phone: string;
  parent_name: string;
  emergency_contact: string;
}) {
  const rollNumber = `LCA-${Math.floor(10000 + Math.random() * 90000)}`;

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
  `, [data.email.toLowerCase().trim(), data.full_name, data.phone]);

  const uid = authUser.id;

  await query(`
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES ($1, $2, $3, $4, 'student')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
  `, [uid, data.full_name, data.email, data.phone]);

  return queryOne<Student>(`
    INSERT INTO public.students (profile_id, roll_number, parent_name, emergency_contact, status)
    VALUES ($1, $2, $3, $4, 'active')
    RETURNING *;
  `, [uid, rollNumber, data.parent_name, data.emergency_contact]);
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
      b.id, b.course_id, c.title as course_title, c.category as course_category,
      b.trainer_id, p.full_name as trainer_name,
      b.name, b.days_of_week, b.start_time, b.end_time, b.room_or_hall,
      b.max_capacity, b.is_active,
      COUNT(be.id)::int as enrolled_count
    FROM public.batches b
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.trainers t ON t.id = b.trainer_id
    JOIN public.profiles p ON p.id = t.profile_id
    LEFT JOIN public.batch_enrollments be ON be.batch_id = b.id AND be.status = 'active'
    GROUP BY b.id, b.course_id, c.title, c.category, b.trainer_id, p.full_name
    ORDER BY b.start_time, b.name;
  `;
  return query<Batch>(sql);
}

export async function createBatch(data: {
  course_id: string;
  trainer_id: string;
  name: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  room_or_hall: string;
  max_capacity: number;
}) {
  return queryOne<Batch>(`
    INSERT INTO public.batches (course_id, trainer_id, name, days_of_week, start_time, end_time, room_or_hall, max_capacity, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
    RETURNING *;
  `, [
    data.course_id, data.trainer_id, data.name, data.days_of_week,
    data.start_time, data.end_time, data.room_or_hall, data.max_capacity
  ]);
}

// -------------------------------------------------------------
// SESSIONS & ATTENDANCE
// -------------------------------------------------------------
export async function getSessions(dateFilter?: string): Promise<ClassSession[]> {
  const today = dateFilter || new Date().toISOString().split('T')[0];
  const sql = `
    SELECT 
      s.id, s.batch_id, b.name as batch_name, c.title as course_title,
      p.full_name as trainer_name, TO_CHAR(s.session_date, 'YYYY-MM-DD') as session_date,
      s.start_time, s.end_time,
      s.status, s.check_in_code, s.session_topic_notes,
      COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)::int as present_count,
      COUNT(DISTINCT be.id)::int as total_enrolled
    FROM public.class_sessions s
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.trainers t ON t.id = s.trainer_id
    JOIN public.profiles p ON p.id = t.profile_id
    LEFT JOIN public.batch_enrollments be ON be.batch_id = b.id AND be.status = 'active'
    LEFT JOIN public.attendance a ON a.session_id = s.id
    WHERE s.session_date = $1
    GROUP BY s.id, s.batch_id, b.name, c.title, p.full_name
    ORDER BY s.start_time;
  `;
  return query<ClassSession>(sql, [today]);
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

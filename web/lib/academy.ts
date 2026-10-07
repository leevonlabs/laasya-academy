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
  course_id: string;
  course_title: string;
  course_category?: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  room_or_hall: string;
  max_capacity?: number;
  enrolled_count?: number;
}

export interface Trainer {
  id: string;
  profile_id: string;
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
  course_id: string;
  course_title: string;
  course_category: string;
  monthly_fee: number;
  trainer_id: string;
  trainer_name: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  room_or_hall: string;
  enrollment_status: string;
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
  total_monthly_fee?: number;
  due_amount?: number;
  due_date?: string;
  due_status?: 'green' | 'yellow' | 'red';
  enrolled_batches_count?: number;
  attendance_rate?: number;
  enrolled_batches?: StudentEnrolledBatch[];
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
  room_or_hall?: string;
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

export async function getCourses(category?: string): Promise<Course[]> {
  let sql = `
    SELECT 
      c.id, c.title, c.code, COALESCE(c.category, '') as category, c.description, 
      c.duration_months, c.monthly_fee, c.is_active, c.image_url,
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
  return query<Course>(sql, params);
}

export async function createCourse(data: {
  title: string;
  code: string;
  category: string;
  description: string;
  duration_months: number;
  monthly_fee: number;
  image_url?: string;
}) {
  return queryOne<Course>(`
    INSERT INTO public.courses (title, code, category, description, duration_months, monthly_fee, is_active, image_url)
    VALUES ($1, $2, $3, $4, $5, $6, true, $7)
    RETURNING *;
  `, [data.title, data.code, data.category || '', data.description, data.duration_months, data.monthly_fee, data.image_url || null]);
}

export async function updateCourse(id: string, data: {
  title?: string;
  code?: string;
  category?: string;
  monthly_fee?: number;
  duration_months?: number;
  description?: string;
  is_active?: boolean;
  image_url?: string;
}) {
  return queryOne<Course>(`
    UPDATE public.courses
    SET title = COALESCE($2, title),
        code = COALESCE($3, code),
        category = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE category END,
        monthly_fee = COALESCE($5, monthly_fee),
        description = COALESCE($6, description),
        duration_months = COALESCE($7, duration_months),
        is_active = COALESCE($8, is_active),
        image_url = CASE WHEN $9::text IS NOT NULL THEN $9 ELSE image_url END,
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, 
    data.title, 
    data.code, 
    data.category !== undefined ? data.category : null, 
    data.monthly_fee,
    data.description, 
    data.duration_months, 
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
      t.id, t.profile_id, p.full_name, p.email, p.phone,
      COALESCE(t.alternate_phone, p.alternate_phone) as alternate_phone,
      COALESCE(t.avatar_url, p.avatar_url) as avatar_url,
      COALESCE(t.age, p.age)::int as age,
      COALESCE(t.gender, p.gender) as gender,
      t.specializations, t.display_title, t.bio, t.is_active, t.joined_date::text as joined_date,
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
            'course_id', b.course_id,
            'course_title', c.title,
            'course_category', c.category,
            'days_of_week', b.days_of_week,
            'start_time', b.start_time,
            'end_time', b.end_time,
            'room_or_hall', b.room_or_hall,
            'max_capacity', b.max_capacity,
            'enrolled_count', (SELECT COUNT(*)::int FROM public.batch_enrollments be WHERE be.batch_id = b.id AND be.status = 'active')
          )
        ) FILTER (WHERE b.id IS NOT NULL),
        '[]'::json
      ) as assigned_batches
    FROM public.trainers t
    JOIN public.profiles p ON p.id = t.profile_id
    LEFT JOIN public.batches b ON b.trainer_id = t.id
    LEFT JOIN public.courses c ON c.id = b.course_id
    GROUP BY t.id, t.profile_id, p.full_name, p.email, p.phone, t.alternate_phone, p.alternate_phone, t.avatar_url, p.avatar_url, t.age, p.age, t.gender, p.gender, t.specializations, t.display_title, t.bio, t.is_active, t.joined_date, t.monthly_salary
    ORDER BY p.full_name;
  `;
  return query<Trainer>(sql);
}

export async function createTrainer(data: {
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
  monthly_salary?: number;
  is_active?: boolean;
}) {
  const cleanEmail = (data.email && data.email.trim())
    ? data.email.toLowerCase().trim()
    : `${data.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guru'}@laasyaacademy.com`;
  const cleanPhone = data.phone?.trim() || '+91 8151 998 899';
  const cleanAlternatePhone = data.alternate_phone?.trim() || null;
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
    INSERT INTO public.trainers (profile_id, specializations, display_title, bio, is_active, monthly_salary, avatar_url, age, gender, alternate_phone)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `, [uid, data.specializations, displayTitle, bio, isActive, monthlySalary, data.avatar_url || null, age, gender, cleanAlternatePhone]);
}

export async function updateTrainer(id: string, data: {
  full_name?: string;
  display_title?: string;
  phone?: string;
  alternate_phone?: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  specializations?: string[];
  bio?: string;
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
    alternatePhone
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
    GROUP BY s.id, s.profile_id, s.roll_number, p.full_name, p.email, p.phone, s.avatar_url, p.avatar_url, s.age, p.age, s.date_of_birth, s.gender, p.gender, s.parent_name, s.parent_relation, s.parent_contact, s.address, s.status, s.enrollment_date, s.advance_paid
    ORDER BY 
      CASE WHEN s.roll_number ~ '^LCA-[0-9]+$' THEN CAST(SUBSTRING(s.roll_number FROM 5) AS INT) ELSE 999999 END ASC,
      p.full_name ASC;
  `;
  // Fetch students, batch enrollments, and fee invoice summaries concurrently
  const [students, enrollments, invoiceSummaries] = await Promise.all([
    query<Student>(sql),
    query<{
      student_id: string;
      batch_id: string;
      batch_name: string;
      course_id: string;
      course_title: string;
      course_category: string;
      monthly_fee: number;
      trainer_id: string;
      trainer_name: string;
      days_of_week: string[];
      start_time: string;
      end_time: string;
      room_or_hall: string;
      enrollment_status: string;
    }>(`
      SELECT 
        be.student_id,
        b.id as batch_id,
        b.name as batch_name,
        c.id as course_id,
        c.title as course_title,
        c.category as course_category,
        c.monthly_fee,
        t.id as trainer_id,
        tp.full_name as trainer_name,
        b.days_of_week,
        b.start_time,
        b.end_time,
        b.room_or_hall,
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
      enrollment_status: row.enrollment_status
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

  // Calculate current month's due date formatted as "dd and month name" (e.g. "30 Sep", "30 aug")
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const day = lastDay.getDate();
  const month = lastDay.toLocaleString('en-US', { month: 'short' });
  const currentMonthDueDate = `${day} ${month}`; // e.g. "30 Sep"

  for (const st of students) {
    st.enrolled_batches = enrollMap.get(st.id) || [];
    
    // Total Monthly Fee: sum of fees of all courses the student has joined
    const totalMonthly = st.enrolled_batches.reduce((sum, b) => sum + (Number(b.monthly_fee) || 0), 0);
    st.total_monthly_fee = totalMonthly;

    const advPaid = Number(st.advance_paid || 0);
    const invData = invoiceMap.get(st.id);

    // Due amount: total monthly amount to be paid (for current month) - advance that paid
    let rawDue = totalMonthly - advPaid;
    if (invData && invData.balance > totalMonthly) {
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
    } else if (rawDue > totalMonthly) {
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
  const dob = data.date_of_birth?.trim() || null;

  const student = await queryOne<Student>(`
    INSERT INTO public.students (
      profile_id, roll_number, parent_name, parent_relation,
      parent_contact, address, emergency_contact, status, enrollment_date, advance_paid, avatar_url, age, gender, date_of_birth
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, $11, $12, $13::date)
    ON CONFLICT (profile_id) DO UPDATE SET
      parent_name = EXCLUDED.parent_name,
      parent_relation = EXCLUDED.parent_relation,
      parent_contact = EXCLUDED.parent_contact,
      address = EXCLUDED.address,
      emergency_contact = EXCLUDED.emergency_contact,
      status = 'active',
      enrollment_date = EXCLUDED.enrollment_date,
      advance_paid = EXCLUDED.advance_paid,
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
    joiningDate,
    advancePaid,
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
  status?: 'active' | 'inactive' | 'suspended';
  batch_ids?: string[];
}) {
  const current = await queryOne<{ profile_id: string }>(
    `SELECT profile_id FROM public.students WHERE id = $1`,
    [id]
  );
  if (!current) throw new Error('Student not found');

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
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, data.parent_name, data.parent_relation, data.parent_contact, 
    data.address, data.status, data.joining_date, data.advance_paid,
    data.avatar_url !== undefined ? data.avatar_url : null,
    age !== undefined ? age : null,
    gender !== undefined ? gender : null,
    dob
  ]);

  // Update batch enrollments if batch_ids provided
  if (data.batch_ids) {
    await query(`DELETE FROM public.batch_enrollments WHERE student_id = $1`, [id]);
    for (const bId of data.batch_ids) {
      await query(`
        INSERT INTO public.batch_enrollments (batch_id, student_id, status)
        VALUES ($1, $2, 'active')
        ON CONFLICT (batch_id, student_id) DO UPDATE SET status = 'active';
      `, [bId, id]);
    }
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

export async function updateBatch(id: string, data: {
  name?: string;
  course_id?: string;
  trainer_id?: string;
  days_of_week?: string[];
  start_time?: string;
  end_time?: string;
  room_or_hall?: string;
  max_capacity?: number;
  is_active?: boolean;
}) {
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
        is_active = COALESCE($10, is_active),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, data.name, data.course_id, data.trainer_id, data.days_of_week,
    data.start_time, data.end_time, data.room_or_hall, data.max_capacity, data.is_active
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
  let sql = `
    SELECT 
      s.id, s.batch_id, b.name as batch_name, c.title as course_title,
      b.room_or_hall,
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
    WHERE 1=1
  `;
  const params: any[] = [];
  if (startDate && endDate) {
    sql += ` AND s.session_date >= $1 AND s.session_date <= $2`;
    params.push(startDate, endDate);
  } else if (dateFilter) {
    sql += ` AND s.session_date = $1`;
    params.push(dateFilter);
  } else {
    const today = new Date().toISOString().split('T')[0];
    sql += ` AND s.session_date = $1`;
    params.push(today);
  }

  if (roomFilter && roomFilter !== 'All' && roomFilter !== 'all' && roomFilter.trim() !== '') {
    params.push(roomFilter);
    sql += ` AND b.room_or_hall = $${params.length}`;
  }

  sql += `
    GROUP BY s.id, s.batch_id, b.name, c.title, b.room_or_hall, p.full_name
    ORDER BY s.session_date ASC, s.start_time ASC;
  `;
  return query<ClassSession>(sql, params);
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
    JOIN public.trainers t ON t.id = s.trainer_id
    JOIN public.profiles tp ON tp.id = t.profile_id
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

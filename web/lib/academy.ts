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

export async function updateCourse(id: string, data: {
  title?: string;
  code?: string;
  category?: string;
  monthly_fee?: number;
  duration_months?: number;
  description?: string;
  is_active?: boolean;
}) {
  return queryOne<Course>(`
    UPDATE public.courses
    SET title = COALESCE($2, title),
        code = COALESCE($3, code),
        category = COALESCE($4, category),
        monthly_fee = COALESCE($5, monthly_fee),
        description = COALESCE($6, description),
        duration_months = COALESCE($7, duration_months),
        is_active = COALESCE($8, is_active),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, data.title, data.code, data.category, data.monthly_fee,
    data.description, data.duration_months, data.is_active
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
    GROUP BY s.id, s.profile_id, s.roll_number, p.full_name, p.email, p.phone, s.parent_name, s.parent_relation, s.parent_contact, s.address, s.status, s.enrollment_date, s.advance_paid
    ORDER BY 
      CASE WHEN s.roll_number ~ '^LCA-[0-9]+$' THEN CAST(SUBSTRING(s.roll_number FROM 5) AS INT) ELSE 999999 END ASC,
      p.full_name ASC;
  `;
  const students = await query<Student>(sql);

  // Fetch all active batch enrollments with batch & course & trainer info
  const enrollments = await query<{
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
  `);

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

  // Fetch fee invoices summary per student
  const invoiceSummaries = await query<{
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
  `);
  const invoiceMap = new Map<string, { balance: number; hasOverdue: boolean; earliestDueDate: string }>();
  for (const inv of invoiceSummaries) {
    invoiceMap.set(inv.student_id, {
      balance: parseFloat(inv.invoice_balance || '0'),
      hasOverdue: inv.has_overdue === 1,
      earliestDueDate: inv.earliest_due_date
    });
  }

  // Calculate current month's due date in MM/YY format (e.g. 09/26)
  const now = new Date();
  const currentMonthDueDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;

  for (const st of students) {
    st.enrolled_batches = enrollMap.get(st.id) || [];
    
    // Total Monthly Fee: sum of fees of all courses the student has joined
    const totalMonthly = st.enrolled_batches.reduce((sum, b) => sum + (Number(b.monthly_fee) || 0), 0);
    st.total_monthly_fee = totalMonthly;

    const advPaid = Number(st.advance_paid || 0);
    const invData = invoiceMap.get(st.id);

    let rawDue = 0;
    let isOverdue = false;

    if (invData) {
      rawDue = Math.max(0, invData.balance - advPaid);
      isOverdue = invData.hasOverdue || (invData.balance > totalMonthly);
    } else {
      // If no invoices generated yet, current month's fee is pending
      rawDue = Math.max(0, totalMonthly - advPaid);
    }

    st.due_amount = rawDue;
    st.due_date = currentMonthDueDate;

    // Color indicator logic:
    // Green: Zero or negative due amount (fully paid or advance payment)
    // Yellow: Current month's fee is pending and payable by month-end
    // Red: Fee remains unpaid for more than one month
    if (rawDue <= 0) {
      st.due_status = 'green';
    } else if (rawDue > totalMonthly || isOverdue) {
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

  await query(`
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES ($1, $2, $3, $4, 'student')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
  `, [uid, data.full_name, cleanEmail, data.phone]);

  const joiningDate = data.joining_date || new Date().toISOString().split('T')[0];
  const advancePaid = Number(data.advance_paid || 0);

  const student = await queryOne<Student>(`
    INSERT INTO public.students (
      profile_id, roll_number, parent_name, parent_relation,
      parent_contact, address, emergency_contact, status, enrollment_date, advance_paid
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9)
    ON CONFLICT (profile_id) DO UPDATE SET
      parent_name = EXCLUDED.parent_name,
      parent_relation = EXCLUDED.parent_relation,
      parent_contact = EXCLUDED.parent_contact,
      address = EXCLUDED.address,
      emergency_contact = EXCLUDED.emergency_contact,
      status = 'active',
      enrollment_date = EXCLUDED.enrollment_date,
      advance_paid = EXCLUDED.advance_paid
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
    advancePaid
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
    advance_paid: advancePaid
  };
}

export async function updateStudent(id: string, data: {
  full_name?: string;
  email?: string;
  phone?: string;
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

  if (data.full_name || data.email || data.phone) {
    await query(`
      UPDATE public.profiles
      SET full_name = COALESCE($2, full_name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          updated_at = now()
      WHERE id = $1;
    `, [current.profile_id, data.full_name, data.email, data.phone]);
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
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, data.parent_name, data.parent_relation, data.parent_contact, 
    data.address, data.status, data.joining_date, data.advance_paid
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

  const prof = await queryOne<{ full_name: string; email: string; phone: string }>(
    `SELECT full_name, email, phone FROM public.profiles WHERE id = $1`,
    [current.profile_id]
  );

  return {
    ...updated,
    full_name: prof?.full_name || data.full_name,
    email: prof?.email || data.email,
    phone: prof?.phone || data.phone
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
  status: 'present' | 'absent' | 'late' | 'excused';
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

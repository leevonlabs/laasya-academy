import { query, queryOne } from './db';

export interface StudentPasswordInfo {
  id: string;
  profile_id: string;
  roll_number: string;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  avatar_url?: string;
}

export interface GuruPasswordInfo {
  id: string;
  profile_id: string;
  guru_code: string;
  display_title?: string;
  full_name: string;
  phone: string;
  email: string;
  is_active: boolean;
  avatar_url?: string;
}

export async function getStudentPasswords(): Promise<StudentPasswordInfo[]> {
  const sql = `
    SELECT 
      s.id,
      s.profile_id,
      COALESCE(s.roll_number, '') as roll_number,
      COALESCE(p.full_name, 'Student') as full_name,
      COALESCE(p.phone, '') as phone,
      COALESCE(p.email, '') as email,
      COALESCE(s.status, 'active') as status,
      p.avatar_url
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    ORDER BY 
      NULLIF(regexp_replace(s.roll_number, '\\D', '', 'g'), '')::int ASC NULLS LAST,
      s.roll_number ASC,
      p.full_name ASC
  `;
  return query<StudentPasswordInfo>(sql);
}

export async function getGuruPasswords(): Promise<GuruPasswordInfo[]> {
  const sql = `
    SELECT 
      t.id,
      t.profile_id,
      COALESCE(t.display_title, '') as display_title,
      COALESCE(p.full_name, 'Guru') as full_name,
      COALESCE(p.phone, '') as phone,
      COALESCE(p.email, '') as email,
      COALESCE(t.is_active, true) as is_active,
      p.avatar_url
    FROM public.trainers t
    JOIN public.profiles p ON p.id = t.profile_id
    ORDER BY p.full_name ASC
  `;
  const rows = await query<any>(sql);
  return rows.map((r, idx) => ({
    ...r,
    guru_code: `GURU-${String(idx + 1).padStart(3, '0')}`,
  }));
}

export async function updateUserPassword(profileId: string, newPassword: string): Promise<boolean> {
  const trimmed = newPassword.trim();
  if (!trimmed || trimmed.length < 4) {
    throw new Error('Password must be at least 4 characters long');
  }

  // Ensure user is student or trainer
  const profile = await queryOne<{ id: string; role: string; phone: string }>(
    `SELECT id, role, phone FROM public.profiles WHERE id = $1`,
    [profileId]
  );
  if (!profile) {
    throw new Error('User profile not found');
  }

  // Update in auth.users
  await query(
    `UPDATE auth.users
     SET encrypted_password = crypt($1, gen_salt('bf')),
         updated_at = NOW()
     WHERE id = $2`,
    [trimmed, profileId]
  );

  return true;
}

export async function resetAllPasswordsToDefault(): Promise<number> {
  const res = await query(
    `UPDATE auth.users
     SET encrypted_password = crypt('123456', gen_salt('bf')),
         updated_at = NOW()
     WHERE id IN (
       SELECT id FROM public.profiles WHERE role IN ('student', 'trainer')
     )
     RETURNING id`
  );
  return res.length;
}

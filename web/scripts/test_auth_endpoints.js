const { Pool } = require('pg');
const crypto = require('crypto');

const MUMBAI_URL = 'postgresql://postgres.kumbtvmjpmjtmoefddux:Laasya%4024530@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const pool = new Pool({ connectionString: MUMBAI_URL });

async function testAuth() {
  console.log('--- 1. Testing Director / Admin Accounts in DB ---');
  const directors = await pool.query(`
    SELECT p.id, p.full_name, p.phone, p.email, p.role, u.encrypted_password IS NOT NULL as has_password
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.role IN ('owner', 'admin', 'receptionist')
  `);
  console.log('Directors / Receptionists in DB:');
  console.table(directors.rows);

  console.log('\n--- 2. Testing Guru / Faculty Accounts in DB ---');
  const gurus = await pool.query(`
    SELECT t.id, t.guru_id, p.full_name, p.phone, u.encrypted_password IS NOT NULL as has_password
    FROM trainers t
    JOIN profiles p ON t.profile_id = p.id
    LEFT JOIN auth.users u ON u.id = p.id
    LIMIT 3
  `);
  console.log('Sample Gurus:');
  console.table(gurus.rows);

  console.log('\n--- 3. Testing Student Accounts in DB ---');
  const students = await pool.query(`
    SELECT s.id, s.roll_number, p.full_name, p.phone, s.parent_contact, u.encrypted_password IS NOT NULL as has_password
    FROM students s
    JOIN profiles p ON s.profile_id = p.id
    LEFT JOIN auth.users u ON u.id = p.id
    LIMIT 3
  `);
  console.log('Sample Students:');
  console.table(students.rows);

  await pool.end();
}

testAuth().catch(console.error);

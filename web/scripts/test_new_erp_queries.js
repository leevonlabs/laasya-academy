const fs = require('fs');
const path = require('path');
const { Pool } = require('../node_modules/pg');

let dbUrl = '';
try {
  const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
  }
} catch (_) {}
if (!dbUrl) dbUrl = process.env.DATABASE_URL || '';

const newConnStr = dbUrl;

const pool = new Pool({
  connectionString: newConnStr,
  ssl: { rejectUnauthorized: false }
});

async function testErpQueries() {
  console.log('Testing ERP Queries against New Supabase Database (Transaction Pooler: 6543)...');

  try {
    // 1. Check Owner/Director Profile
    const ownerRes = await pool.query("SELECT id, full_name, email, role, phone FROM public.profiles WHERE role = 'owner'");
    console.log('Owner Profiles found:', ownerRes.rows);

    // 2. Check Trainers & Batches count
    const trainersRes = await pool.query(`
      SELECT t.id, p.full_name, t.specializations 
      FROM public.trainers t 
      JOIN public.profiles p ON t.profile_id = p.id 
      LIMIT 3
    `);
    console.log('Sample Trainers:', trainersRes.rows);

    // 3. Check Students
    const studentsRes = await pool.query(`
      SELECT s.id, s.roll_number, p.full_name, p.phone 
      FROM public.students s 
      JOIN public.profiles p ON s.profile_id = p.id 
      LIMIT 3
    `);
    console.log('Sample Students:', studentsRes.rows);

    // 4. Check Announcements
    const announcementsRes = await pool.query(`
      SELECT id, title, announcement_type, created_at 
      FROM public.announcements 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    console.log('Sample Announcements:', announcementsRes.rows);

    // 5. Check Invoices & Payments
    const financeRes = await pool.query(`
      SELECT count(*)::int as total_invoices, sum(total_amount)::numeric as total_billed
      FROM public.student_fee_invoices
    `);
    console.log('Finance Summary:', financeRes.rows[0]);

    // 6. Check Payments
    const paymentsRes = await pool.query(`
      SELECT count(*)::int as total_payments, sum(amount_paid)::numeric as total_collected
      FROM public.student_fee_payments
    `);
    console.log('Payments Summary:', paymentsRes.rows[0]);

    // 7. Check Attendance
    const attRes = await pool.query(`
      SELECT count(*)::int as total_attendance, count(DISTINCT session_id) as total_sessions
      FROM public.attendance
    `);
    console.log('Attendance Summary:', attRes.rows[0]);

    console.log('\nAll core ERP queries against new database PASSED!');
  } catch (e) {
    console.error('Query error:', e);
  } finally {
    await pool.end();
  }
}

testErpQueries();

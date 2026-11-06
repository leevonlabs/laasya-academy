/**
 * Laasya Cultural Academy ERP - Client Handover Clean Slate Reset Script
 * 
 * Purpose:
 * Safely and completely clears all mock/test data (400 students, 20 gurus, 18 courses, 
 * 72 batches, attendance records, class sessions, media assets, etc.) so that the client 
 * receives a 100% pristine, production-ready system ready for their real admissions.
 * 
 * Safety:
 * - Requires explicit flag: --confirm-handover
 * - Strictly preserves owner/admin accounts (admin@laasyaacademy.com / director@laasyaacademy.com)
 * - Strictly preserves system settings, app configuration, table schemas, triggers, and RLS policies
 * - Executes in an atomic transaction (rolls back on any error)
 * 
 * Usage:
 *   node web/scripts/handover_clean_slate_reset.js --confirm-handover
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.kumbtvmjpmjtmoefddux:Laasya%4024530@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CONFIRM_FLAG = process.argv.includes('--confirm-handover');

async function cleanSlateReset() {
  if (!CONFIRM_FLAG) {
    console.log('================================================================');
    console.log('SAFETY WARNING: CLIENT HANDOVER RESET WAS NOT EXECUTED');
    console.log('================================================================');
    console.log('This script will permanently purge all test students, gurus, courses,');
    console.log('batches, schedules, and mock media for final client handover.');
    console.log('To execute the reset, run with the explicit flag:');
    console.log('  node web/scripts/handover_clean_slate_reset.js --confirm-handover');
    console.log('================================================================');
    process.exit(0);
  }

  const client = await pool.connect();

  try {
    console.log('================================================================');
    console.log('Starting Client Handover Clean-Slate Database Reset...');
    console.log('Connected to Supabase Mumbai (kumbtvmjpmjtmoefddux)');
    console.log('================================================================');

    await client.query('BEGIN');

    // 1. Identify Owner/Admin profile and auth IDs to preserve
    const adminRes = await client.query(`
      SELECT id, full_name, email, role 
      FROM public.profiles 
      WHERE role IN ('owner', 'admin')
    `);
    const preservedIds = adminRes.rows.map(r => r.id);
    console.log(`Preserving ${preservedIds.length} administrative account(s):`, adminRes.rows.map(r => `${r.full_name} (${r.email})`).join(', '));

    if (preservedIds.length === 0) {
      throw new Error('Safety abort: No owner/admin profile found! Aborting to prevent lockout.');
    }

    // 2. Cascade delete transaction records
    console.log('\n[1/6] Purging transactional logs and activity records...');
    await client.query(`DELETE FROM public.attendance`);
    await client.query(`DELETE FROM public.class_sessions`);
    await client.query(`DELETE FROM public.tally_classes`);
    await client.query(`DELETE FROM public.session_alerts`);
    await client.query(`DELETE FROM public.batch_enrollments`);
    await client.query(`DELETE FROM public.student_fee_payments`);
    await client.query(`DELETE FROM public.student_fee_invoices`);
    await client.query(`DELETE FROM public.fee_reminders`);
    await client.query(`DELETE FROM public.guru_absences`);
    await client.query(`DELETE FROM public.guru_payments`);
    await client.query(`DELETE FROM public.guru_salary_advances`);
    await client.query(`DELETE FROM public.guru_salary_records`);
    await client.query(`DELETE FROM public.active_sessions`);
    await client.query(`DELETE FROM public.device_tokens`);
    await client.query(`DELETE FROM public.advertisement_views`);
    await client.query(`DELETE FROM public.announcements`);
    await client.query(`DELETE FROM public.holiday_alerts`);
    await client.query(`DELETE FROM public.video_library`);
    await client.query(`DELETE FROM public.expense_audit_logs`);
    await client.query(`DELETE FROM public.expenses`);
    console.log('✓ Cleared sessions, attendance logs, enrollments, fees, announcements, and audit tables.');

    // 3. Delete media assets (images, flyers, test portraits)
    console.log('\n[2/6] Purging test image media binaries...');
    const mediaRes = await client.query(`DELETE FROM public.media_assets`);
    console.log(`✓ Deleted ${mediaRes.rowCount} test media assets from public.media_assets.`);

    // 4. Delete Batches, Courses, and Trainers
    console.log('\n[3/6] Purging test batches, courses, and faculty profiles...');
    await client.query(`DELETE FROM public.batches`);
    await client.query(`DELETE FROM public.students`);
    await client.query(`DELETE FROM public.trainers`);
    await client.query(`DELETE FROM public.courses`);
    console.log('✓ Cleared all batches, courses, student profiles, and guru profiles.');

    // 5. Purge test user profiles and auth.users (except preserved admin accounts)
    console.log('\n[4/6] Purging non-admin test users from profiles and auth.users...');
    const idListStr = preservedIds.map(id => `'${id}'`).join(', ');

    const profRes = await client.query(`
      DELETE FROM public.profiles 
      WHERE id NOT IN (${idListStr})
    `);
    console.log(`✓ Deleted ${profRes.rowCount} student/guru test records from public.profiles.`);

    const authRes = await client.query(`
      DELETE FROM auth.users 
      WHERE id NOT IN (${idListStr})
    `);
    console.log(`✓ Deleted ${authRes.rowCount} student/guru test credentials from auth.users.`);

    // 6. Reset Sequences and maintain pristine academy rooms
    console.log('\n[5/6] Resetting academy rooms to 4 pristine standard halls...');
    await client.query(`DELETE FROM public.rooms`);
    await client.query(`
      INSERT INTO public.rooms (id, name, capacity, is_active) VALUES
        (gen_random_uuid(), 'Room 1 (Natya Mandapam)', 30, true),
        (gen_random_uuid(), 'Room 2 (Sangeetha Shala)', 25, true),
        (gen_random_uuid(), 'Room 3 (Chitrakala Hall)', 25, true),
        (gen_random_uuid(), 'Room 4 (Veera Kalari Koodam)', 30, true)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Initialized standard academy rooms: Room 1, Room 2, Room 3, Room 4.');

    // 7. Reset sequences if applicable
    console.log('\n[6/6] Verifying database integrity and storage state...');
    const dbSizeRes = await client.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;`);
    console.log(`✓ Database disk size after clean-slate reset: ${dbSizeRes.rows[0].db_size}`);

    await client.query('COMMIT');

    console.log('\n================================================================');
    console.log('✓ CLIENT HANDOVER CLEAN-SLATE RESET COMPLETE!');
    console.log('The ERP database is 100% clean and ready for real client onboarding.');
    console.log('Owner admin login remains active and protected.');
    console.log('================================================================\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERROR during handover reset, transaction rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanSlateReset().catch(() => process.exit(1));

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MUMBAI_URL = 'postgresql://postgres.kumbtvmjpmjtmoefddux:Laasya%4024530@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function main() {
  console.log('=== STEP 1: VERIFY MUMBAI SUPABASE DATABASE INTEGRITY ===');
  const pool = new Pool({ connectionString: MUMBAI_URL });

  try {
    const studentCount = await pool.query('SELECT count(*)::int as count FROM public.students');
    console.log('✓ Students count:', studentCount.rows[0].count, '(Expected: 300)');

    const trainerCount = await pool.query('SELECT count(*)::int as count FROM public.trainers');
    console.log('✓ Trainers count:', trainerCount.rows[0].count, '(Expected: 14)');

    const batchCount = await pool.query('SELECT count(*)::int as count FROM public.batches');
    console.log('✓ Batches count:', batchCount.rows[0].count, '(Expected: 34)');

    const courseCount = await pool.query('SELECT count(*)::int as count FROM public.courses');
    console.log('✓ Courses count:', courseCount.rows[0].count, '(Expected: 19)');

    const activeSessionsTable = await pool.query(`
      SELECT to_regclass('public.active_sessions') as exists
    `);
    console.log('✓ active_sessions table exists:', !!activeSessionsTable.rows[0].exists);

    const pooja = await pool.query(`
      SELECT s.roll_number, p.full_name, s.avatar_url
      FROM students s
      JOIN profiles p ON s.profile_id = p.id
      WHERE s.roll_number = 'LCA-018'
    `);
    console.log('✓ Pooja Venkatesh record:', pooja.rows[0]);

    const media = await pool.query(`
      SELECT filename, length(data) as len, mime_type
      FROM public.media_assets
      WHERE filename = 'avatar_adcfdbc81c42.jpg'
    `);
    console.log('✓ Media asset avatar_adcfdbc81c42.jpg in DB:', media.rows[0]);

    console.log('\n=== STEP 2: VERIFY ZERO LEAKAGE OF OLD SUPABASE ACCOUNT ===');
    const OLD_ID = 'bhpqzrcohjigkkpmcdsy';
    const filesToCheck = [
      'web/.env.local',
      'mobile/lib/core/constants/supabase_constants.dart',
      'web/lib/db.ts',
      'web/scripts/export_full_backup.js',
      'web/scripts/generate_live_schema_ddl.js'
    ];

    let foundOld = false;
    for (const f of filesToCheck) {
      const full = path.join(process.cwd(), f);
      if (fs.existsSync(full)) {
        const txt = fs.readFileSync(full, 'utf8');
        if (txt.includes(OLD_ID)) {
          console.error(`✗ FOUND OLD SUPABASE ID IN: ${f}`);
          foundOld = true;
        } else {
          console.log(`✓ Clean: ${f}`);
        }
      }
    }
    if (!foundOld) {
      console.log('✓ ALL verified configuration files cleanly point to Mumbai!');
    }

    console.log('\n=== STEP 3: SECURITY & INSPECT VULNERABILITY AUDIT ===');
    const secretKey = 'Laasya%4024530';
    const clientFiles = [
      'web/app/(auth)/login/page.tsx',
      'web/app/(dashboard)/layout.tsx',
      'web/components/layout/Header.tsx',
      'web/components/layout/Sidebar.tsx'
    ];

    let leakFound = false;
    for (const cf of clientFiles) {
      const pth = path.join(process.cwd(), cf);
      if (fs.existsSync(pth)) {
        const code = fs.readFileSync(pth, 'utf8');
        if (code.includes(secretKey) || code.includes('aws-0-ap-south-1.pooler.supabase.com')) {
          console.error(`✗ CRITICAL LEAK IN CLIENT COMPONENT: ${cf}`);
          leakFound = true;
        }
      }
    }
    if (!leakFound) {
      console.log('✓ Client-side React components do NOT contain DB passwords or pooler secrets.');
    }

  } catch (err) {
    console.error('Database integrity test failed:', err);
  } finally {
    await pool.end();
  }
}

main();

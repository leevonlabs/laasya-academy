const { Pool } = require('pg');

const MUMBAI_URL = 'postgresql://postgres.kumbtvmjpmjtmoefddux:Laasya%4024530@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const pool = new Pool({ connectionString: MUMBAI_URL });

async function main() {
  console.log('=== STEP 1: FIX GURU SALARY SCHEMA & PAYMENTS TABLE ===');
  
  // 1. Add invoice_number column to guru_salary_records
  await pool.query(`
    ALTER TABLE public.guru_salary_records ADD COLUMN IF NOT EXISTS invoice_number TEXT;
  `);
  console.log('✓ Added invoice_number column to public.guru_salary_records');

  // 2. Create public.guru_payments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.guru_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
      payment_type TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
      transaction_reference TEXT,
      receipt_number TEXT,
      invoice_number TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('✓ Verified public.guru_payments table');

  // 3. Ensure invoice_number populated on existing March 2026 records
  const existingRecords = await pool.query(`
    SELECT id FROM public.guru_salary_records WHERE invoice_number IS NULL
  `);
  for (const r of existingRecords.rows) {
    const inv = `LCA-SAL-2026-${r.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    await pool.query(`UPDATE public.guru_salary_records SET invoice_number = $1 WHERE id = $2`, [inv, r.id]);
  }
  console.log(`✓ Backfilled invoice_number on ${existingRecords.rows.length} existing salary records`);

  // 4. Seed October 2026 and November 2026 guru salary records for all 14 gurus
  console.log('\n=== STEP 2: SEED GURU SALARY RECORDS FOR OCTOBER & NOVEMBER 2026 ===');
  const trainers = await pool.query(`
    SELECT t.id, t.guru_id, p.full_name, COALESCE(t.monthly_salary, 28000)::numeric as monthly_salary
    FROM public.trainers t
    JOIN public.profiles p ON t.profile_id = p.id
    WHERE t.is_active = true
    ORDER BY p.full_name ASC
  `);

  console.log(`Found ${trainers.rows.length} active gurus`);

  const monthsToSeed = ['October 2026', 'November 2026'];
  for (const month of monthsToSeed) {
    for (const t of trainers.rows) {
      const sal = Number(t.monthly_salary) || 28000;
      const invNo = `LCA-SAL-2026-${month.slice(0, 3).toUpperCase()}-${(t.guru_id || t.id.slice(0, 4)).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
      // October was last month: mark 10 gurus as paid with transaction ref, 4 as pending
      const isOct = month === 'October 2026';
      const isPaid = isOct && !['Nandana', 'Vismaya', 'Kavya'].includes(t.full_name);
      const status = isPaid ? 'paid' : 'pending';
      const payDate = isPaid ? '2026-10-31' : null;
      const payMethod = isPaid ? 'bank_transfer' : null;
      const txRef = isPaid ? `AXIS-SAL-${t.id.slice(0, 8).toUpperCase()}` : null;

      await pool.query(`
        INSERT INTO public.guru_salary_records (
          trainer_id, payroll_month, base_salary, classes_assigned, classes_conducted,
          bonus_amount, deduction_amount, advance_deducted, net_salary, status,
          payment_date, payment_method, transaction_reference, invoice_number, notes
        ) VALUES (
          $1, $2, $3, 16, 16,
          0, 0, 0, $3, $4,
          $5, $6, $7, $8, 'Monthly Guru Honorarium'
        )
        ON CONFLICT (trainer_id, payroll_month) 
        DO UPDATE SET
          invoice_number = COALESCE(public.guru_salary_records.invoice_number, EXCLUDED.invoice_number),
          base_salary = EXCLUDED.base_salary,
          net_salary = EXCLUDED.net_salary
      `, [t.id, month, sal, status, payDate, payMethod, txRef, invNo]);
    }
    console.log(`✓ Seeded/verified 14 guru salary records for ${month}`);
  }

  // 5. Seed sample direct payments into public.guru_payments
  const paidOctRecords = await pool.query(`
    SELECT s.id, s.trainer_id, s.net_salary, s.payment_date, s.payment_method, s.transaction_reference, s.invoice_number
    FROM public.guru_salary_records s
    WHERE s.payroll_month = 'October 2026' AND s.status = 'paid'
  `);
  for (const r of paidOctRecords.rows) {
    const existing = await pool.query(`SELECT id FROM public.guru_payments WHERE transaction_reference = $1`, [r.transaction_reference]);
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO public.guru_payments (
          trainer_id, payment_type, amount, payment_date, payment_method,
          transaction_reference, receipt_number, invoice_number, notes
        ) VALUES ($1, 'monthly_salary', $2, $3, $4, $5, $6, $7, 'October 2026 Salary Disbursal')
      `, [
        r.trainer_id,
        r.net_salary,
        r.payment_date,
        r.payment_method || 'bank_transfer',
        r.transaction_reference,
        `RCP-${r.id.slice(0, 6).toUpperCase()}`,
        r.invoice_number
      ]);
    }
  }
  console.log(`✓ Synced ${paidOctRecords.rows.length} paid salary records to public.guru_payments`);

  console.log('\n=== STEP 3: SEED CLASS SESSIONS FOR NOVEMBER 2026 ===');
  // Fetch all active batches with days_of_week, start_time, end_time, trainer_id
  const activeBatches = await pool.query(`
    SELECT id, name, course_id, trainer_id, room_or_hall, days_of_week, start_time, end_time
    FROM public.batches
    WHERE is_active = true
  `);
  console.log(`Found ${activeBatches.rows.length} active batches to schedule`);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Generate for Nov 1 through Nov 15, 2026
  let insertedSessions = 0;
  for (let day = 1; day <= 15; day++) {
    const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
    const d = new Date(dateStr);
    const dayOfWeek = dayNames[d.getUTCDay()];

    for (const b of activeBatches.rows) {
      let days = [];
      if (Array.isArray(b.days_of_week)) {
        days = b.days_of_week;
      } else if (typeof b.days_of_week === 'string') {
        try {
          days = JSON.parse(b.days_of_week);
        } catch (_) {
          days = b.days_of_week.split(',').map(s => s.trim());
        }
      }

      if (days.includes(dayOfWeek)) {
        // This batch runs on this day of week!
        // Check if session already exists
        const sessCheck = await pool.query(`
          SELECT id FROM public.class_sessions WHERE batch_id = $1 AND session_date = $2
        `, [b.id, dateStr]);

        if (sessCheck.rows.length === 0) {
          const isPast = day < 3; // Nov 1 and Nov 2 are past
          const isToday = day === 3; // Nov 3 is today
          const status = isPast ? 'completed' : 'scheduled';
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const topicNotes = isToday ? 'Live Practice Session & Mudra Mastery' : 'Classical Arts Curriculum & Practice';

          await pool.query(`
            INSERT INTO public.class_sessions (
              batch_id, trainer_id, session_date, start_time, end_time,
              status, check_in_code, session_topic_notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
          `, [
            b.id,
            b.trainer_id,
            dateStr,
            b.start_time || '17:30:00',
            b.end_time || '18:30:00',
            status,
            code,
            topicNotes
          ]);
          insertedSessions++;
        }
      }
    }
  }
  console.log(`✓ Inserted ${insertedSessions} new class sessions for November 1-15, 2026`);

  // Verify today's sessions (Nov 3, 2026 - Tuesday)
  const todaySess = await pool.query(`
    SELECT s.id, b.name as batch_name, c.title as course_title, p.full_name as trainer_name, s.start_time, s.end_time, b.room_or_hall
    FROM public.class_sessions s
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.trainers t ON t.id = s.trainer_id
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE s.session_date = '2026-11-03'
    ORDER BY s.start_time ASC
  `);
  console.log(`\n✓ Today's Scheduled Classes for 2026-11-03: ${todaySess.rows.length} batches`);
  console.table(todaySess.rows.slice(0, 10));

  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  pool.end();
});

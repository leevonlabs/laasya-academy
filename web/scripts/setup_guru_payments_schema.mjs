import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Setting up public.guru_payments table...');
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
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  console.log('public.guru_payments table created / verified successfully.');

  // If there are existing records in guru_salary_advances, migrate them to guru_payments if not already there
  const advances = await pool.query(`
    SELECT * FROM public.guru_salary_advances;
  `);

  console.log(`Found ${advances.rows.length} existing advances. Checking migration...`);
  for (const a of advances.rows) {
    const existing = await pool.query(
      `SELECT id FROM public.guru_payments WHERE transaction_reference = $1`,
      [a.transaction_ref || a.id]
    );
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO public.guru_payments (
          trainer_id, payment_type, amount, payment_date, payment_method,
          transaction_reference, receipt_number, notes, created_at
        ) VALUES ($1, 'salary_advance', $2, $3, $4, $5, $6, $7, $8)
      `, [
        a.trainer_id,
        a.amount,
        a.disbursement_date || a.request_date || new Date().toISOString().split('T')[0],
        a.payment_method || 'bank_transfer',
        a.transaction_ref || `ADV-${a.id.slice(0, 8)}`,
        `RCP-${a.id.slice(0, 8).toUpperCase()}`,
        a.reason || 'Salary Advance',
        a.created_at || new Date()
      ]);
    }
  }

  console.log('Migration check complete!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  pool.end();
  process.exit(1);
});

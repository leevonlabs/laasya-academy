import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Ensuring invoice_number columns...');
  await pool.query(`
    ALTER TABLE public.guru_payments ADD COLUMN IF NOT EXISTS invoice_number TEXT;
    ALTER TABLE public.guru_salary_records ADD COLUMN IF NOT EXISTS invoice_number TEXT;
  `);

  // Backfill invoice_number on guru_payments if missing
  const gpRows = await pool.query(`SELECT id, created_at FROM public.guru_payments WHERE invoice_number IS NULL`);
  for (const row of gpRows.rows) {
    const inv = `LCA-PAY-2026-${row.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    await pool.query(`UPDATE public.guru_payments SET invoice_number = $1 WHERE id = $2`, [inv, row.id]);
  }

  // Backfill invoice_number on guru_salary_records if missing
  const srRows = await pool.query(`SELECT id, created_at FROM public.guru_salary_records WHERE invoice_number IS NULL`);
  for (const row of srRows.rows) {
    const inv = `LCA-SAL-2026-${row.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    await pool.query(`UPDATE public.guru_salary_records SET invoice_number = $1 WHERE id = $2`, [inv, row.id]);
  }

  console.log('Invoice number columns and backfill completed successfully!');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});

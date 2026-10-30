import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Renumbering guru_salary_records to LCA-SAL-2026-1, 2, ...');
  const res1 = await pool.query('SELECT id FROM public.guru_salary_records ORDER BY created_at ASC');
  for (let i = 0; i < res1.rows.length; i++) {
    const inv = `LCA-SAL-2026-${i + 1}`;
    await pool.query('UPDATE public.guru_salary_records SET invoice_number = $1 WHERE id = $2', [inv, res1.rows[i].id]);
  }
  console.log(`Renumbered ${res1.rows.length} salary records.`);

  console.log('Renumbering guru_payments to LCA-PAY-2026-1, 2, ...');
  const res2 = await pool.query('SELECT id FROM public.guru_payments ORDER BY created_at ASC');
  for (let i = 0; i < res2.rows.length; i++) {
    const inv = `LCA-PAY-2026-${i + 1}`;
    await pool.query('UPDATE public.guru_payments SET invoice_number = $1 WHERE id = $2', [inv, res2.rows[i].id]);
  }
  console.log(`Renumbered ${res2.rows.length} direct payments.`);

  const samples = await pool.query('SELECT id, invoice_number FROM public.guru_salary_records ORDER BY created_at ASC LIMIT 5');
  console.log('Sample Salary Invoices:', samples.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});

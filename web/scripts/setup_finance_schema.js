const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Connecting to database...');
  
  // 1. Check existing tables
  const existing = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `);
  console.log('Existing tables:', existing.rows.map(r => r.table_name));

  // 2. Create student fee invoices table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.student_fee_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
      course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
      batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      fee_period TEXT NOT NULL,
      due_date DATE NOT NULL,
      total_amount NUMERIC(10, 2) NOT NULL,
      discount_amount NUMERIC(10, 2) DEFAULT 0,
      paid_amount NUMERIC(10, 2) DEFAULT 0,
      balance_amount NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
      last_reminder_sent_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('Created or verified public.student_fee_invoices');

  // 3. Create student fee payments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.student_fee_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL REFERENCES public.student_fee_invoices(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
      receipt_number TEXT UNIQUE NOT NULL,
      amount_paid NUMERIC(10, 2) NOT NULL,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'cash', 'bank_transfer', 'card', 'cheque')),
      transaction_reference TEXT,
      receipt_issued_by TEXT DEFAULT 'Director / Academy Office',
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('Created or verified public.student_fee_payments');

  // 4. Create fee reminders log table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.fee_reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL REFERENCES public.student_fee_invoices(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'call')),
      sent_to TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('Created or verified public.fee_reminders');

  // 5. Create guru salary records table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.guru_salary_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
      payroll_month TEXT NOT NULL, -- e.g. "March 2026" or "2026-03"
      base_salary NUMERIC(10, 2) NOT NULL,
      classes_assigned INT DEFAULT 0,
      classes_conducted INT DEFAULT 0,
      bonus_amount NUMERIC(10, 2) DEFAULT 0,
      bonus_reason TEXT,
      deduction_amount NUMERIC(10, 2) DEFAULT 0,
      deduction_reason TEXT,
      advance_deducted NUMERIC(10, 2) DEFAULT 0,
      net_salary NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'processing')),
      payment_date DATE,
      payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'upi', 'cash', 'cheque')),
      transaction_reference TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(trainer_id, payroll_month)
    );
  `);
  console.log('Created or verified public.guru_salary_records');

  // 6. Create guru salary advances table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.guru_salary_advances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_id UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
      amount NUMERIC(10, 2) NOT NULL,
      request_date DATE NOT NULL DEFAULT CURRENT_DATE,
      disbursement_date DATE,
      status TEXT NOT NULL CHECK (status IN ('approved', 'disbursed', 'partially_settled', 'settled')),
      recovered_amount NUMERIC(10, 2) DEFAULT 0,
      remaining_balance NUMERIC(10, 2) NOT NULL,
      reason TEXT,
      payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'upi', 'cash')),
      transaction_ref TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('Created or verified public.guru_salary_advances');

  await pool.end();
  console.log('Finance schema setup complete!');
}

main().catch(err => {
  console.error('Schema error:', err);
  pool.end();
  process.exit(1);
});

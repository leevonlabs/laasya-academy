const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function setupTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Expense Categories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.expense_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        is_custom BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Standard Categories
    const defaultCategories = [
      'Rent',
      'Electricity',
      'Maintenance',
      'Supplies',
      'Instruments',
      'Costumes',
      'Event costs',
      'Other'
    ];

    for (const cat of defaultCategories) {
      await client.query(`
        INSERT INTO public.expense_categories (name, is_custom)
        VALUES ($1, false)
        ON CONFLICT (name) DO NOTHING;
      `, [cat]);
    }

    // 2. Expenses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_date DATE NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        payment_method VARCHAR(50) NOT NULL, -- Cash, UPI, Bank transfer, Other
        vendor VARCHAR(200),
        reference_number VARCHAR(100),
        attachment_url TEXT,
        attachment_name VARCHAR(255),
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMPTZ,
        created_by VARCHAR(100) DEFAULT 'Academy Director',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Expense Audit Logs (History of edits)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.expense_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
        field_name VARCHAR(100) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by VARCHAR(100) NOT NULL DEFAULT 'Academy Director',
        changed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Announcements Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        audience VARCHAR(100) NOT NULL, -- 'All students', 'Selected course or batch', 'Trainers', 'Chosen recipients'
        target_course_id UUID,
        target_course_title VARCHAR(200),
        target_batch_id UUID,
        target_batch_name VARCHAR(200),
        type_tag VARCHAR(50) NOT NULL, -- 'Holiday', 'Schedule change', 'Cancellation', 'Fee reminder', 'General'
        publish_date DATE NOT NULL,
        expiry_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Scheduled', 'Published', 'Expired'
        delivery_status VARCHAR(100) DEFAULT 'System verified (Delivered)',
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMPTZ,
        created_by VARCHAR(100) DEFAULT 'Academy Director',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Successfully created expenses, expense_audit_logs, expense_categories, and announcements tables!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupTables();

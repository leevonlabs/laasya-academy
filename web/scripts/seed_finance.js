const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('Seeding financial data...');

  // 1. Fetch active students
  const studentsRes = await pool.query(`
    SELECT s.id, s.roll_number, p.full_name, p.phone, p.email, s.parent_name
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    LIMIT 20
  `);
  const students = studentsRes.rows;
  console.log(`Found ${students.length} students`);

  // 2. Fetch courses and batches
  const batchesRes = await pool.query(`
    SELECT b.id, b.name, b.course_id, c.title as course_title, c.monthly_fee
    FROM public.batches b
    JOIN public.courses c ON c.id = b.course_id
  `);
  const batches = batchesRes.rows;
  console.log(`Found ${batches.length} batches`);

  // 3. Fetch trainers (Gurus)
  const gurusRes = await pool.query(`
    SELECT t.id, p.full_name, t.display_title, t.specializations
    FROM public.trainers t
    JOIN public.profiles p ON p.id = t.profile_id
  `);
  const gurus = gurusRes.rows;
  console.log(`Found ${gurus.length} gurus`);

  // Clear existing finance seed data to avoid duplicates if re-run
  await pool.query('DELETE FROM public.student_fee_payments');
  await pool.query('DELETE FROM public.fee_reminders');
  await pool.query('DELETE FROM public.student_fee_invoices');
  await pool.query('DELETE FROM public.guru_salary_records');
  await pool.query('DELETE FROM public.guru_salary_advances');

  // --- SEED STUDENT FEE INVOICES & PAYMENTS ---
  const currentMonth = 'March 2026';
  const lastMonth = 'February 2026';

  let invCount = 100;
  let recCount = 500;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const batch = batches[i % batches.length] || batches[0];
    const baseFee = Number(batch?.monthly_fee) || 2000;

    // Pattern for demo distribution:
    // Student 0, 1: Fully Paid current month
    // Student 2: Partial payment (e.g. Paid 1200 out of 2000, 800 pending)
    // Student 3: Pending / Overdue with Reminder sent
    // Student 4: Paid with discount (sibling / annual discount)
    // Student 5, 6...: Mix of Paid and Partial

    let status = 'paid';
    let discount = 0;
    let paidAmount = baseFee;
    let balance = 0;
    let dueDate = '2026-03-10';

    if (i % 4 === 1) {
      // Partial payment
      status = 'partial';
      paidAmount = Math.round(baseFee * 0.6);
      balance = baseFee - paidAmount;
    } else if (i % 4 === 2) {
      // Pending / Overdue
      status = 'overdue';
      paidAmount = 0;
      balance = baseFee;
      dueDate = '2026-03-05';
    } else if (i % 4 === 3) {
      // Discounted
      discount = 200;
      paidAmount = baseFee - discount;
      balance = 0;
      status = 'paid';
    }

    invCount++;
    const invNum = `LCA-INV-2026-${invCount}`;

    const invRes = await pool.query(`
      INSERT INTO public.student_fee_invoices (
        student_id, course_id, batch_id, invoice_number, fee_period,
        due_date, total_amount, discount_amount, paid_amount, balance_amount,
        status, last_reminder_sent_at, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id;
    `, [
      student.id,
      batch?.course_id || null,
      batch?.id || null,
      invNum,
      currentMonth,
      dueDate,
      baseFee,
      discount,
      paidAmount,
      balance,
      status,
      status === 'overdue' || status === 'partial' ? '2026-03-12 10:30:00+05:30' : null,
      status === 'partial' ? 'First installment received. Balance due before 25th.' : null
    ]);

    const invoiceId = invRes.rows[0].id;

    // If paid or partial, insert payments with receipt
    if (paidAmount > 0) {
      recCount++;
      const recNum = `LCA-REC-${recCount}`;
      const methods = ['upi', 'cash', 'bank_transfer', 'card'];
      const method = methods[i % methods.length];

      await pool.query(`
        INSERT INTO public.student_fee_payments (
          invoice_id, student_id, receipt_number, amount_paid,
          payment_date, payment_method, transaction_reference,
          receipt_issued_by, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `, [
        invoiceId,
        student.id,
        recNum,
        paidAmount,
        '2026-03-04',
        method,
        method === 'upi' ? `UPI/6064${i}9821/HDFC` : method === 'bank_transfer' ? `NEFT-2026030400${i}` : 'Counter Cash Receipt',
        'Director / Academy Office',
        status === 'partial' ? 'Partial Fee Installment #1' : 'Full Month Course Tuition Fee'
      ]);

      // If it was partial, also insert a second minor payment for one student to demonstrate multi-installment history
      if (i === 1 && balance > 0) {
        recCount++;
        const secondPay = 400;
        await pool.query(`
          INSERT INTO public.student_fee_payments (
            invoice_id, student_id, receipt_number, amount_paid,
            payment_date, payment_method, transaction_reference,
            receipt_issued_by, remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `, [
          invoiceId,
          student.id,
          `LCA-REC-${recCount}`,
          secondPay,
          '2026-03-15',
          'upi',
          'UPI/6075192834/GPAY',
          'Director / Academy Office',
          'Installment #2 via GPay'
        ]);

        // update invoice paid & balance
        await pool.query(`
          UPDATE public.student_fee_invoices
          SET paid_amount = paid_amount + $2,
              balance_amount = balance_amount - $2
          WHERE id = $1
        `, [invoiceId, secondPay]);
      }
    }

    // If overdue or partial, insert reminder log
    if (status === 'overdue' || status === 'partial') {
      await pool.query(`
        INSERT INTO public.fee_reminders (
          invoice_id, student_id, channel, sent_to, message, status
        ) VALUES ($1, $2, $3, $4, $5, 'delivered');
      `, [
        invoiceId,
        student.id,
        'whatsapp',
        student.phone || '+91 98450 12345',
        `Namaste ${student.parent_name || student.full_name}, gentle reminder from Laasya Cultural Academy: ${batch?.course_title} fee for ${currentMonth} (Bal: ₹${balance}) is pending. Please pay online via UPI or visit reception. Thank you.`
      ]);
    }
  }

  console.log('Seeded student fee invoices, payments, and reminders.');

  // --- SEED GURU SALARIES & ADVANCES ---
  // Salary structure based on Guru seniority:
  // Director / Senior Gurus: ₹35,000 - ₹45,000
  // Faculty Masters: ₹24,000 - ₹30,000
  // Instructors: ₹18,000 - ₹22,000

  for (let j = 0; j < gurus.length; j++) {
    const guru = gurus[j];
    let baseSalary = 25000;
    if (guru.full_name.includes('Amos') || guru.full_name.includes('Anusha')) {
      baseSalary = 42000;
    } else if (guru.full_name.includes('Manikandan') || guru.full_name.includes('Pramod') || guru.full_name.includes('Olekar')) {
      baseSalary = 32000;
    } else if (guru.full_name.includes('Shahil') || guru.full_name.includes('Dipayan') || guru.full_name.includes('Sathish')) {
      baseSalary = 28000;
    } else {
      baseSalary = 22000;
    }

    let bonus = 0;
    let bonusReason = null;
    let deduction = 0;
    let deductionReason = null;
    let advanceDeducted = 0;
    let status = 'paid';
    let payDate = '2026-03-01';
    let method = 'bank_transfer';
    let txnRef = `SAL-NEFT-2026030${j}`;

    if (j === 0) {
      bonus = 3000;
      bonusReason = 'Special Academy Workshop Bonus';
    } else if (j === 2) {
      deduction = 1000;
      deductionReason = 'Approved Leave adjustment (1 session)';
    } else if (j === 3) {
      // Guru with an active advance recovery
      advanceDeducted = 2500;
    } else if (j === 5 || j === 6) {
      status = 'pending';
      payDate = null;
      txnRef = null;
    }

    const netSalary = baseSalary + bonus - deduction - advanceDeducted;

    await pool.query(`
      INSERT INTO public.guru_salary_records (
        trainer_id, payroll_month, base_salary, classes_assigned, classes_conducted,
        bonus_amount, bonus_reason, deduction_amount, deduction_reason,
        advance_deducted, net_salary, status, payment_date, payment_method,
        transaction_reference, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
    `, [
      guru.id,
      currentMonth,
      baseSalary,
      16,
      j === 2 ? 15 : 16,
      bonus,
      bonusReason,
      deduction,
      deductionReason,
      advanceDeducted,
      netSalary,
      status,
      payDate,
      status === 'paid' ? method : null,
      txnRef,
      status === 'paid' ? 'Salary credited to registered bank account' : 'Awaiting monthly attendance sign-off'
    ]);

    // Seed Guru Advance for Guru 3 & 4
    if (j === 3 || j === 7) {
      const advAmount = 10000;
      const recovered = j === 3 ? 2500 : 0;
      await pool.query(`
        INSERT INTO public.guru_salary_advances (
          trainer_id, amount, request_date, disbursement_date,
          status, recovered_amount, remaining_balance, reason,
          payment_method, transaction_ref
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `, [
        guru.id,
        advAmount,
        '2026-02-20',
        '2026-02-22',
        j === 3 ? 'partially_settled' : 'disbursed',
        recovered,
        advAmount - recovered,
        'Festival & Equipment purchase advance',
        'bank_transfer',
        `ADV-20260222-${j}`
      ]);
    }
  }

  console.log('Seeded Guru salary records and advances.');
  await pool.end();
  console.log('All financial seed data committed successfully!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  pool.end();
  process.exit(1);
});

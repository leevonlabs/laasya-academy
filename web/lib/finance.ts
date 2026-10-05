import { query, queryOne } from './db';

// -------------------------------------------------------------
// TYPES & INTERFACES
// -------------------------------------------------------------

export interface FeePayment {
  id: string;
  invoice_id: string;
  student_id: string;
  student_name?: string;
  receipt_number: string;
  amount_paid: number;
  payment_date: string;
  payment_method: 'upi' | 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  transaction_reference?: string;
  receipt_issued_by: string;
  remarks?: string;
  created_at: string;
}

export interface FeeReminder {
  id: string;
  invoice_id: string;
  student_id: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'call';
  sent_to: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  created_at: string;
}

export interface StudentFeeInvoice {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  parent_name: string;
  phone: string;
  email: string;
  course_id: string;
  course_title: string;
  batch_id: string;
  batch_name: string;
  invoice_number: string;
  fee_period: string;
  due_date: string;
  total_amount: number;
  discount_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  last_reminder_sent_at?: string | null;
  notes?: string | null;
  created_at: string;
  payments?: FeePayment[];
  reminders?: FeeReminder[];
}

export interface GuruSalaryRecord {
  id: string;
  trainer_id: string;
  guru_name: string;
  display_title: string;
  specializations: string[];
  phone: string;
  email: string;
  payroll_month: string;
  base_salary: number;
  classes_assigned: number;
  classes_conducted: number;
  bonus_amount: number;
  bonus_reason?: string | null;
  deduction_amount: number;
  deduction_reason?: string | null;
  advance_deducted: number;
  net_salary: number;
  status: 'paid' | 'pending' | 'processing';
  payment_date?: string | null;
  payment_method?: 'bank_transfer' | 'upi' | 'cash' | 'cheque' | null;
  transaction_reference?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface GuruSalaryAdvance {
  id: string;
  trainer_id: string;
  guru_name: string;
  display_title: string;
  amount: number;
  request_date: string;
  disbursement_date?: string | null;
  status: 'approved' | 'disbursed' | 'partially_settled' | 'settled';
  recovered_amount: number;
  remaining_balance: number;
  reason?: string | null;
  payment_method?: 'bank_transfer' | 'upi' | 'cash' | null;
  transaction_ref?: string | null;
  created_at: string;
}

export interface FinancialSummary {
  totalFeeCollected: number;
  totalFeePending: number;
  totalFeeBilled: number;
  overdueInvoicesCount: number;
  partialInvoicesCount: number;
  totalSalariesPaid: number;
  totalSalariesPending: number;
  totalAdvancesActive: number;
  netOperatingCashFlow: number;
  collectionRate: number;
  totalStudentsBilled: number;
  totalGurusOnPayroll: number;
}

// -------------------------------------------------------------
// FINANCIAL SUMMARY FOR OWNER DASHBOARD
// -------------------------------------------------------------
export async function getFinancialSummary(): Promise<FinancialSummary> {
  const [feeRow] = await query<{
    total_collected: string;
    total_pending: string;
    total_billed: string;
    overdue_count: string;
    partial_count: string;
    students_count: string;
  }>(`
    SELECT 
      COALESCE(SUM(paid_amount), 0) as total_collected,
      COALESCE(SUM(balance_amount), 0) as total_pending,
      COALESCE(SUM(total_amount - discount_amount), 0) as total_billed,
      COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
      COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
      COUNT(DISTINCT student_id) as students_count
    FROM public.student_fee_invoices;
  `);

  const [salaryRow] = await query<{
    salaries_paid: string;
    salaries_pending: string;
    gurus_count: string;
  }>(`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END), 0) as salaries_paid,
      COALESCE(SUM(CASE WHEN status != 'paid' THEN net_salary ELSE 0 END), 0) as salaries_pending,
      COUNT(DISTINCT trainer_id) as gurus_count
    FROM public.guru_salary_records;
  `);

  const [advancesRow] = await query<{ active_advances: string }>(`
    SELECT COALESCE(SUM(remaining_balance), 0) as active_advances
    FROM public.guru_salary_advances
    WHERE status != 'settled';
  `);

  const collected = Number(feeRow?.total_collected || 0);
  const pending = Number(feeRow?.total_pending || 0);
  const billed = Number(feeRow?.total_billed || 0);
  const salariesPaid = Number(salaryRow?.salaries_paid || 0);
  const salariesPending = Number(salaryRow?.salaries_pending || 0);
  const activeAdvances = Number(advancesRow?.active_advances || 0);

  const rate = billed > 0 ? Math.round((collected / billed) * 100) : 100;
  const netCash = collected - salariesPaid;

  return {
    totalFeeCollected: collected,
    totalFeePending: pending,
    totalFeeBilled: billed,
    overdueInvoicesCount: Number(feeRow?.overdue_count || 0),
    partialInvoicesCount: Number(feeRow?.partial_count || 0),
    totalSalariesPaid: salariesPaid,
    totalSalariesPending: salariesPending,
    totalAdvancesActive: activeAdvances,
    netOperatingCashFlow: netCash,
    collectionRate: rate,
    totalStudentsBilled: Number(feeRow?.students_count || 0),
    totalGurusOnPayroll: Number(salaryRow?.gurus_count || 0)
  };
}

// -------------------------------------------------------------
// STUDENT FEE INVOICES & PAYMENTS
// -------------------------------------------------------------

export async function getStudentFeeInvoices(): Promise<StudentFeeInvoice[]> {
  const sql = `
    SELECT 
      i.id, i.student_id, p.full_name as student_name, s.roll_number,
      s.parent_name, p.phone, p.email,
      i.course_id, COALESCE(c.title, 'General Course') as course_title,
      i.batch_id, COALESCE(b.name, 'Default Batch') as batch_name,
      i.invoice_number, i.fee_period, i.due_date::text as due_date,
      i.total_amount, i.discount_amount, i.paid_amount, i.balance_amount,
      i.status, i.last_reminder_sent_at::text as last_reminder_sent_at, i.notes, i.created_at::text as created_at
    FROM public.student_fee_invoices i
    JOIN public.students s ON s.id = i.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    LEFT JOIN public.courses c ON c.id = i.course_id
    LEFT JOIN public.batches b ON b.id = i.batch_id
    ORDER BY 
      CASE WHEN i.status = 'overdue' THEN 1 WHEN i.status = 'partial' THEN 2 WHEN i.status = 'pending' THEN 3 ELSE 4 END,
      i.due_date ASC;
  `;

  const invoices = await query<StudentFeeInvoice>(sql);

  // Fetch all payments for these invoices
  if (invoices.length > 0) {
    const payments = await query<FeePayment>(`
      SELECT 
        id, invoice_id, student_id, receipt_number, amount_paid,
        payment_date::text as payment_date, payment_method, transaction_reference,
        receipt_issued_by, remarks, created_at::text as created_at
      FROM public.student_fee_payments
      ORDER BY payment_date DESC;
    `);

    const reminders = await query<FeeReminder>(`
      SELECT 
        id, invoice_id, student_id, channel, sent_to, message, status, created_at::text as created_at
      FROM public.fee_reminders
      ORDER BY created_at DESC;
    `);

    // Attach payments & reminders to respective invoices
    const payMap = new Map<string, FeePayment[]>();
    for (const p of payments) {
      if (!payMap.has(p.invoice_id)) payMap.set(p.invoice_id, []);
      payMap.get(p.invoice_id)!.push(p);
    }

    const remMap = new Map<string, FeeReminder[]>();
    for (const r of reminders) {
      if (!remMap.has(r.invoice_id)) remMap.set(r.invoice_id, []);
      remMap.get(r.invoice_id)!.push(r);
    }

    for (const inv of invoices) {
      inv.payments = payMap.get(inv.id) || [];
      inv.reminders = remMap.get(inv.id) || [];
    }
  }

  return JSON.parse(JSON.stringify(invoices));
}

export async function recordStudentFeePayment(data: {
  invoice_id: string;
  amount_paid: number;
  payment_method: 'upi' | 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  transaction_reference?: string;
  remarks?: string;
  receipt_issued_by?: string;
}) {
  const invoice = await queryOne<StudentFeeInvoice>(`
    SELECT * FROM public.student_fee_invoices WHERE id = $1
  `, [data.invoice_id]);

  if (!invoice) throw new Error('Invoice not found');

  const paymentAmount = Number(data.amount_paid);
  if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero');

  const newPaidAmount = Number(invoice.paid_amount) + paymentAmount;
  const netDue = Number(invoice.total_amount) - Number(invoice.discount_amount);
  const newBalance = Math.max(0, netDue - newPaidAmount);
  const newStatus = newBalance <= 0 ? 'paid' : 'partial';

  // Generate unique receipt number
  const receiptNum = `LCA-REC-${Math.floor(100000 + Math.random() * 900000)}`;

  // 1. Insert payment record
  const [payment] = await query<FeePayment>(`
    INSERT INTO public.student_fee_payments (
      invoice_id, student_id, receipt_number, amount_paid,
      payment_date, payment_method, transaction_reference,
      receipt_issued_by, remarks
    ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
    RETURNING *;
  `, [
    data.invoice_id,
    invoice.student_id,
    receiptNum,
    paymentAmount,
    data.payment_method,
    data.transaction_reference || `REF-${Date.now().toString().slice(-6)}`,
    data.receipt_issued_by || 'Director / Academy Office',
    data.remarks || (newStatus === 'paid' ? 'Full fee settlement' : 'Partial payment received')
  ]);

  // 2. Update invoice balances
  await query(`
    UPDATE public.student_fee_invoices
    SET paid_amount = $2,
        balance_amount = $3,
        status = $4,
        updated_at = now()
    WHERE id = $1;
  `, [data.invoice_id, newPaidAmount, newBalance, newStatus]);

  return { payment, invoiceStatus: newStatus, newPaidAmount, newBalance };
}

export async function createStudentFeeInvoice(data: {
  student_id: string;
  course_id?: string;
  batch_id?: string;
  fee_period: string;
  due_date: string;
  total_amount: number;
  discount_amount?: number;
  notes?: string;
}) {
  const invNumber = `LCA-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const discount = Number(data.discount_amount || 0);
  const total = Number(data.total_amount);
  const balance = Math.max(0, total - discount);

  return queryOne<StudentFeeInvoice>(`
    INSERT INTO public.student_fee_invoices (
      student_id, course_id, batch_id, invoice_number, fee_period,
      due_date, total_amount, discount_amount, paid_amount, balance_amount,
      status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, 'pending', $10)
    RETURNING *;
  `, [
    data.student_id,
    data.course_id || null,
    data.batch_id || null,
    invNumber,
    data.fee_period,
    data.due_date,
    total,
    discount,
    balance,
    data.notes || null
  ]);
}

export async function updateStudentFeeInvoice(id: string, data: {
  fee_period?: string;
  due_date?: string;
  total_amount?: number;
  discount_amount?: number;
  notes?: string;
  status?: 'paid' | 'partial' | 'pending' | 'overdue';
}) {
  const current = await queryOne<StudentFeeInvoice>(`
    SELECT * FROM public.student_fee_invoices WHERE id = $1
  `, [id]);
  if (!current) throw new Error('Invoice not found');

  const total = data.total_amount !== undefined ? Number(data.total_amount) : Number(current.total_amount);
  const discount = data.discount_amount !== undefined ? Number(data.discount_amount) : Number(current.discount_amount);
  const paid = Number(current.paid_amount || 0);
  const netDue = Math.max(0, total - discount);
  const balance = Math.max(0, netDue - paid);
  
  let newStatus = current.status;
  if (data.status) {
    newStatus = data.status;
  } else {
    if (balance <= 0) newStatus = 'paid';
    else if (paid > 0) newStatus = 'partial';
    else newStatus = 'pending';
  }

  const updated = await queryOne<StudentFeeInvoice>(`
    UPDATE public.student_fee_invoices
    SET fee_period = COALESCE($2, fee_period),
        due_date = COALESCE($3::date, due_date),
        total_amount = $4,
        discount_amount = $5,
        balance_amount = $6,
        status = $7,
        notes = COALESCE($8, notes),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id,
    data.fee_period || null,
    data.due_date || null,
    total,
    discount,
    balance,
    newStatus,
    data.notes !== undefined ? data.notes : null
  ]);

  return updated;
}

export async function collectStudentFee(data: {
  student_id: string;
  amount_paid: number;
  discount_amount?: number;
  payment_method: 'upi' | 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  transaction_reference?: string;
  fee_period?: string;
  remarks?: string;
  receipt_issued_by?: string;
}) {
  const discountAmt = Math.max(0, Number(data.discount_amount || 0));

  // Check if student has pending or partial invoices
  const unpaidInvoice = await queryOne<StudentFeeInvoice>(`
    SELECT * FROM public.student_fee_invoices 
    WHERE student_id = $1 AND status IN ('pending', 'partial', 'overdue')
    ORDER BY due_date ASC
    LIMIT 1;
  `, [data.student_id]);

  if (unpaidInvoice) {
    if (discountAmt > 0 || data.discount_amount !== undefined) {
      await query(`
        UPDATE public.student_fee_invoices
        SET discount_amount = $2,
            updated_at = now()
        WHERE id = $1;
      `, [unpaidInvoice.id, discountAmt]);
    }

    // Record payment against existing unpaid invoice
    return recordStudentFeePayment({
      invoice_id: unpaidInvoice.id,
      amount_paid: data.amount_paid,
      payment_method: data.payment_method,
      transaction_reference: data.transaction_reference,
      remarks: data.remarks,
      receipt_issued_by: data.receipt_issued_by
    });
  }

  // If no unpaid invoice exists, find student's batch or create fresh invoice
  const enroll = await queryOne<{ batch_id: string; course_id: string; monthly_fee: number }>(`
    SELECT be.batch_id, b.course_id, c.monthly_fee
    FROM public.batch_enrollments be
    JOIN public.batches b ON b.id = be.batch_id
    JOIN public.courses c ON c.id = b.course_id
    WHERE be.student_id = $1 AND be.status = 'active'
    LIMIT 1;
  `, [data.student_id]);

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const period = data.fee_period || `${monthName} ${now.getFullYear()}`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const totalBillable = data.amount_paid + discountAmt;

  const newInvoice = await createStudentFeeInvoice({
    student_id: data.student_id,
    course_id: enroll?.course_id,
    batch_id: enroll?.batch_id,
    fee_period: period,
    due_date: lastDay,
    total_amount: totalBillable > 0 ? totalBillable : Number(enroll?.monthly_fee || data.amount_paid),
    discount_amount: discountAmt,
    notes: data.remarks || 'Collected at academy desk'
  });

  if (!newInvoice) throw new Error('Failed to create invoice');

  return recordStudentFeePayment({
    invoice_id: newInvoice.id,
    amount_paid: data.amount_paid,
    payment_method: data.payment_method,
    transaction_reference: data.transaction_reference,
    remarks: data.remarks,
    receipt_issued_by: data.receipt_issued_by
  });
}

export async function sendFeeReminderNotification(invoiceId: string, channel: 'whatsapp' | 'sms' | 'email') {
  const invoice = await queryOne<StudentFeeInvoice>(`
    SELECT 
      i.*, p.full_name as student_name, s.parent_name, p.phone, p.email,
      c.title as course_title
    FROM public.student_fee_invoices i
    JOIN public.students s ON s.id = i.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    LEFT JOIN public.courses c ON c.id = i.course_id
    WHERE i.id = $1
  `, [invoiceId]);

  if (!invoice) throw new Error('Invoice not found');

  const target = channel === 'email' ? invoice.email : invoice.phone;
  const message = `Namaste ${invoice.parent_name || invoice.student_name}, gentle reminder from Laasya Cultural Academy: ${invoice.course_title || 'Academy Course'} fee for ${invoice.fee_period} (Pending Due: ₹${invoice.balance_amount}) is due. Please complete the fee payment via UPI or visit the academy office desk. Thank you.`;

  // Insert reminder log
  await query(`
    INSERT INTO public.fee_reminders (
      invoice_id, student_id, channel, sent_to, message, status
    ) VALUES ($1, $2, $3, $4, $5, 'delivered');
  `, [invoiceId, invoice.student_id, channel, target, message]);

  // Update last_reminder_sent_at on invoice
  await query(`
    UPDATE public.student_fee_invoices
    SET last_reminder_sent_at = now()
    WHERE id = $1;
  `, [invoiceId]);

  return { success: true, channel, sent_to: target, message };
}

// -------------------------------------------------------------
// GURU SALARY MANAGEMENT & ADVANCES
// -------------------------------------------------------------

export async function getGuruSalaryRecords(month?: string): Promise<GuruSalaryRecord[]> {
  const filterMonth = month || 'March 2026';
  const sql = `
    SELECT 
      s.id, s.trainer_id, p.full_name as guru_name, t.display_title,
      t.specializations, p.phone, p.email,
      s.payroll_month, s.base_salary, s.classes_assigned, s.classes_conducted,
      s.bonus_amount, s.bonus_reason, s.deduction_amount, s.deduction_reason,
      s.advance_deducted, s.net_salary, s.status, s.payment_date::text as payment_date,
      s.payment_method, s.transaction_reference, s.notes, s.created_at::text as created_at
    FROM public.guru_salary_records s
    JOIN public.trainers t ON t.id = s.trainer_id
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE s.payroll_month = $1
    ORDER BY 
      CASE WHEN s.status = 'pending' THEN 1 WHEN s.status = 'processing' THEN 2 ELSE 3 END,
      p.full_name ASC;
  `;
  let records = await query<GuruSalaryRecord>(sql, [filterMonth]);

  if (records.length === 0) {
    const trainers = await query<{ id: string; monthly_salary: number }>(
      'SELECT id, COALESCE(monthly_salary, 25000)::numeric as monthly_salary FROM public.trainers WHERE is_active = true'
    );
    for (const t of trainers) {
      const sal = Number(t.monthly_salary) || 25000;
      await query(`
        INSERT INTO public.guru_salary_records (
          trainer_id, payroll_month, base_salary, classes_assigned, classes_conducted,
          bonus_amount, deduction_amount, advance_deducted, net_salary, status
        ) VALUES ($1, $2, $3, 16, 16, 0, 0, 0, $3, 'pending')
        ON CONFLICT (trainer_id, payroll_month) DO NOTHING;
      `, [t.id, filterMonth, sal]);
    }
    records = await query<GuruSalaryRecord>(sql, [filterMonth]);
  }

  return JSON.parse(JSON.stringify(records));
}

export async function updateGuruSalaryRecord(id: string, data: {
  base_salary?: number;
  bonus_amount?: number;
  bonus_reason?: string;
  deduction_amount?: number;
  deduction_reason?: string;
  advance_deducted?: number;
  status?: 'paid' | 'pending' | 'processing';
  payment_method?: 'bank_transfer' | 'upi' | 'cash' | 'cheque';
  transaction_reference?: string;
  payment_date?: string;
  notes?: string;
}) {
  const current = await queryOne<GuruSalaryRecord>(`
    SELECT * FROM public.guru_salary_records WHERE id = $1
  `, [id]);
  if (!current) throw new Error('Salary record not found');

  const base = data.base_salary !== undefined ? Number(data.base_salary) : Number(current.base_salary);
  const bonus = data.bonus_amount !== undefined ? Number(data.bonus_amount) : Number(current.bonus_amount);
  const deduction = data.deduction_amount !== undefined ? Number(data.deduction_amount) : Number(current.deduction_amount);
  const advance = data.advance_deducted !== undefined ? Number(data.advance_deducted) : Number(current.advance_deducted);
  const net = base + bonus - deduction - advance;

  const status = data.status || current.status;
  const payDate = data.payment_date || (status === 'paid' ? new Date().toISOString().split('T')[0] : current.payment_date);

  return queryOne<GuruSalaryRecord>(`
    UPDATE public.guru_salary_records
    SET base_salary = $2,
        bonus_amount = $3,
        bonus_reason = COALESCE($4, bonus_reason),
        deduction_amount = $5,
        deduction_reason = COALESCE($6, deduction_reason),
        advance_deducted = $7,
        net_salary = $8,
        status = $9,
        payment_date = $10,
        payment_method = COALESCE($11, payment_method),
        transaction_reference = COALESCE($12, transaction_reference),
        notes = COALESCE($13, notes),
        updated_at = now()
    WHERE id = $1
    RETURNING *;
  `, [
    id, base, bonus, data.bonus_reason, deduction, data.deduction_reason,
    advance, net, status, payDate, data.payment_method, data.transaction_reference, data.notes
  ]);
}

export async function getGuruSalaryAdvances(): Promise<GuruSalaryAdvance[]> {
  const sql = `
    SELECT 
      a.id, a.trainer_id, p.full_name as guru_name, t.display_title,
      a.amount, a.request_date::text as request_date, a.disbursement_date::text as disbursement_date, a.status,
      a.recovered_amount, a.remaining_balance, a.reason,
      a.payment_method, a.transaction_ref, a.created_at::text as created_at
    FROM public.guru_salary_advances a
    JOIN public.trainers t ON t.id = a.trainer_id
    JOIN public.profiles p ON p.id = t.profile_id
    ORDER BY a.request_date DESC;
  `;
  const advances = await query<GuruSalaryAdvance>(sql);
  return JSON.parse(JSON.stringify(advances));
}

export async function createGuruSalaryAdvance(data: {
  trainer_id: string;
  amount: number;
  reason?: string;
  payment_method?: 'bank_transfer' | 'upi' | 'cash';
  transaction_ref?: string;
}) {
  const amt = Number(data.amount);
  return queryOne<GuruSalaryAdvance>(`
    INSERT INTO public.guru_salary_advances (
      trainer_id, amount, request_date, disbursement_date,
      status, recovered_amount, remaining_balance, reason,
      payment_method, transaction_ref
    ) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, 'disbursed', 0, $2, $3, $4, $5)
    RETURNING *;
  `, [
    data.trainer_id,
    amt,
    data.reason || 'Personal / Festival Advance',
    data.payment_method || 'bank_transfer',
    data.transaction_ref || `ADV-${Date.now().toString().slice(-6)}`
  ]);
}

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trainerIdParam = searchParams.get('trainerId');
    const phoneParam = searchParams.get('phone');
    const nameParam = searchParams.get('name');

    // Authenticate via user session if present, or fallback to mobile query identification
    const user = await getCurrentUser(req);
    let resolvedTrainerId = trainerIdParam;

    if (user && user.role === 'trainer') {
      resolvedTrainerId = user.userId;
    }

    // Lookup Trainer record
    let trainer: any = null;
    if (resolvedTrainerId && resolvedTrainerId.trim() && resolvedTrainerId !== 'null' && resolvedTrainerId !== 'undefined') {
      trainer = await queryOne(`
        SELECT 
          t.id as trainer_id, t.profile_id, t.guru_id, COALESCE(t.guru_id, t.code) as code,
          p.full_name as trainer_name, p.phone, p.email,
          COALESCE(t.display_title, 'Faculty Guru') as display_title,
          COALESCE(array_to_string(t.specializations, ', '), 'Classical Arts') as specialization,
          COALESCE(t.monthly_salary, 25000)::numeric as monthly_salary
        FROM public.trainers t
        JOIN public.profiles p ON t.profile_id = p.id
        WHERE t.id::text = $1 OR t.profile_id::text = $1 OR p.phone = $1
        LIMIT 1;
      `, [resolvedTrainerId.trim()]);
    }

    if (!trainer && phoneParam && phoneParam.trim()) {
      trainer = await queryOne(`
        SELECT 
          t.id as trainer_id, t.profile_id, t.guru_id, COALESCE(t.guru_id, t.code) as code,
          p.full_name as trainer_name, p.phone, p.email,
          COALESCE(t.display_title, 'Faculty Guru') as display_title,
          COALESCE(array_to_string(t.specializations, ', '), 'Classical Arts') as specialization,
          COALESCE(t.monthly_salary, 25000)::numeric as monthly_salary
        FROM public.trainers t
        JOIN public.profiles p ON t.profile_id = p.id
        WHERE p.phone LIKE $1
        LIMIT 1;
      `, [`%${phoneParam.replace(/\D/g, '').slice(-10)}%`]);
    }

    if (!trainer && nameParam && nameParam.trim()) {
      trainer = await queryOne(`
        SELECT 
          t.id as trainer_id, t.profile_id, t.guru_id, COALESCE(t.guru_id, t.code) as code,
          p.full_name as trainer_name, p.phone, p.email,
          COALESCE(t.display_title, 'Faculty Guru') as display_title,
          COALESCE(array_to_string(t.specializations, ', '), 'Classical Arts') as specialization,
          COALESCE(t.monthly_salary, 25000)::numeric as monthly_salary
        FROM public.trainers t
        JOIN public.profiles p ON t.profile_id = p.id
        WHERE LOWER(p.full_name) ILIKE LOWER($1)
        LIMIT 1;
      `, [`%${nameParam.trim()}%`]);
    }

    // Default to first trainer if not explicitly specified (for dev/demo access)
    if (!trainer) {
      trainer = await queryOne(`
        SELECT 
          t.id as trainer_id, t.profile_id, t.guru_id, COALESCE(t.guru_id, t.code) as code,
          p.full_name as trainer_name, p.phone, p.email,
          COALESCE(t.display_title, 'Faculty Guru') as display_title,
          COALESCE(array_to_string(t.specializations, ', '), 'Classical Arts') as specialization,
          COALESCE(t.monthly_salary, 25000)::numeric as monthly_salary
        FROM public.trainers t
        JOIN public.profiles p ON t.profile_id = p.id
        ORDER BY t.created_at ASC
        LIMIT 1;
      `);
    }

    if (!trainer) {
      return NextResponse.json({
        success: true,
        salaries: [],
        payments: [],
        summary: {
          base_salary: 25000,
          current_month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          current_month_status: 'Pending',
          all_months: []
        }
      }, { headers: corsHeaders });
    }

    const tId = trainer.trainer_id;

    // 1. Fetch Paid Monthly Salary Records (Updated through Payroll by Admin)
    const salaryRecords = await query<any>(`
      SELECT 
        sr.id,
        sr.trainer_id,
        'salary' as record_kind,
        'monthly_salary' as payment_type,
        'Salary' as type_label,
        'Monthly Salary' as badge_label,
        COALESCE(sr.invoice_number, CONCAT('LCA-SAL-2026-', UPPER(SUBSTRING(REPLACE(sr.id::text, '-', ''), 1, 6)))) as invoice_number,
        COALESCE(sr.invoice_number, sr.transaction_reference) as voucher_number,
        CONCAT('RCP-SAL-', SUBSTRING(sr.id::text, 1, 6)) as receipt_number,
        sr.payroll_month,
        p.full_name as trainer_name,
        COALESCE(t.display_title, 'Faculty Guru') as display_title,
        COALESCE(array_to_string(t.specializations, ', '), 'Classical Arts') as specialization,
        COALESCE(sr.base_salary, t.monthly_salary, 25000)::numeric as base_salary,
        COALESCE(sr.net_salary, sr.base_salary)::numeric as amount,
        COALESCE(sr.net_salary, sr.base_salary)::numeric as net_salary,
        COALESCE(sr.bonus_amount, 0)::numeric as bonus_amount,
        sr.bonus_reason,
        COALESCE(sr.deduction_amount, 0)::numeric as deduction_amount,
        sr.deduction_reason,
        COALESCE(sr.advance_deducted, 0)::numeric as advance_deducted,
        sr.status,
        COALESCE(sr.payment_date::text, sr.created_at::date::text) as payment_date,
        TO_CHAR(COALESCE(sr.payment_date, sr.created_at::date), 'DD Mon YYYY') as display_date,
        COALESCE(sr.payment_method, 'bank_transfer') as payment_method,
        COALESCE(sr.transaction_reference, 'IMPS/' || UPPER(SUBSTRING(sr.id::text, 1, 8))) as transaction_reference,
        'Academy Accounts Desk' as disbursed_by,
        COALESCE(sr.notes, CONCAT('Monthly Honorarium • ', sr.payroll_month)) as remarks,
        sr.created_at::text as created_at
      FROM public.guru_salary_records sr
      JOIN public.trainers t ON sr.trainer_id = t.id
      JOIN public.profiles p ON t.profile_id = p.id
      WHERE sr.trainer_id = $1 AND sr.status = 'paid'
      ORDER BY COALESCE(sr.payment_date, sr.created_at::date) DESC;
    `, [tId]);

    // 2. Fetch Direct Guru Payments (Advances, Bonuses, Incentives added from Payments page)
    const directPayments = await query<any>(`
      SELECT 
        gp.id,
        gp.trainer_id,
        'payment' as record_kind,
        gp.payment_type,
        'Payment' as type_label,
        CASE 
          WHEN gp.payment_type = 'salary_advance' THEN 'Salary Advance'
          WHEN gp.payment_type = 'bonus' THEN 'Bonus'
          WHEN gp.payment_type = 'festival_bonus' THEN 'Festival Bonus'
          WHEN gp.payment_type = 'incentive' THEN 'Incentive'
          WHEN gp.payment_type = 'reimbursement' THEN 'Reimbursement'
          WHEN gp.payment_type = 'honorarium' THEN 'Honorarium'
          ELSE 'Direct Payment'
        END as badge_label,
        COALESCE(gp.invoice_number, CONCAT('LCA-PAY-2026-', UPPER(SUBSTRING(REPLACE(gp.id::text, '-', ''), 1, 6)))) as invoice_number,
        COALESCE(gp.invoice_number, gp.transaction_reference) as voucher_number,
        COALESCE(gp.receipt_number, CONCAT('RCP-PAY-', SUBSTRING(gp.id::text, 1, 6))) as receipt_number,
        NULL as payroll_month,
        p.full_name as trainer_name,
        COALESCE(t.display_title, 'Faculty Guru') as display_title,
        COALESCE(array_to_string(t.specializations, ', '), 'Classical Arts') as specialization,
        COALESCE(t.monthly_salary, 25000)::numeric as base_salary,
        gp.amount::numeric as amount,
        gp.amount::numeric as net_salary,
        0 as bonus_amount,
        NULL as bonus_reason,
        0 as deduction_amount,
        NULL as deduction_reason,
        0 as advance_deducted,
        'paid' as status,
        COALESCE(gp.payment_date::text, gp.created_at::date::text) as payment_date,
        TO_CHAR(COALESCE(gp.payment_date, gp.created_at::date), 'DD Mon YYYY') as display_date,
        COALESCE(gp.payment_method, 'bank_transfer') as payment_method,
        COALESCE(gp.transaction_reference, 'IMPS/' || UPPER(SUBSTRING(gp.id::text, 1, 8))) as transaction_reference,
        'Academy Accounts Desk' as disbursed_by,
        COALESCE(gp.notes, 'Direct payment disbursement') as remarks,
        gp.created_at::text as created_at
      FROM public.guru_payments gp
      JOIN public.trainers t ON gp.trainer_id = t.id
      JOIN public.profiles p ON t.profile_id = p.id
      WHERE gp.trainer_id = $1
      ORDER BY COALESCE(gp.payment_date, gp.created_at::date) DESC;
    `, [tId]);

    // Combine all payments and sort chronologically descending
    const combinedPayments = [...salaryRecords, ...directPayments].sort((a, b) => {
      const da = new Date(a.payment_date || a.created_at).getTime();
      const db = new Date(b.payment_date || b.created_at).getTime();
      return db - da;
    });

    // 3. Current Month Status & All Months Payroll History for Month-Year Filter
    const currentCalMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const allPayrollMonths = await query<{
      payroll_month: string;
      status: string;
      base_salary: number;
      net_salary: number;
      payment_date: string;
      invoice_number: string;
    }>(`
      SELECT 
        payroll_month,
        status,
        base_salary::numeric,
        net_salary::numeric,
        payment_date::text,
        invoice_number
      FROM public.guru_salary_records
      WHERE trainer_id = $1
      ORDER BY created_at DESC;
    `, [tId]);

    const currentMonthRecord = allPayrollMonths.find(m => m.payroll_month === currentCalMonth);
    const currentMonthStatus = currentMonthRecord?.status === 'paid' ? 'Paid' : 'Pending';

    const summary = {
      guru_id: trainer.guru_id || trainer.code,
      guru_name: trainer.trainer_name,
      base_salary: Number(trainer.monthly_salary) || 25000,
      current_month: currentCalMonth,
      current_month_status: currentMonthStatus,
      current_month_net: currentMonthRecord ? Number(currentMonthRecord.net_salary) : Number(trainer.monthly_salary),
      all_months: allPayrollMonths.map(m => ({
        month: m.payroll_month,
        status: m.status === 'paid' ? 'Paid' : 'Pending',
        is_paid: m.status === 'paid',
        net_salary: Number(m.net_salary),
        invoice_number: m.invoice_number,
        payment_date: m.payment_date
      }))
    };

    return NextResponse.json({
      success: true,
      salaries: combinedPayments, // For backwards compatibility
      payments: combinedPayments,
      summary
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in GET /api/finance/trainer-salaries:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

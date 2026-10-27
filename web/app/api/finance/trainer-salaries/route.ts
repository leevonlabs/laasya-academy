import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (user.role !== 'owner' && user.role !== 'trainer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Access denied.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const trainerId = searchParams.get('trainerId');

    // Trainers can only access their own salary records
    let targetTrainerFilter = trainerId;
    if (user.role === 'trainer') {
      targetTrainerFilter = user.userId;
    }

    let sql = `
      SELECT 
        sr.id,
        ('LCA-SAL-' || TO_CHAR(sr.created_at, 'YYYYMM') || '-' || UPPER(SUBSTRING(sr.id::text, 1, 4))) as voucher_number,
        ('LCA-VOUCHER-' || TO_CHAR(sr.created_at, 'YYYYMM') || '-' || UPPER(SUBSTRING(sr.id::text, 1, 4))) as receipt_number,
        sr.payroll_month,
        p.full_name as trainer_name,
        COALESCE(t.display_title, 'Faculty Guru') as display_title,
        COALESCE(array_to_string(t.specializations, ', '), 'Classical Arts') as specialization,
        sr.base_salary::numeric as base_salary,
        COALESCE(sr.classes_assigned, 16)::int as classes_assigned,
        COALESCE(sr.classes_conducted, 16)::int as classes_conducted,
        COALESCE(sr.bonus_amount, 0)::numeric as bonus_amount,
        sr.bonus_reason,
        COALESCE(sr.deduction_amount, 0)::numeric as deduction_amount,
        COALESCE(sr.net_salary, sr.base_salary)::numeric as net_salary,
        sr.status,
        COALESCE(TO_CHAR(sr.payment_date, 'DD Mon YYYY'), TO_CHAR(sr.created_at, 'DD Mon YYYY')) as payment_date,
        COALESCE(sr.payment_method, 'Bank Transfer') as payment_method,
        COALESCE(sr.transaction_reference, 'IMPS/' || UPPER(SUBSTRING(sr.id::text, 1, 8))) as transaction_reference,
        'Academy Accounts Desk' as disbursed_by,
        COALESCE(sr.notes, 'Monthly faculty honorarium') as remarks
      FROM public.guru_salary_records sr
      JOIN public.trainers t ON sr.trainer_id = t.id
      JOIN public.profiles p ON t.profile_id = p.id
    `;
    const params: any[] = [];
    if (targetTrainerFilter && targetTrainerFilter.trim() && targetTrainerFilter !== 'null' && targetTrainerFilter !== 'undefined') {
      sql += ` WHERE (t.id = $1 OR t.profile_id = $1)`;
      params.push(targetTrainerFilter.trim());
    }
    sql += ` ORDER BY sr.created_at DESC;`;

    const salaries = await query(sql, params);
    return NextResponse.json({ success: true, salaries }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in GET /api/finance/trainer-salaries:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

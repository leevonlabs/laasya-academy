import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { collectStudentFee } from '@/lib/finance';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const rollNumber = searchParams.get('rollNumber');

    const isStaff = user && (user.role === 'owner' || user.role === 'receptionist');

    if (studentId || rollNumber) {
      const dbInvoices = await query<any>(`
        SELECT 
          i.id,
          i.invoice_number,
          COALESCE(i.invoice_number, '') as receipt_number,
          i.fee_period,
          c.title as course_title,
          b.name as batch_name,
          i.amount_paid,
          i.gross_amount,
          i.discount_amount,
          (i.gross_amount - i.amount_paid - COALESCE(i.discount_amount, 0)) as balance_due,
          to_char(COALESCE(i.payment_date, i.created_at), 'DD Mon YYYY') as payment_date,
          to_char(COALESCE(i.payment_date, i.created_at), 'YYYY-MM-DD') as payment_date_iso,
          i.payment_method,
          i.transaction_reference,
          i.status,
          i.receipt_issued_by,
          p.full_name as student_name,
          s.roll_number,
          s.parent_name,
          i.remarks
        FROM public.student_fee_invoices i
        JOIN public.students s ON i.student_id = s.id
        JOIN public.profiles p ON s.profile_id = p.id
        LEFT JOIN public.batches b ON i.batch_id = b.id
        LEFT JOIN public.courses c ON b.course_id = c.id
        WHERE (
          s.id::text = $1 
          OR s.profile_id::text = $1 
          OR (LOWER(s.roll_number) = LOWER($2) AND LENGTH($2) > 0)
        )
        ORDER BY COALESCE(i.payment_date, i.created_at) DESC
      `, [studentId || null, rollNumber || '']);

      if (dbInvoices && dbInvoices.length > 0) {
        return NextResponse.json({ success: true, payments: dbInvoices }, { headers: corsHeaders });
      }
    }

    if (isStaff) {
      const allPayments = await query<any>(`
        SELECT 
          i.id,
          i.invoice_number,
          COALESCE(i.invoice_number, '') as receipt_number,
          i.fee_period,
          c.title as course_title,
          b.name as batch_name,
          i.amount_paid,
          i.gross_amount,
          i.discount_amount,
          (i.gross_amount - i.amount_paid - COALESCE(i.discount_amount, 0)) as balance_due,
          to_char(COALESCE(i.payment_date, i.created_at), 'DD Mon YYYY') as payment_date,
          to_char(COALESCE(i.payment_date, i.created_at), 'YYYY-MM-DD') as payment_date_iso,
          i.payment_method,
          i.transaction_reference,
          i.status,
          i.receipt_issued_by,
          p.full_name as student_name,
          s.roll_number,
          s.parent_name,
          i.remarks
        FROM public.student_fee_invoices i
        JOIN public.students s ON i.student_id = s.id
        JOIN public.profiles p ON s.profile_id = p.id
        LEFT JOIN public.batches b ON i.batch_id = b.id
        LEFT JOIN public.courses c ON b.course_id = c.id
        ORDER BY COALESCE(i.payment_date, i.created_at) DESC
        LIMIT 50
      `);
      return NextResponse.json({ success: true, payments: allPayments }, { headers: corsHeaders });
    }

    return NextResponse.json({ success: true, payments: [] }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error fetching student payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve payments' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      student_id, 
      roll_number, 
      amount_paid, 
      payment_method, 
      transaction_reference, 
      fee_period, 
      remarks 
    } = body;

    let targetStudentId = student_id;
    if (!targetStudentId && roll_number) {
      const s = await queryOne<{ id: string }>(`
        SELECT id FROM public.students WHERE LOWER(roll_number) = LOWER($1) LIMIT 1
      `, [roll_number]);
      if (s) targetStudentId = s.id;
    }

    if (!targetStudentId) {
      const defaultStudent = await queryOne<{ id: string }>(`
        SELECT id FROM public.students ORDER BY created_at ASC LIMIT 1
      `);
      if (defaultStudent) {
        targetStudentId = defaultStudent.id;
      } else {
        return NextResponse.json(
          { success: false, error: 'Student ID or roll number is required' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const amt = Number(amount_paid);
    if (!amt || amt <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid positive payment amount is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validMethod = ['upi', 'cash', 'bank_transfer', 'card', 'cheque', 'other'].includes(payment_method)
      ? payment_method
      : 'upi';

    const result = await collectStudentFee({
      student_id: targetStudentId,
      amount_paid: amt,
      payment_method: validMethod,
      transaction_reference: transaction_reference || `UPI/MOB-${Date.now().toString().slice(-8)}`,
      fee_period: fee_period,
      remarks: remarks || 'Mobile App Online Payment',
      receipt_issued_by: 'Student Mobile Portal'
    });

    return NextResponse.json({
      success: true,
      message: 'Student fee payment successfully registered and linked to admin ledger.',
      payment: result
    }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    console.error('Student payment POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record student payment' },
      { status: 500, headers: corsHeaders }
    );
  }
}

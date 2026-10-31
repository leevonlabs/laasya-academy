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
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required: Please sign in to view payment history.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const rollNumber = searchParams.get('rollNumber');

    const isStaff = user.role === 'owner' || user.role === 'receptionist';

    // Role-based authorization & ownership checks
    if (!isStaff) {
      if (user.role === 'trainer') {
        return NextResponse.json(
          { success: false, error: 'Access denied: Faculty accounts are not permitted to inspect student fee ledgers.' },
          { status: 403, headers: corsHeaders }
        );
      }

      if (user.role === 'student') {
        // Verify student can only inspect their own payments
        if (studentId && studentId !== user.userId) {
          const isOwn = await queryOne<{ id: string }>(`
            SELECT id FROM public.students WHERE (id::text = $1 OR profile_id::text = $1) AND profile_id::text = $2 LIMIT 1
          `, [studentId, user.userId]);
          if (!isOwn) {
            return NextResponse.json(
              { success: false, error: 'Access denied: You are only permitted to inspect your own fee payments.' },
              { status: 403, headers: corsHeaders }
            );
          }
        }
        if (rollNumber && user.rollNumber && rollNumber.toLowerCase() !== user.rollNumber.toLowerCase()) {
          return NextResponse.json(
            { success: false, error: 'Access denied: You are only permitted to inspect your own fee payments.' },
            { status: 403, headers: corsHeaders }
          );
        }
      }
    }

    // Determine query target
    let queryStudentId = studentId;
    let queryRollNumber = rollNumber;

    if (!isStaff && user.role === 'student') {
      queryStudentId = user.userId;
      queryRollNumber = user.rollNumber || '';
    }

    if (queryStudentId || queryRollNumber) {
      const dbPayments = await query<any>(`
        SELECT 
          p.id,
          p.receipt_number,
          p.amount_paid,
          to_char(p.payment_date, 'DD Mon YYYY') as payment_date,
          to_char(p.payment_date, 'YYYY-MM-DD') as payment_date_iso,
          p.payment_method,
          p.transaction_reference,
          p.receipt_issued_by,
          p.remarks,
          i.invoice_number,
          i.fee_period,
          i.total_amount as gross_amount,
          i.discount_amount,
          i.paid_amount,
          i.balance_amount as balance_due,
          i.status,
          prof.full_name as student_name,
          s.roll_number,
          s.parent_name,
          COALESCE(c.title, 'General Course') as course_title,
          COALESCE(b.name, 'Default Batch') as batch_name
        FROM public.student_fee_payments p
        JOIN public.student_fee_invoices i ON p.invoice_id = i.id
        JOIN public.students s ON p.student_id = s.id
        JOIN public.profiles prof ON s.profile_id = prof.id
        LEFT JOIN public.courses c ON i.course_id = c.id
        LEFT JOIN public.batches b ON i.batch_id = b.id
        WHERE (
          s.id::text = $1 
          OR s.profile_id::text = $1 
          OR (LOWER(s.roll_number) = LOWER($2) AND LENGTH($2) > 0)
        )
        ORDER BY p.payment_date DESC, p.created_at DESC
      `, [queryStudentId || null, queryRollNumber || '']);

      return NextResponse.json({ success: true, payments: dbPayments || [] }, { headers: corsHeaders });
    }

    if (isStaff) {
      const allPayments = await query<any>(`
        SELECT 
          p.id,
          p.receipt_number,
          p.amount_paid,
          to_char(p.payment_date, 'DD Mon YYYY') as payment_date,
          to_char(p.payment_date, 'YYYY-MM-DD') as payment_date_iso,
          p.payment_method,
          p.transaction_reference,
          p.receipt_issued_by,
          p.remarks,
          i.invoice_number,
          i.fee_period,
          i.total_amount as gross_amount,
          i.discount_amount,
          i.paid_amount,
          i.balance_amount as balance_due,
          i.status,
          prof.full_name as student_name,
          s.roll_number,
          s.parent_name,
          COALESCE(c.title, 'General Course') as course_title,
          COALESCE(b.name, 'Default Batch') as batch_name
        FROM public.student_fee_payments p
        JOIN public.student_fee_invoices i ON p.invoice_id = i.id
        JOIN public.students s ON p.student_id = s.id
        JOIN public.profiles prof ON s.profile_id = prof.id
        LEFT JOIN public.courses c ON i.course_id = c.id
        LEFT JOIN public.batches b ON i.batch_id = b.id
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT 100
      `);

      return NextResponse.json({ success: true, payments: allPayments || [] }, { headers: corsHeaders });
    }

    return NextResponse.json({ success: true, payments: [] }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Student payments GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch student payments' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required: Please sign in to record a payment.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const isStaff = user.role === 'owner' || user.role === 'receptionist';
    if (!isStaff && user.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Only staff or authorized students may submit fee payments.' },
        { status: 403, headers: corsHeaders }
      );
    }

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

    if (!isStaff && user.role === 'student') {
      const ownStudent = await queryOne<{ id: string }>(`
        SELECT id FROM public.students WHERE profile_id::text = $1 OR id::text = $1 LIMIT 1
      `, [user.userId]);

      if (!ownStudent) {
        return NextResponse.json(
          { success: false, error: 'Student record not found for authenticated account.' },
          { status: 404, headers: corsHeaders }
        );
      }
      targetStudentId = ownStudent.id;
    }

    if (!targetStudentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID or roll number is required' },
        { status: 400, headers: corsHeaders }
      );
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
      receipt_issued_by: isStaff ? (user.fullName || 'Academy Staff') : 'Student Mobile Portal'
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

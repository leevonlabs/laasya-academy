import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const receptionistId = searchParams.get('receptionist_id');

    let sql = `
      SELECT 
        s.id,
        s.receptionist_id,
        s.month_year,
        s.amount,
        s.status,
        s.payment_date,
        s.payment_mode,
        s.notes,
        s.created_at,
        r.full_name as receptionist_name,
        r.phone as receptionist_phone,
        r.email as receptionist_email,
        r.monthly_salary
      FROM public.receptionist_salaries s
      JOIN public.receptionists r ON s.receptionist_id = r.id
    `;
    const params: any[] = [];

    if (receptionistId) {
      sql += ` WHERE s.receptionist_id = $1`;
      params.push(receptionistId);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const list = await query<any>(sql, params);
    return NextResponse.json({ success: true, salaries: list });
  } catch (err: any) {
    console.error('Error fetching receptionist salaries:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receptionist_id, month_year, amount, status, payment_date, payment_mode, notes } = body;

    if (!receptionist_id || !month_year || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: 'Receptionist ID, month/year, and salary amount are required.' },
        { status: 400 }
      );
    }

    const created = await queryOne<any>(
      `INSERT INTO public.receptionist_salaries (
        receptionist_id, 
        month_year, 
        amount, 
        status, 
        payment_date, 
        payment_mode, 
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        receptionist_id,
        month_year.trim(),
        parseFloat(amount.toString()),
        status || 'Issued',
        payment_date || new Date().toISOString().split('T')[0],
        payment_mode || 'Bank Transfer',
        notes?.trim() || null
      ]
    );

    return NextResponse.json({ success: true, salary: created });
  } catch (err: any) {
    console.error('Error creating receptionist salary notice:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, amount, status, payment_date, payment_mode, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Salary notice ID is required.' }, { status: 400 });
    }

    const updated = await queryOne<any>(
      `UPDATE public.receptionist_salaries
       SET amount = COALESCE($1, amount),
           status = COALESCE($2, status),
           payment_date = COALESCE($3, payment_date),
           payment_mode = COALESCE($4, payment_mode),
           notes = COALESCE($5, notes)
       WHERE id = $6
       RETURNING *`,
      [
        amount !== undefined ? parseFloat(amount.toString()) : null,
        status || null,
        payment_date || null,
        payment_mode || null,
        notes !== undefined ? notes : null,
        id
      ]
    );

    return NextResponse.json({ success: true, salary: updated });
  } catch (err: any) {
    console.error('Error updating receptionist salary notice:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Salary notice ID is required' }, { status: 400 });
    }

    await query(`DELETE FROM public.receptionist_salaries WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, message: 'Salary notice deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting receptionist salary notice:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

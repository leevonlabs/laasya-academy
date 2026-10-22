import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const list = await query<any>(`
      SELECT id, full_name, age, phone, alternative_phone, email, address, password_hash, allowed_pages, is_active, monthly_salary, can_delete, created_at, updated_at
      FROM public.receptionists
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ success: true, receptionists: list });
  } catch (err: any) {
    console.error('Error fetching receptionists:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      full_name, 
      age, 
      phone, 
      alternative_phone, 
      email, 
      address, 
      password, 
      is_active, 
      allowed_pages, 
      monthly_salary,
      can_delete
    } = body;

    if (!full_name || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Full name, primary contact number, and password are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');

    // Check if primary phone already exists
    const existing = await queryOne<any>(
      `SELECT id FROM public.receptionists WHERE regexp_replace(phone, '\\D', '', 'g') = $1`,
      [cleanDigits]
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A receptionist with this primary contact number already exists.' },
        { status: 400 }
      );
    }

    const pagesJson = JSON.stringify(Array.isArray(allowed_pages) ? allowed_pages : []);
    const parsedAge = age ? parseInt(age.toString(), 10) : null;
    const parsedSalary = monthly_salary ? parseFloat(monthly_salary.toString()) : 20000;
    const activeStatus = is_active !== false;
    const allowDelete = Boolean(can_delete);

    const created = await queryOne<any>(
      `INSERT INTO public.receptionists (
        full_name, 
        age, 
        phone, 
        alternative_phone, 
        email, 
        address, 
        password_hash, 
        allowed_pages, 
        is_active, 
        monthly_salary,
        can_delete
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
      RETURNING id, full_name, age, phone, alternative_phone, email, address, password_hash, allowed_pages, is_active, monthly_salary, can_delete, created_at`,
      [
        full_name.trim(),
        parsedAge,
        cleanPhone,
        alternative_phone?.trim() || null,
        (email || '').trim() || null,
        address?.trim() || null,
        password.trim(),
        pagesJson,
        activeStatus,
        parsedSalary,
        allowDelete
      ]
    );

    return NextResponse.json({ success: true, receptionist: created });
  } catch (err: any) {
    console.error('Error creating receptionist:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, 
      full_name, 
      age, 
      phone, 
      alternative_phone, 
      email, 
      address, 
      password, 
      is_active, 
      allowed_pages, 
      monthly_salary,
      can_delete
    } = body;

    if (!id || !full_name || !phone) {
      return NextResponse.json(
        { success: false, error: 'ID, name, and primary contact number are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');

    // Check if duplicate phone on another record
    const duplicate = await queryOne<any>(
      `SELECT id FROM public.receptionists 
       WHERE regexp_replace(phone, '\\D', '', 'g') = $1 AND id != $2`,
      [cleanDigits, id]
    );

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'Another receptionist already has this contact number.' },
        { status: 400 }
      );
    }

    const pagesJson = JSON.stringify(Array.isArray(allowed_pages) ? allowed_pages : []);
    const parsedAge = age ? parseInt(age.toString(), 10) : null;
    const parsedSalary = monthly_salary ? parseFloat(monthly_salary.toString()) : 20000;
    const activeStatus = is_active !== false;
    const allowDelete = Boolean(can_delete);

    let updated;
    if (password && password.trim().length > 0) {
      updated = await queryOne<any>(
        `UPDATE public.receptionists
         SET full_name = $1,
             age = $2,
             phone = $3,
             alternative_phone = $4,
             email = $5,
             address = $6,
             password_hash = $7,
             allowed_pages = $8::jsonb,
             is_active = $9,
             monthly_salary = $10,
             can_delete = $11,
             updated_at = NOW()
         WHERE id = $12
         RETURNING id, full_name, age, phone, alternative_phone, email, address, password_hash, allowed_pages, is_active, monthly_salary, can_delete, created_at, updated_at`,
        [
          full_name.trim(),
          parsedAge,
          cleanPhone,
          alternative_phone?.trim() || null,
          (email || '').trim() || null,
          address?.trim() || null,
          password.trim(),
          pagesJson,
          activeStatus,
          parsedSalary,
          allowDelete,
          id
        ]
      );
    } else {
      updated = await queryOne<any>(
        `UPDATE public.receptionists
         SET full_name = $1,
             age = $2,
             phone = $3,
             alternative_phone = $4,
             email = $5,
             address = $6,
             allowed_pages = $7::jsonb,
             is_active = $8,
             monthly_salary = $9,
             can_delete = $10,
             updated_at = NOW()
         WHERE id = $11
         RETURNING id, full_name, age, phone, alternative_phone, email, address, password_hash, allowed_pages, is_active, monthly_salary, can_delete, created_at, updated_at`,
        [
          full_name.trim(),
          parsedAge,
          cleanPhone,
          alternative_phone?.trim() || null,
          (email || '').trim() || null,
          address?.trim() || null,
          pagesJson,
          activeStatus,
          parsedSalary,
          allowDelete,
          id
        ]
      );
    }

    return NextResponse.json({ success: true, receptionist: updated });
  } catch (err: any) {
    console.error('Error updating receptionist:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Receptionist ID is required' }, { status: 400 });
    }

    await query(`DELETE FROM public.receptionist_salaries WHERE receptionist_id = $1`, [id]);
    await query(`DELETE FROM public.receptionists WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'Receptionist deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting receptionist:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

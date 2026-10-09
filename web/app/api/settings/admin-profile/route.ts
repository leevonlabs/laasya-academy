import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, updateAdminPassword } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    // Fetch admin profile from database
    const profile = await queryOne<any>(`
      SELECT 
        p.id,
        p.full_name,
        p.phone,
        p.email,
        p.role,
        p.avatar_url,
        p.created_at
      FROM public.profiles p
      WHERE p.role = 'owner'
      ORDER BY p.created_at ASC
      LIMIT 1
    `);

    const adminDetails = {
      name: profile?.full_name || 'Satya',
      phone: profile?.phone || '7780763121',
      email: profile?.email || 'admin@laasyaacademy.com',
      role: 'Super Administrator & Academy Director',
      employee_id: 'LCA-ADM-001',
      joining_date: '15 January 2023',
      department: 'Central Administration & Academic Governance',
      campus: 'Laasya Cultural Academy, Main Campus',
      status: 'Active (Full Privileges)',
      system_access: [
        'Curriculum & Course Framework',
        'Faculty Gurus & Batch Allocation',
        'Disciple Admissions & Fee Ledger',
        'Official Event Video Library',
        'Central Broadcast Notifications',
        'Role & Access Management',
      ],
    };

    return NextResponse.json({ success: true, profile: adminDetails }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch admin profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { new_password, current_password } = body;

    if (!new_password || new_password.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 4 characters long.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update admin password in database
    await updateAdminPassword(new_password.trim());

    // Also update phone or name if provided
    if (body.name || body.phone) {
      await query(`
        UPDATE public.profiles
        SET full_name = COALESCE($1, full_name),
            phone = COALESCE($2, phone),
            updated_at = NOW()
        WHERE role = 'owner'
      `, [body.name || null, body.phone || null]);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin password updated successfully. Use your new password on next sign in.'
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error updating admin password:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update admin password' },
      { status: 500, headers: corsHeaders }
    );
  }
}

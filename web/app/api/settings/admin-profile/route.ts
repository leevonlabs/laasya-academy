import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, updateAdminPassword, verifyCurrentPassword } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // 0. Ensure schema compatibility for whatsapp_number column
    try {
      await query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;`);
    } catch {
      // Ignore if DDL is restricted or column already present
    }

    // 1. Fetch admin profile from profiles table using SELECT p.* for backward compatibility
    const profile = await queryOne<any>(`
      SELECT 
        p.*
      FROM public.profiles p
      WHERE p.role = 'owner'
      ORDER BY p.created_at ASC
      LIMIT 1
    `);

    // 2. Fetch extended support directory config from app_config
    const configRow = await queryOne<{ config_value: any }>(`
      SELECT config_value FROM public.app_config WHERE config_key = 'admin_support_profile' LIMIT 1;
    `);

    const cfg = configRow?.config_value || {};

    const adminDetails = {
      full_name: cfg.full_name || profile?.full_name || 'Satya',
      avatar_url: cfg.avatar_url || profile?.avatar_url || '',
      designation: cfg.designation || 'Academy Director & Operations Lead',
      // Private primary login phone for admin dashboard login:
      primary_login_phone: profile?.phone || '7780763121',
      // Official WhatsApp number for landing page link-ups:
      whatsapp_number: cfg.whatsapp_number || profile?.whatsapp_number || '+91 8151 998 899',
      // Public contacts displayed on landing page and bottom bar:
      contacts: (Array.isArray(cfg.contacts) && cfg.contacts.length > 0)
        ? cfg.contacts
        : [
            { title: 'Office Desk & Admissions', phone: '+91 8151 998 899' }
          ],
      emails: (Array.isArray(cfg.emails) && cfg.emails.length > 0)
        ? cfg.emails
        : [
            { title: 'Official Inquiries', email: profile?.email || 'admin@laasyaacademy.com' }
          ],
      campus_address: cfg.campus_address || 'Laasya Cultural Academy, Main Campus, Bangalore / Hyderabad',
      map_url: cfg.map_url || 'https://maps.app.goo.gl/BXwHcSPeUzExxR6V7',
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
    const user = await getCurrentUser();
    if (!user || user.role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator access required.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await request.json();

    // 1. Handle Admin Password Update
    if (body.action === 'change_password' || (body.new_password && !body.action)) {
      const { new_password, current_password } = body;
      if (!new_password || new_password.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long.' },
          { status: 400, headers: corsHeaders }
        );
      }

      if (current_password) {
        const isValid = await verifyCurrentPassword(user.userId, current_password);
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: 'Current password is incorrect.' },
            { status: 401, headers: corsHeaders }
          );
        }
      }

      await updateAdminPassword(new_password.trim(), user.userId);
      return NextResponse.json({
        success: true,
        message: 'Admin password updated successfully.'
      }, { headers: corsHeaders });
    }

    // 2. Handle Admin Profile Edit & Save
    const fullName = (body.full_name || body.name || 'Satya').toString().trim();
    const designation = (body.designation || 'Academy Director & Operations Lead').toString().trim();
    const campusAddress = (body.campus_address || 'Laasya Cultural Academy, Main Campus, Bangalore / Hyderabad').toString().trim();
    const mapUrl = (body.map_url || '').toString().trim();
    const avatarUrl = body.avatar_url !== undefined ? body.avatar_url : null;
    const whatsappNumber = (body.whatsapp_number || '+91 8151 998 899').toString().trim();
    const primaryLoginPhone = (body.primary_login_phone || '').toString().trim();

    // Public contacts array: [{ title, phone }] (filtered to exclude developer/private contact)
    let contacts: Array<{ title: string; phone: string }> = [];
    if (Array.isArray(body.contacts)) {
      contacts = body.contacts
        .filter((c: any) => c && (c.phone || c.title))
        .map((c: any) => ({
          title: String(c.title || 'Contact').trim(),
          phone: String(c.phone || '').trim()
        }));
    }
    if (contacts.length === 0) {
      contacts = [{ title: 'Office Desk & Admissions', phone: whatsappNumber || '+91 8151 998 899' }];
    }

    // Emails array: [{ title, email }]
    let emails: Array<{ title: string; email: string }> = [];
    if (Array.isArray(body.emails)) {
      emails = body.emails
        .filter((e: any) => e && (e.email || e.title))
        .map((e: any) => ({
          title: String(e.title || 'Email').trim(),
          email: String(e.email || '').trim()
        }));
    }
    if (emails.length === 0) {
      emails = [{ title: 'Official Inquiries', email: 'admin@laasyaacademy.com' }];
    }

    const supportConfig = {
      full_name: fullName,
      avatar_url: avatarUrl,
      designation,
      whatsapp_number: whatsappNumber,
      contacts,
      emails,
      campus_address: campusAddress,
      map_url: mapUrl
    };

    // Upsert into app_config
    await query(`
      INSERT INTO public.app_config (config_key, config_value, description, updated_at)
      VALUES ($1, $2::jsonb, $3, NOW())
      ON CONFLICT (config_key)
      DO UPDATE SET
        config_value = EXCLUDED.config_value,
        updated_at = NOW();
    `, [
      'admin_support_profile',
      JSON.stringify(supportConfig),
      'Official academy support directory, public WhatsApp, and contact information'
    ]);

    // Update public.profiles table for the owner:
    // Update whatsapp_number, and if primary_login_phone is provided, update phone (admin dashboard login credential)
    try {
      await query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;`);
    } catch {
      // Ignore
    }

    const currentUser = await getCurrentUser();
    if (currentUser?.userId) {
      await query(`
        UPDATE public.profiles
        SET full_name = $1,
            avatar_url = COALESCE($2, avatar_url),
            whatsapp_number = $3,
            phone = CASE WHEN LENGTH($4) > 0 THEN $4 ELSE phone END,
            updated_at = NOW()
        WHERE id = $5;
      `, [fullName, avatarUrl, whatsappNumber, primaryLoginPhone, currentUser.userId]);
    } else {
      await query(`
        UPDATE public.profiles
        SET full_name = $1,
            avatar_url = COALESCE($2, avatar_url),
            whatsapp_number = $3,
            phone = CASE WHEN LENGTH($4) > 0 THEN $4 ELSE phone END,
            updated_at = NOW()
        WHERE role = 'owner';
      `, [fullName, avatarUrl, whatsappNumber, primaryLoginPhone]);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile updated successfully!',
      profile: {
        ...supportConfig,
        primary_login_phone: primaryLoginPhone || '7780763121'
      }
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update admin profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

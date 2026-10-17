import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, updateAdminPassword } from '@/lib/auth';
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
    // 1. Fetch admin profile from profiles table
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

    // 2. Fetch extended support directory config from app_config
    const configRow = await queryOne<{ config_value: any }>(`
      SELECT config_value FROM public.app_config WHERE config_key = 'admin_support_profile' LIMIT 1;
    `);

    const cfg = configRow?.config_value || {};

    const adminDetails = {
      full_name: cfg.full_name || profile?.full_name || 'Satya',
      avatar_url: cfg.avatar_url || profile?.avatar_url || '',
      designation: cfg.designation || 'Academy Director & Operations Lead',
      contacts: (Array.isArray(cfg.contacts) && cfg.contacts.length > 0)
        ? cfg.contacts
        : [
            { title: 'Office Desk & Admissions', phone: profile?.phone || '7780763121' }
          ],
      emails: (Array.isArray(cfg.emails) && cfg.emails.length > 0)
        ? cfg.emails
        : [
            { title: 'Official Inquiries', email: profile?.email || 'admin@laasyaacademy.com' }
          ],
      campus_address: cfg.campus_address || 'Laasya Cultural Academy, Main Campus, Hyderabad',
      map_url: cfg.map_url || 'https://maps.google.com/?q=Laasya+Cultural+Academy',
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

    // 1. Handle Admin Password Update
    if (body.action === 'change_password' || (body.new_password && !body.action)) {
      const { new_password } = body;
      if (!new_password || new_password.trim().length < 4) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 4 characters long.' },
          { status: 400, headers: corsHeaders }
        );
      }

      await updateAdminPassword(new_password.trim());
      return NextResponse.json({
        success: true,
        message: 'Admin password updated successfully.'
      }, { headers: corsHeaders });
    }

    // 2. Handle Admin Profile Edit & Save
    const fullName = (body.full_name || body.name || 'Satya').toString().trim();
    const designation = (body.designation || 'Academy Director & Operations Lead').toString().trim();
    const campusAddress = (body.campus_address || 'Laasya Cultural Academy, Main Campus, Hyderabad').toString().trim();
    const mapUrl = (body.map_url || '').toString().trim();
    const avatarUrl = body.avatar_url !== undefined ? body.avatar_url : null;

    // Contacts array: [{ title, phone }]
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
      contacts = [{ title: 'Office Desk & Admissions', phone: '7780763121' }];
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
      'Official academy support directory and admin contact information'
    ]);

    // Also sync to public.profiles table for the owner
    const primaryPhone = contacts[0]?.phone || '7780763121';
    const currentUser = await getCurrentUser();
    if (currentUser?.userId) {
      await query(`
        UPDATE public.profiles
        SET full_name = $1,
            phone = COALESCE($2, phone),
            avatar_url = COALESCE($3, avatar_url),
            updated_at = NOW()
        WHERE id = $4;
      `, [fullName, primaryPhone, avatarUrl, currentUser.userId]);
    } else {
      await query(`
        UPDATE public.profiles
        SET full_name = $1,
            avatar_url = COALESCE($2, avatar_url),
            updated_at = NOW()
        WHERE role = 'owner';
      `, [fullName, avatarUrl]);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile updated successfully!',
      profile: supportConfig
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update admin profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}

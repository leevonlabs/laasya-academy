import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ notifications: [] }, { status: 200 });
    }

    const notifs: any[] = [];

    // 1. Live student fee payments
    try {
      const payments = await query<any>(`
        SELECT p.id, p.amount, p.payment_date, p.payment_method, p.receipt_number,
               s.full_name as student_name, s.roll_number,
               c.title as course_title, b.name as batch_name
        FROM public.student_fee_payments p
        JOIN public.students s ON s.id = p.student_id
        LEFT JOIN public.batches b ON b.id = p.batch_id
        LEFT JOIN public.courses c ON c.id = b.course_id
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT 20;
      `);

      for (const p of payments) {
        notifs.push({
          id: `pay-${p.id}`,
          category: 'payment',
          title: 'Student Tuition Fee Received',
          description: `${p.student_name} paid ₹${Number(p.amount).toLocaleString('en-IN')} via ${p.payment_method || 'UPI'}. Receipt #${p.receipt_number || 'LCA-REC'} generated.`,
          timestamp: p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          unread: false,
          amount: Number(p.amount),
          actorName: p.student_name,
          actorRole: `Disciple (${p.roll_number || 'LCA'})`,
          actionUrl: '/finance/fees',
          actionLabel: 'View Payment Receipt',
          metadata: {
            course: p.course_title,
            batch: p.batch_name,
            receiptNo: p.receipt_number
          }
        });
      }
    } catch (_) {}

    // 2. Live guru salary payments
    try {
      const salaries = await query<any>(`
        SELECT gp.id, gp.amount, gp.payment_date, gp.payment_method, gp.receipt_number,
               pr.full_name as guru_name, gp.payment_type
        FROM public.guru_payments gp
        JOIN public.trainers t ON t.id = gp.trainer_id
        JOIN public.profiles pr ON pr.id = t.profile_id
        ORDER BY gp.payment_date DESC, gp.created_at DESC
        LIMIT 10;
      `);

      for (const sal of salaries) {
        notifs.push({
          id: `sal-${sal.id}`,
          category: 'salary',
          title: 'Guru Salary / Honorarium Disbursed',
          description: `Honorarium of ₹${Number(sal.amount).toLocaleString('en-IN')} disbursed to Guru ${sal.guru_name} via ${sal.payment_method || 'Bank Transfer'}.`,
          timestamp: sal.payment_date ? new Date(sal.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          unread: false,
          amount: Number(sal.amount),
          actorName: `Guru ${sal.guru_name}`,
          actorRole: 'Faculty Guru',
          actionUrl: '/finance/salaries',
          actionLabel: 'View Disbursal Details',
          metadata: {
            receiptNo: sal.receipt_number
          }
        });
      }
    } catch (_) {}

    // 3. Live faculty messages / announcements
    try {
      const msgs = await query<any>(`
        SELECT id, title, message, sender_role, trainer_name, created_at, target_course_title, target_batch_name
        FROM public.announcements
        WHERE announcement_type = 'message' OR announcement_type = 'notification'
        ORDER BY created_at DESC
        LIMIT 15;
      `);

      for (const m of msgs) {
        notifs.push({
          id: `msg-${m.id}`,
          category: 'message',
          title: m.title || 'Guru Message',
          description: m.message || '',
          timestamp: m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          unread: false,
          actorName: m.trainer_name ? `Guru ${m.trainer_name}` : 'Academy Administration',
          actorRole: m.sender_role || 'Faculty',
          actionUrl: '/announcements',
          actionLabel: 'Open Announcements',
          metadata: {
            course: m.target_course_title,
            batch: m.target_batch_name
          }
        });
      }
    } catch (_) {}

    // 4. Live video shares
    try {
      const videos = await query<any>(`
        SELECT vl.id, vl.title, vl.description, vl.created_at, vl.target_batch_name,
               c.title as course_title, pr.full_name as guru_name
        FROM public.video_library vl
        LEFT JOIN public.courses c ON c.id = vl.course_id
        LEFT JOIN public.trainers t ON t.id = vl.trainer_id
        LEFT JOIN public.profiles pr ON pr.id = t.profile_id
        ORDER BY vl.created_at DESC
        LIMIT 10;
      `);

      for (const v of videos) {
        notifs.push({
          id: `vid-${v.id}`,
          category: 'video',
          title: 'New Video Lecture Shared',
          description: `${v.title}: ${v.description || ''}`,
          timestamp: v.created_at ? new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          unread: false,
          actorName: v.guru_name ? `Guru ${v.guru_name}` : 'Faculty Guru',
          actorRole: 'Faculty',
          actionUrl: '/video-library',
          actionLabel: 'Watch Video & Curriculum',
          metadata: {
            course: v.course_title,
            batch: v.target_batch_name
          }
        });
      }
    } catch (_) {}

    return NextResponse.json({ notifications: notifs });
  } catch (err: any) {
    return NextResponse.json({ notifications: [], error: err.message });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTrainers, createTrainer, updateTrainer, deleteTrainer } from '@/lib/academy';

export async function GET() {
  const user = await getCurrentUser();
  const trainers = await getTrainers();
  const isStaff = user?.role === 'owner' || user?.role === 'receptionist';

  if (!isStaff) {
    // Sanitize and redact private payroll, phone, and personal contact details for public view
    const publicTrainers = trainers.map((t: any) => ({
      id: t.id,
      guru_id: t.guru_id,
      code: t.code,
      full_name: t.full_name,
      avatar_url: t.avatar_url,
      display_title: t.display_title,
      specializations: t.specializations,
      bio: t.bio,
      experience: t.experience,
      is_active: t.is_active,
      batches_assigned: t.batches_assigned,
      batches: (t.batches || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        course_title: b.course_title,
        course_category: b.course_category,
        days_of_week: b.days_of_week,
        start_time: b.start_time,
        end_time: b.end_time,
      }))
    }));
    return NextResponse.json(publicTrainers);
  }

  return NextResponse.json(trainers);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const trainer = await createTrainer(body);
    return NextResponse.json(trainer);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'Guru ID is required' }, { status: 400 });
    }
    const updated = await updateTrainer(id, data);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'owner' && !(user.role === 'receptionist' && user.canDelete))) {
    return NextResponse.json({ error: 'Unauthorized: Delete permission denied' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Guru ID is required' }, { status: 400 });
    }
    const deleted = await deleteTrainer(id);
    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

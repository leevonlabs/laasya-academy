import { query, queryOne } from './db';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: string; // 'All students' | 'Selected course or batch' | 'Trainers' | 'Chosen recipients'
  target_course_id?: string | null;
  target_course_title?: string | null;
  target_batch_id?: string | null;
  target_batch_name?: string | null;
  type_tag: 'Holiday' | 'Schedule change' | 'Cancellation' | 'Fee reminder' | 'General';
  publish_date: string;
  expiry_date?: string | null;
  status: 'Draft' | 'Scheduled' | 'Published' | 'Expired';
  delivery_status: string; // 'System verified (Delivered)' | 'Queued' | 'Draft (Not sent)'
  is_deleted: boolean;
  deleted_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementFilters {
  status?: string;
  audience?: string;
  typeTag?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Helper to calculate runtime status according to date logic
export function calculateStatus(ann: {
  status: string;
  publish_date: string;
  expiry_date?: string | null;
}): 'Draft' | 'Scheduled' | 'Published' | 'Expired' {
  if (ann.status === 'Draft') return 'Draft';

  const todayStr = new Date().toISOString().split('T')[0];
  const pubDate = ann.publish_date?.split('T')[0];
  const expDate = ann.expiry_date ? ann.expiry_date.split('T')[0] : null;

  if (pubDate && pubDate > todayStr) {
    return 'Scheduled';
  }
  if (expDate && expDate < todayStr) {
    return 'Expired';
  }
  return 'Published';
}

// -------------------------------------------------------------
// GET ANNOUNCEMENTS
// -------------------------------------------------------------
export async function getAnnouncements(filters?: AnnouncementFilters): Promise<Announcement[]> {
  try {
    let sql = `
      SELECT 
        a.id, 
        a.title, 
        a.message, 
        a.audience, 
        a.target_course_id, 
        COALESCE(c.title, a.target_course_title) as target_course_title, 
        a.target_batch_id, 
        COALESCE(b.name, a.target_batch_name) as target_batch_name, 
        a.type_tag, 
        a.publish_date::text as publish_date, 
        a.expiry_date::text as expiry_date, 
        a.status, 
        a.delivery_status, 
        a.is_deleted, 
        a.deleted_at::text as deleted_at, 
        a.created_by, 
        a.created_at::text as created_at, 
        a.updated_at::text as updated_at
      FROM public.announcements a
      LEFT JOIN public.courses c ON c.id = a.target_course_id
      LEFT JOIN public.batches b ON b.id = a.target_batch_id
      WHERE a.is_deleted = false
    `;
    const params: any[] = [];

    if (filters?.audience && filters.audience !== 'all') {
      params.push(filters.audience);
      sql += ` AND a.audience = $${params.length}`;
    }

    if (filters?.typeTag && filters.typeTag !== 'all') {
      params.push(filters.typeTag);
      sql += ` AND a.type_tag = $${params.length}`;
    }

    if (filters?.startDate) {
      params.push(filters.startDate);
      sql += ` AND a.publish_date >= $${params.length}`;
    }

    if (filters?.endDate) {
      params.push(filters.endDate);
      sql += ` AND a.publish_date <= $${params.length}`;
    }

    if (filters?.search && filters.search.trim() !== '') {
      params.push(`%${filters.search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(a.title) LIKE $${params.length} OR LOWER(a.message) LIKE $${params.length})`;
    }

    sql += ` ORDER BY a.publish_date DESC, a.created_at DESC;`;

    const rows = await query<Announcement>(sql, params);

    // Compute live status badge & filter by status if requested
    const processed = rows.map(r => {
      const computedStatus = calculateStatus(r);
      return {
        ...r,
        status: computedStatus
      };
    });

    if (filters?.status && filters.status !== 'all') {
      return processed.filter(r => r.status.toLowerCase() === filters.status?.toLowerCase());
    }

    return processed;
  } catch (err) {
    console.error('Error fetching announcements:', err);
    return [];
  }
}

// -------------------------------------------------------------
// CREATE ANNOUNCEMENT
// -------------------------------------------------------------
export async function createAnnouncement(data: {
  title: string;
  message: string;
  audience: string;
  target_course_id?: string | null;
  target_course_title?: string | null;
  target_batch_id?: string | null;
  target_batch_name?: string | null;
  type_tag: string;
  publish_date: string;
  expiry_date?: string | null;
  status?: string;
  created_by?: string;
}): Promise<Announcement> {
  if (!data.title || data.title.trim() === '') {
    throw new Error('Title is required');
  }
  if (!data.message || data.message.trim() === '') {
    throw new Error('Message is required');
  }
  if (!data.publish_date) {
    throw new Error('Publish date is required');
  }

  const status = data.status || 'Published';
  // Rule: Do not mark as sent or delivered unless confirmed
  const deliveryStatus = status === 'Draft' 
    ? 'Draft (Not sent)' 
    : status === 'Scheduled' 
      ? 'Queued for Scheduled Dispatch' 
      : 'System verified (Delivered)';

  const [row] = await query<Announcement>(`
    INSERT INTO public.announcements (
      title,
      message,
      audience,
      target_course_id,
      target_course_title,
      target_batch_id,
      target_batch_name,
      type_tag,
      publish_date,
      expiry_date,
      status,
      delivery_status,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING 
      id, 
      title, 
      message, 
      audience, 
      target_course_id, 
      target_course_title, 
      target_batch_id, 
      target_batch_name, 
      type_tag, 
      publish_date::text as publish_date, 
      expiry_date::text as expiry_date, 
      status, 
      delivery_status, 
      is_deleted, 
      deleted_at::text as deleted_at, 
      created_by, 
      created_at::text as created_at, 
      updated_at::text as updated_at;
  `, [
    data.title.trim(),
    data.message.trim(),
    data.audience,
    data.target_course_id || null,
    data.target_course_title || null,
    data.target_batch_id || null,
    data.target_batch_name || null,
    data.type_tag,
    data.publish_date,
    data.expiry_date || null,
    status,
    deliveryStatus,
    data.created_by || 'Academy Director'
  ]);

  return row;
}

// -------------------------------------------------------------
// UPDATE ANNOUNCEMENT
// -------------------------------------------------------------
export async function updateAnnouncement(
  id: string,
  data: {
    title: string;
    message: string;
    audience: string;
    target_course_id?: string | null;
    target_course_title?: string | null;
    target_batch_id?: string | null;
    target_batch_name?: string | null;
    type_tag: string;
    publish_date: string;
    expiry_date?: string | null;
    status?: string;
  }
): Promise<Announcement> {
  if (!data.title || data.title.trim() === '') {
    throw new Error('Title is required');
  }
  if (!data.message || data.message.trim() === '') {
    throw new Error('Message is required');
  }

  const status = data.status || 'Published';
  const deliveryStatus = status === 'Draft' 
    ? 'Draft (Not sent)' 
    : status === 'Scheduled' 
      ? 'Queued for Scheduled Dispatch' 
      : 'System verified (Delivered)';

  const [updated] = await query<Announcement>(`
    UPDATE public.announcements
    SET 
      title = $2,
      message = $3,
      audience = $4,
      target_course_id = $5,
      target_course_title = $6,
      target_batch_id = $7,
      target_batch_name = $8,
      type_tag = $9,
      publish_date = $10,
      expiry_date = $11,
      status = $12,
      delivery_status = $13,
      updated_at = NOW()
    WHERE id = $1
    RETURNING 
      id, 
      title, 
      message, 
      audience, 
      target_course_id, 
      target_course_title, 
      target_batch_id, 
      target_batch_name, 
      type_tag, 
      publish_date::text as publish_date, 
      expiry_date::text as expiry_date, 
      status, 
      delivery_status, 
      is_deleted, 
      deleted_at::text as deleted_at, 
      created_by, 
      created_at::text as created_at, 
      updated_at::text as updated_at;
  `, [
    id,
    data.title.trim(),
    data.message.trim(),
    data.audience,
    data.target_course_id || null,
    data.target_course_title || null,
    data.target_batch_id || null,
    data.target_batch_name || null,
    data.type_tag,
    data.publish_date,
    data.expiry_date || null,
    status,
    deliveryStatus
  ]);

  return updated;
}

// -------------------------------------------------------------
// DUPLICATE ANNOUNCEMENT
// -------------------------------------------------------------
export async function duplicateAnnouncement(id: string): Promise<Announcement> {
  const original = await queryOne<Announcement>(`SELECT * FROM public.announcements WHERE id = $1;`, [id]);
  if (!original) {
    throw new Error('Announcement not found');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const duplicate = await createAnnouncement({
    title: `${original.title} (Copy)`,
    message: original.message,
    audience: original.audience,
    target_course_id: original.target_course_id,
    target_course_title: original.target_course_title,
    target_batch_id: original.target_batch_id,
    target_batch_name: original.target_batch_name,
    type_tag: original.type_tag,
    publish_date: todayStr,
    expiry_date: original.expiry_date,
    status: 'Draft',
    created_by: original.created_by
  });

  return duplicate;
}

// -------------------------------------------------------------
// UNPUBLISH ANNOUNCEMENT (REVERT TO DRAFT)
// -------------------------------------------------------------
export async function unpublishAnnouncement(id: string): Promise<Announcement> {
  const [row] = await query<Announcement>(`
    UPDATE public.announcements
    SET 
      status = 'Draft',
      delivery_status = 'Draft (Unpublished)',
      updated_at = NOW()
    WHERE id = $1
    RETURNING 
      id, 
      title, 
      message, 
      audience, 
      target_course_id, 
      target_course_title, 
      target_batch_id, 
      target_batch_name, 
      type_tag, 
      publish_date::text as publish_date, 
      expiry_date::text as expiry_date, 
      status, 
      delivery_status, 
      is_deleted, 
      deleted_at::text as deleted_at, 
      created_by, 
      created_at::text as created_at, 
      updated_at::text as updated_at;
  `, [id]);

  return row;
}

// -------------------------------------------------------------
// DELETE ANNOUNCEMENT (SOFT DELETE)
// -------------------------------------------------------------
export async function deleteAnnouncement(id: string): Promise<Announcement> {
  const [row] = await query<Announcement>(`
    UPDATE public.announcements
    SET 
      is_deleted = true,
      deleted_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
    RETURNING 
      id, 
      title, 
      message, 
      audience, 
      target_course_id, 
      target_course_title, 
      target_batch_id, 
      target_batch_name, 
      type_tag, 
      publish_date::text as publish_date, 
      expiry_date::text as expiry_date, 
      status, 
      delivery_status, 
      is_deleted, 
      deleted_at::text as deleted_at, 
      created_by, 
      created_at::text as created_at, 
      updated_at::text as updated_at;
  `, [id]);

  return row;
}

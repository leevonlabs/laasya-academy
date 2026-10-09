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
  publish_time?: string | null;
  expiry_date?: string | null;
  status: 'Draft' | 'Scheduled' | 'Published' | 'Expired';
  delivery_status: string; // 'System verified (Delivered)' | 'Queued' | 'Draft (Not sent)'
  image_url?: string | null;
  announcement_type?: 'banner' | 'message' | 'notification' | string;
  action_links?: Array<{ title: string; url: string }> | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  created_by: string;
  sender_role?: 'admin' | 'trainer' | string;
  trainer_id?: string | null;
  trainer_name?: string | null;
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
  announcementType?: string;
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
        a.image_url,
        a.announcement_type,
        a.action_links,
        a.is_deleted, 
        a.deleted_at::text as deleted_at, 
        a.created_by, 
        a.sender_role,
        a.trainer_id,
        a.trainer_name,
        a.created_at::text as created_at, 
        a.updated_at::text as updated_at
      FROM public.announcements a
      LEFT JOIN public.courses c ON c.id = a.target_course_id
      LEFT JOIN public.batches b ON b.id = a.target_batch_id
      WHERE a.is_deleted = false
    `;
    const params: any[] = [];

    if (filters?.announcementType && filters.announcementType !== 'all') {
      if (filters.announcementType === 'banner') {
        sql += ` AND (a.announcement_type = 'banner')`;
      } else if (filters.announcementType === 'message') {
        // Enforce 30-day lifespan: Messages older than 30 days are automatically deleted/omitted
        sql += ` AND (a.announcement_type = 'message' OR a.announcement_type = 'notification' OR a.announcement_type IS NULL OR a.announcement_type != 'banner')`;
        sql += ` AND (a.publish_date >= CURRENT_DATE - INTERVAL '30 days' OR a.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days')`;
      } else {
        params.push(filters.announcementType);
        sql += ` AND a.announcement_type = $${params.length}`;
      }
    }

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
    const thirtyDaysAgoTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const processed = rows
      .map(r => {
        const computedStatus = calculateStatus(r);
        return {
          ...r,
          status: computedStatus
        };
      })
      .filter(r => {
        // Enforce 30-day message lifespan: Messages older than 30 days are automatically cleared
        const isMsg = r.announcement_type === 'message' || r.announcement_type === 'notification' || (r.announcement_type !== 'banner' && !r.image_url);
        if (isMsg) {
          const pubTime = new Date(r.publish_date).getTime();
          if (pubTime < thirtyDaysAgoTime) {
            return false;
          }
        }
        return true;
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
function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

export async function createAnnouncement(data: {
  title: string;
  message: string;
  audience: string;
  target_course_id?: string | null;
  target_course_title?: string | null;
  target_batch_id?: string | null;
  target_batch_name?: string | null;
  target_students?: any[] | null;
  target_student_names?: string | null;
  type_tag: string;
  publish_date: string;
  expiry_date?: string | null;
  status?: string;
  image_url?: string | null;
  announcement_type?: string;
  action_links?: Array<{ title: string; url: string }> | null;
  created_by?: string;
  sender_role?: string;
  trainer_id?: string | null;
  trainer_name?: string | null;
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

  const annType = data.announcement_type || (data.image_url ? 'banner' : 'message');

  // Enforce 30-day lifespan for message broadcasts
  let expiryDate = data.expiry_date || null;
  if (!expiryDate && annType === 'message') {
    const pub = new Date(data.publish_date);
    pub.setDate(pub.getDate() + 30);
    expiryDate = pub.toISOString().split('T')[0];
  }

  const validCourseId = isValidUuid(data.target_course_id) ? data.target_course_id : null;
  const validBatchId = isValidUuid(data.target_batch_id) ? data.target_batch_id : null;

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
      image_url,
      announcement_type,
      created_by,
      sender_role,
      trainer_id,
      trainer_name,
      action_links,
      target_students,
      target_student_names
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20::jsonb, $21)
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
      image_url,
      announcement_type,
      action_links,
      is_deleted, 
      deleted_at::text as deleted_at, 
      created_by, 
      sender_role,
      trainer_id,
      trainer_name,
      target_students,
      target_student_names,
      created_at::text as created_at, 
      updated_at::text as updated_at;
  `, [
    data.title.trim(),
    data.message.trim(),
    data.audience,
    validCourseId,
    data.target_course_title || null,
    validBatchId,
    data.target_batch_name || null,
    data.type_tag,
    data.publish_date,
    expiryDate,
    status,
    deliveryStatus,
    data.image_url || null,
    annType,
    data.created_by || data.trainer_name || 'Academy Director',
    data.sender_role || 'admin',
    data.trainer_id || null,
    data.trainer_name || null,
    JSON.stringify(data.action_links || []),
    JSON.stringify(data.target_students || []),
    data.target_student_names || null
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
    image_url?: string | null;
    announcement_type?: string;
    action_links?: Array<{ title: string; url: string }> | null;
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
      image_url = $14,
      announcement_type = COALESCE($15, announcement_type),
      action_links = CASE WHEN $16::text IS NOT NULL THEN $16::jsonb ELSE action_links END,
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
      image_url,
      announcement_type,
      action_links,
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
    deliveryStatus,
    data.image_url !== undefined ? data.image_url : null,
    data.announcement_type || null,
    data.action_links !== undefined ? JSON.stringify(data.action_links || []) : null
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
    image_url: original.image_url,
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

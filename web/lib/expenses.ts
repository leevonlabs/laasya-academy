import { query, queryOne } from './db';

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: 'Cash' | 'UPI' | 'Bank transfer' | 'Other';
  vendor?: string | null;
  reference_number?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseAuditLog {
  id: string;
  expense_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  topCategory: { name: string; amount: number } | null;
  expenseCount: number;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  paymentMethod?: string;
  search?: string;
  includeDeleted?: boolean;
}

// -------------------------------------------------------------
// GET EXPENSES
// -------------------------------------------------------------
export async function getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
  try {
    let sql = `
      SELECT 
        id, 
        expense_date::text as expense_date, 
        category, 
        description, 
        amount::float as amount, 
        payment_method, 
        vendor, 
        reference_number, 
        attachment_url, 
        attachment_name, 
        is_deleted, 
        deleted_at::text as deleted_at, 
        created_by, 
        created_at::text as created_at, 
        updated_at::text as updated_at
      FROM public.expenses
      WHERE is_deleted = $1
    `;
    const params: any[] = [filters?.includeDeleted ?? false];

    if (filters?.startDate) {
      params.push(filters.startDate);
      sql += ` AND expense_date >= $${params.length}`;
    }

    if (filters?.endDate) {
      params.push(filters.endDate);
      sql += ` AND expense_date <= $${params.length}`;
    }

    if (filters?.category && filters.category !== 'all') {
      params.push(filters.category);
      sql += ` AND category = $${params.length}`;
    }

    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      params.push(filters.paymentMethod);
      sql += ` AND payment_method = $${params.length}`;
    }

    if (filters?.search && filters.search.trim() !== '') {
      params.push(`%${filters.search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(description) LIKE $${params.length} OR 
        LOWER(COALESCE(vendor, '')) LIKE $${params.length} OR 
        LOWER(COALESCE(reference_number, '')) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY expense_date DESC, created_at DESC;`;

    const rows = await query<Expense>(sql, params);
    return rows;
  } catch (err) {
    console.error('Error in getExpenses:', err);
    return [];
  }
}

// -------------------------------------------------------------
// GET EXPENSE SUMMARY
// -------------------------------------------------------------
export async function getExpenseSummary(filters?: ExpenseFilters): Promise<ExpenseSummary> {
  const expenses = await getExpenses(filters);
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const expenseCount = expenses.length;

  const categoryTotals: Record<string, number> = {};
  for (const e of expenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
  }

  let topCategory: { name: string; amount: number } | null = null;
  let maxAmount = 0;
  for (const [name, amount] of Object.entries(categoryTotals)) {
    if (amount > maxAmount) {
      maxAmount = amount;
      topCategory = { name, amount };
    }
  }

  return {
    totalAmount,
    topCategory,
    expenseCount
  };
}

// -------------------------------------------------------------
// GET CATEGORIES
// -------------------------------------------------------------
export async function getExpenseCategories(): Promise<{ id: string; name: string; is_custom: boolean }[]> {
  try {
    const rows = await query<{ id: string; name: string; is_custom: boolean }>(`
      SELECT id, name, is_custom 
      FROM public.expense_categories
      ORDER BY is_custom ASC, name ASC;
    `);
    return rows;
  } catch (err) {
    console.error('Error in getExpenseCategories:', err);
    return [
      { id: '1', name: 'Rent', is_custom: false },
      { id: '2', name: 'Electricity', is_custom: false },
      { id: '3', name: 'Maintenance', is_custom: false },
      { id: '4', name: 'Supplies', is_custom: false },
      { id: '5', name: 'Instruments', is_custom: false },
      { id: '6', name: 'Costumes', is_custom: false },
      { id: '7', name: 'Event costs', is_custom: false },
      { id: '8', name: 'Other', is_custom: false }
    ];
  }
}

// -------------------------------------------------------------
// ADD CUSTOM CATEGORY
// -------------------------------------------------------------
export async function addExpenseCategory(name: string): Promise<{ id: string; name: string; is_custom: boolean }> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Category name cannot be empty');
  }

  const existing = await queryOne<{ id: string; name: string; is_custom: boolean }>(`
    SELECT id, name, is_custom FROM public.expense_categories WHERE LOWER(name) = LOWER($1);
  `, [trimmed]);

  if (existing) {
    return existing;
  }

  const [created] = await query<{ id: string; name: string; is_custom: boolean }>(`
    INSERT INTO public.expense_categories (name, is_custom)
    VALUES ($1, true)
    RETURNING id, name, is_custom;
  `, [trimmed]);

  return created;
}

// -------------------------------------------------------------
// CREATE EXPENSE
// -------------------------------------------------------------
export async function createExpense(data: {
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: 'Cash' | 'UPI' | 'Bank transfer' | 'Other';
  vendor?: string | null;
  reference_number?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  created_by?: string;
}): Promise<Expense> {
  if (!data.expense_date) {
    throw new Error('Date is required');
  }
  if (!data.amount || Number(data.amount) <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  if (!data.category || data.category.trim() === '') {
    throw new Error('Category is required');
  }
  if (!data.description || data.description.trim() === '') {
    throw new Error('Description is required');
  }

  const [row] = await query<Expense>(`
    INSERT INTO public.expenses (
      expense_date,
      category,
      description,
      amount,
      payment_method,
      vendor,
      reference_number,
      attachment_url,
      attachment_name,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING 
      id, 
      expense_date::text as expense_date, 
      category, 
      description, 
      amount::float as amount, 
      payment_method, 
      vendor, 
      reference_number, 
      attachment_url, 
      attachment_name, 
      is_deleted, 
      deleted_at::text as deleted_at, 
      created_by, 
      created_at::text as created_at, 
      updated_at::text as updated_at;
  `, [
    data.expense_date,
    data.category.trim(),
    data.description.trim(),
    Number(data.amount),
    data.payment_method,
    data.vendor?.trim() || null,
    data.reference_number?.trim() || null,
    data.attachment_url || null,
    data.attachment_name || null,
    data.created_by || 'Academy Director'
  ]);

  return row;
}

// -------------------------------------------------------------
// UPDATE EXPENSE (WITH AUDIT LOG HISTORY)
// -------------------------------------------------------------
export async function updateExpense(
  id: string,
  data: {
    expense_date: string;
    category: string;
    description: string;
    amount: number;
    payment_method: 'Cash' | 'UPI' | 'Bank transfer' | 'Other';
    vendor?: string | null;
    reference_number?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
  },
  changedBy: string = 'Academy Director'
): Promise<Expense> {
  if (!data.expense_date) {
    throw new Error('Date is required');
  }
  if (!data.amount || Number(data.amount) <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  // Fetch current old values
  const current = await queryOne<Expense>(`
    SELECT 
      id,
      expense_date::text as expense_date,
      category,
      description,
      amount,
      payment_method,
      vendor,
      reference_number,
      attachment_url,
      attachment_name,
      is_deleted
    FROM public.expenses WHERE id = $1;
  `, [id]);

  if (!current) {
    throw new Error('Expense not found');
  }

  // Compare and record audit logs
  const changes: { field: string; oldVal: any; newVal: any }[] = [];

  const compareField = (field: string, oldV: any, newV: any) => {
    const formattedOld = oldV === null || oldV === undefined ? '' : String(oldV);
    const formattedNew = newV === null || newV === undefined ? '' : String(newV);
    if (formattedOld !== formattedNew) {
      changes.push({ field, oldVal: formattedOld, newVal: formattedNew });
    }
  };

  const oldDateRaw = current.expense_date as any;
  const oldDateStr = oldDateRaw
    ? (typeof oldDateRaw === 'string' ? oldDateRaw.split('T')[0] : (oldDateRaw instanceof Date ? oldDateRaw.toISOString().split('T')[0] : String(oldDateRaw)))
    : '';

  compareField('expense_date', oldDateStr, data.expense_date);
  compareField('category', current.category, data.category);
  compareField('description', current.description, data.description);
  compareField('amount', current.amount, data.amount);
  compareField('payment_method', current.payment_method, data.payment_method);
  compareField('vendor', current.vendor || '', data.vendor || '');
  compareField('reference_number', current.reference_number || '', data.reference_number || '');
  if (data.attachment_name !== undefined) {
    compareField('attachment_name', current.attachment_name || '', data.attachment_name || '');
  }

  for (const ch of changes) {
    await query(`
      INSERT INTO public.expense_audit_logs (expense_id, field_name, old_value, new_value, changed_by)
      VALUES ($1, $2, $3, $4, $5);
    `, [id, ch.field, ch.oldVal, ch.newVal, changedBy]);
  }

  const [updated] = await query<Expense>(`
    UPDATE public.expenses
    SET 
      expense_date = $2,
      category = $3,
      description = $4,
      amount = $5,
      payment_method = $6,
      vendor = $7,
      reference_number = $8,
      attachment_url = COALESCE($9, attachment_url),
      attachment_name = COALESCE($10, attachment_name),
      updated_at = NOW()
    WHERE id = $1
    RETURNING 
      id, 
      expense_date::text as expense_date, 
      category, 
      description, 
      amount::float as amount, 
      payment_method, 
      vendor, 
      reference_number, 
      attachment_url, 
      attachment_name, 
      is_deleted, 
      deleted_at::text as deleted_at, 
      created_by, 
      created_at::text as created_at, 
      updated_at::text as updated_at;
  `, [
    id,
    data.expense_date,
    data.category.trim(),
    data.description.trim(),
    Number(data.amount),
    data.payment_method,
    data.vendor?.trim() || null,
    data.reference_number?.trim() || null,
    data.attachment_url,
    data.attachment_name
  ]);

  return updated;
}

// -------------------------------------------------------------
// DELETE EXPENSE (FLAGGED AS REMOVED / SOFT DELETE)
// -------------------------------------------------------------
export async function deleteExpense(id: string, changedBy: string = 'Academy Director'): Promise<Expense> {
  const current = await queryOne<Expense>(`SELECT * FROM public.expenses WHERE id = $1`, [id]);
  if (!current) {
    throw new Error('Expense not found');
  }

  await query(`
    INSERT INTO public.expense_audit_logs (expense_id, field_name, old_value, new_value, changed_by)
    VALUES ($1, 'status', 'active', 'removed', $2);
  `, [id, changedBy]);

  const [removed] = await query<Expense>(`
    UPDATE public.expenses
    SET 
      is_deleted = true,
      deleted_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
    RETURNING 
      id, 
      expense_date::text as expense_date, 
      category, 
      description, 
      amount::float as amount, 
      payment_method, 
      vendor, 
      reference_number, 
      attachment_url, 
      attachment_name, 
      is_deleted, 
      deleted_at::text as deleted_at, 
      created_by, 
      created_at::text as created_at, 
      updated_at::text as updated_at;
  `, [id]);

  return removed;
}

// -------------------------------------------------------------
// GET AUDIT LOGS FOR AN EXPENSE
// -------------------------------------------------------------
export async function getExpenseAuditLogs(expenseId: string): Promise<ExpenseAuditLog[]> {
  try {
    const rows = await query<ExpenseAuditLog>(`
      SELECT 
        id, 
        expense_id, 
        field_name, 
        old_value, 
        new_value, 
        changed_by, 
        changed_at::text as changed_at
      FROM public.expense_audit_logs
      WHERE expense_id = $1
      ORDER BY changed_at DESC;
    `, [expenseId]);
    return rows;
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

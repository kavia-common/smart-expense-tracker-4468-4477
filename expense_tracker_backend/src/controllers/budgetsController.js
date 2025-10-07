import { z } from 'zod';
import { query } from '../db/pg.js';

// Accepts either explicit month (YYYY-MM-DD) or enum period for future extension.
// For now, we store month (first day of month) and ignore period in DB, but validate if provided.
const createSchema = z.object({
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  // month string must be YYYY-MM or YYYY-MM-DD; normalize to first day of month.
  month: z.string().regex(/^\d{4}-(\d{2})(-\d{2})?$/),
  // optional enum period for API compatibility, validate but not stored yet
  period: z.enum(['monthly']).optional(),
  limit_amount: z.number().positive()
});
const updateSchema = createSchema.partial();

// PUBLIC_INTERFACE
export async function listBudgets(_req, res, next) {
  try {
    const sql = `
      SELECT b.*,
        COALESCE((
          SELECT SUM(t.amount)
          FROM public.transactions t
          WHERE t.user_id = b.user_id
            AND t.category_id = b.category_id
            AND t.direction = 'outflow'
            AND date_trunc('month', t.transaction_date) = date_trunc('month', b.month)
        ), 0) AS spent
      FROM public.budgets b
      ORDER BY b.month DESC, b.created_at DESC
    `;
    const r = await query(sql);
    const rows = r.rows.map((b) => ({
      ...b,
      budget_overrun: Number(b.spent) > Number(b.limit_amount)
    }));
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

// Normalize YYYY-MM or YYYY-MM-DD to first day of that month
function normalizeMonth(m) {
  const parts = m.split('-');
  if (parts.length === 2) {
    return `${parts[0]}-${parts[1]}-01`;
  }
  // already YYYY-MM-DD, replace day with 01
  return `${parts[0]}-${parts[1]}-01`;
}

// PUBLIC_INTERFACE
export async function createBudget(req, res, next) {
  try {
    const body = createSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid body', details: body.error.flatten() });

    const { user_id, category_id, limit_amount } = body.data;
    const month = normalizeMonth(body.data.month);

    try {
      const sql = `
        INSERT INTO public.budgets (user_id, category_id, month, limit_amount)
        VALUES ($1,$2,$3,$4)
        RETURNING *`;
      const r = await query(sql, [user_id, category_id, month, limit_amount]);

      // Compute spent and overrun for the created entity to return enriched shape
      const spentSql = `
        SELECT COALESCE((
          SELECT SUM(t.amount)
          FROM public.transactions t
          WHERE t.user_id = $1
            AND t.category_id = $2
            AND t.direction = 'outflow'
            AND date_trunc('month', t.transaction_date) = date_trunc('month', $3::date)
        ), 0) AS spent
      `;
      const spentRes = await query(spentSql, [user_id, category_id, month]);
      const spent = Number(spentRes.rows?.[0]?.spent || 0);
      const created = { ...r.rows[0], spent, budget_overrun: spent > Number(r.rows[0].limit_amount) };
      res.status(201).json(created);
    } catch (e) {
      // handle uniqueness conflict on (user_id, category_id, month)
      if (e?.code === '23505') {
        e.status = 409;
        return next(Object.assign(new Error('Budget already exists for this category and month'), { status: 409 }));
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function updateBudget(req, res, next) {
  try {
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });
    const body = updateSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid body', details: body.error.flatten() });

    const fields = [];
    const params = [];
    let i = 1;

    for (const [k, vRaw] of Object.entries(body.data)) {
      let v = vRaw;
      if (k === 'month' && typeof v === 'string') v = normalizeMonth(v);
      if (k === 'period') continue; // not stored
      fields.push(`${k} = $${i++}`);
      params.push(v);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    const sql = `UPDATE public.budgets SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
    params.push(id);
    const r = await query(sql, params);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function deleteBudget(req, res, next) {
  try {
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });

    const r = await query('DELETE FROM public.budgets WHERE id = $1', [id]);
    res.json({ deleted: r.rowCount || 0 });
  } catch (e) {
    next(e);
  }
}

import { z } from 'zod';
import { query } from '../db/pg.js';

const createSchema = z.object({
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

// PUBLIC_INTERFACE
export async function createBudget(req, res, next) {
  try {
    const body = createSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid body', details: body.error.flatten() });

    const { user_id, category_id, month, limit_amount } = body.data;
    const sql = `
      INSERT INTO public.budgets (user_id, category_id, month, limit_amount)
      VALUES ($1,$2,$3,$4)
      RETURNING *`;
    const r = await query(sql, [user_id, category_id, month, limit_amount]);
    res.status(201).json(r.rows[0]);
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
    for (const [k, v] of Object.entries(body.data)) {
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

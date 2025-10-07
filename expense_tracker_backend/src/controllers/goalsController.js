import { z } from 'zod';
import { query } from '../db/pg.js';

const createSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1, 'name required').max(160),
  target_amount: z.number().positive('target_amount must be > 0'),
  current_amount: z.number().nonnegative().default(0),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'target_date must be YYYY-MM-DD')
    .nullable()
    .optional()
});
const updateSchema = createSchema.partial();

// PUBLIC_INTERFACE
export async function listGoals(_req, res, next) {
  try {
    const r = await query('SELECT * FROM public.goals ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function createGoal(req, res, next) {
  try {
    const body = createSchema.safeParse(req.body);
    if (!body.success)
      return res.status(400).json({ error: 'Invalid body', details: body.error.flatten() });

    const {
      user_id,
      name,
      target_amount,
      current_amount = 0,
      target_date = null
    } = body.data;
    const sql = `
      INSERT INTO public.goals (user_id, name, target_amount, current_amount, target_date)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`;
    const r = await query(sql, [user_id, name, target_amount, current_amount, target_date]);
    const created = r.rows[0];
    // Return created entity directly for client optimistic reconciliation
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function updateGoal(req, res, next) {
  try {
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });

    const body = updateSchema.safeParse(req.body);
    if (!body.success)
      return res.status(400).json({ error: 'Invalid body', details: body.error.flatten() });

    const fields = [];
    const params = [];
    let i = 1;
    for (const [k, v] of Object.entries(body.data)) {
      fields.push(`${k} = $${i++}`);
      params.push(v);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    const sql = `UPDATE public.goals SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
    params.push(id);
    const r = await query(sql, params);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function deleteGoal(req, res, next) {
  try {
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });

    const r = await query('DELETE FROM public.goals WHERE id = $1', [id]);
    res.json({ deleted: r.rowCount || 0 });
  } catch (e) {
    next(e);
  }
}

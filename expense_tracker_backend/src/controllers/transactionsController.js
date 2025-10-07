import { z } from 'zod';
import { query } from '../db/pg.js';
import { buildPagination, buildTransactionFilters } from '../models/queries.js';

// Schemas
const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  accountId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().uuid().optional()
});

const createSchema = z.object({
  user_id: z.string().uuid(),
  account_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.number(),
  direction: z.enum(['inflow', 'outflow']),
  description: z.string().max(2000).optional().nullable(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const updateSchema = createSchema.partial();

// PUBLIC_INTERFACE
export async function listTransactions(req, res, next) {
  try {
    const qs = listQuerySchema.safeParse(req.query);
    if (!qs.success) return res.status(400).json({ error: 'Invalid query', details: qs.error.flatten() });

    const { where, params } = buildTransactionFilters(qs.data);
    const { sql: pagSql } = buildPagination(qs.data);
    const base = `SELECT * FROM public.transactions ${where} ORDER BY transaction_date DESC, created_at DESC`;
    const finalSql = `${base}${pagSql.replace('$limit', `$${params.length + 1}`).replace('$offset', `$${params.length + 2}`)}`;

    const resDb = await query(finalSql, [...params, qs.data.limit ?? 50, qs.data.offset ?? 0]);
    res.json(resDb.rows);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function createTransaction(req, res, next) {
  try {
    const body = createSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid body', details: body.error.flatten() });

    const {
      user_id, account_id = null, category_id = null,
      amount, direction, description = null, transaction_date
    } = body.data;

    const sql = `
      INSERT INTO public.transactions
        (user_id, account_id, category_id, amount, direction, description, transaction_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`;
    const params = [user_id, account_id, category_id, amount, direction, description, transaction_date];
    const created = await query(sql, params);
    res.status(201).json(created.rows[0]);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function updateTransaction(req, res, next) {
  try {
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });

    const body = updateSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Invalid body', details: body.error.flatten() });

    // Build dynamic update
    const fields = [];
    const params = [];
    let i = 1;
    for (const [k, v] of Object.entries(body.data)) {
      fields.push(`${k} = $${i++}`);
      params.push(v);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    const sql = `UPDATE public.transactions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
    params.push(id);
    const r = await query(sql, params);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function deleteTransaction(req, res, next) {
  try {
    const id = req.params.id;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });

    const r = await query('DELETE FROM public.transactions WHERE id = $1', [id]);
    res.json({ deleted: r.rowCount || 0 });
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function getSummary(req, res, next) {
  try {
    const range = (req.query.range || 'month').toString();
    if (!['month', 'week', 'year'].includes(range)) return res.status(400).json({ error: 'Invalid range' });
    const dateTrunc = range === 'week' ? 'week' : range === 'year' ? 'year' : 'month';

    const sql = `
      SELECT
        date_trunc($1, transaction_date) AS period,
        SUM(CASE WHEN direction='inflow' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN direction='outflow' THEN amount ELSE 0 END) AS expense
      FROM public.transactions
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    `;
    const r = await query(sql, [dateTrunc]);
    res.json(r.rows);
  } catch (e) {
    next(e);
  }
}

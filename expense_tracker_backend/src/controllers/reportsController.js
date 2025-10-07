import { query } from '../db/pg.js';

// PUBLIC_INTERFACE
export async function spendingByCategory(req, res, next) {
  try {
    const range = (req.query.range || 'month').toString();
    if (!['month', 'week', 'year'].includes(range)) return res.status(400).json({ error: 'Invalid range' });

    const dateTrunc = range === 'week' ? 'week' : range === 'year' ? 'year' : 'month';
    const sql = `
      SELECT c.name AS category, COALESCE(SUM(t.amount),0) AS total
      FROM public.categories c
      LEFT JOIN public.transactions t
        ON t.category_id = c.id AND t.direction = 'outflow'
        AND date_trunc($1, t.transaction_date) = date_trunc($1, CURRENT_DATE)
      WHERE c.type = 'expense'
      GROUP BY c.name
      ORDER BY total DESC
    `;
    const r = await query(sql, [dateTrunc]);
    res.json(r.rows);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function incomeVsExpense(req, res, next) {
  try {
    const range = (req.query.range || 'month').toString();
    if (!['month', 'week', 'year'].includes(range)) return res.status(400).json({ error: 'Invalid range' });

    const dateTrunc = range === 'week' ? 'week' : range === 'year' ? 'year' : 'month';
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN direction='inflow' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN direction='outflow' THEN amount ELSE 0 END), 0) AS expense
      FROM public.transactions
      WHERE date_trunc($1, transaction_date) = date_trunc($1, CURRENT_DATE)
    `;
    const r = await query(sql, [dateTrunc]);
    res.json(r.rows[0] || { income: 0, expense: 0 });
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function listAlerts(_req, res, _next) {
  // Optional stub for now
  res.json([]);
}

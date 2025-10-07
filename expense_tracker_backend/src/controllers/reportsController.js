import { query } from '../db/pg.js';

/**
 * Helpers to parse/validate query parameters for reports
 */
function coerceRange(r) {
  const val = (r || 'month').toString();
  if (!['month', 'quarter'].includes(val)) return null;
  return val;
}

function isValidDateStr(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Build date filter for SQL based on:
 * - range=month|quarter with default current period
 * - optional from/to override (inclusive)
 * Returns: { clause, params }
 */
function buildDateWhere({ range, from, to }) {
  const params = [];
  let clause = '';

  if (from && to) {
    clause = `transaction_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
    params.push(from, to);
    return { clause, params };
  }
  if (from && !to) {
    clause = `transaction_date >= $${params.length + 1}`;
    params.push(from);
    return { clause, params };
  }
  if (!from && to) {
    clause = `transaction_date <= $${params.length + 1}`;
    params.push(to);
    return { clause, params };
  }

  // No explicit from/to, use current range
  // For month -> first day of current month to last day of current month
  // For quarter -> current date - 3 months rolling window
  if (range === 'month') {
    clause = `date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE)`;
    return { clause, params };
  }
  // quarter -> last 3 months inclusive from today
  clause = `transaction_date >= (CURRENT_DATE - INTERVAL '3 months')`;
  return { clause, params };
}

/**
 * Basic pagination builder for reports where the list can be long (categories)
 */
function buildPagination(limitParam, offsetParam) {
  const limit = Math.max(1, Math.min(Number(limitParam) || 50, 200));
  const offset = Math.max(0, Number(offsetParam) || 0);
  return { limit, offset };
}

// PUBLIC_INTERFACE
export async function spendingByCategory(req, res, next) {
  try {
    const range = coerceRange(req.query.range);
    if (!range) return res.status(400).json({ error: "Invalid range. Use 'month' or 'quarter'." });

    const from = req.query.from;
    const to = req.query.to;
    if (from && !isValidDateStr(from)) return res.status(400).json({ error: 'Invalid from date. Use YYYY-MM-DD' });
    if (to && !isValidDateStr(to)) return res.status(400).json({ error: 'Invalid to date. Use YYYY-MM-DD' });

    const { limit, offset } = buildPagination(req.query.limit, req.query.offset);
    const { clause, params } = buildDateWhere({ range, from, to });

    // Aggregate total outflows grouped by expense categories; join to categories to include zeroes as 0
    // currency is derived from account; to keep simple, default to USD if mixed/unknown
    const sql = `
      WITH tx AS (
        SELECT t.category_id, t.amount
        FROM public.transactions t
        WHERE t.direction = 'outflow' AND ${clause}
      )
      SELECT
        c.name AS categoryName,
        COALESCE(SUM(tx.amount), 0) AS total,
        'USD'::text AS currency
      FROM public.categories c
      LEFT JOIN tx ON tx.category_id = c.id
      WHERE c.type = 'expense'
      GROUP BY c.name
      ORDER BY total DESC, c.name ASC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
    const r = await query(sql, [...params, limit, offset]);
    res.json(r.rows || []);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function incomeVsExpense(req, res, next) {
  try {
    const range = coerceRange(req.query.range);
    if (!range) return res.status(400).json({ error: "Invalid range. Use 'month' or 'quarter'." });

    const from = req.query.from;
    const to = req.query.to;
    if (from && !isValidDateStr(from)) return res.status(400).json({ error: 'Invalid from date. Use YYYY-MM-DD' });
    if (to && !isValidDateStr(to)) return res.status(400).json({ error: 'Invalid to date. Use YYYY-MM-DD' });

    // Periodize by month within the requested window (month -> current month only; quarter -> last 3 months rolling)
    const { clause, params } = buildDateWhere({ range, from, to });

    const sql = `
      SELECT
        to_char(date_trunc('month', t.transaction_date), 'YYYY-MM') AS period,
        COALESCE(SUM(CASE WHEN t.direction = 'inflow' THEN t.amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN t.direction = 'outflow' THEN t.amount ELSE 0 END), 0) AS expense,
        COALESCE(SUM(CASE WHEN t.direction = 'inflow' THEN t.amount ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN t.direction = 'outflow' THEN t.amount ELSE 0 END), 0) AS net
      FROM public.transactions t
      WHERE ${clause}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    const r = await query(sql, params);
    // Ensure empty array instead of null
    res.json(r.rows || []);
  } catch (e) {
    next(e);
  }
}

// PUBLIC_INTERFACE
export async function listAlerts(_req, res, _next) {
  // Optional stub for now
  res.json([]);
}

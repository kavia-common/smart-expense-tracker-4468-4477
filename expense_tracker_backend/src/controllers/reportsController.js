import { query } from '../db/pg.js';
import { buildReportPagination } from '../models/queries.js';

/**
 * Helpers to parse/validate query parameters for reports
 */
function coerceRange(r) {
  const val = (r || 'month').toString();
  if (!['month', 'quarter', '3months'].includes(val)) return null;
  // normalize '3months' to 'quarter' for internal logic
  return val === '3months' ? 'quarter' : val;
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
  // For quarter -> last 3 full months including current month (rolling)
  if (range === 'month') {
    clause = `date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE)`;
    return { clause, params };
  }
  // quarter -> include transactions from first day of current month minus 2 months
  clause = `date_trunc('month', transaction_date) >= date_trunc('month', CURRENT_DATE) - INTERVAL '2 months'`;
  return { clause, params };
}

/**
 * PUBLIC_INTERFACE
 * spendingByCategory - sum outflows by expense categories for given period.
 * Ensures expenses are summed as positive totals (even if amounts are stored negative).
 * Returns stable shape: [ { categoryName, total, currency } ]
 */
export async function spendingByCategory(req, res, next) {
  try {
    const range = coerceRange(req.query.range);
    if (!range) return res.status(400).json({ error: "Invalid range. Use 'month', 'quarter', or '3months'." });

    const from = req.query.from;
    const to = req.query.to;
    if (from && !isValidDateStr(from)) return res.status(400).json({ error: 'Invalid from date. Use YYYY-MM-DD' });
    if (to && !isValidDateStr(to)) return res.status(400).json({ error: 'Invalid to date. Use YYYY-MM-DD' });

    const { limit, offset } = buildReportPagination(req.query.limit, req.query.offset);
    const { clause, params } = buildDateWhere({ range, from, to });

    // Aggregate total outflows grouped by expense categories; join to categories to include categories with zero in the period.
    // Amounts for outflows are summed as absolute positives to represent spend totals.
    // Currency is unified to 'USD' for demo dataset.
    const sql = `
      WITH tx AS (
        SELECT t.category_id, ABS(t.amount) AS amount
        FROM public.transactions t
        WHERE t.direction = 'outflow' AND ${clause}
      )
      SELECT
        c.name AS "categoryName",
        COALESCE(SUM(tx.amount), 0)::numeric(12,2) AS total,
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
    res.json((r.rows || []).map(row => ({
      categoryName: row.categoryName,
      total: Number(row.total),
      currency: row.currency || 'USD'
    })));
  } catch (e) {
    next(e);
  }
}

/**
 * PUBLIC_INTERFACE
 * incomeVsExpense - monthly rollup for income vs expense within selected period.
 * Groups by YYYY-MM and returns: [ { period, income, expense, net } ]
 * - expense is positive total of outflows
 * - net = income - expense
 */
export async function incomeVsExpense(req, res, next) {
  try {
    const range = coerceRange(req.query.range);
    if (!range) return res.status(400).json({ error: "Invalid range. Use 'month', 'quarter', or '3months'." });

    const from = req.query.from;
    const to = req.query.to;
    if (from && !isValidDateStr(from)) return res.status(400).json({ error: 'Invalid from date. Use YYYY-MM-DD' });
    if (to && !isValidDateStr(to)) return res.status(400).json({ error: 'Invalid to date. Use YYYY-MM-DD' });

    const { clause, params } = buildDateWhere({ range, from, to });

    const sql = `
      SELECT
        to_char(date_trunc('month', t.transaction_date), 'YYYY-MM') AS period,
        COALESCE(SUM(CASE WHEN t.direction = 'inflow' THEN t.amount ELSE 0 END), 0)::numeric(12,2) AS income,
        COALESCE(SUM(CASE WHEN t.direction = 'outflow' THEN ABS(t.amount) ELSE 0 END), 0)::numeric(12,2) AS expense,
        (
          COALESCE(SUM(CASE WHEN t.direction = 'inflow' THEN t.amount ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN t.direction = 'outflow' THEN ABS(t.amount) ELSE 0 END), 0)
        )::numeric(12,2) AS net
      FROM public.transactions t
      WHERE ${clause}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    const r = await query(sql, params);
    res.json((r.rows || []).map(row => ({
      period: row.period,
      income: Number(row.income),
      expense: Number(row.expense),
      net: Number(row.net)
    })));
  } catch (e) {
    next(e);
  }
}

/**
 * PUBLIC_INTERFACE
 * listAlerts - placeholder endpoint for future alerting logic.
 */
export async function listAlerts(_req, res, _next) {
  res.json([]);
}

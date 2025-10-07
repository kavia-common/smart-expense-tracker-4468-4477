/**
 * Utilities for building safe SQL fragments and pagination clauses.
 */

// PUBLIC_INTERFACE
/**
 * buildPagination - returns SQL and params for limit/offset
 */
export function buildPagination({ limit = 50, offset = 0 }) {
  const l = Math.max(0, Math.min(Number(limit) || 50, 200));
  const o = Math.max(0, Number(offset) || 0);
  return {
    sql: ' LIMIT $limit OFFSET $offset ',
    named: { limit: l, offset: o },
    positional: [l, o]
  };
}

// PUBLIC_INTERFACE
/**
 * buildTransactionFilters - filters by accountId, date range, and category
 */
export function buildTransactionFilters({ accountId, from, to, category }) {
  const clauses = [];
  const params = [];
  let i = 1;
  if (accountId) {
    clauses.push(`account_id = $${i++}`);
    params.push(accountId);
  }
  if (from) {
    clauses.push(`transaction_date >= $${i++}`);
    params.push(from);
  }
  if (to) {
    clauses.push(`transaction_date <= $${i++}`);
    params.push(to);
  }
  if (category) {
    clauses.push(`category_id = $${i++}`);
    params.push(category);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, params };
}

// PUBLIC_INTERFACE
/**
 * buildReportPagination - lightweight helper mirrored from buildPagination but accepting primitives
 */
export function buildReportPagination(limit, offset) {
  const l = Math.max(1, Math.min(Number(limit) || 50, 200));
  const o = Math.max(0, Number(offset) || 0);
  return { limit: l, offset: o };
}

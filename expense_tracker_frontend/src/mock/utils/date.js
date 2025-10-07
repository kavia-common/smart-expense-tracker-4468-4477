//
// Deterministic date utilities for mock data
//

// PUBLIC_INTERFACE
export function startOfMonth(date) {
  /** Returns a new Date at the start of month (00:00:00) */
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

// PUBLIC_INTERFACE
export function endOfMonth(date) {
  /** Returns a new Date at the end of month (23:59:59.999) */
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

// PUBLIC_INTERFACE
export function rangeByMonth(start, end) {
  /**
   * Returns an array of ISO strings (YYYY-MM-01) for each month boundary between start and end inclusive.
   */
  const res = [];
  let cur = startOfMonth(start);
  const last = startOfMonth(end);
  while (cur <= last) {
    res.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return res;
}

// PUBLIC_INTERFACE
export function toISODate(date) {
  /** Returns YYYY-MM-DD ISO date string in local time for deterministic display */
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// PUBLIC_INTERFACE
export function formatCurrency(amount, currency = "USD", locale = "en-US") {
  /** Format number as currency string. */
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

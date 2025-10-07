import accounts from "./data/accounts.json";
import categories from "./data/categories.json";
import transactions from "./data/transactions.json";
import budgets from "./data/budgets.json";
import goals from "./data/goals.json";
import { startOfMonth, endOfMonth, toISODate } from "./utils/date";

// Keep local mutable copies for upserts during the session
let __budgets = [...budgets];
let __goals = [...goals];

// Helpers
const isIncome = (t) => t.type === "income" || t.amount > 0;
const isExpense = (t) => t.type === "expense" || t.amount < 0;

// PUBLIC_INTERFACE
export async function getAccounts() {
  /** Returns deterministic list of accounts. */
  return accounts.slice();
}

// PUBLIC_INTERFACE
export async function getCategories() {
  /** Returns deterministic list of categories. */
  return categories.slice();
}

// PUBLIC_INTERFACE
export async function getTransactions({ from, to } = {}) {
  /**
   * Returns transactions sorted by date asc filtered by optional from/to (YYYY-MM-DD).
   * Shape: {id,date,description,amount,categoryId,accountId,type}
   */
  let list = transactions.slice();
  if (from) {
    list = list.filter((t) => t.date >= from);
  }
  if (to) {
    list = list.filter((t) => t.date <= to);
  }
  list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return list;
}

// PUBLIC_INTERFACE
export async function getBudgets() {
  /** Returns current budgets (mutable session copy). */
  return __budgets.slice();
}

// PUBLIC_INTERFACE
export async function upsertBudget(budget) {
  /**
   * Upsert budget by id or by (categoryId, period) if id missing.
   * Returns updated budget object.
   */
  const id = budget.id || `bud_${budget.categoryId || "new"}`;
  const idx = __budgets.findIndex(
    (b) => b.id === id || (b.categoryId === budget.categoryId && b.period === budget.period)
  );
  const normalized = {
    id,
    categoryId: budget.categoryId,
    amount: Number(budget.amount),
    period: budget.period || "monthly"
  };
  if (idx >= 0) {
    __budgets[idx] = { ...__budgets[idx], ...normalized };
  } else {
    __budgets.push(normalized);
  }
  return { ...normalized };
}

// PUBLIC_INTERFACE
export async function getGoals() {
  /** Returns list of goals. */
  return __goals.slice();
}

// PUBLIC_INTERFACE
export async function upsertGoal(goal) {
  /**
   * Upsert goal by id or name.
   */
  const id = goal.id || `goal_${(goal.goal || "new").toLowerCase().replace(/\s+/g, "_")}`;
  const idx = __goals.findIndex((g) => g.id === id || g.goal === goal.goal);
  const normalized = {
    id,
    goal: goal.goal,
    amount: Number(goal.amount),
    progress: Number(goal.progress ?? 0)
  };
  if (idx >= 0) {
    __goals[idx] = { ...__goals[idx], ...normalized };
  } else {
    __goals.push(normalized);
  }
  return { ...normalized };
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function calcIncomeVsExpenseLast6Months() {
  const today = new Date("2025-07-15"); // anchored for determinism
  const end = endOfMonth(today);
  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const months = [];
  let cur = new Date(start);
  while (cur <= end) {
    months.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  const byMonth = {};
  for (const m of months) {
    byMonth[monthKey(m)] = { income: 0, expense: 0 };
  }

  for (const t of transactions) {
    const d = new Date(t.date);
    const mk = monthKey(d);
    if (byMonth[mk]) {
      if (isIncome(t)) byMonth[mk].income += t.amount;
      else byMonth[mk].expense += Math.abs(t.amount);
    }
  }

  const labels = months.map((m) => monthKey(m));
  const income = labels.map((k) => Number((byMonth[k]?.income || 0).toFixed(2)));
  const expense = labels.map((k) => Number((byMonth[k]?.expense || 0).toFixed(2)));
  return { labels, income, expense };
}

function calcSpendingByCategoryCurrentMonth() {
  const today = new Date("2025-07-15"); // anchored
  const from = toISODate(startOfMonth(today));
  const to = toISODate(endOfMonth(today));
  const tlist = transactions.filter((t) => t.date >= from && t.date <= to && isExpense(t));
  const byCat = {};
  for (const t of tlist) {
    byCat[t.categoryId] = (byCat[t.categoryId] || 0) + Math.abs(t.amount);
  }
  const items = Object.entries(byCat)
    .map(([categoryId, total]) => {
      const cat = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        name: cat?.name || categoryId,
        color: cat?.color || "#9CA3AF",
        total: Number(total.toFixed(2))
      };
    })
    .sort((a, b) => b.total - a.total);
  return items;
}

function calcAlerts() {
  // Detect categories exceeding budget in current month
  const today = new Date("2025-07-15");
  const from = toISODate(startOfMonth(today));
  const to = toISODate(endOfMonth(today));
  const exp = transactions.filter((t) => t.date >= from && t.date <= to && isExpense(t));
  const byCatSpend = {};
  for (const t of exp) {
    byCatSpend[t.categoryId] = (byCatSpend[t.categoryId] || 0) + Math.abs(t.amount);
  }
  const alerts = [];
  for (const b of __budgets) {
    if (b.period !== "monthly") continue;
    const spent = byCatSpend[b.categoryId] || 0;
    if (spent > b.amount) {
      const cat = categories.find((c) => c.id === b.categoryId);
      alerts.push({
        id: `alert_${b.categoryId}`,
        type: "budget_exceeded",
        message: `${cat?.name || b.categoryId} is over budget by $${(spent - b.amount).toFixed(2)} this month.`,
        categoryId: b.categoryId,
        amount: Number(spent.toFixed(2)),
        budget: b.amount
      });
    } else if (spent > 0.9 * b.amount) {
      const cat = categories.find((c) => c.id === b.categoryId);
      alerts.push({
        id: `warn_${b.categoryId}`,
        type: "budget_warning",
        message: `${cat?.name || b.categoryId} reached ${(100 * spent / b.amount).toFixed(0)}% of budget.`,
        categoryId: b.categoryId,
        amount: Number(spent.toFixed(2)),
        budget: b.amount
      });
    }
  }
  return alerts;
}

// PUBLIC_INTERFACE
export async function getAlerts() {
  /** Returns computed alerts for current month based on budgets and spend. */
  return calcAlerts();
}

// PUBLIC_INTERFACE
export async function getReports() {
  /**
   * Returns aggregate reports including:
   * - spendingByCategory (current month)
   * - incomeVsExpense (last 6 months)
   * - KPIs: totalSpentMonth, totalIncomeMonth, savingsRate
   * - trend arrays for KPIs
   */
  const spendingByCategory = calcSpendingByCategoryCurrentMonth();
  const ive = calcIncomeVsExpenseLast6Months();

  // KPIs for current month
  const today = new Date("2025-07-15");
  const from = toISODate(startOfMonth(today));
  const to = toISODate(endOfMonth(today));
  const monthTx = transactions.filter((t) => t.date >= from && t.date <= to);
  const totalSpentMonth = Number(
    monthTx.filter(isExpense).reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(2)
  );
  const totalIncomeMonth = Number(
    monthTx.filter(isIncome).reduce((s, t) => s + t.amount, 0).toFixed(2)
  );
  const savingsRate = totalIncomeMonth > 0 ? Number((((totalIncomeMonth - totalSpentMonth) / totalIncomeMonth) * 100).toFixed(2)) : 0;

  // Trends (last 6 months same window as ive)
  const trend = ive.labels.map((label) => {
    const [y, m] = label.split("-");
    const start = new Date(Number(y), Number(m) - 1, 1);
    const end = endOfMonth(start);
    const fromS = toISODate(start);
    const toS = toISODate(end);
    const tx = transactions.filter((t) => t.date >= fromS && t.date <= toS);
    const spent = tx.filter(isExpense).reduce((s, t) => s + Math.abs(t.amount), 0);
    const income = tx.filter(isIncome).reduce((s, t) => s + t.amount, 0);
    const sr = income > 0 ? ((income - spent) / income) * 100 : 0;
    return {
      month: label,
      totalSpent: Number(spent.toFixed(2)),
      totalIncome: Number(income.toFixed(2)),
      savingsRate: Number(sr.toFixed(2))
    };
  });

  return {
    spendingByCategory,
    incomeVsExpense: ive,
    kpis: { totalSpentMonth, totalIncomeMonth, savingsRate },
    trends: trend
  };
}

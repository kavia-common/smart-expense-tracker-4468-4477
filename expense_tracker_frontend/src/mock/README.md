# Mock Data Layer

This directory provides a deterministic mock data system for running the frontend without authentication or backend.

Contents:
- data/*.json: Seed data for accounts, categories, transactions, budgets, and goals.
- utils/date.js: Reusable helpers (range by month, start/end of month, currency).
- api.js: Async functions that behave like the backend API and compute reports and alerts.

Usage:
- Set REACT_APP_USE_MOCK=true (default in development) to use the mock API layer.
- Hooks dynamically import the mock API when the flag is truthy; otherwise they use the real client.

Data Shapes:
- transactions { id, date (YYYY-MM-DD), description, amount, categoryId, accountId, type }
- categories { id, name, color }
- budgets { id, categoryId, amount, period: 'monthly' }
- goals { id, goal, amount, progress }

Reports:
- spendingByCategory (current month)
- incomeVsExpense (last 6 months)
- KPIs: totalSpentMonth, totalIncomeMonth, savingsRate
- trends: monthly totals and savingsRate across the last 6 months

Notes:
- Data is fixed-seed and sorted for deterministic charts.
- Upserts for budgets/goals are session-local (in-memory).

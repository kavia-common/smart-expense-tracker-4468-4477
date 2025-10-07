# Expense Tracker Backend (Node/Express)

Express service providing REST endpoints for transactions, budgets, goals, reports, and health.

## Features

- Express with CORS and JSON body parsing
- PostgreSQL via `pg` with Pool and helper
- Input validation using `zod` (bodies and query params)
- Centralized error handling
- OpenAPI spec at `/openapi.yaml`
- Smoke tests with `jest` + `supertest` (DB access not required to pass)

## Environment

Copy `.env.sample` to `.env` and adjust as needed:

```
PORT=8080
DATABASE_URL=postgresql://expenses_user:secure_password@expense_tracker_database:5432/expenses
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
JWT_SECRET=change-me
```

Note: Do not commit real secrets. The orchestrator will set env vars for deployments.

## Run

Install dependencies and start:

```
cd smart-expense-tracker-4468-4477/expense_tracker_backend
npm install
npm run dev   # dev with nodemon
# or
npm start     # production start
```

API base: `http://localhost:${PORT}`

- Health: `GET /health`
- Transactions: `GET/POST /transactions`, `PUT/DELETE /transactions/:id`, `GET /transactions/summary`
- Budgets: `GET/POST /budgets`, `PUT/DELETE /budgets/:id`
- Goals: `GET/POST /goals`, `PUT/DELETE /goals/:id`
- Reports:
  - `GET /reports/spending-by-category?range=month|quarter&from=&to=&limit=&offset=`
    - Default range is `month` (current month). If `from`/`to` are provided (YYYY-MM-DD), they override `range`.
    - Returns `[ { categoryName, total, currency } ]`
  - `GET /reports/income-vs-expense?range=month|quarter&from=&to=`
    - Default range is `month` (current month). For `quarter`, last 3 months rolling. `from`/`to` override.
    - Returns `[ { period: YYYY-MM, income, expense, net } ]`
  - `GET /reports/alerts`

OpenAPI: `GET /openapi.yaml`

## Tests

```
npm test
```

Smoke tests validate:
- `GET /health` returns `{status:"ok"}`
- Transactions basic CRUD endpoints respond correctly to invalid payloads and 404s (no DB needed)

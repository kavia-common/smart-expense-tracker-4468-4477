# Expense Tracker Backend (Node/Express)

Express service providing REST endpoints for transactions, budgets, goals, reports, and health.

## Features

- Express with CORS and JSON body parsing
- PostgreSQL via `pg` with Pool and helper
- Input validation using `zod` (bodies and query params)
- Centralized error handling
- OpenAPI spec at `/openapi.yaml`
- Smoke tests with `jest` + `supertest` (DB access not required to pass)

## Using with Mock Frontend (Backend Optional for Preview)

The frontend ships with deterministic mock data and can run without this backend.

- When the frontend environment variable `REACT_APP_USE_MOCK=1` (default), the UI uses an in-browser mock API and does not require the backend or database to be running.
- In this mode, the health badge will show “Mock mode,” and all dashboards/reports use seeded mock data.
- Existing auth endpoints remain available on the backend, but they are not required for the mock-driven UI.

Optional unauthenticated preview:
- No backend configuration is required to preview the app with mock data.
- If you still run the backend, note that protected API routes still enforce authentication as usual; the frontend will simply not call them while mock mode is enabled.

## Switching to API Mode (Connect Frontend to Backend)

To connect the frontend to this backend instead of using mocks:

Frontend (.env):
- Set `REACT_APP_USE_MOCK=0`
- Set `REACT_APP_API_URL=http://localhost:8080` (or your deployed backend URL)

Backend (.env):
- `PORT=8080` (or desired port)
- `DATABASE_URL=postgresql://expenses_user:secure_password@expense_tracker_database:5432/expenses` (configure for your environment)
- `CORS_ORIGIN=http://localhost:3000` (set to the exact frontend origin)
- `LOG_LEVEL=info`
- `JWT_SECRET=<request from orchestrator>` (required for auth-protected endpoints)
- Optional: `JWT_EXPIRES_IN=1h`

Notes:
- In API mode, the frontend will call the backend and authentication is required for protected endpoints.
- Ensure your database is running and reachable using `DATABASE_URL`.
- CORS must be set to the exact frontend origin for browser requests to succeed.

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

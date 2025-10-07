# smart-expense-tracker-4468-4477

This repository contains a multi-container application with a React frontend, a Node/Express backend, and a PostgreSQL database for the Smart Expense Tracker.

Key endpoints:
- Backend OpenAPI Spec: GET /openapi.yaml (served by backend)
- Backend Health: GET /health

## Authentication Removed (Preview Friendly)

The application can now run without login. The frontend ships with a deterministic mock data layer and all routes are public for previews and demos. When running in mock mode, the UI renders seeded accounts, transactions, budgets, goals, and reports without calling the backend. The health badge in the UI will show “Mock mode” to indicate that no backend is required.

## Mock Mode vs API Mode

- Mock Mode (default): Set REACT_APP_USE_MOCK=true (or 1). In this mode the frontend uses data from src/mock and does not require the backend or database to be running.
- API Mode: Set REACT_APP_USE_MOCK=false (or 0) and set REACT_APP_API_URL to point to the backend. The backend continues to support JWT-protected endpoints if you enable authentication again; in API mode, protected routes will require valid tokens.

The health badge adapts automatically:
- Mock mode: “Mock mode” with amber status
- API mode and reachable: “API OK” with green status
- API mode and unreachable: “API Down” with red status

## Environment Variables

Frontend (.env)
- REACT_APP_USE_MOCK: Toggle between mock mode and API mode. Default true/1 if not set.
- REACT_APP_API_URL: Base URL of the backend (e.g., http://localhost:8080). Optional in mock mode.
- REACT_APP_THEME: Optional theme name (e.g., ocean, dark)
- REACT_APP_FEATURE_FLAGS: Optional JSON or comma-separated flags (e.g., beta,charts)

Backend (.env) (only needed for API mode)
- PORT: Backend port (default 8080)
- DATABASE_URL: Postgres connection string (e.g., postgresql://expenses_user:secure_password@localhost:5432/expenses)
- CORS_ORIGIN: Exact origin of the frontend (e.g., http://localhost:3000)
- LOG_LEVEL: Log level (e.g., debug, info, warn, error)
- JWT_SECRET: Secret used to sign JWTs (request from orchestrator; do not commit)
- JWT_EXPIRES_IN: JWT expiration (e.g., 1h, 2h, 7d)

Database (.env)
- POSTGRES_DB: expenses
- POSTGRES_USER: expenses_user
- POSTGRES_PASSWORD: secure_password
- POSTGRES_PORT: 5432

## How to Switch Modes

1) Copy expense_tracker_frontend/.env.sample to expense_tracker_frontend/.env.
2) Set REACT_APP_USE_MOCK=true for mock mode or false for API mode.
3) If using API mode, set REACT_APP_API_URL to your backend URL and configure backend .env from its .env.sample. Ensure PORT, DATABASE_URL, CORS_ORIGIN, LOG_LEVEL, JWT_SECRET, and JWT_EXPIRES_IN are set as needed.
4) Restart your development server or preview so the environment changes take effect.

## Seeded Sample Data

The frontend includes seeded sample data for deterministic previews. Seed files under expense_tracker_frontend/src/mock/data/*.json provide demo accounts, categories, budgets, goals, transactions, and computed reports. The mock layer assembles reports such as spending-by-category and income-vs-expense from these sources.

## Example .env Values

Frontend (.env)
REACT_APP_USE_MOCK=true
# For API mode:
# REACT_APP_USE_MOCK=false
# REACT_APP_API_URL=http://localhost:8080
REACT_APP_THEME=ocean

Backend (.env)
PORT=8080
DATABASE_URL=postgresql://expenses_user:secure_password@localhost:5432/expenses
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
JWT_SECRET=change-me
JWT_EXPIRES_IN=1h

Database (.env)
POSTGRES_DB=expenses
POSTGRES_USER=expenses_user
POSTGRES_PASSWORD=secure_password
POSTGRES_PORT=5432

## Local Run Order and Ports

Preview without backend (recommended for quick demos):
- Start Frontend only (port 3000)
  - cd smart-expense-tracker-4468-4477/expense_tracker_frontend
  - cp .env.sample .env
  - Ensure REACT_APP_USE_MOCK=true
  - npm install
  - npm start
  - Open http://localhost:3000

Full stack (API mode):
1) Start Database (port 5432)
- See smart-expense-tracker-4468-4477/expense_tracker_database/README.md for docker run instructions and .env.
- Ensure POSTGRES_* envs are set; first run seeds schema and demo data.

2) Start Backend (port 8080)
- cd smart-expense-tracker-4468-4477/expense_tracker_backend
- cp .env.sample .env (or set env via orchestrator) and configure DATABASE_URL, CORS_ORIGIN, JWT_SECRET.
- npm install
- npm run dev (nodemon) or npm start
- Verify:
  - GET http://localhost:8080/health returns { "status": "ok" }
  - GET http://localhost:8080/openapi.yaml returns OpenAPI YAML

3) Start Frontend (port 3000)
- cd smart-expense-tracker-4468-4477/expense_tracker_frontend
- cp .env.sample .env
- Set REACT_APP_USE_MOCK=false and REACT_APP_API_URL=http://localhost:8080
- npm install
- npm start
- Open http://localhost:3000

CORS Guidance:
- Set backend CORS_ORIGIN to exact origin of the frontend:
  - Local: http://localhost:3000
  - Preview: use the frontend preview origin provided by the orchestrator.
- The backend will allow requests only from this origin.

## OpenAPI Contract Summary

The backend OpenAPI contains:
- POST /auth/login (200 on success, 401 on invalid credentials)
- POST /auth/register (201 on success, 400 on invalid input)
- GET /accounts (200 on success, 401 unauthorized; bearerAuth required)
- GET /transactions (query: from, to; 200 on success, 401 unauthorized; bearerAuth required)
- GET /reports (or specific report endpoints) (200 on success, 401 unauthorized; bearerAuth required)
- GET/POST /budgets (200 on GET, 200 or 201 on POST; 400 on invalid; 401 unauthorized; bearerAuth)
- GET/POST /goals (200 on GET, 201 on POST; 400 on invalid; 401 unauthorized; bearerAuth)
- GET /profile (200 on success, 401 unauthorized; bearerAuth)
- PUT /profile (200 on success, 400 on invalid; 401 unauthorized; bearerAuth)

Auth: bearerAuth (JWT) is required for protected endpoints in API mode only. In mock mode the frontend does not call these endpoints.

## Notes

- The frontend health badge shows “Mock mode,” “API OK,” or “API Down,” reflecting your chosen mode and backend availability.
- GET /openapi.yaml is served directly by the backend.
- Follow the per-container READMEs for more details and additional endpoints.
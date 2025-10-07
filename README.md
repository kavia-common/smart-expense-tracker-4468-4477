# smart-expense-tracker-4468-4477

This repository contains a multi-container application with a React frontend, a Node/Express backend, and a PostgreSQL database for the Smart Expense Tracker.

Key endpoints:
- Backend OpenAPI Spec: GET /openapi.yaml (served by backend)
- Backend Health: GET /health

## Environment Variables

Frontend (.env)
- REACT_APP_API_URL: Base URL of the backend (e.g., http://localhost:8080)
- REACT_APP_FEATURE_FLAGS: Optional JSON or comma-separated flags (e.g., beta,charts)
- REACT_APP_THEME: Optional theme name (e.g., ocean, dark)

Backend (.env)
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

## Example .env Values

Frontend (.env)
REACT_APP_API_URL=http://localhost:8080
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
- Set REACT_APP_API_URL=http://localhost:8080
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

Auth: bearerAuth (JWT) is required for protected endpoints. Include:
Authorization: Bearer <token>

## Demo Credentials and JWT Usage

Database includes a demo user (local only):
- Email: demo.user@example.com
- Password: DemoPass!123

Usage:
1) Login (POST /auth/login) with the demo credentials to receive a JWT access token.
2) Provide the JWT in the Authorization header for protected endpoints.
3) You can register a new user via POST /auth/register and then login to retrieve a token.

Note:
- JWT_SECRET and JWT_EXPIRES_IN must be set on the backend.
- Do not commit real secrets. The orchestrator will inject secure values.

## Notes

- The frontend health badge calls GET /health to confirm API availability.
- GET /openapi.yaml is served directly by the backend.
- Follow the per-container READMEs for more details and additional endpoints.
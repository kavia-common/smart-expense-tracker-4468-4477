# smart-expense-tracker-4468-4477

## Preview and Environment Integration

This project consists of three containers:
- expense_tracker_frontend (React)
- expense_tracker_backend (Node/Express)
- expense_tracker_database (Postgres)

To wire them together in local development or preview environments:

1) Frontend environment
- Copy smart-expense-tracker-4468-4477/expense_tracker_frontend/.env.sample to .env
- Set REACT_APP_API_URL to your backend URL (e.g., http://localhost:8080 or the backend preview URL provided by orchestration)
- Optionally set REACT_APP_FEATURE_FLAGS and REACT_APP_THEME
- Start the frontend

2) Backend environment
- Copy smart-expense-tracker-4468-4477/expense_tracker_backend/.env.sample to .env
- Ensure PORT is set (default 8080)
- Set DATABASE_URL to point at the database container/service (already defaults to expense_tracker_database)
- Set CORS_ORIGIN to the exact frontend origin (e.g., http://localhost:3000 or the frontend preview URL provided by orchestration)
- Start the backend

3) Database environment
- The database container reads standard Postgres env vars; defaults are provided in its README.

Notes:
- The frontend API client reads REACT_APP_API_URL; if not set, it will use mock data so the UI can still render.
- The Dashboard shows a simple API health indicator (GET /health) to confirm connectivity.
- Do not commit real secrets; the orchestrator will inject environment variables for preview and production.
# Expense Tracker Frontend (React)

This frontend runs in two modes to streamline previews and development: a login-free mock mode with seeded data and a full API mode connected to the backend.

## Authentication Removed (Preview Friendly)

All routes are public in preview. The app runs without login and uses seeded mock data for accounts, transactions, budgets, goals, and reports. A health badge in the UI indicates whether you are in mock mode or connected to an API.

## Mock Mode vs API Mode

- Mock Mode (default): Set `REACT_APP_USE_MOCK=true` (or `1`). No backend is required; data is sourced from `src/mock/*`.
- API Mode: Set `REACT_APP_USE_MOCK=false` (or `0`) and set `REACT_APP_API_URL` to point to the backend. The backend can require JWT auth if enabled; in that case, protected endpoints expect an Authorization header.

The health badge shows:
- “Mock mode” when mock is enabled or no API URL is set.
- “API OK” if the API is reachable.
- “API Down” if the API is not reachable.

## Environment Variables

Frontend (.env)
- REACT_APP_USE_MOCK: Default true/1 if not set; toggles mock vs API mode.
- REACT_APP_API_URL: Backend base URL (e.g., http://localhost:8080). Optional in mock mode.
- REACT_APP_THEME: Optional theme (e.g., ocean, dark).

Backend (.env) (only needed for API mode)
- PORT, DATABASE_URL, CORS_ORIGIN, LOG_LEVEL, JWT_SECRET, JWT_EXPIRES_IN. See backend README for details.

Database (.env)
- POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT. See database README for details.

## How to Switch Modes

1) Copy `.env.sample` to `.env`.
2) Set `REACT_APP_USE_MOCK=true` for mock mode or `false` for API mode.
3) If using API mode, set `REACT_APP_API_URL` to the backend URL, and configure the backend `.env` from its `.env.sample`.
4) Restart the dev server or preview to pick up changes.

## Seeded Sample Data

Seed files under `src/mock/data/*.json` provide deterministic demo accounts, categories, budgets, goals, transactions, and computed reports. The mock API (`src/mock/api.js`) composes reports such as spending-by-category and income-vs-expense from these files.

## Getting Started

Development server:
- `npm install`
- `npm start`
- Open http://localhost:3000

Tests:
- `npm test`

Production build:
- `npm run build`

## Notes

- When in mock mode, the backend is not required and no authentication UI is enforced.
- In API mode, ensure CORS_ORIGIN on the backend matches the frontend origin exactly.

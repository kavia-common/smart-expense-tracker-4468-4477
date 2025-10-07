import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import healthRouter from './routes/health.js';
import transactionsRouter from './routes/transactions.js';
import budgetsRouter from './routes/budgets.js';
import goalsRouter from './routes/goals.js';
import reportsRouter from './routes/reports.js';
import categoriesRouter from './routes/categories.js';

dotenv.config();

const app = express();

/**
 * CORS setup using env var.
 * Set CORS_ORIGIN in environment to the exact frontend origin.
 * Credentials are disabled per project instruction.
 */
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: false
  })
);

// JSON parser
app.use(express.json());

// Logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Routes
app.use('/health', healthRouter);
app.use('/transactions', transactionsRouter);
app.use('/budgets', budgetsRouter);
app.use('/goals', goalsRouter);
app.use('/reports', reportsRouter);
app.use('/categories', categoriesRouter);

/**
 * Serve OpenAPI spec
 * GET /openapi.yaml -> returns the OpenAPI YAML spec file
 */
app.get('/openapi.yaml', (req, res) => {
  res.type('text/yaml');
  res.sendFile('openapi.yaml', { root: process.cwd() + '/smart-expense-tracker-4468-4477/expense_tracker_backend' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Centralized error handler
// PUBLIC_INTERFACE
// error handler middleware
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const detail = process.env.NODE_ENV === 'production' ? undefined : err.stack;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    detail
  });
});

export default app;

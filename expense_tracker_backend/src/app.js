import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import router from './routes/index.js';

dotenv.config();

const app = express();

// CORS setup via env
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: false,
  })
);

// JSON body parsing
app.use(express.json());

// Logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Derived paths in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve OpenAPI if exists
app.get('/openapi.yaml', (req, res) => {
  const specPath = path.join(__dirname, '..', 'openapi.yaml');
  if (fs.existsSync(specPath)) {
    res.type('text/yaml');
    res.sendFile(specPath);
  } else {
    res.status(404).json({ error: 'OpenAPI spec not found' });
  }
});

// Mount central router
app.use('/', router);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// PUBLIC_INTERFACE
// error handler middleware
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const detail = process.env.NODE_ENV === 'production' ? undefined : err.stack;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    detail,
  });
});

export default app;

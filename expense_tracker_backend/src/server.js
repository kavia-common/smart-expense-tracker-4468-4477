import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

// PUBLIC_INTERFACE
// startServer - boots the HTTP server
export function startServer(port = PORT) {
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${port}`);
  });
  return server;
}

// Start only if run directly (not during tests)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

import { Router } from 'express';

const router = Router();

/**
 * GET /health
 * Returns simple status for health checks.
 */
// PUBLIC_INTERFACE
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;

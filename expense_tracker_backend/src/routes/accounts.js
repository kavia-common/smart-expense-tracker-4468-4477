import express from 'express';
import { listAccounts } from '../controllers/accountsController.js';

const router = express.Router();

// PUBLIC_INTERFACE
// /accounts - List accounts (protected)
router.get('/', listAccounts);

export default router;

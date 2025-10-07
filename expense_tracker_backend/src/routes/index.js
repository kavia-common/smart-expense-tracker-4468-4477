import express from 'express';

import healthRouter from './health.js';
import transactionsRouter from './transactions.js';
import budgetsRouter from './budgets.js';
import goalsRouter from './goals.js';
import reportsRouter from './reports.js';
import categoriesRouter from './categories.js';

import authRouter from './auth.js';
import profileRouter from './profile.js';
import accountsRouter from './accounts.js';

import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.use('/health', healthRouter);
router.use('/auth', authRouter);

// Protected routes
router.use('/profile', authMiddleware, profileRouter);
router.use('/accounts', authMiddleware, accountsRouter);

// Protect existing domain routes
router.use('/transactions', authMiddleware, transactionsRouter);
router.use('/budgets', authMiddleware, budgetsRouter);
router.use('/goals', authMiddleware, goalsRouter);
router.use('/reports', authMiddleware, reportsRouter);
router.use('/categories', authMiddleware, categoriesRouter);

export default router;

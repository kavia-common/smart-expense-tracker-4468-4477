import { Router } from 'express';
import { spendingByCategory, incomeVsExpense, listAlerts } from '../controllers/reportsController.js';

const router = Router();

// PUBLIC_INTERFACE
router.get('/spending-by-category', spendingByCategory);
// PUBLIC_INTERFACE
router.get('/income-vs-expense', incomeVsExpense);
// PUBLIC_INTERFACE
router.get('/alerts', listAlerts);

export default router;

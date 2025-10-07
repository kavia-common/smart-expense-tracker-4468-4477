import { Router } from 'express';
import { listBudgets, createBudget, updateBudget, deleteBudget } from '../controllers/budgetsController.js';

const router = Router();

// PUBLIC_INTERFACE
router.get('/', listBudgets);
// PUBLIC_INTERFACE
router.post('/', createBudget);
// PUBLIC_INTERFACE
router.put('/:id', updateBudget);
// PUBLIC_INTERFACE
router.delete('/:id', deleteBudget);

export default router;

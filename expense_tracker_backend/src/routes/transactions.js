import { Router } from 'express';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
} from '../controllers/transactionsController.js';

const router = Router();

// PUBLIC_INTERFACE
router.get('/', listTransactions);
// PUBLIC_INTERFACE
router.post('/', createTransaction);
// PUBLIC_INTERFACE
router.put('/:id', updateTransaction);
// PUBLIC_INTERFACE
router.delete('/:id', deleteTransaction);
// PUBLIC_INTERFACE
router.get('/summary', getSummary);

export default router;

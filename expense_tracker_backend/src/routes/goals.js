import { Router } from 'express';
import { listGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goalsController.js';

const router = Router();

// PUBLIC_INTERFACE
router.get('/', listGoals);
// PUBLIC_INTERFACE
router.post('/', createGoal);
// PUBLIC_INTERFACE
router.put('/:id', updateGoal);
// PUBLIC_INTERFACE
router.delete('/:id', deleteGoal);

export default router;

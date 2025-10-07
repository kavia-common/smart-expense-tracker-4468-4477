import { Router } from 'express';
import { listCategories } from '../controllers/categoriesController.js';

const router = Router();

// PUBLIC_INTERFACE
router.get('/', listCategories);

export default router;

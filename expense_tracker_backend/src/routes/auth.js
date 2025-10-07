import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// PUBLIC_INTERFACE
// /auth/register - Register user
router.post('/register', register);

// PUBLIC_INTERFACE
// /auth/login - Login user
router.post('/login', login);

export default router;

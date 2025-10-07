import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';

const router = express.Router();

// PUBLIC_INTERFACE
// /profile - Get and update profile (protected)
router.get('/', getProfile);
router.put('/', updateProfile);

export default router;

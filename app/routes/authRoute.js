import express from 'express';
const router = express.Router();
import { login, logout, register } from '../controllers/authHandler.js';
import { authMiddleware } from '../utils/validation.js';

// Register router
router.post('/register', register);

// Login router
router.post('/login', login);

// Logout router
router.post('/logout', authMiddleware, logout);

export default router;

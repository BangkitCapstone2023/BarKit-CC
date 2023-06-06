import express from 'express';
import { login, logout, register } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// Register router
router.post('/register', register);

// Login router
router.post('/login', login);

// Logout router
router.post('/logout', authMiddleware, logout);

export default router;

import express from 'express';
const router = express.Router();
import { login, logout, register } from '../controllers/authHandler.js';
import { authMiddleware } from '../utils/validation.js';

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Register route
router.post('/logout', authMiddleware, logout);

export default router;

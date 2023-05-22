import express from 'express';
const router = express.Router();
import { login, register } from '../controllers/authHandler.js';

// Login route
router.post('/login', login);

// Register route
router.post('/register', register);

export default router;

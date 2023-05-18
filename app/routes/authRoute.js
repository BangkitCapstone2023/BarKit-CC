const express = require('express');
const router = express.Router();
const authHandler = require('../controllers/authHandler');

// Login route
router.post('/login', authHandler.login);

// Register route
router.post('/register', authHandler.register);

module.exports = router;

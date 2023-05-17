const express = require('express');
const router = express.Router();
const authHandler = require('../controllers/authHandler');

// Login route
router.post('/login', async (req, res) => {
  // console.log(req.body);

  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  try {
    const token = await authHandler.loginUser(user.email, user.password);
    res.json({ email: user.email, access_token: token });
  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Password yang dimasukkan salah';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'Email pengguna tidak ditemukan';
    } else {
      errorMessage = `Error logging in user: ${error}`;
    }
    res.status(401).json({ error: errorMessage });
  }
});

// Register route
router.post('/register', async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
    username: req.body.username,
    fullName: req.body.fullName,
    address: req.body.address,
    phone: req.body.phone,
    gender: req.body.gender,
  };

  try {
    const userResponse = await authHandler.createUser(
      user.email,
      user.password,
      user.username,
      user.fullName,
      user.address,
      user.phone,
      user.gender,
      user.isLessor
    );
    res.json(userResponse);
    console.log(`Success Create User ${user.username}`);
  } catch (error) {
    if (
      error.message === 'Email, password, username, and fullName are required'
    ) {
      res.status(400).json({ error: error.message });
    } else if (error.message.startsWith('Username')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

module.exports = router;

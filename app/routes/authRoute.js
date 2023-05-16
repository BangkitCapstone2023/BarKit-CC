const express = require('express');
const admin = require('firebase-admin');
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
  // console.log(req.body);

  const user = {
    email: req.body.email,
    password: req.body.password,
    username: req.body.username,
    fullName: req.body.fullName,
    address: req.body.address,
    phone: req.body.phone,
    gender: req.body.gender,
  };

  const db = admin.firestore();

  try {
    // Validasi data yang wajib diisi (email, password, username, fullName)
    if (!user.email || !user.password || !user.username || !user.fullName) {
      return res.status(400).json({
        error: 'Email, password, username, and fullName are required',
      });
    }

    const usernameSnapshot = await db
      .collection('renters')
      .where('username', '==', user.username)
      .get();
    if (!usernameSnapshot.empty) {
      return res.status(400).json({
        error: `Username ${user.username} Already Taken`,
      });
    }

    const userResponse = await authHandler.createUser(
      user.email,
      user.password,
      user.username,
      user.fullName,
      user.address,
      user.phone,
      user.gender
    );
    res.json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.errorInfo.message });
  }
});

module.exports = router;

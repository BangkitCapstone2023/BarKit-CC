const express = require('express');
const router = express.Router();
const registerHandler = require('../controllers/registerHandler');

// Register route
router.post('/register', async (req, res) => {
  console.log(req.body);

  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  try {
    const userResponse = await registerHandler.createUser(
      user.email,
      user.password
    );
    res.json(userResponse);
  } catch (error) {
    errorMessage = error.errorInfo.message;

    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;

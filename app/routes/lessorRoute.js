const express = require('express');
const router = express.Router();
const lessorHandler = require('../controllers/lessorHandler');
const admin = require('firebase-admin');

router.post('/:username/registerLessor', async (req, res) => {
  const lessor = {
    email: req.body.email,
    username: req.body.username,
    fullName: req.body.fullName,
    storeFullName: req.body.storeFullName,
    storeAddress: req.body.storeAddress,
    storeEmail: req.body.storeEmail,
    storePhone: req.body.storePhone,
    storeStatus: req.body.storeStatus,
    kurirId: req.body.kurirId,
  };

  try {
    const db = admin.firestore();

    // Check if the user exists
    const userSnapshot = await db
      .collection('renters')
      .where('username', '==', req.params.username)
      .get();
    if (userSnapshot.empty) {
      throw new Error(`User "${req.params.username}" not found`);
    }

    const userData = userSnapshot.docs[0].data();
    const fullName = userData.fullName; // Get the renter fullName
    const username = userData.username;
    const email = userData.email;

    const renterId = userSnapshot.docs[0].id; // Get the renter ID

    const lessorResponse = await lessorHandler.createLessor(
      email,
      username,
      fullName,
      renterId,
      lessor.storeFullName,
      lessor.storeAddress,
      lessor.storeEmail,
      lessor.storePhone,
      lessor.storeStatus,
      lessor.kurirId
    );
    res.json(lessorResponse);
    console.log(`Success Create Lessor ${username}`);
  } catch (error) {
    if (
      error.message === 'Email, password, username, and fullName are required'
    ) {
      res.status(400).json({ error: error.message });
    } else if (error.message.startsWith('Username')) {
      res.status(400).json({ error: error.message });
    } else {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;

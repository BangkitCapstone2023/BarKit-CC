/* eslint-disable */
const express = require('express');
const app = express();
const port = 8080;

app.get('/', (req, res) => {
  res.send('Hello World!');
  console.log('tes');
});

// Firebase Config
const admin = require('firebase-admin');
const credentials = require('./app/config/firebaseAccountKey.json');

function initializeApp() {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

async function createUser(email, password) {
  try {
    const user = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false,
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/register', async (req, res) => {
  console.log(req.body);

  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  try {
    const userResponse = await createUser(user.email, user.password);
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

initializeApp();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

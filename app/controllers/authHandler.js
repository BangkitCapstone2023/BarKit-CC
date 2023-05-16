const admin = require('firebase-admin');
const firebase = require('firebase/compat/app');
require('firebase/compat/auth');

// Inisialisasi Firebase client-side app
const clientConfig = require('../config/firebaseClientConfig.json');
firebase.initializeApp(clientConfig);

// Login user using Firebase Admin SDK
async function loginUser(email, password) {
  try {
    const userCredential = await admin.auth().getUserByEmail(email);
    const { uid } = userCredential;

    // Use the Firebase JavaScript SDK for client-side authentication
    const userAuth = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);

    // console.log(userAuth);

    // Generate a custom token using the Firebase Admin SDK
    const token = await admin.auth().createCustomToken(uid);
    return token;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
}

// Create user using Firebase Admin SDK
async function createUser(email, password) {
  try {
    const user = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

module.exports = {
  loginUser,
  createUser,
};

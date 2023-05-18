const admin = require('firebase-admin');
const firebase = require('firebase/compat/app');
require('firebase/compat/auth');

// Inisialisasi Firebase client-side app
const clientConfig = require('../config/firebaseClientConfig.json');
firebase.initializeApp(clientConfig);

// Login user menggunakan Firebase Admin SDK
async function loginUser(email, password) {
  try {
    // Gunakan Firebase JavaScript SDK untuk otentikasi di sisi klien
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const { uid } = userCredential.user;

    // Generate custom token menggunakan Firebase Admin SDK
    const token = await admin.auth().createCustomToken(uid);
    return token;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
}

// Create user using Firebase Admin SDK
async function createUser(
  email,
  password,
  username,
  fullName,
  address = '',
  phone = '',
  gender = 'male',
  isLessor = false
) {
  const db = admin.firestore();
  
  try {
    // Validating required fields
    if (!email || !password || !username || !fullName) {
      throw new Error('Email, password, username, and fullName are required');
    }

    // Validating username uniqueness
    const usernameSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();
    if (!usernameSnapshot.empty) {
      throw new Error(`Username "${username}" is already taken`);
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    });

    // Save additional data to Firestore if not empty
    const userDocRef = db.collection('renters').doc(userRecord.uid);
    const userData = {
      id: userRecord.uid,
      email,
      password,
      username,
      fullName,
      phone,
      address,
      gender,
      isLessor,
    };

    await userDocRef.set(userData);
    console.log(`Success Store Renter to firestore ${username}`);
    return userRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
module.exports = {
  loginUser,
  createUser,
};

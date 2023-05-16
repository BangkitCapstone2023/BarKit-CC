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

// Create user menggunakan Firebase Admin SDK
async function createUser(
  email,
  password,
  username,
  fullName,
  address = '',
  phone = '',
  gender = 'male'
) {
  const db = admin.firestore();

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    });

    // Simpan data tambahan ke Firestore jika tidak kosong
    const userDocRef = db.collection('renters').doc(userRecord.uid);
    const userData = {
      id: userRecord.uid,
      email,
      password,
      username,
      fullName,
      phone: phone,
      address: address,
      gender: gender,
    };

    await userDocRef.set(userData);

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

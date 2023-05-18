const admin = require('firebase-admin');
const firebase = require('firebase/compat/app');
require('firebase/compat/auth');
const Response = require('../utils/response');

// Inisialisasi Firebase client-side app
const clientConfig = require('../config/firebaseClientConfig.json');
firebase.initializeApp(clientConfig);

// Login user menggunakan Firebase Admin SDK
async function login(req, res) {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  try {
    const token = await loginUser(user.email, user.password);
    const userLoginData = {
      email: user.email,
      token: token,
    };

    const response = Response.successResponse(
      200,
      'User Success Login',
      userLoginData
    );

    res.status(200).json(response);
  } catch (error) {
    let errorMessage = '';

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Password yang dimasukkan salah';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email pengguna tidak ditemukan';
    } else {
      errorMessage = `Error logging in user: ${error}`;
    }

    const response = Response.badResponse(401, errorMessage);
    res.status(401).json(response);
  }
}

// Create user using Firebase Admin SDK
async function register(req, res) {
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
    const userResponse = await createUser(
      user.email,
      user.password,
      user.username,
      user.fullName,
      user.address,
      user.phone,
      user.gender,
      user.isLessor
    );
    const response = Response.successResponse(
      201,
      'User Success Register',
      userResponse
    );
    res.status(201).json(response);
    console.log(`Success Create User ${user.username}`);
  } catch (error) {
    let errorMessage = '';

    if (
      error.message === 'Email, password, username, and fullName are required'
    ) {
      errorMessage = error.message;
    } else if (error.message.startsWith('Username')) {
      errorMessage = error.message;
    } else {
      errorMessage = error;
    }

    const response = Response.badResponse(400, errorMessage);
    res.json(response);
  }
}

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
  login,
  register,
};

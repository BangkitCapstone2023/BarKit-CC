import admin from 'firebase-admin';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { badResponse, successResponse } from '../utils/response.js';
import { db } from '../config/configFirebase.js';

// Inisialisasi Firebase client-side app
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientConfigPath = join(
  __dirname,
  '../config/firebaseClientConfig2.json'
);
const clientConfig = JSON.parse(readFileSync(clientConfigPath, 'utf8'));
firebase.initializeApp(clientConfig);

// Login Renters
const login = async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  try {
    const { token, loginTime } = await loginUser(user.email, user.password);
    const userLoginData = {
      email: user.email,
      loginTime: loginTime,
      token: token,
    };

    const response = successResponse(200, 'User Success Login', userLoginData);
    res.status(200).json(response);
  } catch (error) {
    let errorMessage = '';

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Password yang dimasukkan salah';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email pengguna tidak ditemukan';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User tidak ditemukan';
    } else {
      errorMessage = `Error logging in user: ${error}`;
    }
    const response = badResponse(401, errorMessage, error.message);
    res.status(401).json(response);
  }
};

const loginUser = async (email, password) => {
  try {
    const timestamp = admin.firestore.Timestamp.now(); // Mendapatkan timestamp saat login

    // Otentikasi di sisi klien
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const { uid } = userCredential.user;

    // Generate custom token
    const token = await admin.auth().createCustomToken(uid);

    return {
      token: token,
      loginTime: timestamp.toDate(),
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// Create Renters
const register = async (req, res) => {
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
    const response = successResponse(
      201,
      'User Success Register',
      userResponse
    );
    res.status(201).json(response);
    console.log(`Success Create User ${user.username}`);
  } catch (error) {
    const response = badResponse(400, error, error);
    res.json(response);
  }
};

const createUser = async (
  email,
  password,
  username,
  fullName,
  address = '',
  phone = '',
  gender = 'male',
  isLessor = false
) => {
  try {
    // Validating required fields
    if (!email || !password || !username || !fullName) {
      let errorMessage = '';
      if (!email) {
        errorMessage += 'Email is required. ';
      }
      if (!password) {
        errorMessage += 'Password is required. ';
      }
      if (!username) {
        errorMessage += 'Username is required. ';
      }
      if (!fullName) {
        errorMessage += 'Full Name is required. ';
      }
      throw new Error(errorMessage.trim());
    }

    // Validating username uniqueness
    const usernameSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();
    if (!usernameSnapshot.empty) {
      throw new Error(`Username '${username}' is already taken`);
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
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

    const responseData = { ...userData, userRecord };

    await userDocRef.set(userData);
    console.log(`Success Store Renter to firestore ${username}`);
    return responseData;
  } catch (error) {
    console.error('Error creating user:', error.message);
    throw error.message;
  }
};

export { login, register };

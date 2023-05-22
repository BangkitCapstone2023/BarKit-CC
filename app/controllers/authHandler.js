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
  const { email, password } = req.body;

  try {
    const { token, loginTime } = await loginUser(email, password);
    const userLoginData = {
      email,
      loginTime,
      token,
    };

    const response = successResponse(200, 'User Success Login', userLoginData);
    res.status(200).json(response);
  } catch (error) {
    let errorMessage = '';

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Password yang dimasukkan salah';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email pengguna tidak valid';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User tidak ditemukan';
    } else {
      errorMessage = `Error logging in user: ${error}`;
    }
    const response = badResponse(401, errorMessage);
    res.status(401).json(response);
  }
};

const loginUser = async (email, password) => {
  try {
    const timestamp = admin.firestore.Timestamp.now(); // Mendapatkan timestamp saat login

    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const { uid } = userCredential.user;

    const token = await admin.auth().createCustomToken(uid);

    return {
      token,
      loginTime: timestamp.toDate(),
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// Create Renters
const register = async (req, res) => {
  const { email, password, username, fullName, address, phone, gender } =
    req.body;

  try {
    const userResponse = await createUser(
      email,
      password,
      username,
      fullName,
      address,
      phone,
      gender
    );
    const response = successResponse(
      201,
      'User Success Register',
      userResponse
    );
    res.status(201).json(response);
    console.log(`Success Create User ${username}`);
  } catch (error) {
    const response = badResponse(
      500,
      'Error While Creating User',
      error.message
    );
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
  gender = 'male'
) => {
  try {
    // Validating required fields
    const requiredFields = ['email', 'password', 'username', 'fullName'];
    const missingFields = requiredFields.filter(
      (field) => !email || !password || !username || !fullName
    );
    if (missingFields.length > 0) {
      const errorMessage = missingFields
        .map((field) => `${field} is required`)
        .join('. ');
      throw new Error(errorMessage);
    }

    // Validating username uniqueness
    const usernameSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();
    if (!usernameSnapshot.empty) {
      throw new Error(`Username '${username}' is already taken`);
    }

    const userRecord = await admin.auth().createUser({ email, password });

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
    };

    const responseData = { ...userData, userRecord };

    await userDocRef.set(userData);
    console.log(`Success Store Renter to Firestore ${username}`);
    return responseData;
  } catch (error) {
    console.error('Error creating user', error.message);
    throw error;
  }
};

export { login, register };

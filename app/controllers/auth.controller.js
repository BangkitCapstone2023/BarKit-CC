import admin from 'firebase-admin';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import db from '../config/firebase.config.js';
import { badResponse, successResponse } from '../utils/response.js';
import formattedTimestamp from '../utils/time.js';

const filename = fileURLToPath(import.meta.url);
const filedirname = dirname(filename);

const configPath = join(filedirname, '../config/config.json');
const config = JSON.parse(readFileSync(configPath));

const clientConfigPath = join(
  filedirname,
  '../config/',
  config.firebaseConfigCredentail,
);
const clientConfig = JSON.parse(readFileSync(clientConfigPath, 'utf8'));
firebase.initializeApp(clientConfig);

// Register Renters Handler
const createUser = async (
  email,
  password,
  username,
  fullName,
  address = '',
  phone = '',
  gender = 'male',
) => {
  try {
    // Validating required fields
    const requiredFields = ['email', 'password', 'username', 'fullName'];
    const missingFields = requiredFields.filter(
      () => !email || !password || !username || !fullName,
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

    const userRecordData = {
      emailVerified: userRecord.emailVerified,
      lastRefreshTime: userRecord.metadata.lastRefreshTime,
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime,
    };

    const userDocRef = db.collection('renters').doc(userRecord.uid);
    const userData = {
      renter_id: userRecord.uid,
      email,
      password,
      username,
      fullName,
      phone,
      address,
      gender,
    };

    delete userData.password;
    await userDocRef.set(userData);
    const responseData = { ...userData, userRecordDatas: userRecordData };
    return responseData;
  } catch (error) {
    console.error('Error creating user', error.message);
    throw error;
  }
};

const register = async (req, res) => {
  const {
    email,
    password,
    username,
    fullName,
    address,
    phone,
    gender,
  } = req.body;

  try {
    const userResponse = await createUser(
      email,
      password,
      username,
      fullName,
      address,
      phone,
      gender,
    );

    delete userResponse.password;

    const response = successResponse(
      201,
      'User Success Register',
      userResponse,
    );
    res.status(201).json(response);
  } catch (error) {
    const response = badResponse(
      500,
      'Error While Creating User',
      error.message,
    );
    res.json(response);
  }
};

const loginUser = async (email, password) => {
  try {
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    // eslint-disable-next-line no-unused-vars
    const { uid } = userCredential.user;

    // Generate JWT Token
    const token = await firebase.auth().currentUser.getIdToken();

    return {
      token,
      loginTime: formattedTimestamp,
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// Login Renters Handler
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { token, loginTime } = await loginUser(email, password);
    const renterSnapshot = await db
      .collection('renters')
      .where('email', '==', email)
      .get();

    const renterData = renterSnapshot.docs[0].data();

    const userLoginData = {
      email,
      token,
    };

    const renterDocRef = renterSnapshot.docs[0].ref;
    // Update Last Sign Time
    await renterDocRef.update({
      'userRecordData.lastSignInTime': loginTime,
    });
    const resposeData = {
      ...userLoginData,
      renter: {
        ...renterData,
        userRecordData: {
          ...renterData.userRecordData,
          lastSignInTime: loginTime,
        },
      },
    };
    const response = successResponse(200, 'User Success Login', resposeData);
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

// Logout Renters Handler
const logout = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { uid } = req.user;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authorization.split('Bearer ')[1];

    // Tandai token sebagai tidak valid di Firestore
    await db.collection('tokens').doc(token).set({ invalid: true });

    await admin.auth().revokeRefreshTokens(uid);

    const logoutTime = formattedTimestamp;
    // Tandai token sebagai tidak valid di Firestore
    await db
      .collection('tokens')
      .doc(token)
      .set({ invalid: true, time: logoutTime, type: 'logout tokens' });

    const response = successResponse(200, 'User logged out successfully');
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    const response = badResponse(401, 'Failed to logout user');
    res.status(401).json(response);
  }
};

export { login, register, logout };

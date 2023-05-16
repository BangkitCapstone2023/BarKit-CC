const admin = require('firebase-admin');

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
  createUser,
};

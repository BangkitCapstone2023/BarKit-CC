const admin = require('firebase-admin');
const firebase = require('firebase/compat/app');
require('firebase/compat/auth');

// Create lessor using Firebase Admin SDK
async function createLessor(
  email,
  username,
  fullName,
  renterId,
  storeFullName = '',
  storeAddress = '',
  storeEmail = '',
  storePhone = '',
  storeActive = true,
  kurirId = []
) {
  const db = admin.firestore();

  try {
    // // Validating username uniqueness
    // const usernameSnapshot = await db
    //   .collection('lessors')
    //   .where('username', '==', username)
    //   .get();
    // if (!usernameSnapshot.empty) {
    //   throw new Error(`Username "${username}" is already taken`);
    // }

    // Save additional data to Firestore if not empty
    const userDocRef = db.collection('lessors').doc();
    const userData = {
      email,
      username,
      fullName,
      renterId,
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
      storeActive,
      kurirId,
    };

    await userDocRef.set(userData);
    console.log(`Success Store Lessor Data to Firestore ${username}`);
    return userData;
  } catch (error) {
    console.error('Error creating lessor:', error);
    throw error;
  }
}
module.exports = {
  createLessor, // Add createLessor to exports
};

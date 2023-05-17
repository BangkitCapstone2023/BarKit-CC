const admin = require('firebase-admin');

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
  const auth = admin.auth();

  try {
    // Save additional data to Firestore if not empty
    const userDocRef = db.collection('lessors').doc();
    const lessorId = userDocRef.id; // Generate a new lessor ID
    const userData = {
      lessorId,
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

    // Update isLessor attribute in user document
    const renterRef = db.collection('renters').doc(renterId);
    await renterRef.update({ isLessor: true });

    // Get renter data
    const renterSnapshot = await renterRef.get();
    const renterData = renterSnapshot.data();

    return {
      ...userData,
      renterData,
    };
  } catch (error) {
    console.error('Error creating lessor:', error);
    throw error;
  }
}

module.exports = {
  createLessor,
};

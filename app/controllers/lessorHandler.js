const admin = require('firebase-admin');
const Response = require('../utils/response');

// Register Lessor
async function registerLessor(req, res) {
  const lessor = {
    email: req.body.email,
    username: req.body.username,
    fullName: req.body.fullName,
    storeFullName: req.body.storeFullName,
    storeAddress: req.body.storeAddress,
    storeEmail: req.body.storeEmail,
    storePhone: req.body.storePhone,
    storeStatus: req.body.storeStatus,
    kurirId: req.body.kurirId,
  };

  try {
    const db = admin.firestore();

    // Check if the user exists
    const userSnapshot = await db
      .collection('renters')
      .where('username', '==', req.params.username)
      .get();
    if (userSnapshot.empty) {
      throw new Error(`User "${req.params.username}" not found`);
    }

    var userData = userSnapshot.docs[0].data();
    const fullName = userData.fullName; // Get the renter fullName
    const username = userData.username;
    const email = userData.email;

    const renterId = userSnapshot.docs[0].id; // Get the renter ID

    // Save additional data to Firestore if not empty
    const userDocRef = db.collection('lessors').doc();
    const lessorId = userDocRef.id; // Generate a new lessor ID
    var userData = {
      lessorId, // Add lessor ID
      email,
      username,
      fullName,
      renterId,
      storeFullName: lessor.storeFullName,
      storeAddress: lessor.storeAddress,
      storeEmail: lessor.storeEmail,
      storePhone: lessor.storePhone,
      storeActive: true,
      kurirId: lessor.kurirId || '',
    };

    await userDocRef.set(userData);
    console.log(`Success Store Lessor Data to Firestore ${username}`);

    // Update isLessor attribute in user document
    const renterRef = db.collection('renters').doc(renterId);
    await renterRef.update({ isLessor: true });

    // // Get renter data
    // const renterSnapshot = await renterRef.get();
    // const renterData = renterSnapshot.data();

    const response = Response.successResponse(
      201,
      `Success Create Lessor ${username}`,
      userData
    );
    res.status(201).json(response);
    console.log(`Success Create Lessor ${username}`);
  } catch (error) {
    console.log(error);
    const response = Response.badResponse(500, error.message);
    res.status(500).json(response);
  }
}

module.exports = {
  registerLessor,
};

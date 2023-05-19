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

async function getAllLessors(req, res) {
  try {
    const db = admin.firestore();

    // Get all lessors from Firestore
    const lessorsSnapshot = await db.collection('lessors').get();

    const lessorsData = [];

    // Iterate through the lessors snapshot and collect the data
    lessorsSnapshot.forEach((doc) => {
      const lessorData = doc.data();
      lessorsData.push(lessorData);
    });

    const response = {
      message: 'Success',
      data: lessorsData,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessors:', error);
    return res.status(500).send('An error occurred while getting lessor data');
  }
}

async function getLessorByUsername(req, res) {
  try {
    const db = admin.firestore();

    const username = req.params.username;

    // Check if the lessor exists
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      throw new Error(`Lessor "${username}" not found`);
    }

    const lessorData = lessorSnapshot.docs[0].data();

    const response = {
      message: 'Success',
      data: lessorData,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessor:', error);
    return res.status(500).send('An error occurred while getting lessor data');
  }
}

async function updateLessorData(req, res) {
  try {
    const db = admin.firestore();

    const username = req.params.username;
    const { storeFullName, storeAddress, storeEmail, storePhone } = req.body;

    // Check if the lessor exists
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      throw new Error(`Lessor "${username}" not found`);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    // Update the lessor data
    await db.collection('lessors').doc(lessorId).update({
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
    });

    const response = {
      message: 'Success',
      data: {
        lessorId,
        username,
        storeFullName,
        storeAddress,
        storeEmail,
        storePhone,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating lessor:', error);
    return res.status(500).send('An error occurred while updating lessor data');
  }
}

module.exports = {
  registerLessor,
  getLessorByUsername,
  getAllLessors,
  updateLessorData,
};

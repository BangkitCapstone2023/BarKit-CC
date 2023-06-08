import db from '../config/firebase.config.js';
import { badResponse } from '../utils/response.js';

// Verify Renter
const verifyRenter = async (username, uid) => {
  try {
    // Check Renter
    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    if (renterSnapshot.empty) {
      return {
        errorRenter: true,
        statusRenter: 404,
        checkResponseRenter: badResponse(404, 'User not found'),
      };
    }

    const renterData = renterSnapshot.docs[0].data();
    const renterRef = renterSnapshot.docs[0].ref;

    // Check Auth Token
    if (renterData.renter_id !== uid) {
      return {
        errorRenter: true,
        statusRenter: 403,
        checkResponseRenter: badResponse(403, 'Not allowed'),
      };
    }

    return {
      errorRenter: false,
      renterData,
      renterRef,
    };
  } catch (error) {
    console.error('Error while checking username and UID:', error);
    return {
      errorUser: true,
      statusRenter: 500,
      checkResponseRenter: badResponse(
        500,
        'An error occurred while checking username and UID',
      ),
    };
  }
};

// Verify Lessor
const verifyLessor = async (username, uid) => {
  try {
    // Check Renter
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      return {
        errorLessor: true,
        statusLessor: 404,
        checkResponseLessor: badResponse(404, 'Lessor not found'),
      };
    }

    const lessorData = lessorSnapshot.docs[0].data();
    const lessorRef = lessorSnapshot.docs[0].ref;

    // Check Auth Token
    if (lessorData.renter_id !== uid) {
      return {
        errorLessor: true,
        statusLessor: 403,
        checkResponseLessor: badResponse(403, 'Not allowed'),
      };
    }

    return {
      errorLessor: false,
      lessorData,
      lessorRef,
    };
  } catch (error) {
    console.error('Error while checking lessors username and UID:', error);
    return {
      errorUser: true,
      statusRenter: 500,
      checkResponseRenter: badResponse(
        500,
        'An error occurred while checking username and UID',
      ),
    };
  }
};

const checkUID = async (collection, id, uid) => {
  const snapshot = await db.collection(`${collection}`).doc(id).get();

  const snapshotData = snapshot.data();

  if (snapshotData.renter_id !== uid) {
    return {
      errorUID: true,
      statusUID: 403,
      checkResponseUID: badResponse(403, 'Not allowed'),
    };
  }
  return {
    errorUID: false,
    snapshotData,
  };
};

export { verifyRenter, verifyLessor, checkUID };

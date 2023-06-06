import admin from 'firebase-admin';
import db from '../config/firebase.config.js';

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;

  try {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authorization.split('Bearer ')[1];

    // Periksa apakah renter sudah logout
    const tokenSnapshoot = db.collection('tokens').doc(token);
    const tokenRef = await tokenSnapshoot.get();
    if (tokenRef.exists && tokenRef.data().invalid) {
      throw new Error('Unauthorized');
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    const docRef = db.collection('tokens').doc(token);
    const doc = await docRef.get();
    if (doc.exists && doc.data().invalid) {
      throw new Error('Login Session Expire');
    }

    next();
  } catch (error) {
    console.error(error.message);
    res.status(401).json({ status: 401, message: 'Unauthorized' });
  }
};

const adminMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  try {
    if (!authorization) {
      res.status(403).json({ status: 403, message: 'Forbidden' });
      return;
    }
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    const adminSnapshot = await db
      .collection('renters')
      .where('isAdmin', '==', true)
      .get();
    const adminData = adminSnapshot.docs[0].data();
    if (adminData.admin_id !== decodedToken.uid) {
      res.status(403).json({ status: 403, message: 'Forbidden' });
      return;
    }
    next();
  } catch (error) {
    res.status(403).json({ status: 403, message: 'Forbidden' });
  }
};

export { authMiddleware, adminMiddleware };

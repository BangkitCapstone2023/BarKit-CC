import admin from 'firebase-admin';
import { db } from '../config/configFirebase.js';

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;

  try {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: 'Unauthorized' });
  }
};

const adminMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  try {
    if (!authorization) {
      return res.status(403).json({ status: 403, message: 'Forbidden' });
    } else {
      const token = authorization.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Decoder Token', decodedToken);
      req.user = decodedToken;

      const adminSnapshot = await db
        .collection('renters')
        .where('fullName', '==', 'Admin Barkit')
        .get();
      const adminData = adminSnapshot.docs[0].data();
      if (adminData.admin_id !== decodedToken.uid) {
        return res.status(403).json({ status: 403, message: 'Forbidden' });
      }
    }
    next();
  } catch {
    return res.status(403).json({ status: 403, message: 'Forbidden' });
  }
};

export { authMiddleware, adminMiddleware };

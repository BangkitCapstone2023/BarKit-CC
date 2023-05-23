import admin from 'firebase-admin';

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;

  try {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Decoder Token', decodedToken);
    req.user = decodedToken;

    next();
  } catch (error) {
    res.status(401).json({ status: 401, message: 'Unauthorized' });
  }
};

export default authMiddleware;

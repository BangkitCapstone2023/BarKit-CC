// Firebase Config
const admin = require('firebase-admin');
const credentials = require('./firebaseAccountKey.json');

async function initializeApp() {
  await admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

module.exports = initializeApp;

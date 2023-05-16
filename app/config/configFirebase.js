// Firebase Config
const admin = require('firebase-admin');
const credentials = require('./firebaseAccountKey.json');

function initializeApp() {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

module.exports = initializeApp;

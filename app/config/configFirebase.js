const admin = require('firebase-admin');
const credentials = require('./firebaseAccountKey2.json');

// Inisialisasi aplikasi Firebase
admin.initializeApp({
  credential: admin.credential.cert(credentials),
  databaseURL: 'https://kirbattesting.firebaseio.com',
});

const db = admin.firestore();

module.exports = { db };

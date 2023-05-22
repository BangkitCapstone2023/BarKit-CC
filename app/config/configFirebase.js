import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const credentialsPath = join(__dirname, 'firebaseAccountKey2.json');
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'));

// Inisialisasi aplikasi Firebase
admin.initializeApp({
  credential: admin.credential.cert(credentials),
  databaseURL: 'https://kirbattesting.firebaseio.com',
});

export const db = admin.firestore();

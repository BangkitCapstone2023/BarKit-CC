import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, 'config.json');
const config = JSON.parse(readFileSync(configPath));

const firebaseAdminCredential = join(__dirname, config.firebaseAdminCredential);
const credentials = JSON.parse(readFileSync(firebaseAdminCredential, 'utf8'));

// Inisialisasi aplikasi Firebase
admin.initializeApp({
  credential: admin.credential.cert(credentials),
  databaseURL: config.databaseURL,
});

export const db = admin.firestore();

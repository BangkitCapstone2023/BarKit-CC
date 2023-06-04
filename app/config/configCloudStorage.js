import pkg from '@google-cloud/storage';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Storage } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, 'config.json');
const config = JSON.parse(readFileSync(configPath));

const serviceKey = join(__dirname, config.cloudStorageCredential);
const storage = new Storage({
  projectId: config.projectId,
  keyFilename: serviceKey,
});
const bucketName = config.bucketName;

export { storage, bucketName };

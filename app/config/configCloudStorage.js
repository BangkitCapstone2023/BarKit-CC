import { Storage } from '@google-cloud/storage';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceKey = join(__dirname, 'cloudStorageKey2.json');
const storage = new Storage({
  projectId: 'barkit-c23pr544',
  keyFilename: serviceKey,
});
const bucketName = 'barkit-images';

export { storage, bucketName };

import pkg from '@google-cloud/storage';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Storage } = pkg;

const filename = fileURLToPath(import.meta.url);
const filedirname = dirname(filename);

const configPath = join(filedirname, 'config.json');
const config = JSON.parse(readFileSync(configPath));

const serviceKey = join(filedirname, config.cloudStorageCredential);
const storage = new Storage({
  projectId: config.projectId,
  keyFilename: serviceKey,
});
const { bucketName } = config;

export { storage, bucketName };

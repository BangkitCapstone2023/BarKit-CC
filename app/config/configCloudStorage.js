const { Storage } = require('@google-cloud/storage');
const path = require('path');

const serviceKey = path.join(__dirname, 'cloudStorageKey.json');
const storage = new Storage({
  projectId: 'barkit-c23pr544',
  keyFilename: serviceKey,
});
const bucketName = 'barkit-images';

module.exports = { storage, bucketName };

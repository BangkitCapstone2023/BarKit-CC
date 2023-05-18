const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const { storage, bucketName } = require('../config/configCloudStorage');
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

async function handleImageUpload(req, res) {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Error saat mengunggah file:', err);
      return res.status(500).send('Terjadi kesalahan saat mengunggah gambar.');
    } else if (err) {
      console.error('Error saat mengunggah file:', err);
      return res.status(500).send('Terjadi kesalahan saat mengunggah gambar.');
    }

    if (!req.file) {
      return res.status(400).send('Tidak ada file yang diunggah.');
    }

    const file = req.file;

    // Cek ukuran file
    const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeInBytes) {
      return res.status(400).send('Ukuran gambar melebihi batas maksimum.');
    }

    const fileId = uuidv4(); // Membuat UUID sebagai ID gambar
    const fileName = file.originalname; // Menambahkan UUID pada nama file
    const blob = storage.bucket(bucketName).file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      predefinedAcl: 'publicRead', // Membuat gambar otomatis public
    });

    blobStream.on('error', (err) => {
      console.error('Error saat mengunggah file:', err);
      return res.status(500).send('Terjadi kesalahan saat mengunggah gambar.');
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      const imageInfo = {
        id: fileId,
        name: file.originalname,
        url: publicUrl,
      };
      return res.status(200).json(imageInfo);
    });

    blobStream.end(file.buffer);
  });
}

async function getAllImages(req, res) {
  try {
    const [files] = await storage.bucket(bucketName).getFiles();
    const imageUrls = files.map((file) => ({
      name: file.name,
      url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
    }));
    return res.status(200).json(imageUrls);
  } catch (err) {
    console.error('Error saat mendapatkan daftar gambar:', err);
    return res
      .status(500)
      .send('Terjadi kesalahan saat mengambil daftar gambar.');
  }
}

async function getImageByName(req, res) {
  const { name } = req.params;
  const [files] = await storage.bucket(bucketName).getFiles({ prefix: name });

  // Memeriksa keberadaan file
  if (!files || files.length === 0) {
    return res.status(404).json({ error: 'Gambar tidak ditemukan.' });
  }

  const file = files[0];

  const imageUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;

  return res.status(200).json({ name: file.name, url: imageUrl });
}

module.exports = {
  handleImageUpload,
  getAllImages,
  getImageByName,
};

// async function getImageById(req, res) {
//   const { id } = req.params;
//   const [files] = await storage.bucket(bucketName).getFiles();

//   const file = files.find((file) => {
//     const fileId = file.name.split('.').slice(0, -1).join('.');
//     return fileId === id;
//   });

//   if (!file) {
//     return res.status(404).json({ error: 'Gambar tidak ditemukan.' });
//   }

//   const imageUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;

//   return res.status(200).json({ id, name: file.name, url: imageUrl });
// }

// async function downloadImage(req, res) {
//   const { name } = req.params;
//   const file = storage.bucket(bucketName).file(name);
//   const readStream = file.createReadStream();
//   res.set('Content-Disposition', `attachment; filename=${name}`);
//   res.set('Content-Type', file.metadata.contentType);
//   readStream.pipe(res);
// }

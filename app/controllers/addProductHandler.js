const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

const { storage, bucketName } = require('../config/configCloudStorage');
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

async function addProdukFunction(req, res) {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Error saat mengunggah file:', err);
        return res
          .status(500)
          .send('Terjadi kesalahan saat mengunggah gambar.');
      } else if (err) {
        console.error('Error saat mengunggah file:', err);
        return res
          .status(500)
          .send('Terjadi kesalahan saat mengunggah gambar.');
      }

      if (!req.file) {
        return res.status(400).send('Tidak ada file yang diunggah.');
      }

      const file = req.file;
      const { category, sub_category } = req.body;

      // Cek ukuran file
      const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSizeInBytes) {
        return res.status(400).send('Ukuran gambar melebihi batas maksimum.');
      }

      const imageId = uuidv4(); // Membuat UUID sebagai ID gambar
      const originalFileName = file.originalname;
      const username = req.params.username;
      const fileName = `${originalFileName
        .split('.')
        .slice(0, -1)
        .join('.')}_${username}.${originalFileName.split('.').pop()}`;
      const filePath = `${category}/${sub_category}/${fileName}`;
      const blob = storage.bucket(bucketName).file(filePath);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
        predefinedAcl: 'publicRead', // Membuat gambar otomatis public
      });

      blobStream.on('error', (err) => {
        console.error('Error saat mengunggah file:', err);
        return res
          .status(500)
          .send('Terjadi kesalahan saat mengunggah gambar.');
      });

      blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
        // const imageInfo = {
        //   id: imageId,
        //   name: originalFileName,
        //   url: publicUrl,
        // };

        const { title, description, price, category, sub_category, quantity } =
          req.body;

        try {
          const db = admin.firestore();

          const userSnapshot = await db
            .collection('renters')
            .where('username', '==', username)
            .get();
          if (userSnapshot.empty) {
            throw new Error(`User "${username}" not found`);
          }

          var userData = userSnapshot.docs[0].data();
          const isLessor = userData.isLessor;
          if (isLessor !== true) {
            throw new Error(`User "${username}" is not a lessor`);
          }

          const lessorId = userSnapshot.docs[0].id;

          const productId = uuidv4();
          const productData = {
            title,
            description,
            price,
            imageUrl: publicUrl,
            category,
            sub_category,
            quantity,
            username,
            lessor_id: lessorId,
            image_id: imageId,
            product_id: productId,
          };

          // Simpan data produk ke koleksi produk di Firestore
          await db
            .collection('products')
            .doc(productData.product_id)
            .set(productData);

          return res.status(200).json({
            message: 'Produk berhasil ditambahkan.',
            data: productData,
          });
        } catch (error) {
          console.error('Error saat menambahkan produk:', error);
          return res.status(500).send(error.message);
        }
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error saat mengunggah file:', error);
    return res
      .status(500)
      .send('Terjadi kesalahan saat mengunggah gambar.', error);
  }
}

module.exports = {
  addProdukFunction,
};
// async function handleImageUpload(req, res) {
//   upload.single('image')(req, res, (err) => {
//     if (err instanceof multer.MulterError) {
//       console.error('Error saat mengunggah file:', err);
//       return res.status(500).send('Terjadi kesalahan saat mengunggah gambar.');
//     } else if (err) {
//       console.error('Error saat mengunggah file:', err);
//       return res.status(500).send('Terjadi kesalahan saat mengunggah gambar.');
//     }

//     if (!req.file) {
//       return res.status(400).send('Tidak ada file yang diunggah.');
//     }

//     const file = req.file;
//     const { category, sub_category } = req.body;

//     // Cek ukuran file
//     const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
//     if (file.size > maxSizeInBytes) {
//       return res.status(400).send('Ukuran gambar melebihi batas maksimum.');
//     }

//     const imageId = uuidv4(); // Membuat UUID sebagai ID gambar
//     const originalFileName = file.originalname;
//     const fileName = originalFileName.replace(/\s+/g, '-'); // Mengganti spasi dengan tanda "-"
//     const filePath = `${category}/${sub_category}/${fileName}`;
//     const blob = storage.bucket(bucketName).file(filePath);
//     const blobStream = blob.createWriteStream({
//       metadata: {
//         contentType: file.mimetype,
//       },
//       predefinedAcl: 'publicRead', // Membuat gambar otomatis public
//     });

//     blobStream.on('error', (err) => {
//       console.error('Error saat mengunggah file:', err);
//       return res.status(500).send('Terjadi kesalahan saat mengunggah gambar.');
//     });

//     blobStream.on('finish', () => {
//       const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
//       const imageInfo = {
//         id: imageId,
//         name: originalFileName,
//         url: publicUrl,
//       };
//       return res.status(200).json(imageInfo);
//     });

//     blobStream.end(file.buffer);
//   });
// }

// // Fungsi untuk menambahkan produk
// async function addProdukFunction(req, res) {
//   const {
//     title,
//     description,
//     price,
//     imageUrl,
//     category,
//     sub_category,
//     quantity,
//   } = req.body;

//   try {
//     const db = admin.firestore();

//     const userSnapshot = await db
//       .collection('renters')
//       .where('username', '==', req.params.username)
//       .get();
//     if (userSnapshot.empty) {
//       throw new Error(`User "${req.params.username}" not found`);
//     }

//     const lessorId = userSnapshot.docs[0].id;

//     const productData = {
//       title: title,
//       description: description,
//       price: price,
//       imageUrl: imageUrl,
//       category: category,
//       sub_category: sub_category,
//       quantity: quantity,
//       lessor_id: lessorId,
//       product_id: uuidv4(),
//     };

//     // Simpan data produk ke koleksi produk di Firestore
//     await db
//       .collection('products')
//       .doc(productData.product_id)
//       .set(productData);

//     return res
//       .status(200)
//       .json({ message: 'Produk berhasil ditambahkan.', product: productData });
//   } catch (error) {
//     console.error('Error saat menambahkan produk:', error);
//     return res.status(500).send('Terjadi kesalahan saat menambahkan produk.');
//   }
// }

// async function getAllImages(req, res) {
//   try {
//     const [files] = await storage.bucket(bucketName).getFiles();
//     const imageUrls = files.map((file) => ({
//       name: file.name,
//       url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
//     }));
//     return res.status(200).json(imageUrls);
//   } catch (err) {
//     console.error('Error saat mendapatkan daftar gambar:', err);
//     return res
//       .status(500)
//       .send('Terjadi kesalahan saat mengambil daftar gambar.');
//   }
// }

// async function getImageByName(req, res) {
//   const { name } = req.params;
//   const [files] = await storage.bucket(bucketName).getFiles({ prefix: name });

//   // Memeriksa keberadaan file
//   if (!files || files.length === 0) {
//     return res.status(404).json({ error: 'Gambar tidak ditemukan.' });
//   }

//   const file = files[0];

//   const imageUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;

//   return res.status(200).json({ name: file.name, url: imageUrl });
// }

// module.exports = {
//   handleImageUpload,
//   getAllImages,
//   getImageByName,
//   addProdukFunction,
// };

// async function getImageById(req, res) {
//   const { id } = req.params;
//   const [files] = await storage.bucket(bucketName).getFiles();

//   const file = files.find((file) => {
//     const imageId = file.name.split('.').slice(0, -1).join('.');
//     return imageId === id;
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

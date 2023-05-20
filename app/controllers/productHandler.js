const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

const Response = require('../utils/response');

const { storage, bucketName } = require('../config/configCloudStorage');
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

async function addProduct(req, res) {
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

          const lessorSnapshot = await db
            .collection('lessors')
            .where('username', '==', username)
            .get();
          const lessorId = lessorSnapshot.docs[0].id;

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

          const response = Response.successResponse(
            201,
            'Success Add Product',
            productData
          );

          return res.status(201).json(response);
        } catch (error) {
          console.error('Error :', error);
          const response = Response.badResponse(
            500,
            'An error occurred while add product',
            error.message
          );
          return res.status(500).send(response);
        }
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error saat mengunggah file:', error);
    const response = Response.badResponse(
      500,
      'An error occurred while upload images',
      error.message
    );
    return res.status(500).send(response);
  }
}

async function updateProductByProductId(req, res) {
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

      const file = req.file;
      const { title, description, price, quantity } = req.body;
      const productId = req.params.productId;
      const username = req.params.username;

      // Cek apakah item ID dan username valid
      if (!productId || !username) {
        const response = Response.badResponse(
          400,
          'Product atau username not valid'
        );
        return res.status(400).send(response);
      }

      const db = admin.firestore();

      // Periksa apakah item dengan ID dan username tersebut ada
      const itemRef = db.collection('products').doc(productId);
      const itemDoc = await itemRef.get();

      if (!itemDoc.exists) {
        const response = Response.badResponse(404, 'Item not Found');
        return res.status(404).send(response);
      }

      const itemData = itemDoc.data();
      const imageUrl = itemData.imageUrl;

      // Jika ada file gambar yang diunggah, lakukan update gambar
      if (file) {
        // Cek ukuran file
        const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSizeInBytes) {
          const response = Response.badResponse(
            400,
            'image Size is more than 10MB'
          );
          return res.status(400).send(response);
        }

        const bucket = storage.bucket(bucketName);
        const originalFileName = file.originalname;
        const { category, sub_category } = itemData;

        let fileName = `${originalFileName
          .split('.')
          .slice(0, -1)
          .join('.')}_${username}.${originalFileName.split('.').pop()}`;

        // Jika nama file sebelumnya sama dengan nama file yang baru diunggah
        if (imageUrl && imageUrl.split('/').pop() === fileName) {
          // Generate nama baru dengan menambahkan versi increment
          let version = 1;
          const fileNameWithoutExtension = fileName
            .split('.')
            .slice(0, -1)
            .join('.');
          const fileExtension = fileName.split('.').pop();

          while (true) {
            const newFileName = `${fileNameWithoutExtension}_newVersion}.${fileExtension}`;
            const newFilePath = `${category}/${sub_category}/${newFileName}`;
            const fileExists = await bucket.file(newFilePath).exists();

            if (!fileExists[0]) {
              fileName = newFileName;
              break;
            }
          }
        }

        const filePath = `${category}/${sub_category}/${fileName}`;

        const blob = bucket.file(filePath);
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
          predefinedAcl: 'publicRead', // Membuat gambar otomatis public
        });

        blobStream.on('error', (error) => {
          console.error('Error saat mengunggah file:', error);
          const response = Response.badResponse(
            500,
            'An error occurred while upload images ',
            error.message
          );
          return res.status(500).send(response);
        });

        blobStream.on('finish', async () => {
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

          // Update data produk dengan data yang diberikan
          const updateData = {
            title: title || itemData.title,
            description: description || itemData.description,
            price: price || itemData.price,
            quantity: quantity || itemData.quantity,
            imageUrl: publicUrl,
          };

          if (imageUrl && imageUrl !== publicUrl) {
            // Hapus gambar lama dari Firebase Storage
            const oldImagePath = imageUrl.split(`/${bucketName}/`)[1];
            await bucket.file(oldImagePath).delete();
          }

          await itemRef.update(updateData);

          const response = Response.successResponse(
            200,
            'Success update product data',
            updateData
          );

          return res.status(200).json(response);
        });

        blobStream.end(file.buffer);
      } else {
        // Jika tidak ada file gambar yang diunggah, hanya lakukan update data produk
        const updateData = {
          title: title || itemData.title,
          description: description || itemData.description,
          price: price || itemData.price,
          quantity: quantity || itemData.quantity,
          imageUrl: imageUrl, // Tetap gunakan gambar lama jika tidak ada pembaruan gambar
        };

        await itemRef.update(updateData);

        const response = Response.successResponse(
          200,
          'Success Update Product Data without change images',
          updateData
        );

        return res.status(200).json(response);
      }
    });
  } catch (error) {
    console.error('Error saat mengupdate produk:', error);
    return res.status(500).send('Terjadi kesalahan saat mengupdate produk.');
  }
}

async function getAllProductsByLessor(req, res) {
  try {
    const db = admin.firestore();
    const lessorUsername = req.params.username;

    // Get the lessor document by username
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', lessorUsername)
      .get();

    if (lessorSnapshot.empty) {
      throw new Error(`Lessor "${lessorUsername}" not found`);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    // Get all products by lessor ID
    const productsSnapshot = await db
      .collection('products')
      .where('lessor_id', '==', lessorId)
      .get();

    const productsData = [];

    // Iterate through the products snapshot and collect the data
    productsSnapshot.forEach((doc) => {
      const productData = doc.data();
      productsData.push(productData);
    });

    const response = Response.successResponse(
      200,
      'Success Get Product',
      productsData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting products by lessor:', error);

    const response = Response.badResponse(
      500,
      'An error occurred while getting  products by lessor',
      error.message
    );
    return res.status(500).send(response);
  }
}

async function getImageByName(req, res) {
  const { name } = req.params;
  const [files] = await storage.bucket(bucketName).getFiles({ prefix: name });

  // Memeriksa keberadaan file
  if (!files || files.length === 0) {
    const response = Response.badResponse(
      404,
      'image not fount',
      error.message
    );
    return res.status(404).send(response);
  }

  const file = files[0];
  // console.log(file);

  const imageUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;

  const imageData = { name: file.name, url: imageUrl };
  const response = Response.successResponse(
    200,
    'Success Get Image',
    imageData
  );

  return res.status(200).json(response);
}

async function getAllImages(req, res) {
  try {
    const [files] = await storage.bucket(bucketName).getFiles();
    const allImages = files.map((file) => ({
      name: file.name,
      url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
    }));
    const response = Response.successResponse(
      200,
      'Success Get All Images ',
      allImages
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error saat mendapatkan daftar gambar:', error);
    const response = Response.badResponse(
      500,
      'Error when get all images',
      error.message
    );
    return res.status(500).send(response);
  }
}

module.exports = {
  addProduct,
  getImageByName,
  getAllImages,
  getAllProductsByLessor,
  updateProductByProductId,
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
// async function addProduct(req, res) {
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

// module.exports = {
//   handleImageUpload,
//   getAllImages,
//   getImageByName,
//   addProduct,
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
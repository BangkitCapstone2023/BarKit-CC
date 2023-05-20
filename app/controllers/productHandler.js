const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const TimeStamp = admin.firestore.Timestamp.now();
const Response = require('../utils/response');

const { storage, bucketName } = require('../config/configCloudStorage');
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

const { db } = require('../config/configFirebase');

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

      const username = req.params.username;

      const userSnapshot = await db
        .collection('renters')
        .where('username', '==', username)
        .get();
      if (userSnapshot.empty) {
        return res.status(400).send(`User '${username}' not found`);
      }

      if (!req.file) {
        return res.status(400).send('Tidak ada file yang diunggah.');
      }

      const file = req.file;
      const { title, description, price, category, sub_category, quantity } =
        req.body;

      // Cek ukuran file
      const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSizeInBytes) {
        return res.status(400).send('Ukuran gambar melebihi batas maksimum.');
      }

      const imageId = uuidv4(); // Membuat UUID sebagai ID gambar
      const originalFileName = file.originalname;
      const fileName = `${originalFileName
        .split('.')
        .slice(0, -1)
        .join('.')}_${username}_${title}.${originalFileName
        .split('.')
        .pop()}`.replace(/\s+/g, '_');
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

        try {
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

          const existingProductSnapshot = await db
            .collection('products')
            .where('title', '==', title)
            .where('lessor_id', '==', lessorId)
            .get();
          if (!existingProductSnapshot.empty) {
            throw new Error(
              `Product '${title}' already exists for the lessor, plese use another title`
            );
          }

          const productId = uuidv4();

          if (price < 1) {
            throw new Error(`Price not valid`);
          }

          if (quantity < 1) {
            throw new Error(`Quantity not valid`);
          }

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
            created_at: TimeStamp,
          };

          // Simpan data produk ke koleksi produk di Firestore
          await db
            .collection('products')
            .doc(productData.product_id)
            .set(productData);

          const createdAt = productData.created_at.toDate();

          // Include the converted Date object in the response
          const responseData = {
            ...productData,
            created_at: createdAt,
          };
          const response = Response.successResponse(
            200,
            'Success update product data',
            responseData
          );

          return res.status(200).json(response);
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

async function updateProductById(req, res) {
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
          .join('.')}_${username}_${title}.${originalFileName
          .split('.')
          .pop()}`.replace(/\s+/g, '_');

        // Jika nama file sebelumnya sama dengan nama file yang baru diunggah
        if (imageUrl && imageUrl.split('/').pop() === fileName) {
          // Generate nama baru dengan menambahkan versi increment
          const fileNameWithoutExtension = fileName
            .split('.')
            .slice(0, -1)
            .join('.');
          const fileExtension = fileName.split('.').pop();

          while (true) {
            const newFileName = `${fileNameWithoutExtension}_newVersion.${fileExtension}`;
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
            update_at: TimeStamp,
          };

          if (imageUrl && imageUrl !== publicUrl) {
            // Hapus gambar lama dari Firebase Storage
            const oldImagePath = imageUrl.split(`/${bucketName}/`)[1];
            await bucket.file(oldImagePath).delete();
          }

          await itemRef.update(updateData);

          const updateAt = updateData.update_at.toDate();

          const responseData = {
            ...updateData,
            update_at: updateAt,
          };
          const response = Response.successResponse(
            200,
            'Success update product data',
            responseData
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

    productsSnapshot.forEach((doc) => {
      const productData = doc.data();

      // Check if created_at field exists
      if (
        productData.created_at &&
        productData.created_at._seconds &&
        productData.created_at._nanoseconds
      ) {
        // Convert created_at field to Timestamp object
        const createdAt = new admin.firestore.Timestamp(
          productData.created_at._seconds,
          productData.created_at._nanoseconds
        ).toDate();

        // Set create_at field as ISO string without milliseconds
        productData.create_at = createdAt.toISOString().replace(/\.\d+Z$/, 'Z');

        // Remove created_at field with nanoseconds
        delete productData.created_at;
      }

      // Check if update_at field exists
      if (
        productData.update_at &&
        productData.update_at._seconds &&
        productData.update_at._nanoseconds
      ) {
        // Convert update_at field to Timestamp object
        const updatedAt = new admin.firestore.Timestamp(
          productData.update_at._seconds,
          productData.update_at._nanoseconds
        ).toDate();

        // Set update_at field as ISO string without milliseconds
        productData.update_at = updatedAt.toISOString().replace(/\.\d+Z$/, 'Z');
      }

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

async function deleteProductById(req, res) {
  const { productId } = req.params;
  const { username } = req.params;

  try {
    // Cek apakah produk dengan ID yang diberikan ada di database
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      const response = {
        status: 404,
        message: 'Product not found',
      };
      return res.status(404).json(response);
    }

    const productData = productDoc.data();

    // Cek apakah lessor yang menghapus produk adalah lessor yang mengunggah produk
    if (productData.username !== username) {
      const response = {
        status: 403,
        message:
          'Access denied. Only the lessor who uploaded the product can delete it.',
      };
      return res.status(403).json(response);
    }

    // Hapus produk dari database
    await productRef.delete();

    const response = {
      status: 200,
      message: 'Product deleted successfully',
    };
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting product:', error);
    const response = {
      status: 500,
      message: 'Error deleting product',
      error: error.message,
    };
    return res.status(500).json(response);
  }
}

module.exports = {
  addProduct,
  getAllProductsByLessor,
  updateProductById,
  deleteProductById,
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
//

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

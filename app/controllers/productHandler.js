import multer from 'multer';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

import { badResponse, successResponse } from '../utils/response.js';
import { storage, bucketName } from '../config/configCloudStorage.js';
import { db } from '../config/configFirebase.js';

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

const timestamp = admin.firestore.Timestamp.now();
const date = timestamp.toDate();
const formattedTimestamp = moment(date).format('YYYY-MM-DD HH:mm:ss');

const addProduct = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Error saat mengunggah file:', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.'
        );
        return res.status(500).json(response);
      } else if (err) {
        console.error('Error saat mengunggah file', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.'
        );
        return res.status(500).json(response);
      }

      const username = req.params.username;

      const userSnapshot = await db
        .collection('renters')
        .where('username', '==', username)
        .get();
      if (userSnapshot.empty) {
        const response = badResponse(404, `User '${username}' not found`);
        return res.status(404).json(response);
      }

      if (!req.file) {
        const response = badResponse(400, 'Tidak ada file yang diunggah.');
        return res.status(400).json(response);
      }

      const file = req.file;
      const { title, description, price, category, sub_category, quantity } =
        req.body;

      // Cek ukuran file
      const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSizeInBytes) {
        const response = badResponse(
          413,
          'Ukuran gambar melebihi batas maksimum.'
        );
        return res.status(413).json(response);
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
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.'
        );
        return res.status(500).json(response);
      });

      blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

        try {
          var userData = userSnapshot.docs[0].data();
          const isLessor = userData.isLessor;
          if (isLessor !== true) {
            const response = badResponse(
              403,
              `User "${username}" is not a lessor`
            );
            return res.status(400).json(response);
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
            const response = badResponse(
              409,
              `Product '${title}' already exists for the lessor, plese use another title`
            );
            return res.status(400).json(response);
          }

          const productId = uuidv4();

          if (price < 1) {
            const response = badResponse(400, 'Price not valid');
            return res.status(400).json(response);
          }

          if (quantity < 1) {
            const response = badResponse(400, 'Quantity not valid');
            return res.status(400).json(response);
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
            create_at: formattedTimestamp,
          };

          // Simpan data produk ke koleksi produk di Firestore
          await db
            .collection('products')
            .doc(productData.product_id)
            .set(productData);

          // Include the converted Date object in the response
          const responseData = {
            productData,
          };
          const response = successResponse(
            200,
            'Success update product data',
            responseData
          );
          return res.status(200).json(response);
        } catch (error) {
          console.error('Error :', error);
          const response = badResponse(
            500,
            'An error occurred while add product',
            error.message
          );
          return res.status(500).json(response);
        }
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error saat mengunggah file:', error);
    const response = badResponse(
      500,
      'An error occurred while upload images',
      error.message
    );
    return res.status(500).json(response);
  }
};

const updateProductById = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Error saat mengunggah file:', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.'
        );
        return res.status(500).json(response);
      } else if (err) {
        console.error('Error saat mengunggah file:', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.'
        );
        return res.status(500).json(response);
      }

      const file = req.file;
      const { title, description, price, quantity } = req.body;
      const productId = req.params.productId;
      const username = req.params.username;

      // Cek apakah item ID dan username valid
      if (!productId || !username) {
        const response = badResponse(400, 'Product or  username not valid');
        return res.status(400).json(response);
      }

      // Periksa apakah item dengan ID dan username tersebut ada
      const itemRef = db.collection('products').doc(productId);
      const itemDoc = await itemRef.get();

      if (!itemDoc.exists) {
        const response = badResponse(404, 'Item not Found');
        return res.status(404).json(response);
      }

      const itemData = itemDoc.data();

      const imageUrl = itemData.imageUrl;

      // Jika ada file gambar yang diunggah, lakukan update gambar
      if (file) {
        // Cek ukuran file
        const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSizeInBytes) {
          const response = badResponse(413, 'image Size is more than 10MB');
          return res.status(413).json(response);
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
          const response = badResponse(
            500,
            'An error occurred while upload images',
            error.message
          );
          return res.status(500).json(response);
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
            update_at: formattedTimestamp,
          };

          if (imageUrl && imageUrl !== publicUrl) {
            // Hapus gambar lama dari Firebase Storage
            const oldImagePath = imageUrl.split(`/${bucketName}/`)[1];
            await bucket.file(oldImagePath).delete();
          }

          await itemRef.update(updateData);

          const responseData = {
            updateData,
          };
          const response = successResponse(
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

        const response = successResponse(
          200,
          'Success Update Product Data without change images',
          updateData
        );
        return res.status(200).json(response);
      }
    });
  } catch (error) {
    console.error('Error saat mengupdate produk:', error);
    const response = badResponse(
      500,
      'Terjadi kesalahan saat mengupdate produk.',
      error.message
    );
    return res.status(500).json(response);
  }
};

const getAllProductsByLessor = async (req, res) => {
  try {
    const lessorUsername = req.params.username;

    // Get the lessor document by username
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', lessorUsername)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${lessorUsername}' not found`);
      return res.status(404).json(response);
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
      productsData.push(productData);
    });

    const response = successResponse(200, 'Success Get Product', productsData);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting products by lessor:', error);

    const response = badResponse(500, error.message);
    return res.status(500).json(response);
  }
};

const deleteProductById = async (req, res) => {
  const { productId } = req.params;
  const { username } = req.params;

  try {
    // Cek apakah produk dengan ID yang diberikan ada di database
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      const response = badResponse(404, 'Product not found');
      return res.status(404).json(response);
    }

    const productData = productDoc.data();

    // Cek apakah lessor yang menghapus produk adalah lessor yang mengunggah produk
    if (productData.username !== username) {
      const response = badResponse(
        403,
        'Access denied. Only the lessor who uploaded the product can delete it'
      );

      return res.status(403).json(response);
    }

    // Hapus produk dari database
    await productRef.delete();

    const response = successResponse(200, 'Product deleted successfully', null);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting product:', error);
    const response = badResponse(500, 'Error deleting product', error.message);
    return res.status(500).json(response);
  }
};

export {
  addProduct,
  getAllProductsByLessor,
  updateProductById,
  deleteProductById,
};

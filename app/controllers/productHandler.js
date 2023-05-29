import multer from 'multer';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

import { badResponse, successResponse } from '../utils/response.js';
import { storage, bucketName } from '../config/configCloudStorage.js';
import { db } from '../config/configFirebase.js';
import predictionModel from '../models/model.js';

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

const timestamp = admin.firestore.Timestamp.now();
const date = timestamp.toDate();
const formattedTimestamp = moment(date).format('YYYY-MM-DD HH:mm:ss');

const addProduct = async (req, res) => {
  try {
    const { uid } = req.user;
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

      const { username } = req.params;

      // Check Renters
      const userSnapshot = await db
        .collection('renters')
        .where('username', '==', username)
        .get();
      if (userSnapshot.empty) {
        const response = badResponse(404, `User '${username}' not found aefae`);
        return res.status(404).json(response);
      }

      const renterData = userSnapshot.docs[0].data();

      // Check if renter is lessor
      const isLessor = renterData.isLessor;
      if (isLessor !== true) {
        const response = badResponse(403, `User '${username}' is not a lessor`);
        return res.status(400).json(response);
      }

      // Check auth token
      if (renterData.renter_id !== uid) {
        const response = badResponse(403, 'Not allowed');
        return res.status(403).json(response);
      }

      const file = req.file;
      const { title, description, price, category, sub_category, quantity } =
        req.body;

      // Check Jika lessor tidak mengupload gambar
      if (!req.file) {
        const response = badResponse(400, 'Tidak ada file yang diunggah.');
        return res.status(400).json(response);
      }

      const requiredFields = [
        'title',
        'description',
        'price',
        'category',
        'sub_category',
        'quantity',
      ];
      const missingFields = [];

      requiredFields.forEach((field) => {
        if (!req.body[field]) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        const errorMessage = missingFields
          .map((field) => `${field} is required`)
          .join('. ');
        const response = badResponse(400, errorMessage);
        return res.status(400).json(response);
      }

      // Cek ukuran file
      const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSizeInBytes) {
        const response = badResponse(
          413,
          'Ukuran gambar melebihi batas maksimum.'
        );
        return res.status(413).json(response);
      }

      const predictionResult = await predictionModel(file, sub_category);

      if (predictionResult.success) {
        const imageId = uuidv4();
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
            // Check Lessor
            const lessorSnapshot = await db
              .collection('lessors')
              .where('username', '==', username)
              .get();

            const lessor_id = lessorSnapshot.docs[0].id;
            const lessorData = lessorSnapshot.docs[0].data();

            // Check title duplicate
            const existingProductSnapshot = await db
              .collection('products')
              .where('title', '==', title)
              .where('lessor_id', '==', lessor_id)
              .get();

            if (!existingProductSnapshot.empty) {
              const response = badResponse(
                409,
                `Product '${title}' already exists for the lessor, plese use another title`
              );
              return res.status(400).json(response);
            }

            const productDocRef = db.collection('products').doc();
            const productId = productDocRef.id;

            // Check harga input product
            if (price < 1) {
              const response = badResponse(400, 'Price not valid');
              return res.status(400).json(response);
            }

            // Check quantity input product
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
              lessor_id,
              image_id: imageId,
              product_id: productId,
              create_at: formattedTimestamp,
            };

            // Simpan data produk ke koleksi produk di Firestore
            await db
              .collection('products')
              .doc(productData.product_id)
              .set(productData);

            const responseData = { ...productData, lessor: lessorData };

            const response = successResponse(
              200,
              'Success add product ',
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
      } else {
        const { errorMessage } = predictionResult;
        console.error('Error :', errorMessage);
        const response = badResponse(
          403,
          'Category dan gambar yang di input tidak sesuai',
          errorMessage
        );
        return res.status(403).json(response);
      }
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

const getAllProductsByLessor = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    // Get the lessor document by username
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }
    const lessorId = lessorSnapshot.docs[0].id;
    const lessorData = lessorSnapshot.docs[0].data();

    if (lessorData.renter_id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }
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

    const responseData = { ...productsData, lessor: lessorData };

    const response = successResponse(200, 'Success Get Product', responseData);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting products by lessor:', error);

    const response = badResponse(500, error.message);
    return res.status(500).json(response);
  }
};

const updateProductById = async (req, res) => {
  const { uid } = req.user;
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
      const { productId, username } = req.params;

      // Cek apakah item ID dan username valid
      if (!productId || !username) {
        const response = badResponse(400, 'Product or  username not valid');
        return res.status(400).json(response);
      }

      // Periksa apakah item dengan ID dan username tersebut ada
      const productSnapshot = db.collection('products').doc(productId);
      const productDoc = await productSnapshot.get();

      if (!productDoc.exists) {
        const response = badResponse(404, 'Item not Found');
        return res.status(404).json(response);
      }

      const itemData = productDoc.data();

      const renterSnapshot = await db
        .collection('renters')
        .where('username', '==', username)
        .get();

      const renterData = renterSnapshot.docs[0].data();

      const lessorSnapshot = await db
        .collection('lessors')
        .where('username', '==', username)
        .get();

      const lessorData = lessorSnapshot.docs[0].data();

      // Pastikan lessor_id pada product sesuai dengan lessor yang mengirim permintaan
      if (itemData.username !== username || renterData.renter_id !== uid) {
        const response = badResponse(
          403,
          'Not allowed to modify antoher lessor product'
        );
        return res.status(403).json(response);
      }

      const imageUrl = itemData.imageUrl;

      // Jika ada file gambar yang diunggah, lakukan update gambar
      if (file) {
        // Cek ukuran file
        const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSizeInBytes) {
          const response = badResponse(413, 'image Size is more than 10MB');
          return res.status(413).json(response);
        }

        const { category, sub_category } = itemData;

        const predictionResult = await predictionModel(file, sub_category);

        if (predictionResult.success) {
          const bucket = storage.bucket(bucketName);
          const originalFileName = file.originalname;

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

            await productSnapshot.update(updateData);
            const updatedproductDoc = await productSnapshot.get();
            const updatedItemData = updatedproductDoc.data();

            const responseData = {
              ...updatedItemData,
              lessor: lessorData,
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
          const { errorMessage } = predictionResult;
          console.error('Error :', errorMessage);
          const response = badResponse(
            403,
            'Category dan gambar yang di input tidak sesuai',
            errorMessage
          );
          return res.status(403).json(response);
        }
      } else {
        // Jika tidak ada file gambar yang diunggah, hanya lakukan update data produk
        const updateData = {
          title: title || itemData.title,
          description: description || itemData.description,
          price: price || itemData.price,
          quantity: quantity || itemData.quantity,
          imageUrl: imageUrl, // Tetap gunakan gambar lama jika tidak ada pembaruan gambar
        };

        await productSnapshot.update(updateData);

        const updatedproductDoc = await productSnapshot.get();
        const updatedItemData = updatedproductDoc.data();

        const responseData = {
          ...updatedItemData,
          lessor: lessorData,
        };
        const response = successResponse(
          200,
          'Success update product data tanpa image',
          responseData
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

const deleteProductById = async (req, res) => {
  const { productId, username } = req.params;
  const { uid } = req.user;

  try {
    // Cek apakah produk dengan ID yang diberikan ada di database
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      const response = badResponse(404, 'Product not found');
      return res.status(404).json(response);
    }

    const productData = productDoc.data();

    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    const renterData = renterSnapshot.docs[0].data();

    // Cek apakah lessor yang menghapus produk adalah lessor yang mengunggah produk
    if (productData.username !== username || renterData.renter_id !== uid) {
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

const addProductToCart = async (req, res) => {
  try {
    const { uid } = req.user;
    const { username, productId } = req.params;
    const { cartQuantity } = req.body;
    // Check Renter
    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    if (renterSnapshot.empty) {
      const response = badResponse(404, 'Renter not found');
      return res.status(404).json(response);
    }
    const renterData = renterSnapshot.docs[0].data();
    const renter_id = renterData.renter_id;

    // Check Auth Token
    if (renterData.renter_id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    // Check if product exists
    const productSnapshot = await db
      .collection('products')
      .doc(productId)
      .get();
    if (!productSnapshot.exists) {
      const response = badResponse(404, `Product '${productId}' not found`);
      return res.status(404).json(response);
    }

    // Get product data & Lessor data
    const productData = productSnapshot.data();
    const lessor_id = productData.lessor_id;

    const lessorSnapshot = await db.collection('lessors').doc(lessor_id).get();

    const lessorData = lessorSnapshot.data();

    if (lessorData.username == username) {
      const response = badResponse(403, 'You cant cart your own product');
      return res.status(403).json(response);
    }

    // Check if product is available
    if (productData.quantity < 1) {
      const response = badResponse(
        400,
        `Product '${productId}' is not available`
      );
      return res.status(400).json(response);
    }

    if (productData.quantity < cartQuantity) {
      const response = badResponse(
        400,
        `Avalaible Quantity is ${productData.quantity}`
      );
      return res.status(400).json(response);
    }

    // Create or get user's cart
    const cartRef = db.collection('carts').doc(uid);
    const cartSnapshot = await cartRef.get();
    const cartData = cartSnapshot.data();

    let updatedCart = [];
    if (cartData && cartData.cart_products) {
      updatedCart = cartData.cart_products;
    }

    const existingProductIndex = updatedCart.findIndex(
      (item) => item.product_id === productId
    );

    if (existingProductIndex !== -1) {
      // Product already exists in cart, update quantity and total price
      const existingQuantity = updatedCart[existingProductIndex].quantity;

      const quantityNow = productData.quantity - existingQuantity;
      if (quantityNow < cartQuantity) {
        const response = badResponse(
          400,
          `You already cart ${existingQuantity} for this product, the avalable quantity is ${quantityNow}`
        );
        return res.status(400).json(response);
      }
      updatedCart[existingProductIndex].quantity += cartQuantity;
      updatedCart[existingProductIndex].total_price +=
        productData.price * cartQuantity;
    } else {
      // Add new product to cart

      updatedCart.push({
        product_id: productId,
        lessor_id,
        quantity: cartQuantity,
        total_price: productData.price * cartQuantity,
      });
    }

    const lastAddedProduct = updatedCart[updatedCart.length - 1];

    const addCart = {
      cart_id: uid,
      cart_products: updatedCart,
      renter_id,
      username,
    };

    const responseData = {
      cart_id: uid,
      product_id: lastAddedProduct.product_id,
      quantity: lastAddedProduct.quantity,
      total_price: lastAddedProduct.total_price,
      renter_id: addCart.renter_id,
      username: addCart.username,
      product: productData,
      renter: renterData,
      lessor: lessorData,
    };
    // Update cart data
    await cartRef.set(addCart);

    const response = successResponse(
      200,
      `Success added Product to the cart`,
      responseData
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while adding product to cart',
      error.message
    );
    return res.status(500).json(response);
  }
};

const getCartProductsByRenter = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

    // Get Renter ID
    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    if (renterSnapshot.empty) {
      const response = badResponse(404, 'Renter not found');
      return res.status(404).json(response);
    }

    const renterData = renterSnapshot.docs[0].data();
    const renterId = renterData.renter_id;

    // Check Auth Token
    if (renterId !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    // Get Cart Data
    const cartSnapshot = await db
      .collection('carts')
      .where('renter_id', '==', renterId)
      .get();

    if (cartSnapshot.empty) {
      const response = badResponse(404, 'Cart not found');
      return res.status(404).json(response);
    }

    const cartData = cartSnapshot.docs[0].data();
    const cartProducts = cartData.cart_products;

    // Get Product Details
    const productIds = cartProducts.map((product) => product.product_id);

    const productSnapshot = await db
      .collection('products')
      .where(admin.firestore.FieldPath.documentId(), 'in', productIds)
      .get();

    const cart_products = productSnapshot.docs.map((doc) => ({
      product_id: doc.id,
      ...doc.data(),
    }));

    const response = successResponse(
      200,
      'Cart products retrieved successfully',
      {
        cart_id: cartData.cart_id,
        renter_id: cartData.renter_id,
        username: cartData.username,
        cart_products,
      }
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while retrieving cart products',
      error.message
    );
    return res.status(500).json(response);
  }
};
const deleteCartProduct = async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId } = req.params;

    // Get user's cart
    const cartRef = db.collection('carts').doc(uid);
    const cartSnapshot = await cartRef.get();
    const cartData = cartSnapshot.data();

    // Check if cart exists
    if (!cartData) {
      const response = badResponse(404, 'Cart not found');
      return res.status(404).json(response);
    }

    // Find the product in the cart
    const existingProductIndex = cartData.cart_products.findIndex(
      (product) => product.product_id === productId
    );

    if (existingProductIndex === -1) {
      const response = badResponse(
        404,
        `Product '${productId}' not found in the cart`
      );
      return res.status(404).json(response);
    }

    // Remove the product from the cart
    cartData.cart_products.splice(existingProductIndex, 1);

    // Update cart data
    await cartRef.update({
      cart_products: cartData.cart_products,
    });

    const response = successResponse(
      200,
      `Product '${productId}' removed from the cart`
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while deleting cart product',
      error.message
    );
    return res.status(500).json(response);
  }
};

const updateCartProductQuantity = async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId } = req.params;
    const { cartQuantity } = req.body;

    // Check if product exists
    const productSnapshot = await db
      .collection('products')
      .doc(productId)
      .get();
    if (!productSnapshot.exists) {
      const response = badResponse(404, `Product '${productId}' not found`);
      return res.status(404).json(response);
    }

    const productData = productSnapshot.data();

    // Get user's cart
    const cartRef = db.collection('carts').doc(uid);
    const cartSnapshot = await cartRef.get();
    const cartData = cartSnapshot.data();

    // Check if cart exists
    if (!cartData) {
      const response = badResponse(404, 'Cart not found');
      return res.status(404).json(response);
    }

    // Find the product in the cart
    const existingProductIndex = cartData.cart_products.findIndex(
      (product) => product.product_id === productId
    );

    if (existingProductIndex === -1) {
      const response = badResponse(
        404,
        `Product '${productId}' not found in the cart`
      );
      return res.status(404).json(response);
    }

    // Update product quantity and total price
    const existingProduct = cartData.cart_products[existingProductIndex];
    console.log(existingProduct);

    const quantityNow = productData.quantity - existingProduct.quantity;
    console.log(quantityNow);

    if (quantityNow < cartQuantity) {
      const response = badResponse(
        400,
        `You already cart ${existingProduct.quantity} for this product, the avalable quantity is ${quantityNow}`
      );
      return res.status(400).json(response);
    }

    const updatedProduct = {
      ...existingProduct,
      quantity: cartQuantity,
      total_price: productSnapshot.data().price * cartQuantity,
    };

    // Update cart cart_products array
    cartData.cart_products[existingProductIndex] = updatedProduct;

    // If quantity is 0, remove the product from the cart
    if (cartQuantity === 0) {
      cartData.cart_products.splice(existingProductIndex, 1);
      const response = successResponse(
        200,
        `Product deleted successfully because quantity was edit to 0`
      );
      return res.status(200).json(response);
    }

    // Update cart data
    await cartRef.update({
      cart_products: cartData.cart_products,
    });

    const { username, cart_id, renter_id } = cartData;

    const responseData = { username, cart_id, renter_id, ...updatedProduct };

    const response = successResponse(
      200,
      `Product '${productId}' quantity updated in the cart`,
      responseData
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while updating cart product quantity',
      error.message
    );
    return res.status(500).json(response);
  }
};

export {
  addProduct,
  getAllProductsByLessor,
  updateProductById,
  deleteProductById,
  addProductToCart,
  getCartProductsByRenter,
  updateCartProductQuantity,
  deleteCartProduct,
};

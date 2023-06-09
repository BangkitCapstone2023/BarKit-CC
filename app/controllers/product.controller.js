import admin from 'firebase-admin';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

import { storage, bucketName } from '../config/storage.config.js';
import db from '../config/firebase.config.js';

import {
  verifyRenter,
  verifyLessor,
} from '../middlewares/authorization.middleware.js';

import predictionModel from '../models/image.model.js';
import { badResponse, successResponse } from '../utils/response.js';

import { dateTimeNow } from '../utils/time.js';

import {
  checkLessor,
  checkProduct,
  checkCart,
} from '../utils/snapshot.js';

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Posting a new Product Handler
const addProduct = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Error saat mengunggah file:', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.',
        );
        return res.status(500).json(response);
      }
      if (err) {
        console.error('Error saat mengunggah file', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.',
        );
        return res.status(500).json(response);
      }
      const { uid } = req.user;
      const { username } = req.params;

      // Check Renters
      const {
        errorRenter,
        statusRenter,
        checkResponseRenter,
        renterData,
      } = await verifyRenter(username, uid);

      if (errorRenter) {
        return res.status(statusRenter).json(checkResponseRenter);
      }

      // Check if renter is lessor
      const { isLessor } = renterData;
      if (isLessor !== true) {
        const response = badResponse(403, `User '${username}' is not a lessor`);
        return res.status(403).json(response);
      }

      const { file } = req;
      const {
        title,
        description,
        price,
        category,
        subCategory,
        quantity,
      } = req.body;

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
        'subCategory',
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
          'Ukuran gambar melebihi batas maksimum.',
        );
        return res.status(413).json(response);
      }

      const predictionResult = await predictionModel(file, subCategory);

      if (predictionResult.success) {
        const imageId = uuidv4();
        const originalFileName = file.originalname;
        const fileName = `${originalFileName
          .split('.')
          .slice(0, -1)
          .join('.')}_${username}_${title}.${originalFileName
          .split('.')
          .pop()}`.replace(/\s+/g, '_');
        const filePath = `${category}/${subCategory}/${fileName}`;
        const blob = storage.bucket(bucketName).file(filePath);

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
            'Terjadi kesalahan saat mengunggah gambar.',
          );
          return res.status(500).json(response);
        });

        blobStream.on('finish', async () => {
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

          try {
            // Check Lessor
            const {
              errorLessor,
              statusLessor,
              checkResponseLessor,
              lessorData,
            } = await verifyLessor(username, uid);

            if (errorLessor) {
              return res.status(statusLessor).json(checkResponseLessor);
            }
            const lessorId = lessorData.lessor_id;

            // Check title duplicate
            const existingProductSnapshot = await db
              .collection('products')
              .where('title', '==', title)
              .where('lessor_id', '==', lessorId)
              .get();

            if (!existingProductSnapshot.empty) {
              const response = badResponse(
                409,
                `Product '${title}' already exists for the lessor, plese use another title`,
              );
              return res.status(409).json(response);
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
              product_id: productId,
              title,
              description,
              price,
              imageUrl: publicUrl,
              category,
              sub_category: subCategory,
              quantity,
              create_at: dateTimeNow(),
              lessor_id: lessorId,
              image_id: imageId,
              username,
            };

            // Simpan data produk ke koleksi produk di Firestore
            await db
              .collection('products')
              .doc(productData.product_id)
              .set(productData);

            delete productData.lessor_id;

            const responseData = { ...productData, lessor: lessorData };
            delete responseData.username;

            const response = successResponse(
              200,
              'Success add product ',
              responseData,
            );
            return res.status(200).json(response);
          } catch (error) {
            console.error('Error :', error);
            const response = badResponse(
              500,
              'An error occurred while add product',
              error.message,
            );
            return res.status(500).json(response);
          }
        });

        blobStream.end(file.buffer);
      } else {
        const { errorMessage } = predictionResult;
        console.error('Error :', errorMessage);
        const response = badResponse(
          400,
          'Category dan gambar yang di input tidak sesuai',
          errorMessage,
        );
        return res.status(400).json(response);
      }
      return null;
    });
    return null;
  } catch (error) {
    console.error('Error saat mengunggah file:', error);
    const response = badResponse(
      500,
      'An error occurred while upload images',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Get All Products Handler
const getAllProductsByLessor = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    // Get the lessor document by username
    const {
      errorLessor,
      statusLessor,
      checkResponseLessor,
      lessorData,
    } = await verifyLessor(username, uid);

    if (errorLessor) {
      return res.status(statusLessor).json(checkResponseLessor);
    }
    const lessorId = lessorData.lessor_id;
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

    const responseData = { productsData, lessor: lessorData };

    const response = successResponse(200, 'Success Get Product', responseData);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting products by lessor:', error);

    const response = badResponse(500, error.message);
    return res.status(500).json(response);
  }
};

// Update Product By Id Handler
const updateProductById = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Error saat mengunggah file:', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.',
        );
        return res.status(500).json(response);
      }
      if (err) {
        console.error('Error saat mengunggah file:', err);
        const response = badResponse(
          500,
          'Terjadi kesalahan saat mengunggah gambar.',
        );
        return res.status(500).json(response);
      }

      const { uid } = req.user;
      const { file } = req;
      const { productId, username } = req.params;

      const {
        title,
        description,
        price,
        quantity,
      } = req.body;

      // Cek apakah product ID dan username valid
      if (!productId || !username) {
        const response = badResponse(400, 'Product or username not valid');
        return res.status(400).json(response);
      }

      // Periksa apakah product dengan ID dan username tersebut ada
      const productSnapshot = db.collection('products').doc(productId);
      const productDoc = await productSnapshot.get();

      if (!productDoc.exists) {
        const response = badResponse(404, 'product not Found');
        return res.status(404).json(response);
      }

      const productData = productDoc.data();
      const {
        errorRenter,
        statusRenter,
        checkResponseRenter,
      } = await verifyRenter(username, uid);

      if (errorRenter) {
        return res.status(statusRenter).json(checkResponseRenter);
      }

      const {
        errorLessor,
        statusLessor,
        checkResponseLessor,
        lessorData,
      } = await checkLessor(productData.lessor_id);

      if (errorLessor) {
        return res.status(statusLessor).json(checkResponseLessor);
      }

      const { imageUrl } = productData;

      // Jika ada file gambar yang diunggah, lakukan update gambar
      if (file) {
        // Cek ukuran file
        const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSizeInBytes) {
          const response = badResponse(413, 'image Size is more than 10MB');
          return res.status(413).json(response);
        }

        const { category } = productData;
        const subCategory = productData.sub_category;

        const predictionResult = await predictionModel(file, subCategory);

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

            let keepLooping = true;
            while (keepLooping) {
              const newFileName = `${fileNameWithoutExtension}_newVersion.${fileExtension}`;
              const newFilePath = `${category}/${subCategory}/${newFileName}`;
              // eslint-disable-next-line no-await-in-loop
              const fileExists = await bucket.file(newFilePath).exists();
              if (!fileExists[0]) {
                fileName = newFileName;
                keepLooping = false; // Break the loop
              }
            }
          }

          const filePath = `${category}/${subCategory}/${fileName}`;

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
              error.message,
            );
            return res.status(500).json(response);
          });

          blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

            // Update data produk dengan data yang diberikan
            const updateData = {
              title: title || productData.title,
              description: description || productData.description,
              price: price || productData.price,
              quantity: quantity || productData.quantity,
              imageUrl: publicUrl,
              update_at: dateTimeNow(),
            };

            if (imageUrl && imageUrl !== publicUrl) {
              // Hapus gambar lama dari Firebase Storage
              const oldImagePath = imageUrl.split(`/${bucketName}/`)[1];
              await bucket.file(oldImagePath).delete();
            }

            await productSnapshot.update(updateData);
            const updatedProductDoc = await productSnapshot.get();
            const updatedProductData = updatedProductDoc.data();

            const responseData = {
              ...updatedProductData,
              lessor: lessorData,
            };
            const response = successResponse(
              200,
              'Success update product data',
              responseData,
            );
            return res.status(200).json(response);
          });

          blobStream.end(file.buffer);
        } else {
          const { errorMessage } = predictionResult;
          console.error('Error :', errorMessage);
          const response = badResponse(
            400,
            'Category dan gambar yang di input tidak sesuai',
            errorMessage,
          );
          return res.status(400).json(response);
        }
      } else {
        // Jika tidak ada file gambar yang diunggah, hanya lakukan update data produk
        const updateData = {
          title: title || productData.title,
          description: description || productData.description,
          price: price || productData.price,
          quantity: quantity || productData.quantity,
          imageUrl,
        };

        await productSnapshot.update(updateData);

        const updatedProductDoc = await productSnapshot.get();
        const updatedProductData = updatedProductDoc.data();

        const responseData = {
          ...updatedProductData,
          lessor: lessorData,
        };

        const response = successResponse(
          200,
          'Success update product data tanpa image',
          responseData,
        );
        return res.status(200).json(response);
      }
      return null;
    });
    return null;
  } catch (error) {
    console.error('Error saat mengupdate produk:', error);
    const response = badResponse(
      500,
      'Terjadi kesalahan saat mengupdate produk.',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Delete Product By Id Handlers
const deleteProductById = async (req, res) => {
  const { productId, username } = req.params;
  const { uid } = req.user;

  try {
    // Cek apakah produk dengan ID yang diberikan ada di database
    const {
      errorProduct,
      statusProduct,
      checkResponseProduct,
      productRef,
    } = await checkProduct(productId);

    if (errorProduct) {
      return res.status(statusProduct).json(checkResponseProduct);
    }

    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }
    // Hapus produk dari database
    await productRef.delete();

    const response = successResponse(200, 'Product deleted successfully');
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
    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
      renterData,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }

    // Check if product exists
    const {
      errorProduct,
      statusProduct,
      checkResponseProduct,
      productData,
    } = await checkProduct(productId);

    if (errorProduct) {
      return res.status(statusProduct).json(checkResponseProduct);
    }

    // Get product data & Lessor data
    const lessorId = productData.lessor_id;

    const {
      errorLessor,
      statusLessor,
      checkResponseLessor,
      lessorData,
    } = await checkLessor(lessorId);

    if (errorLessor) {
      return res.status(statusLessor).json(checkResponseLessor);
    }

    if (lessorData.username === username) {
      const response = badResponse(403, 'You cant cart your own product');
      return res.status(403).json(response);
    }

    // Check if product is available
    if (productData.quantity < 1) {
      const response = badResponse(
        400,
        `Product '${productId}' is not available`,
      );
      return res.status(400).json(response);
    }

    // Check if product is available
    if (cartQuantity < 1) {
      const response = badResponse(400, 'Minimum 1 Quantity to add to cart');
      return res.status(400).json(response);
    }

    if (productData.quantity < cartQuantity) {
      const response = badResponse(
        400,
        `Avalaible Quantity is ${productData.quantity}`,
      );
      return res.status(400).json(response);
    }

    // Create or get user's cart
    const {
      errorCart,
      cartData,
      cartRef,
    } = await checkCart(uid);

    let updatedCart = [];
    if (errorCart) {
      const newCartRef = db.collection('carts').doc(renterData.renter_id);

      // Create new cart if there's an error with the existing cart
      const priceString = productData.price.replace(/[^0-9.-]+/g, '');
      const priceNumber = parseFloat(priceString.replace('.', ''));
      const totalPrice = priceNumber * cartQuantity;
      const newCart = {
        cart_id: renterData.renter_id,
        cart_products: [
          {
            product_id: productId,
            lessor_id: lessorId,
            quantity: cartQuantity,
            total_price: totalPrice.toLocaleString('id-ID'),
          },
        ],
        renter_id: renterData.renter_id,
        username,
      };
      updatedCart = newCart.cart_products;
      await newCartRef.set(newCart);
      const response = successResponse(
        200,
        'Success added Product to the cart',
        newCart,
      );
      return res.status(200).json(response);
    }

    updatedCart = cartData.cart_products;

    if (cartData && cartData.cart_products) {
      updatedCart = cartData.cart_products;
    }

    const existingProductIndex = updatedCart.findIndex(
      (product) => product.product_id === productId,
    );

    if (existingProductIndex !== -1) {
      // Product already exists in cart, update quantity and total price
      const existingQuantity = updatedCart[existingProductIndex].quantity;
      const quantityNow = productData.quantity - existingQuantity;
      if (quantityNow < cartQuantity) {
        const response = badResponse(
          400,
          `You already have ${existingQuantity} in your cart for this product. The available quantity is ${quantityNow}`,
        );
        return res.status(400).json(response);
      }

      const priceString = productData.price.replace(/[^0-9.-]+/g, '');
      const priceNumber = parseFloat(priceString.replace('.', ''));
      updatedCart[existingProductIndex].quantity += cartQuantity;
      updatedCart[existingProductIndex].total_price = (priceNumber * updatedCart[existingProductIndex].quantity).toLocaleString('id-ID');
    } else {
      // Add new product to cart
      const priceString = productData.price.replace(/[^0-9.-]+/g, '');
      const priceNumber = parseFloat(priceString.replace('.', ''));
      const totalPrice = priceNumber * cartQuantity;
      updatedCart.push({
        product_id: productId,
        lessor_id: lessorId,
        quantity: cartQuantity,
        total_price: totalPrice.toLocaleString('id-ID'),
      });
    }

    const lastAddedProduct = updatedCart[updatedCart.length - 1];

    const addCart = {
      cart_id: uid,
      cart_products: updatedCart,
      renter_id: renterData.renter_id,
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
      'Success added Product to the cart',
      responseData,
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while adding product to cart',
      error.message,
    );
    return res.status(500).json(response);
  }
};
// Get Cart Product Handler
const getCartProductsByRenter = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

    // Get Renter ID
    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
      renterData,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }
    const renterId = renterData.renter_id;

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
    const cartProductsData = cartData.cart_products;

    // Get Product Details
    const productIds = cartProductsData.map((product) => product.product_id);

    if (productIds.length === 0) {
      const response = successResponse(
        200,
        `Cart products retrieved successfully, but ${username} doesn't have a product in the cart`,
      );
      return res.status(200).json(response);
    }
    const productSnapshot = await db
      .collection('products')
      .where(admin.firestore.FieldPath.documentId(), 'in', productIds)
      .get();

    const cartProductsMap = productSnapshot.docs.map((doc) => {
      const {
        quantity,
        ...rest
      } = doc.data();
      delete rest.lessor_id;
      delete rest.image_id;
      delete rest.username;
      return { ...rest };
    });

    const resultCart = cartProductsMap.map((cartProduct) => {
      const matchingCartProduct = cartProductsData.find(
        (product) => product.product_id === cartProduct.product_id,
      );

      if (matchingCartProduct) {
        return {
          ...cartProduct,
          ...matchingCartProduct,
        };
      }

      return cartProduct;
    });

    const response = successResponse(
      200,
      'Cart products retrieved successfully',
      {
        cart_id: cartData.cart_id,
        renter_id: cartData.renter_id,
        username: cartData.username,
        resultCart,
      },
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error.message);
    const response = badResponse(
      500,
      'An error occurred while retrieving cart products',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Update Product Quantity in Cart Handler
const updateCartProductQuantity = async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId, username } = req.params;
    const { cartQuantity } = req.body;

    // Check if product exists
    const {
      errorProduct,
      statusProduct,
      checkResponseProduct,
      productData,
    } = await checkProduct(productId);

    if (errorProduct) {
      return res.status(statusProduct).json(checkResponseProduct);
    }

    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }
    // Get user's cart
    const {
      errorCart,
      statusCart,
      checkResponseCart,
      cartData,
      cartRef,
    } = await checkCart(uid);

    if (errorCart) {
      return res.status(statusCart).json(checkResponseCart);
    }
    // Find the product in the cart
    const existingProductIndex = cartData.cart_products.findIndex(
      (product) => product.product_id === productId,
    );

    if (existingProductIndex === -1) {
      const response = badResponse(
        404,
        'Product not found in renter cart',
      );
      return res.status(404).json(response);
    }

    // Update product quantity and total price
    const existingProduct = cartData.cart_products[existingProductIndex];

    if (productData.quantity < cartQuantity) {
      const response = badResponse(
        400,
        `The maximum quantity for this product is ${productData.quantity}`,
      );
      return res.status(400).json(response);
    }

    const priceString = productData.price.replace(/[^0-9.-]+/g, '');
    const priceNumber = parseFloat(priceString.replace('.', ''));
    const totalPrice = priceNumber * cartQuantity;

    const updatedProduct = {
      ...existingProduct,
      quantity: cartQuantity,
      total_price: totalPrice.toLocaleString('id-ID'),
    };

    // Update cart cart_products array
    cartData.cart_products[existingProductIndex] = updatedProduct;

    if (cartQuantity < 1) {
      cartData.cart_products.splice(existingProductIndex, 1);
      await cartRef.update({
        cart_products: cartData.cart_products,
      });
      const response = successResponse(
        200,
        'Product deleted successfully because quantity was edit to 0',
      );
      return res.status(200).json(response);
    }

    // Update cart data
    await cartRef.update({
      cart_products: cartData.cart_products,
    });

    const Username = cartData.username;
    const cartId = cartData.cart_id;
    const renter = cartData.renter_id;

    const responseData = {
      username: Username,
      cart_id: cartId,
      renter_id: renter,
      ...updatedProduct,
    };

    const response = successResponse(
      200,
      `Product '${productId}' quantity updated in the cart`,
      responseData,
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while updating cart product quantity',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Delete Cart Product Handler
const deleteCartProduct = async (req, res) => {
  try {
    const { uid } = req.user;
    const { productId, username } = req.params;

    const {
      errorCart,
      statusCart,
      checkResponseCart,
      cartData,
      cartRef,
    } = await checkCart(uid);

    if (errorCart) {
      return res.status(statusCart).json(checkResponseCart);
    }

    // Check if cart exists
    if (!cartData) {
      const response = badResponse(404, 'Cart not found');
      return res.status(404).json(response);
    }

    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }

    // Find the product in the cart
    const existingProductIndex = cartData.cart_products.findIndex(
      (product) => product.product_id === productId,
    );

    if (existingProductIndex === -1) {
      const response = badResponse(
        404,
        'Product not found in the cart',
      );
      return res.status(404).json(response);
    }

    const productSnapshot = await db
      .collection('products')
      .where('product_id', '==', productId)
      .get();
    const productData = productSnapshot.docs[0].data();

    // Remove the product from the cart
    cartData.cart_products.splice(existingProductIndex, 1);

    // Update cart data
    await cartRef.update({
      cart_products: cartData.cart_products,
    });

    const response = successResponse(
      200,
      `Product '${productData.title}' removed from the cart`,
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while deleting cart product',
      error.message,
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

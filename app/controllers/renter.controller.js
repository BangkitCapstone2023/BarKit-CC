import Fuse from 'fuse.js';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import db from '../config/firebase.config.js';

import {
  verifyRenter,
} from '../middlewares/authorization.middleware.js';

import getRandomElements from '../utils/random.js';
import { badResponse, successResponse } from '../utils/response.js';
import {
  checkLessor,
  checkOrder,
  checkProduct,
  checkAllProduct,
  checkAllCategory,
} from '../utils/snapshot.js';

const filename = fileURLToPath(import.meta.url);
const filedirname = dirname(filename);

const configPath = join(filedirname, '../config/config.json');
const config = JSON.parse(readFileSync(configPath));

const firebaseConfigPath = join(
  filedirname,
  '../config/',
  config.firebaseConfigCredentail,
);
const firebaseConfig = JSON.parse(readFileSync(firebaseConfigPath, 'utf8'));

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Home Handler
const getHomeData = async (req, res) => {
  try {
    const allProduct = await checkAllProduct();

    const products = allProduct.docs.map((doc) => doc.data());

    const allCategory = await checkAllCategory();
    const categories = [];

    await Promise.all(
      allCategory.docs.map(async (categoryDoc) => {
        const categoryData = categoryDoc.data();
        const category = { name: categoryData.name, subcategories: [] };
        const subcategoriesSnapshot = await categoryDoc.ref
          .collection('sub_categories')
          .get();
        subcategoriesSnapshot.forEach((subDoc) => {
          const subcategoryData = subDoc.data();
          const subcategory = { name: subcategoryData.name };
          category.subcategories.push(subcategory);
        });
        categories.push(category);
      }),
    );

    // Randomly select 20 products
    const randomProducts = getRandomElements(products, 20);

    const responseData = {
      products: randomProducts,
      categories,
    };

    const response = successResponse(
      200,
      'Dashboard data retrieved successfully',
      responseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while fetching dashboard data',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Search Products Handler
const searchProduct = async (req, res) => {
  try {
    const { title, category, subCategory } = req.query;

    if (!title) {
      const response = badResponse(
        400,
        'Please enter a word to search for a product',
      );
      return res.status(400).json(response);
    }

    // Retrieve all product data from Firestore
    const allProduct = await checkAllProduct();
    const products = allProduct.docs.map((doc) => doc.data());

    // Create Fuse.js options
    const fuseOptions = {
      keys: ['title'],
      threshold: 0.3,
    };

    // Create a Fuse instance with the product data and options
    const fuse = new Fuse(products, fuseOptions);

    // Perform search using Fuse.js
    const searchResults = fuse.search(title);

    // Filter by category and subCategory
    const filteredResults = searchResults.filter((result) => {
      if (category && subCategory) {
        return result.item.category === category && result.item.sub_category === subCategory;
      }
      if (category) {
        return result.item.category === category;
      }
      if (subCategory) {
        return result.item.sub_category === subCategory;
      }
      return null;
    });

    // Retrieve only the necessary properties from the search results
    const formattedResults = await Promise.all(
      filteredResults.map(async (result) => {
        const {
          errorLessor,
          statusLessor,
          checkResponseLessor,
          lessorData,
        } = await checkLessor(result.item.lessor_id);

        if (errorLessor) {
          return res.status(statusLessor).json(checkResponseLessor);
        }
        const { storeFullName, storeAddress, storePhone } = lessorData;

        const {
          item: { price, quantity, imageUrl },
        } = result;

        return {
          product_id: result.item.product_id,
          title: result.item.title,
          category: result.item.category,
          sub_category: result.item.sub_category,
          price,
          quantity,
          imageUrl,
          storeFullName,
          storeAddress,
          storePhone,
        };
      }),
    );

    if (formattedResults.length === 0) {
      const response = badResponse(
        404,
        'Product not found',
      );
      return res.status(404).json(response);
    }

    const response = successResponse(
      200,
      'Product search successful',
      formattedResults,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while searching products:', error);

    const response = badResponse(
      500,
      'An error occurred while searching products',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Get All Categories Handler
const getAllCategories = async (req, res) => {
  try {
    const allCategory = await checkAllCategory();
    const categories = [];

    allCategory.forEach((doc) => {
      const data = doc.data();
      categories.push({ id: doc.id, name: data.name, iconUrl: data.iconUrl });
    });

    console.log('Working update 10 Juni');

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting categories', error);
    return res.status(500).json({ error: 'Failed to get categories' });
  }
};

// Get All Sub Categories By Category Handler
const getSubCategoriesByCategory = async (req, res) => {
  const { name } = req.params;

  try {
    const categorySnapshot = await db
      .collection('categories')
      .where('name', '==', name)
      .get();

    if (categorySnapshot.empty) {
      const response = badResponse(404, 'Cannot find category');
      return res.status(404).json(response);
    }

    const categoryId = categorySnapshot.docs[0].id;
    const subCategoriesSnapshot = await db
      .collection('categories')
      .doc(categoryId)
      .collection('sub_categories')
      .get();

    const subCategories = [];

    subCategoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      subCategories.push({ id: doc.id, name: data.name, iconUrl: data.iconUrl });
    });

    return res.status(200).json(subCategories);
  } catch (error) {
    console.error('Error getting subcategories', error);
    return res.status(500).json({ error: 'Failed to get subcategories' });
  }
};

const getProductsBySubCategory = async (req, res) => {
  try {
    const { name } = req.params;

    const productsSnapshot = await db
      .collection('products')
      .where('sub_category', '==', name)
      .get();

    if (productsSnapshot.empty) {
      const reponse = badResponse(404, 'Sub category not found');
      return res.status(404).json(reponse);
    }

    const products = [];

    const fetchLessors = async (doc) => {
      const productData = doc.data();

      const { lessorData } = await checkLessor(productData.lessor_id);

      const {
        storeFullName,
        storeAddress,
        storePhone,
        storeEmail,
      } = lessorData;

      products.push({
        product_id: productData.product_id,
        title: productData.title,
        description: productData.description,
        category: productData.category,
        quantity: productData.quantity,
        price: productData.price,
        imageUrl: productData.imageUrl,
        lessor_id: productData.lessor_id,
        storeFullName,
        storeAddress,
        storePhone,
        storeEmail,
      });
    };

    const fetchProductData = async () => {
      const promises = [];
      productsSnapshot.docs.forEach((doc) => {
        promises.push(fetchLessors(doc));
      });
      await Promise.all(promises);
    };

    await fetchProductData();

    const response = successResponse(200, 'Products retrieved successfully', products);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting products by subcategory:', error);

    const response = badResponse(
      500,
      'An error occurred while getting products by subcategory',
    );

    return res.status(500).json(response);
  }
};

// Detail Products Handler
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      errorProduct,
      statusProduct,
      checkResponseProduct,
      productData,
    } = await checkProduct(productId);

    if (errorProduct) {
      return res.status(statusProduct).json(checkResponseProduct);
    }

    const { lessorData } = await checkLessor(productData.lessor_id);

    const {
      fullName,
      storeFullName,
      storeAddress,
      storePhone,
      storeEmail,
      storeActive,
    } = lessorData;

    const lessorResponse = {
      fullName,
      storeFullName,
      storeAddress,
      storePhone,
      storeEmail,
      storeActive,
    };

    const responseData = { ...productData, lessor: lessorResponse };
    const response = successResponse(
      200,
      'Product details retrieved successfully',
      responseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting product details', error);
    const response = badResponse(
      500,
      'Error while getting product details',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Get User Profile Handler
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
      renterData,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }
    const responseData = renterData;

    const response = successResponse(
      200,
      'Profile retrieved successfully',
      responseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting user profile:', error);
    const response = badResponse(
      500,
      'An error occurred while getting user profile',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Update User Profile Handler
const updateProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    const {
      fullName,
      address,
      phone,
      gender,
      email,
    } = req.body;

    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
      renterData,
      renterRef,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }
    // Check Input Data For Edit
    const renterUpdateData = {};

    if (fullName !== undefined && fullName !== '') {
      renterUpdateData.name = fullName;
    }

    if (address !== undefined && address !== '') {
      renterUpdateData.address = address;
    }

    if (phone !== undefined && phone !== '') {
      renterUpdateData.phone = phone;
    }

    if (gender !== undefined && gender !== '') {
      renterUpdateData.gender = gender;
    }

    if (Object.keys(renterUpdateData).length === 0) {
      const response = successResponse(
        200,
        'Berhasil update profile tapi tidak ada data yang diupdate',
        renterData,
      );
      return res.status(200).json(response);
    }

    // Periksa apakah ada perubahan email
    if (email && email !== renterData.email) {
      // Perbarui alamat email pada data profil renter
      renterUpdateData.email = email;

      // Update email di Firebase Authentication
      await firebase.auth().currentUser.updateEmail(email);

      // Kirim ulang email verifikasi ke alamat email baru
      await firebase.auth().currentUser.sendEmailVerification();
    }

    // Perbarui data profile renter pada database
    await renterRef.update(renterUpdateData);

    // Ambil snapshot terbaru dari data profile yang diperbarui
    const updatedProfileSnapshot = await renterRef.get();
    const updatedProfileData = updatedProfileSnapshot.data();

    delete updatedProfileData.userRecordData;
    if (email && email !== renterData.email) {
      const response = successResponse(
        200,
        'Profile updated successfully, check your email to verify',
        updatedProfileData,
      );
      return res.status(200).json(response);
    }

    const response = successResponse(
      200,
      'Profile updated successfully',
      updatedProfileData,
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating user profile:', error);

    const response = badResponse(
      500,
      'An error occurred while updating user profile',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Delete Account Renter Handler
const deleteRenterById = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
      renterData,
      renterRef,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }

    // Hapus renter
    await renterRef.delete();

    // Hapus data lessor yang terkait dengan renter tersebut
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', renterData.username)
      .get();

    if (!lessorSnapshot.empty) {
      const lessorId = lessorSnapshot.docs[0].id;
      const lessorRef = db.collection('lessors').doc(lessorId);
      await lessorRef.delete();
    }

    const response = successResponse(
      200,
      'Renter and associated lessor deleted successfully',
    );
    return res.json(response);
  } catch (error) {
    console.error('Error while deleting renter:', error);

    const response = badResponse(
      500,
      'An error occurred while deleting renter',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Create New Order Handler
const createOrder = async (req, res) => {
  try {
    const { username, productId } = req.params;
    const { uid } = req.user;
    const {
      deliveryAddress,
      startRentDate,
      endRentDate,
      paymentUse,
      quantityOrder,
      kurir,
    } = req.body;

    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
      renterData,
    } = await verifyRenter(username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }

    // Check Product
    const {
      errorProduct,
      statusProduct,
      checkResponseProduct,
      productData,
    } = await checkProduct(productId);
    const renterId = renterData.renter_id;
    if (errorProduct) {
      return res.status(statusProduct).json(checkResponseProduct);
    }

    if (renterData.email_verified === false) {
      const response = badResponse(
        403,
        'Your Email is not verified yet, please cek your email for verification, if you already verified and cant order product,try re-login',
      );
      return res.status(403).json(response);
    }

    const lessorId = productData.lessor_id;

    if (productData.quantity < quantityOrder) {
      const response = badResponse(
        400,
        `The maximum order quantity for this product is ${productData.quantity}`,
      );
      return res.status(400).json(response);
    }

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
      const response = badResponse(403, 'You cant order your own product');
      return res.status(403).json(response);
    }

    if (quantityOrder < 1) {
      const response = badResponse(
        400,
        'The minimum order quantity for this product is 1',
      );
      return res.status(400).json(response);
    }

    // Check Existing Orders
    const existingOrders = await db
      .collection('orders')
      .where('renter_id', '==', renterId)
      .where('product_id', '==', productId)
      .where('status', 'in', ['pending', 'progress'])
      .get();

    if (!existingOrders.empty) {
      const response = badResponse(
        400,
        'You already have a pending/progress order for this product. Please edit your existing order.',
      );
      return res.status(400).json(response);
    }

    // Generate document reference baru
    const orderRef = db.collection('orders').doc();

    // Buat Order Baru
    const newOrder = {
      order_id: orderRef.id,
      renter_id: renterId,
      lessor_id: lessorId,
      product_id: productId,
      delivery_address: deliveryAddress,
      start_rent_date: startRentDate,
      end_rent_date: endRentDate,
      quantity_order: quantityOrder,
      payment_use: paymentUse,
      kurir,
      status: 'pending',
    };

    // Insert order baru ke database
    await orderRef.set(newOrder);
    delete lessorData.username;
    delete lessorData.lessor_id;
    delete lessorData.renter_id;
    delete productData.username;
    delete productData.product_id;
    delete productData.lessor_id;
    delete renterData.renter_id;

    const responseData = {
      ...newOrder,
      lessor: lessorData,
      renter: renterData,
      product: productData,
    };

    delete responseData.renter.userRecordData;
    const response = successResponse(
      201,
      'Order Created successfully',
      responseData,
    );

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error while creating the order:', error);
    const response = badResponse(
      500,
      'An error occurred while creating the order',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Get All Orders By Renter Handler
const getOrdersByRenter = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

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

    // Mengambil seluruh order berdasarkan renter_id
    const orderRenter = await db
      .collection('orders')
      .where('renter_id', '==', renterId)
      .get();

    // Check Orders By Renter
    if (orderRenter.empty) {
      const response = successResponse(200, 'Renter does not have any orders yet', null);
      return res.status(200).json(response);
    }

    const ordersPromises = orderRenter.docs.map(async (doc) => {
      const orderData = doc.data();

      // Mengambil data produk terkait
      const productSnapshot = await db
        .collection('products')
        .doc(orderData.product_id)
        .get();

      // Memastikan produk tersedia
      if (productSnapshot.exists) {
        const productData = productSnapshot.data();
        delete productData.username;

        return {
          order_id: doc.id,
          delivery_address: orderData.delivery_address,
          start_rent_date: orderData.start_rent_date,
          end_rent_date: orderData.end_rent_date,
          quantity_order: orderData.quantity_order,
          payment_use: orderData.payment_use,
          kurir: orderData.kurir,
          status: orderData.status,
          product_id: productData.product_id,
          product: productData,
        };
      }
      const response = badResponse(
        500,
        'An error occurred while getting orders by renter',
      );
      return res.status(500).json(response);
    });

    const orders = await Promise.all(ordersPromises);

    const ordersData = orders.filter((order) => order !== undefined);

    const responseData = { ordersData, renter: renterData };

    const response = successResponse(
      200,
      'Orders retrieved successfully',
      responseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting orders by renter:', error);
    const response = badResponse(
      500,
      'An error occurred while getting orders by renter',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Update Order By Renter Handler
const updateOrder = async (req, res) => {
  try {
    const { uid } = req.user;
    const { username, orderId } = req.params;
    const {
      deliveryAddress,
      kurir,
      startRentDate,
      endRentDate,
    } = req.body;

    // Mengambil data order berdasarkan orderId
    const {
      errorOrder,
      statusOrder,
      checkResponseOrder,
      orderData,
    } = await checkOrder(orderId);

    if (errorOrder) {
      return res.status(statusOrder).json(checkResponseOrder);
    }

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

    // Memastikan order tersebut dimiliki oleh renter yang sesuai
    if (renterData.username !== username) {
      const response = badResponse(
        403,
        'Access denied. Order does not belong to the renter',
      );
      return res.status(403).json(response);
    }

    // Cek apakah status order masih pending
    if (orderData.status !== 'pending') {
      const response = badResponse(
        403,
        'Order cannot be edited, because it is not in pending status',
      );
      return res.status(403).json(response);
    }

    // Update data order dengan atribut yang dapat diubah
    await db.collection('orders').doc(orderId).update({
      delivery_address: deliveryAddress || orderData.delivery_address,
      kurir: kurir || orderData.kurir,
      start_rent_date: startRentDate || orderData.start_rent_date,
      end_rent_date: endRentDate || orderData.end_rent_date,
    });

    // Mengambil data terbaru dari order setelah pembaruan
    const {
      orderData: updateData,
    } = await checkOrder(orderId);

    const response = successResponse(
      200,
      'Order updated successfully',
      updateData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while editing the order:', error);

    const response = badResponse(
      500,
      'An error occurred while editing the order',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Get Detail Order By Renter
const getDetailOrdersByRenter = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { uid } = req.user;

    // Check Order
    const {
      errorOrder,
      statusOrder,
      checkResponseOrder,
      orderData,
    } = await checkOrder(orderId);

    if (errorOrder) {
      return res.status(statusOrder).json(checkResponseOrder);
    }

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

    // Memastikan order tersebut dimiliki oleh renter yang sesuai
    if (renterData.username !== username || renterData.renter_id !== uid) {
      const response = badResponse(
        403,
        'Access denied. Order does not belong to the renter',
      );
      return res.status(403).json(response);
    }

    const {
      errorProduct,
      statusProduct,
      checkResponseProduct,
      productData,
    } = await checkProduct(orderData.product_id);

    if (errorProduct) {
      return res.status(statusProduct).json(checkResponseProduct);
    }

    const {
      errorLessor,
      statusLessor,
      checkResponseLessor,
      lessorData,
    } = await checkLessor(orderData.lessor_id);

    if (errorLessor) {
      return res.status(statusLessor).json(checkResponseLessor);
    }
    delete productData.username;
    delete productData.lessor_id;
    delete lessorData.renter_id;
    delete lessorData.lessr_id;

    const reponseData = {
      ...orderData,
      product: productData,
      lessor: lessorData,
    };
    const response = successResponse(
      200,
      'Order retrieved successfully',
      reponseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the order:', error);

    const response = badResponse(
      500,
      'An error occurred while getting the order',
      error.message,
    );

    return res.status(500).json(response);
  }
};

export {
  getHomeData,
  searchProduct,
  getAllCategories,
  getSubCategoriesByCategory,
  getProductsBySubCategory,
  getProductById,
  getUserProfile,
  updateProfile,
  deleteRenterById,
  createOrder,
  getOrdersByRenter,
  getDetailOrdersByRenter,
  updateOrder,
};

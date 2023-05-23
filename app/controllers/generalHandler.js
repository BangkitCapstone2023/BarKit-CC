import admin from 'firebase-admin';
import { badResponse, successResponse } from '../utils/response.js';
import { db } from '../config/configFirebase.js';

const getAllLessors = async (req, res) => {
  try {
    // Get all lessors from Firestore
    const lessorsSnapshot = await db.collection('lessors').get();

    const lessorsData = [];

    // Iterate through the lessors snapshot and collect the data
    lessorsSnapshot.forEach((doc) => {
      const lessorData = doc.data();
      lessorsData.push(lessorData);
    });

    const response = successResponse(
      200,
      'Success Get All Lessor',
      lessorsData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessors:', error);
    const response = badResponse(
      500,
      'An error occurred while getting all lessor data',
      error.message
    );
    return res.status(500).json(response);
  }
};

const getLessorById = async (req, res) => {
  try {
    const { lessorId } = req.params;

    // Mencari lessor berdasarkan lessorId
    const lessorSnapshot = db.collection('lessors').doc(lessorId);
    const lessorRef = await lessorSnapshot.get();

    if (!lessorRef.exists) {
      const response = badResponse(404, 'Lessor not found');
      return res.status(404).json(response);
    }

    const lessorData = lessorRef.data();

    const response = successResponse(
      200,
      'Lessors retrieved successfully',
      lessorData
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the Lessor', error);

    const response = badResponse(
      500,
      'An error occurred while getting the Lessor',
      error.message
    );

    res.status(500).json(response);
  }
};

//TODO: Still Error
const getImageByName = async (req, res) => {
  const { name } = req.params;

  try {
    // const productSnapshot = await db.collection('products').get();

    const productSnapshot = await db
      .collection('products')
      // .where('imageUrl', 'array-contains', name)
      .get();
    console.log(productSnapshot);
    if (productSnapshot.empty) {
      const response = badResponse(404, `Image ${name} not found`);
      return res.status(404).json(response);
    }

    const productData = productSnapshot.docs[0].data();
    const imageUrl = productData.imageUrl;
    const image_id = productData.image_id;

    const imageData = { image_id, name, imageUrl };
    const response = successResponse(200, 'Success Get Image', imageData);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while retrieving image:', error);
    const response = badResponse(
      500,
      'Error when getting image',
      error.message
    );
    return res.status(500).json(response);
  }
};

const getAllImages = async (req, res) => {
  try {
    // Mendapatkan instance Firestore
    const productsSnapshot = await db.collection('products').get(); // Mendapatkan snapshot produk dari Firestore

    const allImages = [];

    // Iterate through the products snapshot
    productsSnapshot.forEach((productDoc) => {
      const productData = productDoc.data();
      const imageUrl = productData.imageUrl; // Ambil data imageUrl dari field 'imageUrl' di dokument produk

      if (imageUrl) {
        const image_id = productData.image_id; // Ambil data image_id dari field 'image_id' di dokument produk
        allImages.push({ image_id, imageUrl });
      }
    });

    const response = successResponse(200, 'Success Get All Images', allImages);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error saat mendapatkan daftar gambar:', error);
    const response = badResponse(
      500,
      'Error when get all images',
      error.message
    );
    return res.status(500).json(response);
  }
};

const getAllRenters = async (req, res) => {
  try {
    // Get all renters from Firestore
    const renterSnapshot = await db.collection('renters').get();

    const rentersData = [];

    // Iterate through the renters snapshot and collect the data
    renterSnapshot.forEach((doc) => {
      const renterData = doc.data();
      rentersData.push(renterData);
    });

    const response = successResponse(
      200,
      'Success Get All Renters',
      rentersData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting all renters:', error);
    const response = badResponse(
      500,
      'An error occurred while getting all renters data',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Mengambil detail suatu order berdasarkan order_id
const getRenterById = async (req, res) => {
  try {
    const { renterId } = req.params;

    // Mencari renter berdasarkan renterId
    const renterSnapshot = db.collection('renters').doc(renterId);
    const renterRef = await renterSnapshot.get();

    if (!renterRef.exists) {
      const response = badResponse(404, 'Renter not found');
      return res.status(404).json(response);
    }

    const renterData = renterRef.data();

    const response = successResponse(
      200,
      'Renter s retrieved successfully',
      renterData
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the Renter', error);

    const response = badResponse(
      500,
      'An error occurred while getting the Renter',
      error.message
    );

    res.status(500).json(response);
  }
};

const addCategory = async (req, res) => {
  const { name } = req.body;

  db.collection('categories')
    .add({ name })
    .then((docRef) => {
      res.status(201).json({ category_id: docRef.id, name });
    })
    .catch((error) => {
      console.error('Error creating category', error);
      res.status(500).json({ error: 'Failed to create category' });
    });
};

const addSubCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { name } = req.body;

  const categoryRef = db.collection('categories').doc(categoryId);

  categoryRef
    .collection('sub_categories')
    .add({ name })
    .then((docRef) => {
      res.status(201).json({ sub_category_id: docRef.id, name });
    })
    .catch((error) => {
      console.error('Error creating subcategory', error);
      res.status(500).json({ error: 'Failed to create subcategory' });
    });
};

const getAllProduct = async (req, res) => {
  try {
    // Get all renters from Firestore
    const productSnapshot = await db.collection('products').get();

    const productsData = [];

    // Iterate through the renters snapshot and collect the data
    productSnapshot.forEach((doc) => {
      const productData = doc.data();
      productsData.push(productData);
    });

    const response = successResponse(200, 'Success Get Product', productsData);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting all products', error);
    const response = badResponse(
      500,
      'An error occurred while getting all products data',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Mengambil detail suatu order berdasarkan order_id
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Mencari product berdasarkan productId
    const productSnapshot = db.collection('products').doc(productId);
    const productRef = await productSnapshot.get();

    if (!productRef.exists) {
      const response = badResponse(404, 'Products not found');
      return res.status(404).json(response);
    }

    const productData = productRef.data();

    const response = successResponse(
      200,
      'Products retrieved successfully',
      productData
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the Products', error);

    const response = badResponse(
      500,
      'An error occurred while getting the Products',
      error.message
    );

    res.status(500).json(response);
  }
};

// Mengambil seluruh order dari renter
const getAllOrders = async (req, res) => {
  try {
    const orderSnapshot = await db.collection('orders').get();

    const orders = [];

    orderSnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({ order_id: doc.id, ...orderData });
    });

    const response = successResponse(
      200,
      'Orders retrieved successfully',
      orders
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting orders:', error);

    const response = badResponse(
      500,
      'An error occurred while getting  orders',
      error.message
    );

    res.status(500).json(response);
  }
};

// Mengambil detail suatu order berdasarkan order_id
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Mencari order berdasarkan orderId
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      const response = badResponse(404, 'Order not found');
      return res.status(404).json(response);
    }

    const orderData = orderDoc.data();

    const response = successResponse(
      200,
      'Orders retrieved successfully',
      orderData
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the order:', error);

    const response = badResponse(
      500,
      'An error occurred while getting the order',
      error.message
    );

    res.status(500).json(response);
  }
};

export {
  getImageByName,
  getAllImages,
  getAllLessors,
  getLessorById,
  getAllRenters,
  getRenterById,
  addCategory,
  addSubCategory,
  getAllProduct,
  getProductById,
  getAllOrders,
  getOrderById,
};

import { badResponse, successResponse } from '../utils/response.js';
import db from '../config/firebase.config.js';

// Get All Lessor Hander
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
      lessorsData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessors:', error);
    const response = badResponse(
      500,
      'An error occurred while getting all lessor data',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Get Lessor By Id Handler
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
      lessorData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the Lessor', error);

    const response = badResponse(
      500,
      'An error occurred while getting the Lessor',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Get All Images Handler
const getAllImages = async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').get();

    const allImages = [];

    // Iterate through the products snapshot
    productsSnapshot.forEach((productDoc) => {
      const productData = productDoc.data();
      const { imageUrl } = productData;

      if (imageUrl) {
        const imageId = productData.image_id;
        allImages.push({ image_id: imageId, imageUrl });
      }
    });

    const response = successResponse(200, 'Success Get All Images', allImages);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error saat mendapatkan daftar gambar:', error);
    const response = badResponse(
      500,
      'Error when get all images',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Get All Renter Handler
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
      rentersData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting all renters:', error);
    const response = badResponse(
      500,
      'An error occurred while getting all renters data',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Get Renter By Id Handler
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
      renterData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the Renter', error);

    const response = badResponse(
      500,
      'An error occurred while getting the Renter',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Add New Category Handler
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

// Add New Sub Category Handler
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

// Get All Product Handler
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
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Get Product By Id Handler
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Mencari order berdasarkan productId
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      const response = badResponse(404, 'Product not found');
      return res.status(404).json(response);
    }

    const orderData = productDoc.data();

    const response = successResponse(
      200,
      'Products retrieved successfully',
      orderData,
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

// Get All Order Handler
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
      orders,
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting orders:', error);

    const response = badResponse(
      500,
      'An error occurred while getting  orders',
      error.message,
    );

    res.status(500).json(response);
  }
};

// Get Order By Id Handler
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
      orderData,
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

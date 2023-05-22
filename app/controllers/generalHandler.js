import admin from 'firebase-admin';
import { badResponse, successResponse } from '../utils/response.js';
import { db } from '../config/configFirebase.js';

async function getAllLessors(req, res) {
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
    return res.status(500).send(response);
  }
}

async function deleteLessorById(req, res) {
  const db = admin.firestore();
  const { lessorId } = req.params;

  try {
    // Get the lessor document
    const lessorSnapshot = await db.collection('lessors').doc(lessorId).get();

    if (!lessorSnapshot.exists) {
      throw new Error(`Lessor '${lessorId}' not found`);
    }

    // Get the lessor's username
    const lessorData = lessorSnapshot.data();
    const lessorUsername = lessorData.username;

    const lessorRef = db.collection('lessors').doc(lessorId);
    await lessorRef.delete();

    // Delete all products uploaded by the lessor
    const productsSnapshot = await db
      .collection('products')
      .where('username', '==', lessorUsername)
      .get();

    const batch = db.batch();

    productsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    const response = successResponse(
      200,
      'Lessor and associated products deleted successfully'
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting lessor:', error);

    const response = badResponse(500, 'Error deleting lessor', error.message);
    res.status(500).json(response);
  }
}

// async function deleteLessorById(req, res) {
//   const db = admin.firestore();
//   const { lessorId } = req.params;

//   try {
//     // Delete the lessor document
//     const lessorSnapshot = await db
//       .collection('lessors')
//       .where('lessorId', '==', lessorId)
//       .get();

//     if (lessorSnapshot.empty) {
//       throw new Error(`User '${lessorId}' not found or not a lessors`);
//     }
//     var lessorData = lessorSnapshot.docs[0].data();

//     const userSnapshot = await db
//       .collection('renters')
//       .where('username', '==', lessorData.username)
//       .get();

//     const renterId = userSnapshot.docs[0].id; // Get the renter ID

//     const renterRef = db.collection('renters').doc(renterId);
//     await renterRef.update({ isLessor: false });

//     const lessorRef = db.collection('lessors').doc(lessorId);
//     await lessorRef.delete();

//     const response = successResponse(
//       200,
//       'Lessor deleted successfully'
//     );

//     res.status(200).json(response);
//   } catch (error) {
//     console.error('Error deleting lessor:', error);

//     const response = badResponse(
//       500,
//       'Error deleting lessor',
//       error.message
//     );
//     res.status(500).json(response);
//   }
// }

// ! Error
async function getImageByName(req, res) {
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
      return res.status(404).send(response);
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
    return res.status(500).send(response);
  }
}

async function getAllImages(req, res) {
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
    return res.status(500).send(response);
  }
}

async function getAllRenters(req, res) {
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
    return res.status(500).send(response);
  }
}

async function deleteRenterById(req, res) {
  const { id } = req.params;

  try {
    // Get the lessor document
    const renterSnapshot = await db.collection('renters').doc(id).get();

    if (!renterSnapshot.exists) {
      throw new Error(`Renter '${id}' not found`);
    } else {
      await db.collection('renters').doc(id).delete();
    }

    const response = successResponse(200, 'Renters deleted successfully');

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting lessor:', error);

    const response = badResponse(500, 'Error deleting lessor', error.message);
    res.status(500).json(response);
  }
}

async function addCategory(req, res) {
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
}

async function addSubCategory(req, res) {
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
}

// Mengambil seluruh order dari renter
const getAllOrders = async (req, res) => {
  try {
    const orderSnapshot = await db.collection('orders').get();

    const orders = [];

    orderSnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({ order_id: doc.id, ...orderData });
    });

    const response = {
      status: 200,
      message: 'Orders retrieved successfully',
      data: orders,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting orders:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting orders',
      error: error.message,
    };

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
      const response = {
        status: 404,
        message: 'Order not found',
      };
      return res.status(404).json(response);
    }

    const orderData = orderDoc.data();

    const response = {
      status: 200,
      message: 'Order retrieved successfully',
      data: orderData,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting the order:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting the order',
      error: error.message,
    };

    res.status(500).json(response);
  }
};

export {
  getImageByName,
  getAllImages,
  getAllLessors,
  deleteLessorById,
  getAllRenters,
  deleteRenterById,
  addCategory,
  addSubCategory,
  getAllOrders,
  getOrderById,
};

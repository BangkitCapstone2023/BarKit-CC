import { badResponse, successResponse } from '../utils/response.js';
import db from '../config/firebase.config.js';

import {
  verifyRenter,
  verifyLessor,
} from '../middlewares/authorization.middleware.js';

import {
  checkLessor,
  checkOrder,
  checkRenter,
  checkProduct,
} from '../utils/snapshot.js';

// Register Lessor Handler
const registerLessor = async (req, res) => {
  const lessor = {
    email: req.body.email,
    username: req.body.username,
    fullName: req.body.fullName,
    storeFullName: req.body.storeFullName,
    storeAddress: req.body.storeAddress,
    storeEmail: req.body.storeEmail,
    storePhone: req.body.storePhone,
    storeStatus: req.body.storeStatus,
    kurir: req.body.kurir,
  };

  const { uid } = req.user;

  try {
    const requiredFields = [
      'storeFullName',
      'storeAddress',
      'storeEmail',
      'storePhone',
    ];

    // Cek Required Fields
    const missingFields = requiredFields.filter((field) => !lessor[field]);
    if (missingFields.length > 0) {
      const errorMessage = missingFields
        .map((field) => `${field} is required`)
        .join('. ');

      const response = badResponse(400, errorMessage);
      return res.status(400).json(response);
    }

    // Check renters exist
    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
      renterData,
    } = await verifyRenter(req.params.username, uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }

    if (renterData.email_verified === false) {
      const response = badResponse(
        403,
        'Your Email is not verified yet, please cek your email for verification, if you already verified and cant become lessor try re-login',
      );
      return res.status(403).json(response);
    }
    const { fullName, username, email } = renterData;
    const renterId = renterData.renter_id;
    const lessorSnapshot = await db
      .collection('lessors')
      .where('renter_id', '==', renterId)
      .get();

    // Check if renter already lessor
    if (!lessorSnapshot.empty) {
      const response = badResponse(
        409,
        `User '${req.params.username}' is already a lessor`,
      );
      return res.status(409).json(response);
    }

    // Save data to firestore
    const lessorDocRef = db.collection('lessors').doc();

    const lessorId = lessorDocRef.id;
    const lessorData = {
      lessor_id: lessorId,
      email,
      username,
      fullName,
      renter_id: renterId,
      storeFullName: lessor.storeFullName,
      storeAddress: lessor.storeAddress,
      storeEmail: lessor.storeEmail,
      storePhone: lessor.storePhone,
      storeActive: true,
      kurir: lessor.kurir || '',
    };

    await lessorDocRef.set(lessorData);

    // Update isLessor attribute in user document
    const renterRef = db.collection('renters').doc(renterId);
    await renterRef.update({ isLessor: true });

    const responseData = { ...lessorData, renter: renterData };
    const response = successResponse(
      201,
      `Success Create Lessor ${username}`,
      responseData,
    );
    return res.status(201).json(response);
  } catch (error) {
    console.error(error);
    const response = badResponse(
      500,
      'Error while create lessor',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Lessor Profile Handler
const getLessorProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    // Check if the lessor exists
    const {
      errorLessor,
      statusLessor,
      checkResponseLessor,
      lessorData,
    } = await verifyLessor(username, uid);

    if (errorLessor) {
      return res.status(statusLessor).json(checkResponseLessor);
    }

    const responseData = lessorData;
    const response = successResponse(
      200,
      'Success Get Lessor Profile',
      responseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessor:', error);

    const response = badResponse(
      500,
      'Error while getting lessor',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Update Profile Lessor Handler
const updateLessor = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    const {
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
      kurir,
    } = req.body;

    // Check if the lessor exists
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

    // Update  lessor data
    await db
      .collection('lessors')
      .doc(lessorId)
      .update({
        storeFullName,
        storeAddress,
        storeEmail,
        storePhone,
        kurir: kurir || lessorData.kurir,
      });

    const updateData = {
      lessor_id: lessorId,
      username,
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
      kurir: kurir || lessorData.kurir,
    };

    const responseData = updateData;
    const response = successResponse(
      200,
      'Success Update Lessor Data',
      responseData,
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating lessor:', error);

    const response = badResponse(
      500,
      'Error while updating lessor:',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Delete Lessor Account Handler
const deleteLessorById = async (req, res) => {
  const { lessorId } = req.params;

  try {
    // Get the lessor document
    const {
      errorLessor,
      statusLessor,
      checkResponseLessor,
      lessorData,
      lessorRef,
    } = await checkLessor(lessorId);

    if (errorLessor) {
      return res.status(statusLessor).json(checkResponseLessor);
    }
    const lessorUsername = lessorData.username;

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
      'Lessor and associated products deleted successfully',
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting lessor:', error);

    const response = badResponse(500, 'Error deleting lessor', error.message);
    return res.status(500).json(response);
  }
};

// All Order By Lessor Handler
const getOrdersByLessor = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    // Check if lessor is exits
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

    // Mencari orderan berdasarkan lessor_id
    const orderSnapshot = await db
      .collection('orders')
      .where('lessor_id', '==', lessorId)
      .get();

    const orders = [];

    // Mengambil setiap orderan yang dimilik lessor
    orderSnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({ order_id: doc.id, ...orderData });
    });

    const response = successResponse(
      200,
      'Orders retrieved successfully',
      orders,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessor orders:', error);

    const response = badResponse(
      500,
      'Error while getting lessor orders',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Detail Order Lessor Handler
const getLessorOrderById = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { uid } = req.user;
    // Check if lessor is exits
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

    const {
      errorRenter,
      statusRenter,
      checkResponseRenter,
      renterData,
    } = await checkRenter(lessorData.renter_id);

    if (errorRenter) {
      return res.status(statusRenter).json(checkResponseRenter);
    }

    // Mencari order berdasarkan lessor_id dan order_id
    const orderSnapshot = await db
      .collection('orders')
      .where('lessor_id', '==', lessorId)
      .where('order_id', '==', orderId)
      .get();

    if (orderSnapshot.empty) {
      const response = badResponse(404, 'Order not found');
      return res.status(404).json(response);
    }

    const orderData = orderSnapshot.docs[0].data();

    const {
      errorProduct,
      statusProduct,
      checkResponseProduct,
      productData,
    } = await checkProduct(orderData.product_id);

    if (errorProduct) {
      return res.status(statusProduct).json(checkResponseProduct);
    }

    delete renterData.renter_id;

    const resposeData = { ...orderData, product: productData, renter: renterData };
    const response = successResponse(
      200,
      'Order retrieved successfully',
      resposeData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting order:', error);

    const response = badResponse(
      500,
      'Error while getting order',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Update Order Status Lessor Handler
const updateOrderStatusAndNotes = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { status, notes } = req.body;
    const { uid } = req.user;

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

    const {
      errorOrder,
      statusOrder,
      checkResponseOrder,
      orderData,
      orderRef,
    } = await checkOrder(orderId);

    if (errorOrder) {
      return res.status(statusOrder).json(checkResponseOrder);
    }

    // Pastikan lessor_id pada orderan sesuai dengan lessor yang mengirim permintaan
    if (orderData.lessor_id !== lessorId) {
      const response = badResponse(
        403,
        'Not allowed to modify antoher lessor order',
      );
      return res.status(403).json(response);
    }

    // Update status orderan sesuai permintaan
    const allowedStatus = ['pending', 'process', 'cancelled', 'shipped'];
    if (!allowedStatus.includes(status)) {
      const response = badResponse(400, 'Invalid status value');
      return res.status(400).json(response);
    }

    // Persiapan data yang akan diupdate
    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'shipped') {
      const orderProductRef = db
        .collection('products')
        .doc(orderData.product_id);
      const orderProductDoc = await orderProductRef.get();

      if (orderProductDoc.exists) {
        const orderProductData = orderProductDoc.data();
        const quantityOrder = orderData.quantity_order;

        // Mengurangi quantity produk berdasarkan quantity_order
        const updatedQuantity = orderProductData.quantity - quantityOrder;

        // Pastikan quantity tidak menjadi negatif
        if (updatedQuantity < 0) {
          const response = badResponse(400, 'Insufficient product quantity');
          return res.status(400).json(response);
        }

        // Update quantity produk
        await orderProductRef.update({ quantity: updatedQuantity });
      }
    }

    await orderRef.update(updateData);
    const updatedOrderDoc = await orderRef.get();
    const updatedOrderData = updatedOrderDoc.data();

    const response = successResponse(
      200,
      'Success Update Status Order',
      updatedOrderData,
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating order status and notes:', error);

    const response = badResponse(
      500,
      'Error while updating order status and notes',
      error.message,
    );

    return res.status(500).json(response);
  }
};

export {
  registerLessor,
  getLessorProfile,
  updateLessor,
  deleteLessorById,
  getOrdersByLessor,
  getLessorOrderById,
  updateOrderStatusAndNotes,
};

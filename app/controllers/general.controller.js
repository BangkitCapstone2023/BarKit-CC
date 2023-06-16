import { badResponse, successResponse } from '../utils/response.js';
import db from '../config/firebase.config.js';

import {
  checkUID,
} from '../middlewares/authorization.middleware.js';

import {
  checkLessor,
  checkOrder,
  checkProduct,
  checkRenter,
} from '../utils/snapshot.js';

// Get Renter Details
const getRenterById = async (req, res) => {
  try {
    const { renterId } = req.params;

    const {
      errorRenter,
      statusRenter,
      checkRespponseRenter,
      renterData,
    } = await checkRenter(renterId);

    if (errorRenter) {
      return res.status(statusRenter).json(checkRespponseRenter);
    }
    delete renterData.phone;
    delete renterData.address;

    const response = successResponse(200, 'Renter details retrieved successfully', renterData);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting renter details:', error);
    const response = badResponse(500, 'An error occurred while getting renter details');
    return res.status(500).json(response);
  }
};

// Get Lessor Details
const getLessorById = async (req, res) => {
  try {
    const { lessorId } = req.params;

    const {
      errorLessor,
      statusLessor,
      checkResponseLessor,
      lessorData,
    } = await checkLessor(lessorId);

    if (errorLessor) {
      return res.status(statusLessor).json(checkResponseLessor);
    }
    delete lessorData.username;
    delete lessorData.email;
    delete lessorData.fullName;

    const response = successResponse(200, 'Lessor details retrieved successfully', lessorData);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessor details:', error);
    const response = badResponse(500, 'An error occurred while getting lessor details');
    return res.status(500).json(response);
  }
};

// Get Order Details
const getRenterOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid } = req.user;

    const {
      errorOrder,
      statusOrder,
      checkResponseOrder,
      orderData,
    } = await checkOrder(orderId);

    if (errorOrder) {
      return res.status(statusOrder).json(checkResponseOrder);
    }

    const {
      errorUID,
      statusUID,
      checkResponseUID,
    } = await checkUID('orders', orderId, uid);

    if (errorUID) {
      return res.status(statusUID).json(checkResponseUID);
    }

    const response = successResponse(200, 'Order details retrieved successfully', orderData);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting order details:', error);
    const response = badResponse(500, 'An error occurred while getting order details');
    return res.status(500).json(response);
  }
};

// Get Order Details
const getLessorOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid } = req.user;
    // Check if lessor is exits
    const {
      errorRenter,
      statusRenter,
      checkRespponseRenter,
      renterData,
    } = await checkRenter(uid);

    if (errorRenter) {
      return res.status(statusRenter).json(checkRespponseRenter);
    }
    const lessorSnapshot = await db
      .collection('lessors')
      .where('renter_id', '==', renterData.renter_id)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, 'Lessor not found');
      return res.status(404).json(response);
    }

    const lessorData = lessorSnapshot.docs[0].data();

    // Mencari order berdasarkan lessor_id dan order_id
    const orderSnapshot = await db
      .collection('orders')
      .where('lessor_id', '==', lessorData.lessor_id)
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

const mainPath = async (req, res) => {
  try {
    return res.status(200).send('<h1><center>This is main link of BarKit API, try to go another path<br>click <a href=/home>here to go home path</a></center></h1> ');
  } catch (error) {
    const response = badResponse(
      500,
      'Something went wrong',
      error.message,
    );
    return res.status(500).json(response);
  }
};

export {
  mainPath,
  getRenterById,
  getLessorById,
  getRenterOrderById,
  getLessorOrderById,
};

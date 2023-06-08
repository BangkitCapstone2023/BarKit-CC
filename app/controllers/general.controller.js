import { badResponse, successResponse } from '../utils/response.js';

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
    const { uid } = req.user;

    const {
      errorRenter,
      statusRenter,
      checkRespponseRenter,
      renterData,
    } = await checkRenter(renterId);

    if (errorRenter) {
      return res.status(statusRenter).json(checkRespponseRenter);
    }

    const {
      errorUID,
      statusUID,
      checkResponseUID,
    } = await checkUID('renters', renterId, uid);

    if (errorUID) {
      return res.status(statusUID).json(checkResponseUID);
    }

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
    const { uid } = req.user;

    const {
      errorLessor,
      statusLessor,
      checkResponseLessor,
      lessorData,
    } = await checkLessor(lessorId);

    if (errorLessor) {
      return res.status(statusLessor).json(checkResponseLessor);
    }

    const {
      errorUID,
      statusUID,
      checkResponseUID,
    } = await checkUID('lessors', lessorId, uid);

    if (errorUID) {
      return res.status(statusUID).json(checkResponseUID);
    }

    const response = successResponse(200, 'Lessor details retrieved successfully', lessorData);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessor details:', error);
    const response = badResponse(500, 'An error occurred while getting lessor details');
    return res.status(500).json(response);
  }
};

// Get Product Details
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const { uid } = req.user;

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
      errorUID,
      statusUID,
      checkResponseUID,
    } = await checkUID('products', productId, uid);

    if (errorUID) {
      return res.status(statusUID).json(checkResponseUID);
    }

    const response = successResponse(200, 'Product details retrieved successfully', productData);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting product details:', error);
    const response = badResponse(500, 'An error occurred while getting product details');
    return res.status(500).json(response);
  }
};

// Get Order Details
const getOrderById = async (req, res) => {
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

export {
  getRenterById,
  getLessorById,
  getProductById,
  getOrderById,
};

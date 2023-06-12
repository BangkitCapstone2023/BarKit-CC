import db from '../config/firebase.config.js';
import { badResponse } from './response.js';

// Check Renter
const checkRenter = async (renterId) => {
  try {
    const renterSnapshot = await db.collection('renters').doc(renterId).get();

    if (!renterSnapshot.exists) {
      return {
        errorRenter: true,
        statusRenter: 404,
        checkResponseRenter: badResponse(404, 'Renter not found'),
      };
    }
    const renterData = renterSnapshot.data();
    const renterRef = renterData.ref;

    return {
      errorRenter: false,
      renterData,
      renterRef,
    };
  } catch (error) {
    console.error('Error while checking renter:', error);
    return {
      errorRenter: true,
      statusRenter: 500,
      checkResponseRenter: badResponse(
        500,
        'An error occurred while checking lessor',
      ),
    };
  }
};

// Check Lessor
const checkLessor = async (lessorId) => {
  try {
    const lessorSnapshot = await db.collection('lessors').doc(lessorId).get();

    if (!lessorSnapshot.exists) {
      return {
        errorLessor: true,
        statusLessor: 404,
        checkResponseLessor: badResponse(404, 'Lessor not found'),
      };
    }
    const lessorData = lessorSnapshot.data();
    const lessorRef = lessorData.ref;

    return {
      errorLessor: false,
      lessorData,
      lessorRef,
    };
  } catch (error) {
    console.error('Error while checking lessor:', error);
    return {
      errorLessor: true,
      statusLessor: 500,
      checkResponseLessor: badResponse(
        500,
        'An error occurred while checking lessor',
      ),
    };
  }
};

// Check Product
const checkProduct = async (productId) => {
  try {
    const productSnapshot = await db.collection('products').doc(productId).get();

    if (!productSnapshot.exists) {
      return {
        errorProduct: true,
        statusProduct: 404,
        checkResponseProduct: badResponse(404, 'Product not found'),
      };
    }
    const productData = productSnapshot.data();
    const productRef = productSnapshot.ref;

    return {
      errorProduct: false,
      productData,
      productRef,
    };
  } catch (error) {
    console.error('Error while checking product:', error);
    return {
      errorProduct: true,
      statusProduct: 500,
      checkResponseProduct: badResponse(
        500,
        'An error occurred while checking product',
      ),
    };
  }
};

// Check Order
const checkOrder = async (orderId) => {
  try {
    const orderSnapshot = await db.collection('orders').doc(orderId).get();

    if (!orderSnapshot.exists) {
      return {
        errorOrder: true,
        statusOrder: 404,
        checkResponseOrder: badResponse(404, 'Order not found'),
      };
    }

    const orderData = orderSnapshot.data();
    const orderRef = orderSnapshot.ref;

    return {
      errorOrder: false,
      orderData,
      orderRef,
    };
  } catch (error) {
    console.error('Error while checking order:', error);
    return {
      errorOrder: true,
      statusOrder: 500,
      checkResponseOrder: badResponse(500, 'An error occurred while checking order'),
    };
  }
};

// Check Cart
const checkCart = async (uid) => {
  try {
    const cartRef = db.collection('carts').doc(uid);
    const cartSnapshot = await cartRef.get();
    const cartData = cartSnapshot.data();

    if (!cartData) {
      return {
        errorCart: true,
        statusCart: 404,
        checkResponseCart: badResponse(404, 'Cart not found'),
      };
    }

    return {
      errorCart: false,
      cartData,
      cartRef,
    };
  } catch (error) {
    console.error('Error while checking order:', error);
    return {
      errorCart: true,
      statusCart: 500,
      checkResponseCart: badResponse(500, 'An error occurred while checking order'),
    };
  }
};

// get All Product
const checkAllProduct = async () => {
  const allProduct = await db.collection('products').get();

  return allProduct;
};

// get All Category
const checkAllCategory = async () => {
  const allCategory = await db.collection('categories').get();

  return allCategory;
};

export {
  checkAllProduct,
  checkAllCategory,
  checkRenter,
  checkLessor,
  checkProduct,
  checkOrder,
  checkCart,
};

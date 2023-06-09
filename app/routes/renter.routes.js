import express from 'express';
import { authMiddleware } from '../middlewares/authentication.middlewares.js';

import {
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
} from '../controllers/renter.controller.js';

import {
  addProductToCart,
  getCartProductsByRenter,
  updateCartProductQuantity,
  deleteCartProduct,
} from '../controllers/product.controller.js';

const router = express.Router();

// Rute-rute yang tidak membutuhkan otentikasi
// Explore Product Routes
router.get('/home', getHomeData);
router.get('/search', searchProduct);
router.get('/category', getAllCategories);
router.get('/category/:name', getSubCategoriesByCategory);
router.get('/subcategory/:name/products', getProductsBySubCategory);
router.get('/products/:productId', getProductById);

// Rute-rute yang membutuhkan otentikasi
router.use(authMiddleware);
// Profile Renter Routes
router.get('/:username/profile', getUserProfile);
router.put('/:username/profile', updateProfile);
router.delete('/renters/:username/profile', deleteRenterById);

// Cart Routes
router.post('/:username/products/:productId/carts', addProductToCart);
router.get('/:username/carts', getCartProductsByRenter);
router.put('/:username/carts/:productId', updateCartProductQuantity);
router.delete('/:username/carts/:productId', deleteCartProduct);

// Order Renter Routes
router.post('/:username/orders/:productId', createOrder);
router.get('/:username/orders', getOrdersByRenter);
router.get('/:username/orders/:orderId', getDetailOrdersByRenter);
router.put('/:username/orders/:orderId', updateOrder);

export default router;

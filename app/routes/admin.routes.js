import express from 'express';
import { adminMiddleware } from '../middlewares/authentication.middlewares.js';

import {
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
} from '../controllers/admin.controller.js';

import {
  deleteProductById,
} from '../controllers/product.controller.js';

const router = express.Router();

// User Routers
router.get('/admin/lessors', adminMiddleware, getAllLessors);
router.get('/admin/lessors/:lessorId', adminMiddleware, getLessorById);

router.get('/admin/renters', adminMiddleware, getAllRenters);
router.get('/admin/renters/:renterId', adminMiddleware, getRenterById);

// Product Routers
router.get('/admin/products', adminMiddleware, getAllProduct);
router.get('/admin/products/:productId', adminMiddleware, getProductById);
router.delete('/admin/products/:productId', adminMiddleware, deleteProductById);

router.post('/admin/category', adminMiddleware, addCategory);
router.post('/admin/category/:categoryId/subcategory', adminMiddleware, addSubCategory);

// Order Routers
router.get('/admin/orders', adminMiddleware, getAllOrders);
router.get('/admin/orders/:orderId', adminMiddleware, getOrderById);

router.get('/admin/images', adminMiddleware, getAllImages);

export default router;

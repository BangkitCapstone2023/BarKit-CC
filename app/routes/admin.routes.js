import express from 'express';
import { adminMiddleware } from '../middlewares/auth.middlewares.js';

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

import predictionModel from '../models/image.model.js';

const router = express.Router();

// Model Router
router.post('/predict', predictionModel);

// User Routers
router.get('/admin/lessors', adminMiddleware, getAllLessors);
router.get('/admin/lessors/:lessorId', adminMiddleware, getLessorById);

router.get('/admin/renters', adminMiddleware, getAllRenters);
router.get('/admin/renters/:renterId', adminMiddleware, getRenterById);

// Product Routers
router.get('/admin/products', adminMiddleware, getAllProduct);
router.get('/admin/products/:productId', getProductById);

router.post('/admin/category', adminMiddleware, addCategory);
router.post('/admin/category/:categoryId/subcategory', adminMiddleware, addSubCategory);

// Order Routers
router.get('/admin/orders', adminMiddleware, getAllOrders);
router.get('/admin/orders/:orderId', adminMiddleware, getOrderById);

router.get('/admin/images', adminMiddleware, getAllImages);

export default router;

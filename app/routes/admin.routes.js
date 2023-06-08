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

router.use(adminMiddleware);

// User Routers
router.get('/admin/lessors', getAllLessors);
router.get('/admin/lessors/:lessorId', getLessorById);

router.get('/admin/renters', getAllRenters);
router.get('/admin/renters/:renterId', getRenterById);

// Product Routers
router.get('/admin/products', getAllProduct);
router.get('/admin/products/:productId', getProductById);
router.delete('/admin/products/:productId', deleteProductById);

router.post('/admin/category', addCategory);
router.post('/admin/category/:categoryId/subcategory', addSubCategory);

// Order Routers
router.get('/admin/orders', getAllOrders);
router.get('/admin/orders/:orderId', getOrderById);

router.get('/admin/images', getAllImages);

export default router;

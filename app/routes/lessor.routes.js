import express from 'express';
import { authMiddleware } from '../middlewares/authentication.middlewares.js';

import {
  getAllProductsByLessor,
  updateProductById,
  addProduct,
  deleteProductById,
} from '../controllers/product.controller.js';

import {
  registerLessor,
  getLessorProfile,
  updateLessor,
  getOrdersByLessor,
  getLessorOrderById,
  updateOrderStatusAndNotes,
  deleteLessorById,
} from '../controllers/lessor.controller.js';

const router = express.Router();
router.use(authMiddleware);

// Lessor Register Route
router.post('/lessors/:username/register', registerLessor);

// Lessor Profiles Routes
router.get('/lessors/:username/profile', getLessorProfile);
router.put('/lessors/:username/profile', updateLessor);
router.delete('/lessors/:lessorId/profile', deleteLessorById);

// Lessor Products Routes
router.get('/lessors/:username/products', getAllProductsByLessor);
router.put('/lessors/:username/products/:productId', updateProductById);
router.post('/lessors/:username/products', addProduct);
router.delete('/lessors/:username/products/:productId', deleteProductById);

// Lessor Orders Routes
router.get('/lessors/:username/orders', getOrdersByLessor);
router.get('/lessors/:username/orders/:orderId', getLessorOrderById);
router.put('/lessors/:username/orders/:orderId/confirm', updateOrderStatusAndNotes);

export default router;

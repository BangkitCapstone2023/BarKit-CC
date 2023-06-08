import express from 'express';

import { authMiddleware } from '../middlewares/authentication.middlewares.js';

import {
  getRenterById,
  getLessorById,
  getProductById,
  getOrderById,
} from '../controllers/general.controller.js';

const router = express.Router();

router.use(authMiddleware);

// Get Renter Details
router.get('/renters/:renterId', getRenterById);

// Get Lessor Details
router.get('/lessors/:lessorId', getLessorById);

// Get Product Details
router.get('/products/:productId', getProductById);

// Get Order Details
router.get('/orders/:orderId', getOrderById);

export default router;

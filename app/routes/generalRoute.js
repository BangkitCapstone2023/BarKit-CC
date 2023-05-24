import express from 'express';
const router = express.Router();

import {
  getImageByName,
  getAllImages,
  getAllLessors,
  getLessorById,
  getAllRenters,
  getRenterById,
  addCategory,
  addSubCategory,
  getAllProduct,
  getAllOrders,
  getOrderById,
} from '../controllers/generalHandler.js';

router.get('/lessors', getAllLessors);
router.get('/lessors/:lessorId', getLessorById);

router.get('/renters', getAllRenters);
router.get('/renters/:renterId', getRenterById);

router.get('/products', getAllProduct);

router.post('/category', addCategory);
router.post('/category/:categoryId/subcategory', addSubCategory);

router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderById);

router.get('/images', getAllImages);
// router.get('/images/:name', getImageByName);

export default router;

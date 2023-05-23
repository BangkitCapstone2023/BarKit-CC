import express from 'express';
const router = express.Router();

import {
  getAllImages,
  getImageByName,
  getAllLessors,
  getAllRenters,
  addCategory,
  addSubCategory,
  getAllOrders,
  getOrderById,
} from '../controllers/generalHandler.js';

router.get('/renters', getAllRenters);
router.get('/lessors', getAllLessors);

router.post('/category', addCategory);
router.post('/category/:categoryId/subcategory', addSubCategory);

router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderById);

router.get('/images', getAllImages);
// router.get('/images/:name', getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

export default router;

import express from 'express';
const router = express.Router();

import {
  getAllImages,
  getImageByName,
  deleteLessorById,
  deleteRenterById,
  getAllLessors,
  getAllRenters,
  addCategory,
  addSubCategory,
  getAllOrders,
  getOrderById,
} from '../controllers/generalHandler.js';

router.get('/renters', getAllRenters);
router.get('/lessors', getAllLessors);
router.get('/renters', getAllRenters);
router.delete('/renters/:id', deleteRenterById);

router.post('/category', addCategory);
router.post('/category/:categoryId/subcategory', addSubCategory);
router.delete('/lessors/:lessorId/profile', deleteLessorById);
router.delete('/renters/:renterId/profile', deleteRenterById);

router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderById);

router.get('/images', getAllImages);
router.get('/images/:name', getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

export default router;

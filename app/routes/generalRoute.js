import express from 'express';
const router = express.Router();

import {
  getAllImages,
  getImageByName,
  deleteLessorById,
  getAllLessors,
  getAllRenters,
  addCategory,
  addSubCategory,
} from '../controllers/generalHandler.js';

router.get('/lessors', getAllLessors);

router.post('/category', addCategory);
router.post('/category/:categoryId/subcategory', addSubCategory);
router.delete('/lessors/:lessorId', deleteLessorById);

router.get('/images', getAllImages);
router.get('/images/:name', getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

export default router;

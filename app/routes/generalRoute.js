const express = require('express');
const router = express.Router();

const {
  getAllImages,
  getImageByName,
  deleteLessorById,
  deleteRenterById,
  getAllLessors,
  getAllRenters,
  addCategory,
  addSubCategory,
} = require('../controllers/generalHandler');

router.get('/renters', getAllRenters);
router.delete('/renters/:id', deleteRenterById);

router.get('/lessors', getAllLessors);
router.delete('/lessors/:lessorId', deleteLessorById);

router.post('/category', addCategory);
router.post('/category/:categoryId/subcategory', addSubCategory);

router.get('/images', getAllImages);
router.get('/images/:name', getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

module.exports = router;

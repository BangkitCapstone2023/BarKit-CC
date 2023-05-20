const express = require('express');
const router = express.Router();
const {
  getAllProductsByLessor,
  updateProductByProductId,
  addProduct,
  // getAllImages,
  // getImageByName,
} = require('../controllers/productHandler');

const {
  registerLessor,
  getAllLessors,
  getLessorProfile,
  updateLessor,
} = require('../controllers/lessorHandler');

//! Register Lessor Route
router.post('/lessors/:username/register', registerLessor);

//! Store Feature Routes
router.get('/lessors', getAllLessors);
router.get('/lessors/:username/profile', getLessorProfile);
router.put('/lessors/:username', updateLessor);

router.get('/lessors/:username/products', getAllProductsByLessor);
router.put('/lessors/:username/products/:productId', updateProductByProductId);
router.post('/lessors/:username/products', addProduct);

//! Get Image Route
// router.get('/images', getAllImages);
// router.get('/images/:name', getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

module.exports = router;

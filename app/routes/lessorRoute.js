const express = require('express');
const router = express.Router();
const {
  getAllProductsByLessor,
  updateProductByProductId,
  addProduct,
} = require('../controllers/productHandler');

const {
  registerLessor,
  getAllLessors,
  getLessorProfile,
  updateLessor,
  deleteLessor,
} = require('../controllers/lessorHandler');

//! Register Lessor Route
router.post('/lessors/:username/register', registerLessor);

//! Store Feature Routes
router.get('/lessors', getAllLessors);
router.get('/lessors/:username/profile', getLessorProfile);
router.put('/lessors/:username', updateLessor);
router.delete('/lessors/:lessorId', deleteLessor);

router.get('/lessors/:username/products', getAllProductsByLessor);
router.put('/lessors/:username/products/:productId', updateProductByProductId);
router.post('/lessors/:username/products', addProduct);

module.exports = router;

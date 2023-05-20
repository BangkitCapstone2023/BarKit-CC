const express = require('express');
const router = express.Router();
const {
  getAllProductsByLessor,
  updateProductById,
  addProduct,
  deleteProductById,
} = require('../controllers/productHandler');

const {
  registerLessor,
  getLessorProfile,
  updateLessor,
} = require('../controllers/lessorHandler');

//! Register Lessor Route
router.post('/lessors/:username/register', registerLessor);

//! Store Feature Routes
router.get('/lessors/:username/profile', getLessorProfile);
router.put('/lessors/:username', updateLessor);

router.get('/lessors/:username/products', getAllProductsByLessor);
router.put('/lessors/:username/products/:productId', updateProductById);
router.post('/lessors/:username/products', addProduct);
router.delete('/lessors/:username/products/:productId', deleteProductById);

module.exports = router;

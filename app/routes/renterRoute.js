const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  searchProduct,
  getAllCategories,
  getSubCategoriesByName,
  getProductsBySubCategory,
  getProductById,
  getUserProfile,
  updateProfile,
} = require('../controllers/renterHandler');

router.get('/', getDashboardData);
router.get('/search', searchProduct);

router.get('/:username/profile', getUserProfile);
router.put('/:username/profile', updateProfile);

router.get('/category', getAllCategories);
router.get('/category/:name', getSubCategoriesByName);

router.get('/subcategory/:name/products', getProductsBySubCategory);
router.get('/products/:productId', getProductById);

module.exports = router;

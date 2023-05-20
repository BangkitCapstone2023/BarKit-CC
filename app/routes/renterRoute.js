const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  searchProduct,
  getAllCategories,
  getSubCategoriesByName,
} = require('../controllers/renterHandler');

router.get('/', getDashboardData);
router.get('/search', searchProduct);

router.get('/category', getAllCategories);
router.get('/category/:name', getSubCategoriesByName);

module.exports = router;

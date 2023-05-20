const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  searchProduct,
} = require('../controllers/renterHandler');

router.get('/', getDashboardData);
router.get('/search', searchProduct);

module.exports = router;

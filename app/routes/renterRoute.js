const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/renterHandler');

router.get('/', getDashboardData);

module.exports = router;

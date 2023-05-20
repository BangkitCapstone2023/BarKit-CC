const express = require('express');
const router = express.Router();

const {
  getAllImages,
  getImageByName,
} = require('../controllers/productHandler');

router.get('/images', getAllImages);
router.get('/images/:name', getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

module.exports = router;

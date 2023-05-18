const express = require('express');
const router = express.Router();

const imageHandler = require('../controllers/imagesHandler');

router.post('/upload', imageHandler.handleImageUpload);
router.get('/images', imageHandler.getAllImages);
router.get('/images/:name', imageHandler.getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

module.exports = router;

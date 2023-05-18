const express = require('express');
const router = express.Router();
const lessorHandler = require('../controllers/lessorHandler');
const addProdukHandler = require('../controllers/addProductHandler');

router.post('/:username/registerLessor', lessorHandler.registerLessor);

router.post('/:username/addProduct', addProdukHandler.addProdukFunction);

// router.get('/images', imageHandler.getAllImages);
// router.get('/images/:name', imageHandler.getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

module.exports = router;

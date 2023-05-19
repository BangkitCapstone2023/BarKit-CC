const express = require('express');
const router = express.Router();
const lessorHandler = require('../controllers/lessorHandler');
const produkHandler = require('../controllers/productHandler');

// Register Lessor Route
router.post('/:username/registerLessor', lessorHandler.registerLessor);

// Store Feature Routes
router.get('/barkitAdmin/allLessor', lessorHandler.getAllLessors);
router.get('/:username/storeProfile', lessorHandler.getLessorByUsername);
router.put('/:username/updateStore', lessorHandler.updateLessorData);
router.post('/:username/addProduct', produkHandler.addProdukFunction);

// Get Image Route
router.get('/barkitAdmin/images', produkHandler.getAllImages);
router.get('/images/:name', produkHandler.getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

module.exports = router;

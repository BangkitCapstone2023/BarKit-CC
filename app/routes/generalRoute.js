const express = require('express');
const router = express.Router();

const {
  getAllImages,
  getImageByName,
  deleteLessorById,
  getAllLessors,
} = require('../controllers/generalHandler');

router.get('/lessors', getAllLessors);

router.delete('/lessors/:lessorId', deleteLessorById);

router.get('/images', getAllImages);
router.get('/images/:name', getImageByName);
// router.get('/images/:name/download', addProductHandler.downloadImage);

module.exports = router;

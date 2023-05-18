const express = require('express');
const router = express.Router();
const lessorHandler = require('../controllers/lessorHandler');

router.post('/:username/registerLessor', lessorHandler.registerLessor);

module.exports = router;

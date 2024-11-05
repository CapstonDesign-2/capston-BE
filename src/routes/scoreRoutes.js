const express = require('express');
const router = express.Router();
const { calculateMyScore } = require('../controllers/scoreController');

router.post('/calculate', calculateMyScore);

module.exports = router;
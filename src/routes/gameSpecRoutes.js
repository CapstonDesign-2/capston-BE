const express = require('express');
const { createGameSpec } = require('../controllers/gameSpecController');
const router = express.Router();

// POST /api/gamespec
router.post('/', createGameSpec);

module.exports = router; 
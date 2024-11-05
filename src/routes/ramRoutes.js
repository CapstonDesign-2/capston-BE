// src/routes/ramRoutes.js
const express = require('express');
const router = express.Router();
const ramController = require('../controllers/ramController');

// 모든 RAM 정보를 가져오는 GET 라우트
// /api/ram
router.get('/', ramController.getAllRAMs);

module.exports = router;

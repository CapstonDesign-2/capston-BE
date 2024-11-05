const express = require('express');
const { getAllRAMs } = require('../controllers/ramController');
const router = express.Router();

// 모든 RAM 정보를 가져오는 GET 라우트
// /api/ram
router.get('/', getAllRAMs);

module.exports = router;
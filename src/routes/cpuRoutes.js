const express = require('express');
const { getAllCPUs } = require('../controllers/cpuController');
const router = express.Router();

// 모든 CPU 정보를 가져오는 GET 라우트
// /api/cpu
router.get('/', getAllCPUs);

module.exports = router;
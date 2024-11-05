const express = require('express');
const { getAllGPUs } = require('../controllers/gpuController');
const router = express.Router();

// 모든 GPU 정보를 가져오는 GET 라우트
// /api/gpu
router.get('/', getAllGPUs);

module.exports = router;
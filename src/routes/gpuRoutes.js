// src/routes/gpuRoutes.js
const express = require('express');
const router = express.Router();
const gpuController = require('../controllers/gpuController');

// 모든 GPU 정보를 가져오는 GET 라우트
// /api/gpu
router.get('/', gpuController.getAllGPUs);

module.exports = router;

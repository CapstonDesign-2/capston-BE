// src/routes/cpuRoutes.js
const express = require('express');
const router = express.Router();
const cpuController = require('../controllers/cpuController');

// 모든 CPU 정보를 가져오는 GET 라우트
// /api/cpu
router.get('/', cpuController.getAllCPUs);

module.exports = router;

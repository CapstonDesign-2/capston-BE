// src/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// 모든 게임 정보를 가져오는 GET 라우트
// /api/game
router.get('/', gameController.getAllGames);

module.exports = router;

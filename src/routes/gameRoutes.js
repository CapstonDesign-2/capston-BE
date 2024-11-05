const express = require('express');
const { getAllGames } = require('../controllers/gameController');
const router = express.Router();

// 모든 게임 정보를 가져오는 GET 라우트
// /api/game
router.get('/', getAllGames);

module.exports = router;
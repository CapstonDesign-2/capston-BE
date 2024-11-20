const express = require('express');
const router = express.Router();
const { calculateMyScore } = require('../controllers/scoreController');
const { getAllCPUs } = require('../controllers/cpuController');
const { getAllGPUs } = require('../controllers/gpuController');
const { getAllRAMs } = require('../controllers/ramController');
const { getAllGames } = require('../controllers/gameController');
const { createGameSpec } = require('../controllers/gameSpecController');
const {
    loginUser,
    logoutUser,
    getProfile,
    updateProfile
} = require('../controllers/userController');
const { getHardwareRanking } = require('../controllers/rankingController');

router.get('/hello', (req, res) => {
    res.send('안녕하세요! 이것은 /hello 경로입니다.');
});

// 하드웨어 정보 생성 라우트
router.post('/create', async (req, res) => {
    try {
        await calculateMyScore(req, res);
    } catch (error) {
        console.error('라우터 처리 중 오류:', error);
        res.status(500).json({ error: '서버 처리 중 오류가 발생했습니다.' });
    }
});

// Score 관련 라우트
router.post('/api/score/calculate', calculateMyScore);

// CPU 관련 라우트
router.get('/api/cpu', getAllCPUs);

// GPU 관련 라우트
router.get('/api/gpu', getAllGPUs);

// RAM 관련 라우트
router.get('/api/ram', getAllRAMs);

// Game 관련 라우트
router.get('/api/game', getAllGames);

// GameSpec 관련 라우트
router.post('/api/gamespec', createGameSpec);

// User 관련 라우트
router.post('/api/user/login', loginUser);
router.post('/api/user/logout', logoutUser);
router.get('/api/user/profile', getProfile);
router.put('/api/user/profile', updateProfile);

// Ranking 관련 라우트
router.get('/api/hardware/ranking', getHardwareRanking);

module.exports = router;

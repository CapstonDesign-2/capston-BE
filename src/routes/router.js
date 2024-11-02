const express = require('express');
const router = express.Router();
const { calculateMyScore } = require('../controllers/scoreController');

// 예시 경로
router.get('/hello', (req, res) => {
  res.send('안녕하세요! 이것은 /hello 경로입니다.');
});

// 하드웨어 정보 생성 라우터
router.post('/create', async (req, res) => {
    try {
        await calculateMyScore(req, res);
    } catch (error) {
        console.error('라우터 처리 중 오류:', error);
        res.status(500).json({ error: '서버 처리 중 오류가 발생했습니다.' });
    }
});


module.exports = router;

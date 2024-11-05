// src/controllers/gameController.js
const Game = require('../models/Game'); // Game 모델을 가져옴

module.exports = {
    // 모든 게임 정보를 가져오는 함수
    getAllGames: async (req, res) => {
        try {
            const games = await Game.findAll(); // 모든 게임 데이터를 조회
            res.status(200).json(games); // JSON 형식으로 응답
        } catch (error) {
            console.error('Error fetching game data:', error);
            res.status(500).json({ error: '게임 데이터를 가져오는 중 오류가 발생했습니다.' });
        }
    },
};

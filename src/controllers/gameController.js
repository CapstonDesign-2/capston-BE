const Game = require('../models/Game'); // Game 모델을 불러옴

// 모든 게임 정보를 가져오는 함수
const getAllGames = async (req, res) => {
    try {
        const games = await Game.findAll(); // 모든 게임 데이터 조회
        res.status(200).json(games); // 성공적으로 조회된 데이터 응답
    } catch (error) {
        console.error('Error fetching game data:', error);
        res.status(500).json({ error: '게임 데이터를 가져오는 중 오류가 발생했습니다.' });
    }
};

// 모듈로 내보내기
module.exports = {
    getAllGames,
};

const RAM = require('../models/RAM'); // RAM 모델을 불러옴

// 모든 RAM 정보를 가져오는 함수
const getAllRAMs = async (req, res) => {
    try {
        const rams = await RAM.findAll(); // 모든 RAM 데이터 조회
        res.status(200).json(rams); // 성공적으로 조회된 데이터 응답
    } catch (error) {
        console.error('Error fetching RAM data:', error);
        res.status(500).json({ error: 'RAM 데이터를 가져오는 중 오류가 발생했습니다.' });
    }
};

// 모듈로 내보내기
module.exports = {
    getAllRAMs,
};

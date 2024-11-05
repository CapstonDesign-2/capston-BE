const CPU = require('../models/CPU'); // CPU 모델을 불러옴

// 모든 CPU 정보를 가져오는 함수
const getAllCPUs = async (req, res) => {
    try {
        const cpus = await CPU.findAll(); // 모든 CPU 데이터 조회
        res.status(200).json(cpus); // 성공적으로 조회된 데이터 응답
    } catch (error) {
        console.error('Error fetching CPU data:', error);
        res.status(500).json({ error: 'CPU 데이터를 가져오는 중 오류가 발생했습니다.' });
    }
};

// 모듈로 내보내기
module.exports = {
    getAllCPUs,
};

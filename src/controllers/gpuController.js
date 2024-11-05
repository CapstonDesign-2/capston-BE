// src/controllers/gpuController.js
const GPU = require('../models/GPU'); // GPU 모델을 불러옴

module.exports = {
    // 모든 GPU 정보를 가져오는 함수
    getAllGPUs: async (req, res) => {
        try {
            const gpus = await GPU.findAll(); // 모든 GPU 데이터 조회
            res.status(200).json(gpus); // 성공적으로 조회된 데이터 응답
        } catch (error) {
            console.error('Error fetching GPU data:', error);
            res.status(500).json({ error: 'GPU 데이터를 가져오는 중 오류가 발생했습니다.' });
        }
    },
};

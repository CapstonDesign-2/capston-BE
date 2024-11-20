const fs = require('fs').promises;
const path = require('path');

const getHardwareRanking = async (req, res) => {
    try {
        // JSON 파일 읽기
        const jsonData = await fs.readFile(
            path.join(__dirname, '../../data/userData.json'),
            'utf8'
        );
        
        // JSON 파싱
        const hardwareData = JSON.parse(jsonData);
        
        // totalScore 기준으로 내림차순 정렬
        const sortedData = hardwareData.sort((a, b) => b.totalScore - a.totalScore);
        
        res.status(200).json({
            sortedData
        });

    } catch (error) {
        console.error('랭킹 조회 중 오류 발생:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
};

module.exports = {
    getHardwareRanking
}; 
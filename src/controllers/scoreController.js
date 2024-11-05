const { BaseScore, User } = require('../index');
const { matchHardwareNames } = require('./nameMatchController');

const calculateMyScore = async (req, res) => {
    try {
        const hardwareData = req.body;
        
        // 하드웨어 매칭
        const matchResult = await matchHardwareNames(hardwareData);
        
        if (!matchResult.success) {
            return res.status(404).json({
                message: matchResult.message,
                notFound: matchResult.notFound
            });
        }

        const { cpu, gpu, ram } = matchResult.hardware;

        // baseScore 가져오기
        const baseScore = await BaseScore.findOne({ where: { baseScoreId: 1 } });
        if (!baseScore) {
            return res.status(404).json({ message: '기준 점수를 찾을 수 없습니다.' });
        }

        // 종합 점수 계산
        const totalScore = (
            ((cpu.cpuScore / baseScore.cpuBaseScore) * 100) * 0.3 +
            ((gpu.gpuScore / baseScore.gpuBaseScore) * 100) * 0.5 +
            ((ram.ramScore / baseScore.ramBaseScore) * 100) * 0.2
        );

        // 소수점 둘째자리까지 반올림
        const roundedScore = Math.round(totalScore * 100) / 100;

        // User 모델에 데이터 저장
        const user = await User.create({
            serialNum: hardwareData.deviceId,
            cpuName: cpu.name,
            cpuScore: cpu.score,
            gpuName: gpu.name,
            gpuScore: gpu.score,
            ramName: ram.name,
            ramScore: ram.score,
            totalScore: hardwareData.totalScore
        });

        res.status(200).json({
            serialNum: hardwareData.deviceId,
            cpuName: cpu.name,
            cpuScore: cpu.score,
            gpuName: gpu.name,
            gpuScore: gpu.score,
            ramName: ram.name,
            ramScore: ram.score,
            totalScore: hardwareData.totalScore
        });

    } catch (error) {
        console.error('점수 계산 중 오류 발생:', error);
        res.status(500).json({ message: '점수 계산 중 오류가 발생했습니다.' });
    }
};

module.exports = {
    calculateMyScore
}; 
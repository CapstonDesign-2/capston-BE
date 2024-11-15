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

        // 하드웨어 매칭 결과 검증
        if (!cpu || !gpu || !ram) {
            return res.status(404).json({ 
                message: '하드웨어 매칭 실패',
                notFound: {
                    cpu: !cpu,
                    gpu: !gpu,
                    ram: !ram
                }
            });
        }

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

        // NaN 체크 추가
        if (isNaN(totalScore)) {
            console.error('점수 계산 오류:', {
                cpu: cpu.cpuScore,
                gpu: gpu.gpuScore,
                ram: ram.ramScore,
                baseScores: {
                    cpu: baseScore.cpuBaseScore,
                    gpu: baseScore.gpuBaseScore,
                    ram: baseScore.ramBaseScore
                }
            });
            return res.status(500).json({ message: '점수 계산 중 오류가 발생했습니다.' });
        }

        // 소수점 둘째자리까지 반올림
        const roundedScore = Math.round(totalScore * 100) / 100;

        // User 모델에 데이터 저장
        const user = await User.create({
            serialNum: hardwareData.deviceId,
            myCPU: cpu.cpuName,
            cpuScore: cpu.cpuScore,
            myGPU: gpu.gpuName,
            gpuScore: gpu.gpuScore,
            myRAM: ram.ramName,
            ramScore: ram.ramScore,
            totalScore: roundedScore
        });

        res.status(200).json({
            serialNum: hardwareData.deviceId,
            cpuName: cpu.cpuName,
            cpuScore: cpu.cpuScore,
            gpuName: gpu.gpuName,
            gpuScore: gpu.gpuScore,
            ramName: ram.ramName,
            ramScore: ram.ramScore,
            totalScore: roundedScore
        });

    } catch (error) {
        console.error('점수 계산 중 오류 발생:', error);
        res.status(500).json({ message: '점수 계산 중 오류가 발생했습니다.' });
    }
};

module.exports = {
    calculateMyScore
}; 
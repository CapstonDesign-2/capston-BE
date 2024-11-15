const { BaseScore, User } = require('../index');
const { matchHardwareNames } = require('./nameMatchController');

const calculateMyScore = async (req, res) => {
    try {
        const hardwareData = req.body;
        
        console.log('Received hardware data:', hardwareData);
        const result = await matchHardwareNames(hardwareData);
        
        if (!result.success) {
            return res.status(404).json({
                message: result.message,
                notFound: result.notFound
            });
        }

        const { cpu, gpu, ram } = result.hardware;

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

        // 종합 점수 계산 방식 수정
        const cpuWeight = 0.3;  // CPU 30%
        const gpuWeight = 0.5;  // GPU 50%
        const ramWeight = 0.2;  // RAM 20%

        // 각 점수를 기준 점수로 정규화
        const normalizedCpuScore = (cpu.cpuScore / baseScore.cpuBaseScore) * 100;
        const normalizedGpuScore = (gpu.gpuScore / baseScore.gpuBaseScore) * 100;
        const normalizedRamScore = (ram.ramScore / baseScore.ramBaseScore) * 100;

        // 패널티 기준치 설정
        const penaltyThreshold = 40; // 기준 점수의 40% 미만일 경우
        const penaltyMultiplier = 0.5; // 패널티 계수

        // 패널티 적용 함수
        const applyPenalty = (score) => {
            if (score < penaltyThreshold) {
                return score * penaltyMultiplier;
            }
            return score;
        };

        // 패널티 적용된 점수 계산
        const penalizedCpuScore = applyPenalty(normalizedCpuScore);
        const penalizedGpuScore = applyPenalty(normalizedGpuScore);
        const penalizedRamScore = applyPenalty(normalizedRamScore);

        // 가중치를 적용한 최종 점수 계산
        const totalScore = (
            penalizedCpuScore * cpuWeight +
            penalizedGpuScore * gpuWeight +
            penalizedRamScore * ramWeight
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
        try {
            const user = await User.upsert({
                serialNum: hardwareData.deviceId,
                myCPU: cpu.cpuName,
                cpuScore: cpu.cpuScore,
                myGPU: gpu.gpuName,
                gpuScore: gpu.gpuScore,
                myRAM: ram.ramName,
                ramScore: ram.ramScore,
                totalScore: roundedScore
            });
        } catch (error) {
            console.error('사용자 데이터 저장 중 오류:', error);
            throw error;
        }

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
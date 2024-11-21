const { BaseScore, User } = require('../index');
const { matchHardwareNames } = require('./nameMatchController');
const fs = require('fs').promises;
const path = require('path');

const calculateMyScore = async (req, res) => {
    try {
        // 여러 디바이스 처리를 위한 배열 변환
        const devices = Array.isArray(req.body) ? req.body : [req.body];
        const results = [];

        // 각 디바이스별로 기존 로직 실행
        for (const hardwareData of devices) {
            try {
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

                // RAM 점수 정규화 수정
                let normalizedRamScore;
                if (ram.ramCount && ram.ramCount > 1) {
                    // 듀얼채널 보너스 조정: 추가 RAM당 15% 추가 성능으로 줄임
                    const dualChannelBonus = 1 + ((ram.ramCount - 1) * 0.15);
                    
                    // 평균 점수 계산 후 보너스 적용
                    normalizedRamScore = ((ram.ramScore / ram.ramCount) / baseScore.ramBaseScore) * 100 * dualChannelBonus;
                    
                    // 최대 보너스 제한 (원래 점수의 2배를 넘지 않도록)
                    normalizedRamScore = Math.min(normalizedRamScore, 200);
                } else {
                    normalizedRamScore = (ram.ramScore / baseScore.ramBaseScore) * 100;
                }

                // 추가: normalizedRamScore가 너무 높은 경우 제한
                normalizedRamScore = Math.min(normalizedRamScore, 150); // 최대 150%로 제한

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

                const adjustedRamScore = Math.round(ram.ramScore * 0.5); // RAM 점수를 절반으로 조정

                // 계산된 유저 데이터
                const userData = {
                    serialNum: hardwareData.deviceId,
                    myCPU: cpu.cpuName,
                    cpuScore: cpu.cpuScore,
                    myGPU: gpu.gpuName,
                    gpuScore: gpu.gpuScore,
                    myRAM: ram.ramName,
                    ramScore: adjustedRamScore,  // 조정된 RAM 점수
                    totalScore: roundedScore
                };

                try {
                    // User 모델에 저장
                    await User.upsert(userData);

                    // userData.json 파일 경로
                    const userDataPath = path.join(__dirname, '../../data/userData.json');

                    // 기존 데이터 읽기
                    let existingData = [];
                    try {
                        const fileData = await fs.readFile(userDataPath, 'utf8');
                        existingData = JSON.parse(fileData);
                    } catch (error) {
                        // 파일이 없거나 비어있는 경우 빈 배열로 시작
                        existingData = [];
                    }

                    // 같은 serialNum이 있는지 확인
                    const index = existingData.findIndex(user => user.serialNum === userData.serialNum);
                    if (index !== -1) {
                        // 기존 데이터 업데이트
                        existingData[index] = userData;
                    } else {
                        // 새 데이터 추가
                        existingData.push(userData);
                    }

                    // 파일에 저장
                    await fs.writeFile(userDataPath, JSON.stringify(existingData, null, 2), 'utf8');

                    // 각 디바이스의 결과를 배열에 추가
                    results.push(userData);

                } catch (error) {
                    console.error('데이터 저장 중 오류:', error);
                    results.push({
                        serialNum: hardwareData.deviceId,
                        error: '데이터 저장 중 오류가 발생했습니다.',
                        message: error.message
                    });
                }

            } catch (error) {
                // 개별 디바이스 처리 실패 시 해당 디바이스만 실패 처리
                results.push({
                    serialNum: hardwareData.deviceId,
                    error: '처리 실패',
                    message: error.message
                });
            }
        }

        // 전체 결과 반환
        res.status(200).json(results);

    } catch (error) {
        console.error('점수 계산 중 오류 발생:', error);
        res.status(500).json({ message: '점수 계산 중 오류가 발생했습니다.' });
    }
};

// RAM 평균 점수 계산 함수 추가
const calculateAverageRAMScore = (matchingRAMs) => {
    if (!matchingRAMs || matchingRAMs.length === 0) {
        return null;
    }

    const totalScore = matchingRAMs.reduce((sum, ram) => {
        return sum + parseFloat(ram.ramScore);
    }, 0);

    return totalScore / matchingRAMs.length;
};

const calculateGameSpecScores = async (cpuScore, gpuScore, ramScore) => {
    try {
        // baseScore 가져오기
        const baseScore = await BaseScore.findOne({ where: { baseScoreId: 1 } });
        if (!baseScore) {
            throw new Error('기준 점수를 찾을 수 없습니다.');
        }

        // 점수 정규화
        const normalizedCpuScore = (cpuScore / baseScore.cpuBaseScore) * 100;
        const normalizedGpuScore = (gpuScore / baseScore.gpuBaseScore) * 100;
        const normalizedRamScore = (ramScore / baseScore.ramBaseScore) * 100;

        // 패널티 적용
        const penaltyThreshold = 40;
        const penaltyMultiplier = 0.5;
        const applyPenalty = (score) => {
            if (score < penaltyThreshold) {
                return score * penaltyMultiplier;
            }
            return score;
        };

        const penalizedCpuScore = applyPenalty(normalizedCpuScore);
        const penalizedGpuScore = applyPenalty(normalizedGpuScore);
        const penalizedRamScore = applyPenalty(normalizedRamScore);

        // 가중치 적용
        const cpuWeight = 0.3;
        const gpuWeight = 0.5;
        const ramWeight = 0.2;

        const totalScore = (
            penalizedCpuScore * cpuWeight +
            penalizedGpuScore * gpuWeight +
            penalizedRamScore * ramWeight
        );

        return Math.round(totalScore * 100) / 100;
    } catch (error) {
        console.error('게임 스펙 점수 계산 중 오류:', error);
        throw error;
    }
};

const calculateGameSpecRamScore = (ramGB) => {
    // 기본 점수 계산 (1GB당 280점)
    let baseScore = ramGB * 1640;
    
    // RAM 크기에 따른 패널티/보너스 적용
    if (ramGB < 8) {
        // 8GB 미만: 20% 패널티
        baseScore *= 0.8;
    } else if (ramGB < 16) {
        // 8GB-16GB: 10% 패널티
        baseScore *= 0.9;
    } else if (ramGB > 32) {
        // 32GB 초과: 추가 GB당 점수 50% 감소
        const baseGB32Score = 32 * 280;  // 32GB까지의 기본 점수
        const additionalGB = ramGB - 32;  // 32GB 초과분
        const additionalScore = additionalGB * 140;  // 초과분에 대해 50% 감소된 점수
        baseScore = baseGB32Score + additionalScore;
    }

    return Math.round(baseScore);
};

module.exports = {
    calculateMyScore,
    calculateAverageRAMScore,
    calculateGameSpecScores,
    calculateGameSpecRamScore  // 새로운 함수 export
}; 
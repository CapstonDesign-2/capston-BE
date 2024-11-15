const db = require('../index');
const { matchHardwareNames, hardwareCache, hardwareMatcher } = require('./nameMatchController');
const { Op } = require('sequelize');
const { saveGameData } = require('../utils/gameData');

const calculateSpecScores = async (specs, ramScore, matchedHardware) => {
    const cpuResults = [];
    const gpuResults = [];

    // GPU 매칭 및 점수 계산
    for (const gpuName of specs.gpus) {
        const result = await matchHardwareNames({
            cpu: 'dummy',
            gpu: gpuName,
            ram: '4GB'
        });
        
        if (result.success && result.hardware.gpu) {
            gpuResults.push(result.hardware.gpu.gpuScore);
            matchedHardware.gpus.push(result.hardware.gpu);
        }
    }

    // CPU 매칭 및 점수 계산
    for (const cpuName of specs.cpus) {
        const result = await matchHardwareNames({
            cpu: cpuName,
            gpu: 'dummy',
            ram: '4GB'
        });
        
        if (result.success && result.hardware.cpu) {
            cpuResults.push(result.hardware.cpu.cpuScore);
            matchedHardware.cpus.push(result.hardware.cpu);
        }
    }

    // 평균 점수 계산
    const avgCpuScore = cpuResults.length > 0 ? 
        cpuResults.reduce((sum, score) => sum + score, 0) / cpuResults.length : 0;
    const avgGpuScore = gpuResults.length > 0 ? 
        gpuResults.reduce((sum, score) => sum + score, 0) / gpuResults.length : 0;

    // CPU나 GPU 중 하나라도 비어있으면 totalScore를 0으로 설정
    const totalScore = (!specs.cpus.length || !specs.gpus.length) ? 0 :
        (avgCpuScore * 0.3) + (avgGpuScore * 0.5) + (ramScore * 0.2);

    return {
        avgCpuScore: isNaN(avgCpuScore) ? 0 : avgCpuScore,
        avgGpuScore: isNaN(avgGpuScore) ? 0 : avgGpuScore,
        totalScore: isNaN(totalScore) ? 0 : Math.round(totalScore * 100) / 100
    };
};

const calculateRamScore = async (targetGB) => {
    try {
        if (!hardwareCache.ram) {
            await hardwareMatcher.initializeCache();
        }

        // RAM 용량에 맞는 항목들 찾기
        const matchingRAMs = hardwareCache.ram.filter(ram => {
            const ramName = ram.ramName.toLowerCase();
            return ramName.includes(`${targetGB}gb`) || ramName.includes(`${targetGB} gb`);
        });

        if (matchingRAMs.length === 0) {
            console.log(`${targetGB}GB RAM을 찾을 수 없습니다.`);
            return null;
        }

        // 평균 점수 계산
        const avgScore = matchingRAMs.reduce((sum, ram) => sum + ram.ramScore, 0) / matchingRAMs.length;
        
        console.log(`${targetGB}GB RAM 매칭 결과:`);
        console.log('매칭된 RAM 개수:', matchingRAMs.length);
        console.log('평균 점수:', avgScore);
        
        return avgScore;
    } catch (error) {
        console.error('RAM 점수 계산 중 오류:', error);
        return null;
    }
};

const createGameSpec = async (req, res) => {
    try {
        const { gameName, minSpecs, recommendedSpecs, highSpecs, ramGB } = req.body;

        // 매칭된 하드웨어 정보를 저장할 객체
        const matchedHardware = {
            minimum: { cpus: [], gpus: [] },
            recommended: { cpus: [], gpus: [] },
            maximum: { cpus: [], gpus: [] }
        };

        // RAM 점수 계산
        const avgRamScore = await calculateRamScore(ramGB);

        // 최소, 권장, 최고 사양 점수 계산
        const minScores = await calculateSpecScores(minSpecs, avgRamScore, matchedHardware.minimum);
        const recommendedScores = await calculateSpecScores(recommendedSpecs, avgRamScore, matchedHardware.recommended);
        const maxScores = await calculateSpecScores(highSpecs, avgRamScore, matchedHardware.maximum);

        // 이미 존재하는 게임 찾기
        let game = await db.Game.findOne({ where: { gameName } });

        // 게임 데이터 생성 또는 업데이트
        const gameData = {
            gameName,
            minimumCPUScore: minScores.avgCpuScore,
            minimumGPUScore: minScores.avgGpuScore,
            minimumRAMScore: avgRamScore,
            minimumTotalScore: minScores.totalScore,
            recommendedCPUScore: recommendedScores.avgCpuScore,
            recommendedGPUScore: recommendedScores.avgGpuScore,
            recommendedTotalScore: recommendedScores.totalScore,
            maximumCPUScore: maxScores.avgCpuScore,
            maximumGPUScore: maxScores.avgGpuScore,
            maximumTotalScore: maxScores.totalScore
        };

        if (game) {
            // 기존 게임 업데이트
            game = await game.update(gameData);
        } else {
            // 새 게임 생성
            game = await db.Game.create(gameData);
        }

        // 게임 데이터를 JSON 파일에도 저장
        saveGameData({
            ...gameData,
            matchedHardware: {
                minimum: {
                    cpus: matchedHardware.minimum.cpus.map(cpu => cpu.cpuName),
                    gpus: matchedHardware.minimum.gpus.map(gpu => gpu.gpuName),
                    ram: `${ramGB}GB`
                },
                recommended: {
                    cpus: matchedHardware.recommended.cpus.map(cpu => cpu.cpuName),
                    gpus: matchedHardware.recommended.gpus.map(gpu => gpu.gpuName),
                    ram: `${ramGB}GB`
                },
                maximum: {
                    cpus: matchedHardware.maximum.cpus.map(cpu => cpu.cpuName),
                    gpus: matchedHardware.maximum.gpus.map(gpu => gpu.gpuName),
                    ram: `${ramGB}GB`
                }
            }
        });

        // 응답 전송
        res.status(201).json({
            success: true,
            game: {
                gameId: game.gameId,
                gameName: game.gameName,
                minimumCPUScore: game.minimumCPUScore,
                minimumGPUScore: game.minimumGPUScore,
                minimumRAMScore: game.minimumRAMScore,
                minimumTotalScore: game.minimumTotalScore,
                recommendedCPUScore: game.recommendedCPUScore,
                recommendedGPUScore: game.recommendedGPUScore,
                recommendedTotalScore: game.recommendedTotalScore,
                maximumCPUScore: game.maximumCPUScore,
                maximumGPUScore: game.maximumGPUScore,
                maximumTotalScore: game.maximumTotalScore,
                matchedHardware: {
                    minimum: {
                        cpus: matchedHardware.minimum.cpus.map(cpu => cpu.cpuName),
                        gpus: matchedHardware.minimum.gpus.map(gpu => gpu.gpuName),
                        ram: `${ramGB}GB`
                    },
                    recommended: {
                        cpus: matchedHardware.recommended.cpus.map(cpu => cpu.cpuName),
                        gpus: matchedHardware.recommended.gpus.map(gpu => gpu.gpuName),
                        ram: `${ramGB}GB`
                    },
                    maximum: {
                        cpus: matchedHardware.maximum.cpus.map(cpu => cpu.cpuName),
                        gpus: matchedHardware.maximum.gpus.map(gpu => gpu.gpuName),
                        ram: `${ramGB}GB`
                    }
                },
                createdAt: game.createdAt,
                updatedAt: game.updatedAt
            }
        });

    } catch (error) {
        console.error('게임 사양 처리 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '게임 사양 처리 중 오류가 발생했습니다.'
        });
    }
};

// 함수들을 export
module.exports = {
    createGameSpec,
    calculateSpecScores,
    calculateRamScore
}; 
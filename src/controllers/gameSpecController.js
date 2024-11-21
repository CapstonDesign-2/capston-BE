const db = require('../index');
const { gameSpecNameMatching } = require('./nameMatchController');
const { calculateGameSpecScores, calculateGameSpecRamScore } = require('./scoreController');
const { Op } = require('sequelize');
const { saveGameData } = require('../utils/gameData');

const calculateSpecScores = async (specs, ramGB, matchedHardware) => {
    const cpuResults = [];
    const gpuResults = [];

    // CPU와 GPU 동시에 매칭
    for (let i = 0; i < Math.max(specs.cpus.length, specs.gpus.length); i++) {
        if (!specs.cpus[i] && !specs.gpus[i]) continue;

        const result = await gameSpecNameMatching({
            cpu: specs.cpus[i] || undefined,
            gpu: specs.gpus[i] || undefined
        });
        
        // CPU 결과 처리
        if (specs.cpus[i] && result.hardware.cpu) {
            cpuResults.push(result.hardware.cpu.cpuScore);
            matchedHardware.cpus.push(result.hardware.cpu);
        }

        // GPU 결과 처리
        if (specs.gpus[i] && result.hardware.gpu) {
            gpuResults.push(result.hardware.gpu.gpuScore);
            matchedHardware.gpus.push(result.hardware.gpu);
        }
    }

    // 평균 점수 계산
    const avgCpuScore = cpuResults.length > 0 ? 
        cpuResults.reduce((sum, score) => sum + score, 0) / cpuResults.length : 0;
    const avgGpuScore = gpuResults.length > 0 ? 
        gpuResults.reduce((sum, score) => sum + score, 0) / gpuResults.length : 0;

    // RAM 점수 계산 (기존 calculateGameSpecRamScore 함수 사용)
    const ramScore = calculateGameSpecRamScore(ramGB);

    // 최종 점수 계산 (기존 calculateGameSpecScores 함수 사용)
    const totalScore = (!specs.cpus.length || !specs.gpus.length) ? 0 :
        await calculateGameSpecScores(avgCpuScore, avgGpuScore, ramScore);

    return {
        avgCpuScore: isNaN(avgCpuScore) ? 0 : avgCpuScore,
        avgGpuScore: isNaN(avgGpuScore) ? 0 : avgGpuScore,
        ramScore: ramScore,
        totalScore: isNaN(totalScore) ? 0 : totalScore
    };
};

const createGameSpec = async (req, res) => {
    try {
        const { gameName, gameThumbnail, minSpecs, recommendedSpecs, highSpecs } = req.body;

        const matchedHardware = {
            minimum: { cpus: [], gpus: [] },
            recommended: { cpus: [], gpus: [] },
            maximum: { cpus: [], gpus: [] }
        };

        // 각 사양별 점수 계산
        const minScores = await calculateSpecScores(minSpecs, minSpecs.ramGB, matchedHardware.minimum);
        const recommendedScores = await calculateSpecScores(recommendedSpecs, recommendedSpecs.ramGB, matchedHardware.recommended);
        const maxScores = highSpecs.cpus.length || highSpecs.gpus.length ? 
            await calculateSpecScores(highSpecs, highSpecs.ramGB, matchedHardware.maximum) :
            { avgCpuScore: 0, avgGpuScore: 0, ramScore: 0, totalScore: 0 };

        // 이미 존재하는 게임 찾기
        let game = await db.Game.findOne({ where: { gameName } });

        // 게임 데이터 생성 또는 업데이트
        const gameData = {
            gameName,
            gameThumbnail,
            minimumCPUScore: minScores.avgCpuScore,
            minimumGPUScore: minScores.avgGpuScore,
            minimumRAMScore: minScores.ramScore,
            minimumTotalScore: minScores.totalScore,
            recommendedCPUScore: recommendedScores.avgCpuScore,
            recommendedGPUScore: recommendedScores.avgGpuScore,
            recommendedRAMScore: recommendedScores.ramScore,
            recommendedTotalScore: recommendedScores.totalScore,
            maximumCPUScore: maxScores.avgCpuScore,
            maximumGPUScore: maxScores.avgGpuScore,
            maximumRAMScore: maxScores.ramScore,
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
                    ram: `${minSpecs.ramGB}GB`
                },
                recommended: {
                    cpus: matchedHardware.recommended.cpus.map(cpu => cpu.cpuName),
                    gpus: matchedHardware.recommended.gpus.map(gpu => gpu.gpuName),
                    ram: `${recommendedSpecs.ramGB}GB`
                },
                maximum: {
                    cpus: matchedHardware.maximum.cpus.map(cpu => cpu.cpuName),
                    gpus: matchedHardware.maximum.gpus.map(gpu => gpu.gpuName),
                    ram: `${highSpecs.ramGB}GB`
                }
            }
        });

        // 응답 전송
        res.status(201).json({
            success: true,
            game: {
                gameId: game.gameId,
                gameName: game.gameName,
                gameThumbnail: game.gameThumbnail,
                minimumCPUScore: game.minimumCPUScore,
                minimumGPUScore: game.minimumGPUScore,
                minimumRAMScore: game.minimumRAMScore,
                minimumTotalScore: game.minimumTotalScore,
                recommendedCPUScore: game.recommendedCPUScore,
                recommendedGPUScore: game.recommendedGPUScore,
                recommendedRAMScore: game.recommendedRAMScore,
                recommendedTotalScore: game.recommendedTotalScore,
                maximumCPUScore: game.maximumCPUScore,
                maximumGPUScore: game.maximumGPUScore,
                maximumRAMScore: game.maximumRAMScore,
                maximumTotalScore: game.maximumTotalScore,
                matchedHardware: {
                    minimum: {
                        cpus: matchedHardware.minimum.cpus.map(cpu => cpu.cpuName),
                        gpus: matchedHardware.minimum.gpus.map(gpu => gpu.gpuName),
                        ram: `${minSpecs.ramGB}GB`
                    },
                    recommended: {
                        cpus: matchedHardware.recommended.cpus.map(cpu => cpu.cpuName),
                        gpus: matchedHardware.recommended.gpus.map(gpu => gpu.gpuName),
                        ram: `${recommendedSpecs.ramGB}GB`
                    },
                    maximum: {
                        cpus: matchedHardware.maximum.cpus.map(cpu => cpu.cpuName),
                        gpus: matchedHardware.maximum.gpus.map(gpu => gpu.gpuName),
                        ram: `${highSpecs.ramGB}GB`
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
    calculateSpecScores
}; 
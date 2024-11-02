const { CPU, GPU, RAM } = require('../index');
const { Op } = require('sequelize');

const matchHardwareNames = async (hardwareData) => {
    try {
        // CPU 매칭
        const cpu = await findMostSimilarCPU(hardwareData.cpu);

        // GPU 매칭
        const gpu = await findMostSimilarGPU(hardwareData.gpu);

        // RAM 매칭
        const ram = await findMostSimilarRAM(hardwareData.ram);

        // 각 하드웨어별 매칭 결과 출력
        console.log('\n=== CPU 매칭 결과 ===');
        console.log('원본 데이터:', hardwareData.cpu);
        console.log('정제된 데이터:', cpu ? cpu.cleanedInput : 'N/A');
        console.log('최고 유사도:', cpu ? cpu.similarity : 'N/A');
        console.log('선택된 CPU:', cpu ? cpu.cpuName : 'NULL');

        console.log('\n=== GPU 매칭 결과 ===');
        console.log('원본 데이터:', hardwareData.gpu);
        console.log('정제된 데이터:', gpu ? gpu.cleanedInput : 'N/A');
        console.log('최고 유사도:', gpu ? gpu.similarity : 'N/A');
        console.log('선택된 GPU:', gpu ? gpu.gpuName : 'NULL');

        console.log('\n=== RAM 매칭 결과 ===');
        console.log('원본 데이터:', hardwareData.ram);
        console.log('정제된 데이터:', ram ? ram.cleanedInput : 'N/A');
        console.log('최고 유사도:', ram ? ram.similarity : 'N/A');
        console.log('선택된 RAM:', ram ? ram.ramName : 'NULL');

        console.log('\n========== 최종 하드웨어 매칭 결과 ==========');
        console.log('CPU 매칭 결과:');
        console.log('- 최고 유사도:', cpu ? cpu.similarity : 'N/A');
        console.log('- 선택된 CPU:', cpu ? cpu.cpuName : 'none');
        
        console.log('\nGPU 매칭 결과:');
        console.log('- 최고 유사도:', gpu ? gpu.similarity : 'N/A');
        console.log('- 선택된 GPU:', gpu ? gpu.gpuName : 'none');
        
        console.log('\nRAM 매칭 결과:');
        console.log('- 최고 유사도:', ram ? ram.similarity : 'N/A');
        console.log('- 선택된 RAM:', ram ? ram.ramName : 'none');
        console.log('==========================================\n');

        if (!cpu || !gpu || !ram) {
            return {
                success: false,
                message: '일치하는 하드웨어를 찾을 수 없습니다.',
                notFound: {
                    cpu: !cpu,
                    gpu: !gpu,
                    ram: !ram
                },
                found: {
                    cpu: cpu ? {
                        name: cpu.cpuName,
                        score: cpu.cpuScore,
                        similarity: cpu.similarity
                    } : null,
                    gpu: gpu ? {
                        name: gpu.gpuName,
                        score: gpu.gpuScore,
                        similarity: gpu.similarity
                    } : null,
                    ram: ram ? {
                        name: ram.ramName,
                        score: ram.ramScore,
                        similarity: ram.similarity
                    } : null
                }
            };
        }

        return {
            success: true,
            hardware: { 
                cpu: {
                    name: cpu.cpuName,
                    score: cpu.cpuScore
                }, 
                gpu: {
                    name: gpu.gpuName,
                    score: gpu.gpuScore
                }, 
                ram: {
                    name: ram.ramName,
                    score: ram.ramScore
                } 
            }
        };
    } catch (error) {
        console.error('하드웨어 매칭 중 오류:', error);
        throw error;
    }
};

const findMostSimilarCPU = async (cpuName) => {
    try {
        const cleanedInput = cpuName
            .replace(/Intel.*?(?=i\d)/i, 'Intel ')
            .replace(/[®™()@\s]/g, ' ')
            .replace(/CPU/i, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        
        // 입력값을 단어로 분리
        const inputWords = cleanedInput.split(' ');
        
        console.log('\n=== CPU 입력 ===');
        console.log('원본 CPU 입력:', cpuName);
        console.log('정제된 CPU 입력:', cleanedInput);
        console.log('분리된 단어:', inputWords);
        
        const allCPUs = await CPU.findAll();
        let bestMatch = null;
        let highestSimilarity = 0;
        
        for (const cpu of allCPUs) {
            const cleanedCPU = cpu.cpuName
                .replace(/Intel.*?(?=i\d)/i, 'Intel ')
                .replace(/[®™()@\s]/g, ' ')
                .replace(/CPU/i, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
            
            // DB의 CPU 이름을 단어로 분리
            const cpuWords = cleanedCPU.split(' ');
            
            // 공통 단어 수 계산
            const commonWords = inputWords.filter(word => cpuWords.includes(word));
            // 유사도 = 공통 단어 수 / 더 긴 배열의 길이
            const similarity = commonWords.length / Math.max(inputWords.length, cpuWords.length);
            
            console.log('\n비교 대상 CPU:', cpu.cpuName);
            console.log('정제된 비교 CPU:', cleanedCPU);
            console.log('분리된 단어:', cpuWords);
            console.log('공통 단어:', commonWords);
            console.log('유사도:', similarity);
            
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = {
                    ...cpu.dataValues,
                    similarity: similarity
                };
            }
        }
        
        console.log('\n=== CPU 매칭 결과 ===');
        console.log('최고 유사도:', highestSimilarity);
        console.log('선택된 CPU:', bestMatch ? bestMatch.cpuName : 'none');
        
        if (bestMatch) {
            bestMatch = {
                ...bestMatch,
                cleanedInput: cleanedInput,
                similarity: highestSimilarity
            };
        }

        return bestMatch;
    } catch (error) {
        console.error('CPU 검색 중 오류:', error);
        return null;
    }
};

const findMostSimilarGPU = async (gpuName) => {
    try {
        const cleanedInput = gpuName
            .replace(/NVIDIA\s*/i, '')
            .replace(/AMD\s*/i, '')
            .replace(/[®™()@\s]/g, '')
            .toLowerCase();
        
        console.log('원본 GPU 입력:', gpuName);
        console.log('정제된 GPU 입력:', cleanedInput);
        
        // 모든 GPU 데이터 가져오기
        const allGPUs = await GPU.findAll();
        
        let bestMatch = null;
        let highestSimilarity = 0;
        
        for (const gpu of allGPUs) {
            const cleanedGPU = gpu.gpuName
                .replace(/[®™()@\s]/g, '')
                .toLowerCase();
            
            console.log('비교 대상 GPU:', cleanedGPU);
            
            // 문자열 유사도 계산
            let similarity = 0;
            const minLength = Math.min(cleanedInput.length, cleanedGPU.length);
            
            for (let i = 0; i < minLength; i++) {
                if (cleanedInput[i] === cleanedGPU[i]) {
                    similarity++;
                }
            }
            
            similarity = similarity / Math.max(cleanedInput.length, cleanedGPU.length);
            console.log('유사도:', similarity);
            
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = {
                    ...gpu.dataValues,
                    similarity: similarity
                };
            }
        }
        
        console.log('\n=== GPU 매칭 결과 ===');
        console.log('최고 유사도:', highestSimilarity);
        console.log('선택된 GPU:', bestMatch ? bestMatch.gpuName : 'none');
        
        if (bestMatch) {
            bestMatch = {
                ...bestMatch,
                cleanedInput: cleanedInput,
                similarity: highestSimilarity
            };
        }

        return highestSimilarity > 0.5 ? bestMatch : null;
    } catch (error) {
        console.error('GPU 검색 중 오류:', error);
        return null;
    }
};

const findMostSimilarRAM = async (ramName) => {
    try {
        // 입력값을 공백으로 분리
        const inputParts = ramName.split(' ');
        
        const allRAMs = await RAM.findAll();
        
        for (const ram of allRAMs) {
            const dbRAMParts = ram.ramName.split(' ');
            
            // 입력값의 모든 부분이 DB의 RAM 이름에 포함되어 있는지 확인
            const allPartsFound = inputParts.every(part => 
                dbRAMParts.some(dbPart => dbPart.includes(part))
            );
            
            if (allPartsFound) {
                return {
                    ...ram.dataValues,
                    similarity: 1.0
                };
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('RAM 검색 중 오류:', error);
        return null;
    }
};

module.exports = {
    matchHardwareNames
}; 
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// CSV 데이터 로드 함수
async function loadCSVData(filename) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, '../../data/', filename))
            .on('error', (error) => {
                console.error(`Error reading file ${filename}:`, error);
                reject(error);
            })
            .pipe(csv())
            .on('data', (data) => {
                if (data && Object.keys(data).length > 0) {
                    results.push(data);
                }
            })
            .on('end', () => {
                console.log(`Loaded ${results.length} records from ${filename}`);
                resolve(results);
            })
            .on('error', (error) => {
                console.error(`Error parsing CSV ${filename}:`, error);
                reject(error);
            });
    });
}

// 데이터 캐싱
let cpuData = null;
let gpuData = null;
let ramData = null;

// 데이 초기 로드
async function initializeData() {
    try {
        cpuData = await loadCSVData('cpu_data_sorted.csv');
        gpuData = await loadCSVData('gpu_data_sorted.csv');
        ramData = await loadCSVData('ram_data_sorted.csv');
        
        // 데이터 로드 확인을 위한 로그 추가
        console.log('Loaded CPU data count:', cpuData?.length);
        console.log('Sample CPU data:', cpuData?.[0]);
        console.log('Loaded GPU data count:', gpuData?.length);
        console.log('Sample GPU data:', gpuData?.[0]);
        console.log('Loaded RAM data count:', ramData?.length);
        console.log('Sample RAM data:', ramData?.[0]);
    } catch (error) {
        console.error('데이터 로드 중 오류:', error);
        throw error;
    }
}

// 초기 데이터 로드 실행
initializeData();

function findBestMatch(inputName, databaseNames, threshold = 0.65) {
    // 입력값 검증 추가
    if (!inputName || !databaseNames || !Array.isArray(databaseNames)) {
        console.error('Invalid input:', { inputName, databaseNames });
        return null;
    }

    // 빈 배열 체크
    if (databaseNames.length === 0) {
        console.error('Database names array is empty');
        return null;
    }

    // undefined나 null 값 필터링
    databaseNames = databaseNames.filter(name => name != null);

    // 입력값 전처리
    inputName = preprocessString(inputName);
    
    let bestMatch = null;
    let highestScore = 0;

    for (const dbName of databaseNames) {
        // null 체크 추가
        if (!dbName) continue;
        
        const dbNameClean = preprocessString(dbName);
        
        // 1. 정확히 포함되는지 먼저 확인
        if (inputName.includes(dbNameClean) || dbNameClean.includes(inputName)) {
            return { name: dbName, score: 1 }; // 완벽한 매치 발견
        }
        
        // 2. 토큰 기반 유사도 계산
        const tokenScore = calculateTokenSimilarity(inputName, dbNameClean);
        
        // 3. 전체 문자열 유사도 계산
        const stringScore = stringSimilarity.compareTwoStrings(inputName, dbNameClean);
        
        // 두 점수 중 높은 것 선택
        const finalScore = Math.max(tokenScore, stringScore);
        
        if (finalScore > highestScore) {
            highestScore = finalScore;
            bestMatch = dbName;
        }
    }
    
    return highestScore >= threshold ? { name: bestMatch, score: highestScore } : null;
}

function preprocessString(str) {
    return str
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[^\w\s-]/g, '');
}

function calculateTokenSimilarity(str1, str2) {
    const tokens1 = str1.split(' ');
    const tokens2 = str2.split(' ');
    
    let matchCount = 0;
    
    for (const token1 of tokens1) {
        for (const token2 of tokens2) {
            if (token1 === token2 || 
                stringSimilarity.compareTwoStrings(token1, token2) > 0.8) {
                matchCount++;
                break;
            }
        }
    }
    
    return matchCount / Math.max(tokens1.length, tokens2.length);
}

async function matchHardwareNames(hardwareData) {
    // 데이터가 로드되지 않았다면 로드
    if (!cpuData || !gpuData || !ramData) {
        await initializeData();
    }

    // 데이터 로드 확인
    if (!cpuData || !gpuData || !ramData) {
        console.error('하드웨어 데이터 로드 실패:', { 
            cpuData: !!cpuData, 
            gpuData: !!gpuData, 
            ramData: !!ramData 
        });
        throw new Error('하드웨어 데이터를 로드할 수 없습니다.');
    }

    console.log('CPU Data length:', cpuData.length);
    console.log('GPU Data length:', gpuData.length);
    console.log('RAM Data length:', ramData.length);

    const result = {
        success: true,
        hardware: {},
        message: '',
        notFound: []
    };

    // CPU 칭
    console.log('Matching CPU:', hardwareData.cpu);
    const cpuNames = cpuData
        .filter(cpu => cpu && cpu.CPUName) // null 체크 추가
        .map(cpu => cpu.CPUName);
    
    console.log('사용 가능한 CPU 이름 수:', cpuNames.length);
    console.log('첫 번째 CPU 이름:', cpuNames[0]);

    const cpuMatch = findBestMatch(
        hardwareData.cpu,
        cpuNames,
        0.7
    );

    if (cpuMatch) {
        const cpuInfo = cpuData.find(cpu => cpu.CPUName === cpuMatch.name);
        result.hardware.cpu = {
            cpuName: cpuMatch.name,
            cpuScore: parseFloat(cpuInfo.CPUScore)
        };
    } else {
        result.notFound.push('cpu');
    }

    // GPU 매칭
    const gpuMatch = findBestMatch(
        hardwareData.gpu,
        gpuData.map(gpu => gpu.GPUName),
        0.65
    );

    if (gpuMatch) {
        const gpuInfo = gpuData.find(gpu => gpu.GPUName === gpuMatch.name);
        result.hardware.gpu = {
            gpuName: gpuMatch.name,
            gpuScore: parseFloat(gpuInfo.GPUScore)
        };
    } else {
        result.notFound.push('gpu');
    }

    // RAM 매칭 부분 수정
    const ramMatch = async (ramString) => {
        // RAM 이름 목록 추출
        const ramNames = ramData
            .filter(ram => ram && ram.ramName)
            .map(ram => ram.ramName);

        const ramParts = ramString.split(',').map(part => part.trim());
        let baseScore = 0;
        let matchedNames = [];

        // 각 RAM의 용량 추출
        let totalRamSize = 0;
        const ramSizes = [];
        for (const ramPart of ramParts) {
            const ramSize = extractRAMSize(ramPart);
            totalRamSize += ramSize;
            ramSizes.push(ramSize);
            
            const match = findBestMatch(
                ramPart,
                ramNames,
                0.6
            );

            if (match) {
                matchedNames.push(match.name);
            } else {
                matchedNames.push(ramPart);
            }
        }

        // 전체 RAM 용량에 대한 기본 점수 계산
        baseScore = calculateRAMScore(totalRamSize);

        // RAM 구성에 따른 효율성 계산 (패널티 강화)
        const calculateEfficiencyMultiplier = (sizes) => {
            if (sizes.length === 1) {
                return 0.7; // 30% 패널티
            }

            const isSymmetric = sizes.every(size => size === sizes[0]);
            const isEvenCount = sizes.length % 2 === 0;

            if (isSymmetric && isEvenCount) {
                return 1.0;
            } else if (isEvenCount) {
                return 0.85; // 15% 패널티
            } else {
                return 0.75; // 25% 패널티
            }
        };

        // RAM 개수에 따른 증가율 (매우 낮게 조정)
        const getMultiplierByCount = (count) => {
            switch(count) {
                case 1: return 1.0;
                case 2: return 1.03; // 3% 증가
                case 3: return 1.05; // 5% 증가
                case 4: return 1.07; // 7% 증가
                default: return 1.08; // 최대 8% 증가
            }
        };

        const countMultiplier = getMultiplierByCount(ramParts.length);
        const efficiencyMultiplier = calculateEfficiencyMultiplier(ramSizes);
        const totalScore = baseScore * countMultiplier * efficiencyMultiplier;

        // RAM 이름을 더 간단하게 표시
        const simplifyRamName = (ramParts) => {
            if (ramParts.length <= 1) return ramParts[0];
            const firstRam = ramParts[0];
            return `${firstRam} (${ramParts.length}x)`;
        };

        return {
            ramName: simplifyRamName(matchedNames),
            ramScore: totalScore
        };
    };

    if (hardwareData.ram) {
        console.log('Matching RAM:', hardwareData.ram);
        result.hardware.ram = await ramMatch(hardwareData.ram);
        console.log('RAM Match found:', result.hardware.ram);
    } else {
        result.notFound.push('ram');
    }

    // 결과 처리
    if (result.notFound.length > 0) {
        result.success = false;
        result.message = '일부 하드웨어를 찾을 수 없습니다.';
    }

    return result;
}

// RAM 용량 추출 함수 개선
function extractRAMSize(ramString) {
    // 여러 개의 RAM이 있는 경우 합산
    const matches = ramString.match(/(\d+)\s*GB/gi);
    if (!matches) return 8; // 기본값 8GB
    
    const totalSize = matches.reduce((sum, match) => {
        const size = parseInt(match);
        return sum + (isNaN(size) ? 0 : size);
    }, 0);
    
    return totalSize || 8; // 합산이 0이면 기본값 8GB 반환
}

// RAM 점수 계산 함수 개선
function calculateRAMScore(ramSize) {
    // 용량별 점수 계산을 더 낮은 비율로 조정
    const getScoreBySize = (size) => {
        if (size <= 8) return size * 800;           // 8GB = 6400점
        if (size <= 16) return 6400 + (size - 8) * 400;  // 16GB = 9600점
        if (size <= 32) return 9600 + (size - 16) * 200; // 32GB = 12800점
        return 12800 + (size - 32) * 100;          // 32GB 초과는 매우 낮은 증가율
    };

    return getScoreBySize(ramSize);
}

module.exports = {
    matchHardwareNames
};

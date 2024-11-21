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
        console.log('CPU Match found:', result.hardware.cpu);
    } else {
        result.notFound.push('cpu');
    }

    // GPU 매칭
    console.log('Matching GPU:', hardwareData.gpu);
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
        console.log('GPU Match found:', result.hardware.gpu);
    } else {
        result.notFound.push('gpu');
    }

    // RAM 매칭
    if (hardwareData.ram) {
        console.log('Matching RAM:', hardwareData.ram);
        
        // 콤마로 구분된 RAM 처리
        const ramParts = hardwareData.ram.split(',').map(part => part.trim());
        let totalRamScore = 0;
        let matchedRamNames = [];
        let ramCount = ramParts.length;

        for (const ramPart of ramParts) {
            const ramMatch = findBestMatch(
                ramPart,
                ramData.map(ram => ram.ramName),
                0.65
            );

            if (ramMatch) {
                const ramInfo = ramData.find(ram => ram.ramName === ramMatch.name);
                totalRamScore += parseFloat(ramInfo.ramScore);
                matchedRamNames.push(ramMatch.name);
            }
        }

        if (matchedRamNames.length > 0) {
            // 첫 번째 RAM의 기본 점수
            let baseRamScore = parseFloat(ramData.find(ram => ram.ramName === matchedRamNames[0]).ramScore);
            
            // RAM 개수에 따른 성능 증가율 계산
            let totalRamScore = baseRamScore;
            if (ramCount > 1) {
                // 2개: 80% 추가, 3개: 20% 추가, 4개: 10% 추가
                const performanceMultipliers = [1, 1.6, 1.8, 1.85];  // 인덱스가 (RAM 개수 - 1)
                totalRamScore = baseRamScore * performanceMultipliers[Math.min(ramCount - 1, 3)];
            }

            result.hardware.ram = {
                ramName: `${matchedRamNames[0]} x${ramCount}`,
                ramScore: Math.round(totalRamScore),
                ramCount: ramCount
            };
            console.log('RAM Match found:', result.hardware.ram);
        } else {
            result.notFound.push('ram');
        }
    }

    if (result.notFound.length > 0) {
        result.success = false;
        result.message = '일부 하드웨어를 찾을 수 없습니다.';
    }

    return result;
}


async function gameSpecNameMatching(hardwareData) {
    const result = {
        success: true,
        hardware: {
            cpu: null,
            gpu: null
        },
        notFound: []
    };

    // CPU 매칭
    if (hardwareData.cpu) {
        console.log('Matching CPU:', hardwareData.cpu);
        let matchedCPUs = [];
        const cpuInput = hardwareData.cpu.toLowerCase();

        // 시리즈만 있는 경우 체크
        const cpuSeriesPatterns = {
            'ryzen 3': /^(amd\s*)?ryzen\s*3$/i,
            'ryzen 5': /^(amd\s*)?ryzen\s*5$/i,
            'ryzen 7': /^(amd\s*)?ryzen\s*7$/i,
            'ryzen 9': /^(amd\s*)?ryzen\s*9$/i,
            'core i3': /^(intel\s*)?core\s*i3$/i,
            'core i5': /^(intel\s*)?core\s*i5$/i,
            'core i7': /^(intel\s*)?core\s*i7$/i,
            'core i9': /^(intel\s*)?core\s*i9$/i
        };

        let isSeriesOnly = false;
        let matchedSeries = '';

        // 시리즈만 있는지 확인
        for (const [series, pattern] of Object.entries(cpuSeriesPatterns)) {
            if (pattern.test(cpuInput)) {
                isSeriesOnly = true;
                matchedSeries = series;
                break;
            }
        }

        if (isSeriesOnly) {
            // 시리즈만 있는 경우 해당 시리즈의 모든 CPU 찾기
            matchedCPUs = cpuData.filter(cpu => 
                cpu.CPUName.toLowerCase().includes(matchedSeries.toLowerCase())
            );
        } else {
            // 정확한 모델명이 있는 경우
            const cpuMatch = findBestMatch(
                hardwareData.cpu,
                cpuData.map(cpu => cpu.CPUName),
                0.7
            );

            if (cpuMatch) {
                matchedCPUs = [cpuData.find(cpu => cpu.CPUName === cpuMatch.name)];
            }
        }

        if (matchedCPUs.length > 0) {
            const score = matchedCPUs.length > 1 ? 
                calculateTrimmedMean(matchedCPUs, 'CPUScore') : 
                parseFloat(matchedCPUs[0].CPUScore);

            result.hardware.cpu = {
                cpuName: hardwareData.cpu,
                cpuScore: score
            };
        } else {
            result.notFound.push('cpu');
        }
    }

    // GPU 매칭 (CPU와 유사한 로직)
    if (hardwareData.gpu) {
        console.log('Matching GPU:', hardwareData.gpu);
        let matchedGPUs = [];
        const gpuInput = hardwareData.gpu.toLowerCase();

        // 시리즈만 있는 경우 체크
        const gpuSeriesPatterns = {
            'gtx': /^nvidia\s*geforce\s*gtx$/i,
            'rtx': /^nvidia\s*geforce\s*rtx$/i,
            'rx': /^amd\s*radeon\s*rx$/i
        };

        let isSeriesOnly = false;
        let matchedSeries = '';

        for (const [series, pattern] of Object.entries(gpuSeriesPatterns)) {
            if (pattern.test(gpuInput)) {
                isSeriesOnly = true;
                matchedSeries = series;
                break;
            }
        }

        if (isSeriesOnly) {
            matchedGPUs = gpuData.filter(gpu => 
                gpu.GPUName.toLowerCase().includes(matchedSeries.toLowerCase())
            );
        } else {
            const gpuMatch = findBestMatch(
                hardwareData.gpu,
                gpuData.map(gpu => gpu.GPUName),
                0.65
            );

            if (gpuMatch) {
                matchedGPUs = [gpuData.find(gpu => gpu.GPUName === gpuMatch.name)];
            }
        }

        if (matchedGPUs.length > 0) {
            const score = matchedGPUs.length > 1 ? 
                calculateTrimmedMean(matchedGPUs, 'GPUScore') : 
                parseFloat(matchedGPUs[0].GPUScore);

            result.hardware.gpu = {
                gpuName: hardwareData.gpu,
                gpuScore: score
            };
        } else {
            result.notFound.push('gpu');
        }
    }

    if (result.notFound.length > 0) {
        result.success = false;
        result.message = '일부 하드웨어를 찾을 수 없습니다.';
    }

    return result;
}

// 중간 50% 값들의 평균을 계산하는 함수 추가
function calculateTrimmedMean(items, scoreKey) {
    if (!items || items.length === 0) return 0;
    
    // 점수를 기준으로 정렬
    const sortedItems = [...items].sort((a, b) => parseFloat(a[scoreKey]) - parseFloat(b[scoreKey]));
    
    // 25% 위치 계산
    const quarterLength = Math.floor(sortedItems.length / 4);
    
    // 상위 25%와 하위 25%를 제외한 중간 50% 항목들 추출
    const middleItems = sortedItems.slice(quarterLength, sortedItems.length - quarterLength);
    
    // 중간 50%의 평균 계산
    if (middleItems.length === 0) {
        return parseFloat(sortedItems[0][scoreKey]); // 항목이 너무 적을 경우 전체 평균 반환
    }
    
    const sum = middleItems.reduce((acc, item) => acc + parseFloat(item[scoreKey]), 0);
    return sum / middleItems.length;
}

module.exports = {
    matchHardwareNames,
    gameSpecNameMatching,  // 새로운 함수 export
};

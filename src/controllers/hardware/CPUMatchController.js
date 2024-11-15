const MANUFACTURER_KEYWORDS = {
    intel: ['intel', 'core', 'pentium', 'celeron'],
    amd: ['amd', 'ryzen', 'athlon']
};

class CPUMatchController {
    constructor() {
        this.manufacturerKeywords = MANUFACTURER_KEYWORDS;
    }

    parseCPUName(name) {
        // Intel Core
        const intelMatch = name.match(/core\s+i([357])[-\s]*(\d)(\d{2,3})/i);
        if (intelMatch) {
            return {
                manufacturer: 'intel',
                series: `i${intelMatch[1]}`,
                generation: parseInt(intelMatch[2]),
                model: parseInt(intelMatch[3])
            };
        }

        // 새로운 일반 Intel Core 패턴 추가 (i3/i5/i7만 있는 경우)
        const intelGeneralMatch = name.match(/core\s+i([357])/i);
        if (intelGeneralMatch) {
            return {
                manufacturer: 'intel',
                series: `i${intelGeneralMatch[1]}`,
                isGeneral: true  // 일반적인 표현임을 표시
            };
        }

        // AMD Phenom 패턴 추가
        const phenomMatch = name.match(/phenom\s*(x\d)?\s*(\d{4})/i);
        if (phenomMatch) {
            return {
                manufacturer: 'amd',
                series: 'phenom',
                subfamily: phenomMatch[1]?.toLowerCase() || '',  // x3, x4 등
                model: parseInt(phenomMatch[2])
            };
        }

        // AMD Ryzen
        const ryzenMatch = name.match(/ryzen\s+([357])\s*(\d)(\d{3})/i);
        if (ryzenMatch) {
            const fullModel = parseInt(ryzenMatch[3]);  // 전체 모델 번호 (예: 500)
            return {
                manufacturer: 'amd',
                series: `ryzen ${ryzenMatch[1]}`,
                generation: parseInt(ryzenMatch[2]),     // 세대 (예: 3, 4, 5)
                modelBase: Math.floor(fullModel / 100),  // 기본 모델 (예: 5)
                modelVariant: fullModel % 100            // 변형 번호 (예: 00)
            };
        }

        // AMD A-Series
        const aSeriesMatch = name.match(/a(\d+)[-\s]*(\d{4})/i);
        if (aSeriesMatch) {
            return {
                manufacturer: 'amd',
                series: `a${aSeriesMatch[1]}`,
                model: parseInt(aSeriesMatch[2])
            };
        }

        // Intel Xeon 패턴 수정
        const xeonMatch = name.match(/xeon\s+w(\d+)-(\d{4,5})[xX]?/i);
        if (xeonMatch) {
            return {
                manufacturer: 'intel',
                series: 'xeon',
                generation: parseInt(xeonMatch[1]),
                model: parseInt(xeonMatch[2])
            };
        }

        return null;
    }

    calculateCPUMatchScore(target, item) {
        if (target.manufacturer !== item.manufacturer) return 0;

        // Ryzen 시리즈 매칭 로직 수정
        if (target.series?.includes('ryzen') && item.series?.includes('ryzen')) {
            if (target.series !== item.series) return 0;  // 다른 시리즈면 매칭하지 않음
            
            // 세대가 같으면 높은 점수
            if (target.generation === item.generation) {
                // 기본 모델이 같으면 (예: 3500과 3600은 다른 기본 모델)
                if (target.modelBase === item.modelBase) {
                    const variantDiff = Math.abs(target.modelVariant - item.modelVariant);
                    if (variantDiff === 0) return 1;      // 완전 일치
                    if (variantDiff <= 50) return 0.95;   // 매우 유사한 변형
                    return 0.9;                           // 같은 기본 모델의 다른 변형
                }
                
                // 기본 모델이 다르면 (예: 3500 vs 3600)
                const modelDiff = Math.abs(target.modelBase - item.modelBase);
                if (modelDiff === 1) return 0.8;    // 인접한 기본 모델
                if (modelDiff <= 2) return 0.7;     // 가까운 기본 모델
                return 0.6;                         // 같은 세대의 다른 모델
            }
            
            // 세대 차이가 있는 경우
            const genDiff = Math.abs(target.generation - item.generation);
            if (genDiff === 1) return 0.5;         // 1세대 차이
            return 0;                              // 2세대 이상 차이
        }

        // 일반 Intel Core (i3/i5/i7만 있는 경우)
        if (target.isGeneral && item.manufacturer === 'intel') {
            if (target.series === item.series) {
                return 0.8;  // 같은 시리즈면 기본 점수
            }
            return 0;
        }

        // AMD Phenom 매칭
        if (target.series === 'phenom' && item.series === 'phenom') {
            // subfamily(x3, x4)가 다르면 매칭하지 않음
            if (target.subfamily !== item.subfamily) return 0;
            
            // 모델 번호 차이로 점수 계산
            const modelDiff = Math.abs(target.model - item.model);
            if (modelDiff === 0) return 1;
            if (modelDiff <= 100) return 0.9;
            if (modelDiff <= 500) return 0.7;
            return 0;
        }

        // 기존 매칭 로직
        if (target.series === item.series) {
            if (target.generation === item.generation) {
                const modelDiff = Math.abs(target.model - item.model);
                if (modelDiff <= 50) return 1;
                if (modelDiff <= 100) return 0.9;
                return 0.8;
            }
            if (Math.abs(target.generation - item.generation) === 1) return 0.7;
            return 0;
        }

        return 0;
    }

    async findBestMatch(targetName, items) {
        if (!targetName || targetName === 'dummy') return null;
        
        const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetNorm = normalize(targetName);

        // Ryzen 구체적인 모델 매칭 (접미사 포함)
        const ryzenDetailMatch = targetNorm.match(/ryzen\s*([357])\s*(\d{4})(x|xt|g|ge|u)?/i);
        if (ryzenDetailMatch) {
            const series = ryzenDetailMatch[1];  // 5
            const fullModel = parseInt(ryzenDetailMatch[2]);  // 3500
            const suffix = ryzenDetailMatch[3]?.toLowerCase() || '';  // x, xt, g 등
            const generation = Math.floor(fullModel / 1000);  // 3 (3000번대)
            const performance = Math.floor((fullModel % 1000) / 100);  // 5 (500번대)

            console.log(`Detected Ryzen ${series} ${generation}000 series, performance tier ${performance}00, suffix: ${suffix}`);

            // 같은 세대와 같은 성능대의 CPU 찾기
            const matchingModels = items.filter(item => {
                const itemName = normalize(item.cpuName);
                const itemMatch = itemName.match(/ryzen\s*([357])\s*(\d{4})(x|xt|g|ge|u)?/i);
                if (!itemMatch) return false;
                
                const itemFullModel = parseInt(itemMatch[2]);
                const itemSuffix = itemMatch[3]?.toLowerCase() || '';
                const itemGeneration = Math.floor(itemFullModel / 1000);
                const itemPerformance = Math.floor((itemFullModel % 1000) / 100);
                
                return itemMatch[1] === series && 
                       itemGeneration === generation && 
                       itemPerformance === performance &&
                       suffix === itemSuffix;  // 접미사도 일치해야 함
            });

            if (matchingModels.length > 0) {
                console.log('Found matching CPU:', matchingModels[0].cpuName);
                return {
                    match: matchingModels[0],
                    similarity: 0.9
                };
            }

            // 접미사가 다른 경우에도 세대와 성능대가 같으면 매칭
            const similarModels = items.filter(item => {
                const itemName = normalize(item.cpuName);
                const itemMatch = itemName.match(/ryzen\s*([357])\s*(\d{4})(x|xt|g|ge|u)?/i);
                if (!itemMatch) return false;
                
                const itemFullModel = parseInt(itemMatch[2]);
                const itemGeneration = Math.floor(itemFullModel / 1000);
                const itemPerformance = Math.floor((itemFullModel % 1000) / 100);
                
                return itemMatch[1] === series && 
                       itemGeneration === generation && 
                       itemPerformance === performance;
            });

            if (similarModels.length > 0) {
                console.log('Found similar CPU (different suffix):', similarModels[0].cpuName);
                return {
                    match: similarModels[0],
                    similarity: 0.85  // 접미사가 다르면 약간 낮은 점수
                };
            }
        }

        // 일반적인 Ryzen 매칭은 구체적인 매칭이 실패한 경우에만 시도
        const ryzenGeneralMatch = targetNorm.match(/ryzen\s*([357])/i);
        if (ryzenGeneralMatch) {
            const series = ryzenGeneralMatch[1];
            console.log('Falling back to general Ryzen series match:', series);
            
            const seriesModels = items.filter(item => {
                const itemName = normalize(item.cpuName);
                return itemName.match(new RegExp(`ryzen\\s*${series}\\s*\\d`, 'i'));
            });

            if (seriesModels.length > 0) {
                // 성능 점수로 정렬
                const sortedModels = seriesModels.sort((a, b) => a.cpuScore - b.cpuScore);
                const middleIndex = Math.floor(sortedModels.length / 2);
                
                console.log('Found middle performance Ryzen:', sortedModels[middleIndex].cpuName);
                return { 
                    match: sortedModels[middleIndex], 
                    similarity: 0.9 
                };
            }
        }

        // Intel Core 일반 시리즈 체크
        const generalMatch = targetNorm.match(/(?:cpu|intel core)\s*i([357])/i);
        if (generalMatch) {
            const series = generalMatch[1];  // 3, 5, 7
            console.log('General CPU series match:', series);

            // 같은 시리즈의 모든 CPU 찾기
            const seriesModels = items.filter(item => {
                const itemName = normalize(item.cpuName);
                return itemName.includes(`core i${series}`);
            });

            if (seriesModels.length > 0) {
                // 성능 점수로 정렬
                const sortedModels = seriesModels.sort((a, b) => a.cpuScore - b.cpuScore);
                const middleIndex = Math.floor(sortedModels.length / 2);
                
                console.log('Found middle performance CPU:', sortedModels[middleIndex].cpuName);
                return { 
                    match: sortedModels[middleIndex], 
                    similarity: 0.9 
                };
            }
        }

        // 구체인 모델 매칭
        const targetInfo = this.parseCPUName(targetNorm);
        if (!targetInfo) return null;

        let bestMatch = null;
        let bestScore = 0;

        for (const item of items) {
            const itemInfo = this.parseCPUName(normalize(item.cpuName));
            if (!itemInfo) continue;

            if (targetInfo.manufacturer === itemInfo.manufacturer) {
                const score = this.calculateCPUMatchScore(targetInfo, itemInfo);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = item;
                }
            }
        }

        return bestMatch ? { match: bestMatch, similarity: bestScore } : null;
    }

    detectManufacturer(name) {
        const nameLower = name.toLowerCase();
        
        for (const [manufacturer, keywordList] of Object.entries(this.manufacturerKeywords)) {
            if (keywordList.some(keyword => nameLower.includes(keyword))) {
                return manufacturer;
            }
        }
        return null;
    }
}

module.exports = CPUMatchController;
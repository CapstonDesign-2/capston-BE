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
        const ryzenMatch = name.match(/ryzen\s+([357])\s*(\d{4})/i);
        if (ryzenMatch) {
            return {
                manufacturer: 'amd',
                series: `ryzen ${ryzenMatch[1]}`,
                generation: parseInt(ryzenMatch[2].charAt(0)),
                model: parseInt(ryzenMatch[2].slice(1))
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

        return null;
    }

    calculateCPUMatchScore(target, item) {
        if (target.manufacturer !== item.manufacturer) return 0;

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

        // AMD Ryzen 시리즈 일반 표현 크 (예: "AMD Ryzen 5")
        const ryzenGeneralMatch = targetNorm.match(/ryzen\s*([357])/i);
        if (ryzenGeneralMatch) {
            const series = ryzenGeneralMatch[1];  // 3, 5, 7
            console.log('General Ryzen series match:', series);

            // 같은 시리즈의 모든 CPU 찾기
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

        // 구체적인 모델 매칭
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
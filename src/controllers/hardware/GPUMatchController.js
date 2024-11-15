const HARDWARE_PATTERNS = {
    nvidia: /(?:nvidia\s+)?(?:geforce\s+)?((?:rtx|gtx|gt)?)\s*(\d{3,4})\s*(ti|super)?/i,
    amd: /(?:amd\s+)?(?:radeon\s+)?((?:rx|r[5-9]|hd))\s*(\d{3,4})|(?:amd\s+)?(r[5-9])\s*(\d{3,4})/i,
    intel: /intel\s*((?:hd|uhd|iris|arc))\s*(?:graphics\s*)?([a-z]?\d{3,4})?/i
};

const MANUFACTURER_KEYWORDS = {
    nvidia: ['geforce', 'rtx', 'gtx', 'gt', 'titan'],
    amd: ['radeon', 'rx', 'r5', 'r7', 'r9', 'hd'],
    intel: ['intel hd', 'hd graphics', 'intel graphics', 'hd', 'arc']
};

const AMD_GPU_SERIES = {
    'r5 200': /radeon\s+r5\s+2\d{2}x?/i,
    'r7 200': /radeon\s+r7\s+2\d{2}x?/i,
    'r9 200': /radeon\s+r9\s+2\d{2}x?/i,
};

class GPUMatchController {
    constructor() {
        this.patterns = HARDWARE_PATTERNS;
        this.manufacturerKeywords = MANUFACTURER_KEYWORDS;
        this.amdSeries = AMD_GPU_SERIES;

        this.amdRSeries = {
            'r5': { tier: 'entry', score: 1 },
            'r7': { tier: 'mid', score: 2 },
            'r9': { tier: 'high', score: 3 }
        };

        this.amdRXGenerations = {
            '5000': { architecture: 'RDNA 1', year: 2019 },
            '6000': { architecture: 'RDNA 2', year: 2020 },
            '7000': { architecture: 'RDNA 3', year: 2022 }
        };

        this.intelArcTiers = {
            '3': { tier: 'entry', score: 1 },
            '5': { tier: 'mid', score: 2 },
            '7': { tier: 'high', score: 3 }
        };
    }

    parseGPUName(name) {
        const normalized = name.toLowerCase();

        // NVIDIA GeForce
        const geforceMatch = normalized.match(/(?:nvidia\s+)?(?:geforce\s+)?((?:rtx|gtx|gt)?)\s*(\d{3,4})\s*(ti|super)?/i);
        if (geforceMatch || normalized.includes('geforce')) {
            const series = geforceMatch?.[1]?.toLowerCase() || '';  // rtx, gtx, gt
            const model = parseInt(geforceMatch?.[2]) || 0;
            
            // RTX 시리즈 (2000, 3000, 4000 세대)
            if (series === 'rtx') {
                const generation = Math.floor(model/1000) * 1000;
                const performanceTier = model % 100;
                return {
                    manufacturer: 'nvidia',
                    series: 'rtx',
                    generation: generation,
                    performanceTier: performanceTier,
                    model: model,
                    suffix: geforceMatch?.[3]?.toLowerCase() || ''
                };
            }
            
            // GTX 16xx 시리즈
            if (series === 'gtx' && model >= 1600) {
                const generation = Math.floor(model/100);
                const performanceTier = model % 100;
                return {
                    manufacturer: 'nvidia',
                    series: 'gtx16',
                    generation: generation,
                    performanceTier: performanceTier,
                    model: model,
                    suffix: geforceMatch?.[3]?.toLowerCase() || ''
                };
            }
            
            // GTX 10xx 이하 시리즈
            if (series === 'gtx' || !series) {
                const generation = Math.floor(model/100) * 100;
                const performanceTier = model % 100;
                return {
                    manufacturer: 'nvidia',
                    series: 'gtx',
                    generation: generation,
                    performanceTier: performanceTier,
                    model: model,
                    suffix: geforceMatch?.[3]?.toLowerCase() || ''
                };
            }
            
            // GT 시리즈
            if (series === 'gt') {
                const generation = Math.floor(model/1000) * 1000;
                const performanceTier = model % 1000;
                return {
                    manufacturer: 'nvidia',
                    series: 'gt',
                    generation: generation,
                    performanceTier: performanceTier,
                    model: model,
                    suffix: geforceMatch?.[3]?.toLowerCase() || ''
                };
            }
        }

        // AMD Radeon
        const amdMatch = normalized.match(/(?:amd\s+)?(?:radeon\s+)?((?:rx|r[5-9]))\s*(\d{3,4})/i);
        if (amdMatch) {
            const series = amdMatch[1].toLowerCase();  // rx 또는 r5/r7/r9
            const model = parseInt(amdMatch[2]);
            
            // RX 시리즈
            if (series === 'rx') {
                const generation = Math.floor(model/1000) * 1000;
                const performanceTier = model % 1000;
                return {
                    manufacturer: 'amd',
                    series: 'rx',
                    generation: generation,
                    performanceTier: performanceTier,
                    model: model
                };
            }
            
            // R5/R7/R9 시리즈
            if (series.startsWith('r')) {
                const generation = Math.floor(model/100);
                const performanceTier = model % 100;
                return {
                    manufacturer: 'amd',
                    series: series,
                    generation: generation,
                    performanceTier: performanceTier,
                    model: model
                };
            }
        }

        // Intel Arc
        const arcMatch = normalized.match(/(?:intel\s+)?arc\s*a(\d)(\d{2})/i);
        if (arcMatch) {
            const tier = parseInt(arcMatch[1]);
            const model = parseInt(arcMatch[2]);
            return {
                manufacturer: 'intel',
                series: 'arc',
                tier: tier,
                model: parseInt(arcMatch[1] + arcMatch[2])
            };
        }

        return null;
    }

    async findBestMatch(targetName, items) {
        if (!targetName || targetName === 'dummy') return null;
        
        const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetNorm = normalize(targetName);

        // AMD GPU (Radeon) 매칭
        if (targetNorm.includes('amd')) {
            // Ryzen 내장 그래픽 체크
            if (targetNorm.includes('ryzen')) {
                const exactMatch = items.find(item => {
                    const itemName = normalize(item.gpuName);
                    return itemName.startsWith('ryzen') && 
                           itemName.includes('radeon graphics');
                });
                
                if (exactMatch) {
                    return { match: exactMatch, similarity: 1.0 };
                }
            }

            // AMD를 Radeon으로 변환하여 매칭
            const radeonName = targetNorm.replace('amd', 'radeon');
            
            // Radeon R 시리즈 매칭 (X 접미사 포함)
            if (radeonName.includes('r9') || radeonName.includes('r7') || radeonName.includes('r5')) {
                const rMatch = radeonName.match(/r[579]\s*(\d{3})(?:\s*(x))?/i);
                if (rMatch) {
                    const model = rMatch[1];
                    const suffix = rMatch[2] ? rMatch[2].toLowerCase() : '';
                    
                    const exactMatch = items.find(item => {
                        const itemName = normalize(item.gpuName);
                        const itemMatch = itemName.match(/radeon\s*r[579]\s*(\d{3})(?:\s*(x))?/i);
                        if (!itemMatch) return false;
                        
                        return itemMatch[1] === model && 
                               (itemMatch[2]?.toLowerCase() || '') === suffix;
                    });
                    
                    if (exactMatch) {
                        return { match: exactMatch, similarity: 1.0 };
                    }
                }
            }

            // Radeon RX 시리즈 매칭 (XT, X 접미사 포함)
            if (radeonName.includes('rx')) {
                const rxMatch = radeonName.match(/rx\s*(\d{4})(?:\s*(xt|x))?/i);
                if (rxMatch) {
                    const model = rxMatch[1];
                    const suffix = rxMatch[2] ? rxMatch[2].toLowerCase() : '';
                    
                    const exactMatch = items.find(item => {
                        const itemName = normalize(item.gpuName);
                        const itemMatch = itemName.match(/radeon\s*rx\s*(\d{4})(?:\s*(xt|x))?/i);
                        if (!itemMatch) return false;
                        
                        return itemMatch[1] === model && 
                               (itemMatch[2]?.toLowerCase() || '') === suffix;
                    });
                    
                    if (exactMatch) {
                        return { match: exactMatch, similarity: 1.0 };
                    }
                }
            }
        }

        // 제조사 확인
        const targetManufacturer = this.detectManufacturer(targetNorm);
        if (!targetManufacturer) return null;

        // 같은 제조사의 GPU만 필터링
        const sameManufacturer = items.filter(item => 
            this.detectManufacturer(item.gpuName) === targetManufacturer
        );

        // GeForce 매칭
        if (targetManufacturer === 'nvidia' && targetNorm.includes('geforce')) {
            const match = targetNorm.match(/geforce\s*((?:rtx|gtx|gt)?)\s*(\d{3,4})/i);
            if (match) {
                const series = match[1]?.toLowerCase() || '';
                const modelNumber = parseInt(match[2]);
                
                // 시리즈 전체를 나타내는 경우 체크 (예: GTX 600)
                if (modelNumber % 100 === 0) {
                    console.log('Matching general GPU series:', modelNumber);
                    
                    // 같은 시리즈의 모든 GPU 찾기
                    const sameSeries = sameManufacturer.filter(item => {
                        const itemName = normalize(item.gpuName);
                        if (!itemName.includes('geforce')) return false;
                        
                        const itemMatch = itemName.match(/geforce\s*((?:rtx|gtx|gt)?)\s*(\d{3,4})/i);
                        if (!itemMatch) return false;
                        
                        const itemModel = parseInt(itemMatch[2]);
                        const itemGeneration = Math.floor(itemModel/100) * 100;
                        
                        return itemGeneration === modelNumber;
                    });

                    if (sameSeries.length > 0) {
                        // 성능 점수로 정렬하고 중간값 찾기
                        const sortedModels = sameSeries.sort((a, b) => a.gpuScore - b.gpuScore);
                        const middleIndex = Math.floor(sortedModels.length / 2);
                        
                        console.log('Found middle performance GPU:', sortedModels[middleIndex].gpuName);
                        return { 
                            match: sortedModels[middleIndex], 
                            similarity: 0.9 
                        };
                    }
                }

                // 기존 매칭 로직
                let generation;
                let performanceTier;
                
                if (!series || series === 'gtx') {
                    generation = Math.floor(modelNumber/100) * 100;
                    performanceTier = Math.floor((modelNumber % 100) / 10) * 10;
                }

                const sameSeries = sameManufacturer.filter(item => {
                    const itemName = normalize(item.gpuName);
                    if (!itemName.includes('geforce')) return false;
                    
                    const itemMatch = itemName.match(/geforce\s*((?:rtx|gtx|gt)?)\s*(\d{3,4})/i);
                    if (!itemMatch) return false;
                    
                    const itemModel = parseInt(itemMatch[2]);
                    let itemGeneration = Math.floor(itemModel/100) * 100;
                    let itemPerformanceTier = Math.floor((itemModel % 100) / 10) * 10;
                    
                    return generation === itemGeneration && 
                           Math.abs(performanceTier - itemPerformanceTier) <= 10;
                });

                if (sameSeries.length > 0) {
                    // 정확한 모델 매칭
                    const exactMatch = sameSeries.find(item => {
                        const itemName = normalize(item.gpuName);
                        const itemMatch = itemName.match(/geforce\s*((?:rtx|gtx|gt)?)\s*(\d{3,4})\s*(ti|se|super|m)?/i);
                        const itemModel = parseInt(itemMatch[2]);
                        const itemSuffix = itemMatch[3]?.toLowerCase() || '';
                        
                        const targetMatch = targetNorm.match(/geforce\s*((?:rtx|gtx|gt)?)\s*(\d{3,4})\s*(ti|se|super|m)?/i);
                        const targetSuffix = targetMatch[3]?.toLowerCase() || '';
                        
                        return itemModel === modelNumber && itemSuffix === targetSuffix;
                    });

                    if (exactMatch) {
                        return { match: exactMatch, similarity: 1.0 };
                    }
                }
            }
        }

        // Intel Arc 매칭
        if (targetManufacturer === 'intel' && targetNorm.includes('arc')) {
            const arcMatch = targetNorm.match(/arc\s*a(\d)(\d{2})/i);
            if (arcMatch) {
                const model = parseInt(arcMatch[1] + arcMatch[2]);
                const exactMatch = sameManufacturer.find(item => 
                    normalize(item.gpuName).includes('arc a' + model)
                );
                
                if (exactMatch) {
                    return { match: exactMatch, similarity: 1.0 };
                }
            }
        }

        // 정확한 매칭 실패시 같은 제조사 내에서만 비슷한 성능의 GPU 찾기
        if (sameManufacturer.length > 0) {
            // 중간 성능값 찾기
            const avgScore = sameManufacturer.reduce((sum, gpu) => sum + gpu.gpuScore, 0) / sameManufacturer.length;
            
            const sortedByScore = sameManufacturer.sort((a, b) => 
                Math.abs(a.gpuScore - avgScore) - Math.abs(b.gpuScore - avgScore)
            );
            
            return { 
                match: sortedByScore[0], 
                similarity: 0.8 
            };
        }

        return null;
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

    async findAMDSeriesMatch(targetName, items) {
        const nameLower = targetName.toLowerCase();
        
        const seriesMatch = nameLower.match(/r[579]\s*2\d{2}/i);
        if (!seriesMatch) return null;
        
        const series = seriesMatch[0].replace(/\s+/g, ' ').toLowerCase();
        const pattern = this.amdSeries[series];
        
        if (!pattern) return null;

        const seriesGPUs = items.filter(item => 
            pattern.test(item.gpuName.toLowerCase())
        );

        if (seriesGPUs.length === 0) return null;

        const avgScore = seriesGPUs.reduce((sum, gpu) => sum + gpu.gpuScore, 0) / seriesGPUs.length;

        return {
            match: {
                ...seriesGPUs[0],
                gpuName: `${series.toUpperCase()} Series (Average)`,
                gpuScore: avgScore,
                matchedGPUs: seriesGPUs.map(gpu => gpu.gpuName)
            },
            similarity: 1.0
        };
    }
}

module.exports = GPUMatchController; 
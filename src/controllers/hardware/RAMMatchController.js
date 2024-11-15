class RAMMatchController {
    constructor() {
        this.patterns = {
            ram: /(\d+)\s*gb/i,
            manufacturer: {
                corsair: /^cm[ktzvw]t?|^cmt/i,
                samsung: /^m[34][79][13][ab]/i,
                gskill: /^f[34]-/i,
                kingston: /^(khx|99|kvr)/i,
                crucial: /^(ct|bls)/i,
                hynix: /^hm[at]/i,
                adata: /^a[xd]/i,
                micron: /^mt/i
            },
            ddr: /ddr(\d)/i,
            speed: /(\d{3,4})/
        };
    }

    detectManufacturer(name) {
        const normName = name.toLowerCase();
        for (const [manufacturer, pattern] of Object.entries(this.patterns.manufacturer)) {
            if (pattern.test(normName)) return manufacturer;
        }
        return null;
    }

    detectCapacity(name) {
        const match = name.match(this.patterns.ram);
        if (!match) return null;
        return parseInt(match[1]);
    }

    detectSpeed(name) {
        const match = name.match(this.patterns.speed);
        if (!match) return null;
        return parseInt(match[1]);
    }

    async findExactMatch(targetName, items) {
        if (!targetName || targetName === 'dummy') return null;

        const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetNorm = normalize(targetName);
        
        const manufacturer = this.detectManufacturer(targetNorm);
        const capacity = this.detectCapacity(targetNorm);
        const speed = this.detectSpeed(targetNorm);

        console.log('RAM matching details:', {
            targetName: targetNorm,
            manufacturer,
            capacity,
            speed
        });

        // 정확한 매칭 시도
        const exactMatch = items.find(item => {
            const itemNorm = normalize(item.ramName);
            const itemManufacturer = this.detectManufacturer(itemNorm);
            const itemCapacity = this.detectCapacity(itemNorm);
            const itemSpeed = this.detectSpeed(itemNorm);

            return (
                manufacturer === itemManufacturer &&
                capacity === itemCapacity &&
                (speed === itemSpeed || !speed)  // 속도는 선택적 매칭
            );
        });

        if (exactMatch) {
            return { match: exactMatch, similarity: 1.0 };
        }

        // 정확한 매칭 실패시 용량만으로 매칭 (기존 로직)
        return this.findBestMatch(targetName, items);
    }

    // 기존 용량 기반 매칭 (게임스펙용)
    async findBestMatch(targetName, items) {
        if (!targetName || targetName === 'dummy') return null;

        const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetNorm = normalize(targetName);

        // RAM 용량 추출 (예: "8GB")
        const ramMatch = targetNorm.match(/(\d+)\s*gb/i);
        if (!ramMatch) return null;

        const targetSize = parseInt(ramMatch[1]);

        // 정확히 일치하는 RAM 찾기 (용량만으로 매칭)
        const exactMatch = items.find(item => {
            const itemSize = parseInt(item.ramSize);
            return itemSize === targetSize;
        });

        if (exactMatch) {
            return { match: exactMatch, similarity: 1.0 };
        }

        // 가장 가까운 상위 용량 찾기
        const closestMatch = items.reduce((closest, current) => {
            const currentSize = parseInt(current.ramSize);
            const closestSize = parseInt(closest?.ramSize || 0);

            if (currentSize >= targetSize && 
                (closestSize < targetSize || currentSize < closestSize)) {
                return current;
            }
            return closest;
        }, null);

        return closestMatch ? { match: closestMatch, similarity: 0.9 } : null;
    }
}

module.exports = RAMMatchController;
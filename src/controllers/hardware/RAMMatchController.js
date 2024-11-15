class RAMMatchController {
    constructor() {
        this.patterns = {
            ram: /(\d+)\s*gb/i
        };
    }

    async findBestMatch(targetName, items) {
        if (!targetName || targetName === 'dummy') return null;

        const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetNorm = normalize(targetName);

        // RAM 용량 추출 (예: "8GB")
        const ramMatch = targetNorm.match(/(\d+)\s*gb/i);
        if (!ramMatch) return null;

        const targetSize = parseInt(ramMatch[1]);

        // 정확히 일치하는 RAM 찾기
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
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const db = require('../../src');
const { CPU, GPU, RAM, BaseScore } = db;

async function importData() {
    const dataPath = path.join(__dirname, '../../data');

    return new Promise((resolve, reject) => {
        const cpuData = [];
        const gpuData = [];
        const ramData = [];
        let baseScores = {
            cpuBaseScore: 0,
            gpuBaseScore: 0,
            ramBaseScore: 0
        };
        let completedImports = 0;

        // CPU 데이터 임포트
        fs.createReadStream(path.join(dataPath, 'cpu_data_sorted.csv'))
            .pipe(csv())
            .on('data', (row) => {
                cpuData.push({
                    cpuName: row.CPUName,
                    cpuPrice: row.CPUPrice === 'NA' ? null : parseFloat(row.CPUPrice),
                    cpuScore: parseInt(row.CPUScore)
                });
            })
            .on('end', async () => {
                try {
                    await CPU.bulkCreate(cpuData);
                    const top20PercentCount = Math.ceil(cpuData.length * 0.2);
                    baseScores.cpuBaseScore = cpuData
                        .slice(0, top20PercentCount)
                        .reduce((sum, cpu) => sum + cpu.cpuScore, 0) / top20PercentCount;
                    
                    console.log('CPU 데이터 임포트 완료');
                    completedImports++;
                    if (completedImports === 3) {
                        // 모든 임포트가 완료된 후 BaseScore 저장
                        await BaseScore.create(baseScores);
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', reject);

        // GPU 데이터 임포트
        fs.createReadStream(path.join(dataPath, 'gpu_data_sorted.csv'))
            .pipe(csv())
            .on('data', (row) => {
                gpuData.push({
                    gpuName: row.GPUName,
                    gpuPrice: row.GPUPrice === 'NA' ? null : parseFloat(row.GPUPrice),
                    gpuScore: parseInt(row.GPUScore)
                });
            })
            .on('end', async () => {
                try {
                    await GPU.bulkCreate(gpuData);
                    const top20PercentCount = Math.ceil(gpuData.length * 0.2);
                    baseScores.gpuBaseScore = gpuData
                        .slice(0, top20PercentCount)
                        .reduce((sum, gpu) => sum + gpu.gpuScore, 0) / top20PercentCount;
                    
                    console.log('GPU 데이터 임포트 완료');
                    completedImports++;
                    if (completedImports === 3) {
                        await BaseScore.create(baseScores);
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', reject);

        // RAM 데이터 임포트
        fs.createReadStream(path.join(dataPath, 'ram_data_sorted.csv'))
            .pipe(csv())
            .on('data', (row) => {
                ramData.push({
                    ramName: row.ramName,
                    ramPrice: row.ramPrice === 'NA' ? null : parseFloat(row.ramPrice),
                    ramScore: parseInt(row.ramScore)
                });
            })
            .on('end', async () => {
                try {
                    await RAM.bulkCreate(ramData);
                    const top20PercentCount = Math.ceil(ramData.length * 0.2);
                    baseScores.ramBaseScore = ramData
                        .slice(0, top20PercentCount)
                        .reduce((sum, ram) => sum + ram.ramScore, 0) / top20PercentCount;
                    
                    console.log('RAM 데이터 임포트 완료');
                    completedImports++;
                    if (completedImports === 3) {
                        await BaseScore.create(baseScores);
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', reject);
    });
}

module.exports = importData;
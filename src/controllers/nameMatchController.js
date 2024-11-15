const CPUMatchController = require('./hardware/CPUMatchController');
const GPUMatchController = require('./hardware/GPUMatchController');
const RAMMatchController = require('./hardware/RAMMatchController');
const db = require('../index');

class HardwareMatcher {
    constructor() {
        this.cpuMatcher = new CPUMatchController();
        this.gpuMatcher = new GPUMatchController();
        this.ramMatcher = new RAMMatchController();
        this.hardwareCache = {
            cpu: null,
            gpu: null,
            ram: null
        };
    }

    async initializeCache() {
        if (!this.hardwareCache.cpu) {
            this.hardwareCache.cpu = await db.CPU.findAll();
        }
        if (!this.hardwareCache.gpu) {
            this.hardwareCache.gpu = await db.GPU.findAll();
        }
        if (!this.hardwareCache.ram) {
            this.hardwareCache.ram = await db.RAM.findAll();
        }
    }

    async matchHardwareNames({ cpu, gpu, ram }) {
        await this.initializeCache();

        const results = {
            success: true,
            hardware: {
                cpu: null,
                gpu: null,
                ram: null
            }
        };

        if (cpu && cpu !== 'dummy') {
            console.log('CPU 매칭 시도:', cpu);
            const cpuMatch = await this.cpuMatcher.findBestMatch(cpu, this.hardwareCache.cpu);
            if (cpuMatch) {
                results.hardware.cpu = cpuMatch.match;
                console.log('CPU 매칭 성공:', cpuMatch.match.cpuName);
            } else {
                console.log('CPU 매칭 실패');
            }
        }

        if (gpu && gpu !== 'dummy') {
            console.log('GPU 매칭 시도:', gpu);
            const gpuMatch = await this.gpuMatcher.findBestMatch(gpu, this.hardwareCache.gpu);
            if (gpuMatch) {
                results.hardware.gpu = gpuMatch.match;
                console.log('GPU 매칭 성공:', gpuMatch.match.gpuName);
            } else {
                console.log('GPU 매칭 실패');
            }
        }

        if (ram && ram !== 'dummy') {
            console.log('RAM 매칭 시도:', ram);
            const ramMatch = await this.ramMatcher.findBestMatch(ram, this.hardwareCache.ram);
            if (ramMatch) {
                results.hardware.ram = ramMatch.match;
                console.log('RAM 매칭 성공:', ramMatch.match.ramName);
            } else {
                console.log('RAM 매칭 실패');
            }
        }

        console.log('매칭 결과:', {
            cpu: results.hardware.cpu ? '성공' : '실패',
            gpu: results.hardware.gpu ? '성공' : '실패',
            ram: results.hardware.ram ? '성공' : '실패'
        });

        return results;
    }
}

const hardwareMatcher = new HardwareMatcher();

module.exports = {
    matchHardwareNames: (specs) => hardwareMatcher.matchHardwareNames(specs),
    hardwareCache: hardwareMatcher.hardwareCache,
    hardwareMatcher
}; 
const CPUMatchController = require('../controllers/hardware/CPUMatchController');
const GPUMatchController = require('../controllers/hardware/GPUMatchController');
const RAMMatchController = require('../controllers/hardware/RAMMatchController');
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
            const cpuMatch = await this.cpuMatcher.findBestMatch(cpu, this.hardwareCache.cpu);
            if (cpuMatch) {
                results.hardware.cpu = cpuMatch.match;
            }
        }

        if (gpu && gpu !== 'dummy') {
            const gpuMatch = await this.gpuMatcher.findBestMatch(gpu, this.hardwareCache.gpu);
            if (gpuMatch) {
                results.hardware.gpu = gpuMatch.match;
            }
        }

        if (ram && ram !== 'dummy') {
            const ramMatch = await this.ramMatcher.findBestMatch(ram, this.hardwareCache.ram);
            if (ramMatch) {
                results.hardware.ram = ramMatch.match;
            }
        }

        return results;
    }
}

const hardwareMatcher = new HardwareMatcher();

module.exports = {
    matchHardwareNames: (specs) => hardwareMatcher.matchHardwareNames(specs),
    hardwareCache: hardwareMatcher.hardwareCache,
    hardwareMatcher
}; 
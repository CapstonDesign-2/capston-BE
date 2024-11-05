const User = require('../models/User');
const CPU = require('../models/CPU');
const GPU = require('../models/GPU');
const RAM = require('../models/RAM');

// 세션 설정 함수
const setSessionUser = (req, user) => {
    req.session.user = {
        serialNum: user.serialNum,
        myCPU: user.myCPU,
        myGPU: user.myGPU,
        myRAM: user.myRAM,
        cpuScore: user.cpuScore,
        gpuScore: user.gpuScore,
        ramScore: user.ramScore,
        totalScore: user.totalScore
    };
};

// 회원가입
// const registerUser = async (req, res) => {
//     try {
//         const { serialNum, myCPU, myGPU, myRAM } = req.body;

//         const existingUser = await User.findOne({ where: { serialNum } });
//         if (existingUser) {
//             return res.status(400).json({ error: '이미 존재하는 serialNum입니다.' });
//         }

//         // CPU, GPU, RAM 점수 계산
//         const cpu = await CPU.findOne({ where: { cpuName: myCPU } });
//         const cpuScore = cpu ? cpu.cpuScore : 0;

//         const gpu = await GPU.findOne({ where: { gpuName: myGPU } });
//         const gpuScore = gpu ? gpu.gpuScore : 0;

//         const ram = await RAM.findOne({ where: { ramName: myRAM } });
//         const ramScore = ram ? ram.ramScore : 0;

//         const totalScore = cpuScore + gpuScore + ramScore;

//         const newUser = await User.create({
//             serialNum,
//             myCPU,
//             myGPU,
//             myRAM,
//             cpuScore,
//             gpuScore,
//             ramScore,
//             totalScore
//         });

//         setSessionUser(req, newUser);  // 세션 설정

//         return res.status(201).json({
//             message: '회원가입이 완료되었습니다.',
//             user: req.session.user
//         });
//     } catch (error) {
//         return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.', error: error.message });
//     }
// };

// 로그인
const loginUser = async (req, res) => {
    try {
        const { serialNum } = req.body;
        const user = await User.findOne({ where: { serialNum } });

        if (!user) {
            return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
        }

        setSessionUser(req, user);  // 세션 설정

        return res.status(200).json({
            message: '로그인 성공',
            user: req.session.user
        });
    } catch (error) {
        return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.', error: error.message });
    }
};

// 로그아웃
const logoutUser = async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.status(200).json({ message: '로그아웃 성공' });
    } catch (error) {
        return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.', error: error.message });
    }
};

// 프로필 조회
const getProfile = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: '로그인되어 있지 않습니다.' });
        }

        const user = await User.findOne({ where: { serialNum: req.session.user.serialNum } });
        if (!user) {
            return res.status(404).json({ error: '사용자 정보를 찾을 수 없습니다.' });
        }

        return res.status(200).json({
            user: req.session.user
        });
    } catch (error) {
        return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.', error: error.message });
    }
};

// 내정보 수정
const updateProfile = async (req, res) => {
    try {
        const { myCPU, myGPU, myRAM } = req.body;

        const user = await User.findOne({ where: { serialNum: req.session.user.serialNum } });
        if (!user) {
            return res.status(404).json({ error: '사용자 정보를 찾을 수 없습니다.' });
        }

        // CPU, GPU, RAM 점수 다시 계산
        const cpu = await CPU.findOne({ where: { cpuName: myCPU } });
        const cpuScore = cpu ? cpu.cpuScore : 0;

        const gpu = await GPU.findOne({ where: { gpuName: myGPU } });
        const gpuScore = gpu ? gpu.gpuScore : 0;

        const ram = await RAM.findOne({ where: { ramName: myRAM } });
        const ramScore = ram ? ram.ramScore : 0;

        const totalScore = cpuScore + gpuScore + ramScore;

        // 사용자 정보 업데이트
        user.myCPU = myCPU;
        user.myGPU = myGPU;
        user.myRAM = myRAM;
        user.cpuScore = cpuScore;
        user.gpuScore = gpuScore;
        user.ramScore = ramScore;
        user.totalScore = totalScore;

        await user.save();

        setSessionUser(req, user);  // 세션 정보 업데이트

        return res.status(200).json({
            message: '내정보가 성공적으로 수정되었습니다.',
            user: req.session.user
        });
    } catch (error) {
        return res.status(500).json({ message: '서버 내부 오류가 발생했습니다.', error: error.message });
    }
};

module.exports = {
    //registerUser,
    loginUser,
    logoutUser,
    getProfile,
    updateProfile
};
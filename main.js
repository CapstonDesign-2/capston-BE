require('dotenv').config();
const express = require('express');
const session = require('express-session'); // 세션
const path = require('path');
const importData = require('./src/utils/importData');
const bodyParser = require('body-parser');

const { sequelize } = require('./src/index');

const scoreRoutes = require('./src/routes/scoreRoutes');
const router = require('./src/routes/router');
const cpuRoutes = require('./src/routes/cpuRoutes');  // CPU
const gpuRoutes = require('./src/routes/gpuRoutes');  // GPU
const ramRoutes = require('./src/routes/ramRoutes');  // RAM
const gameRoutes = require('./src/routes/gameRoutes'); // Game
const userRoutes = require('./src/routes/userRoutes'); // user 관련

// Sequelize 로깅 비활성화
sequelize.options.logging = false;

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true })); // 테이블 초기화
app.use(express.json());

app.use(session({
    secret: 'your-secret-key',  // 세션 암호화 키 (하드 코딩)
    resave: false,              // 매 요청마다 세션을 다시 저장할지 여부
    saveUninitialized: true,    // 초기화되지 않은 세션을 저장할지 여부
    cookie: { 
        secure: false,          // https 환경에서만 쿠키를 전송할지 여부 (개발 중에는 false)
        maxAge: 1000 * 60 * 60  // 세션 쿠키 유효 시간 (1시간)
    }
}));

app.use('/', router);
app.use('/api/score', scoreRoutes);

app.use('/api/cpu', cpuRoutes); // CPU
app.use('/api/gpu', gpuRoutes); // GPU
app.use('/api/ram', ramRoutes); // RAM
app.use('/api/game', gameRoutes); // Game
app.use('/api/user', userRoutes); // user

const initializeApp = async () => {
    try {
        await sequelize.authenticate();
        console.log('데이터베이스 연결이 성공적으로 설정되었습니다.');

        await sequelize.sync({ force: true });
        console.log('데이터베이스가 동기화되었습니다.');

        await importData();
        console.log('모든 데이터 임포트가 완료되었습니다.');

        // 서버 시작
        app.listen(port, () => {
            console.log(`앱이 포트 ${port}에서 실행 중입니다.`);
        });
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
        process.exit(1);
    }
}

initializeApp();

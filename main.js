require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const importData = require('./src/utils/importData');
const bodyParser = require('body-parser');
const { sequelize } = require('./src/index');

const cors = require('cors'); // cors 추가

const { initializeGameData } = require('./src/utils/gameData');

// 단일 라우터 파일 임포트
const router = require('./src/routes/router');

const importUserData = require('./src/utils/importUserData');  // 추가

// Sequelize 로깅 비활성화
sequelize.options.logging = false;

const app = express();
const port = process.env.PORT || 4000;

// CORS 미들웨어 설정
app.use(cors({
    // origin: true, // 로컬 테스트용
    origin: 'https://lustrous-starburst-fc4ad8.netlify.app', // 허용할 프론트엔드 도메인
    credential: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 1000 * 60 * 60
    }
}));

// 단일 라우터 사용
app.use('/', router);

const initializeApp = async () => {
    try {
        await sequelize.authenticate();
        console.log('데이터베이스 연결이 성공적으로 설정되었습니다.');

        await sequelize.sync({ force: true });
        console.log('데이터베이스가 초기화되고 동기화되었습니다.');

        await importData();
        console.log('모든 데이터 임포트가 완료되었습니다.');

        const db = require('./src/index');
        await initializeGameData(db);
        console.log('게임 데이터가 초기화되었습니다.');

        await importUserData();  // 추가: 유저 데이터 임포트
        console.log('유저 데이터가 임포트되었습니다.');

        app.listen(port, () => {
            console.log(`앱이 포트 ${port}에서 실행 중입니다.`);
        });
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
        process.exit(1);
    }
}

initializeApp();

require('dotenv').config();
const express = require('express');
const path = require('path');
const importData = require('./src/utils/importData');

const bodyParser = require('body-parser');
const { sequelize } = require('./src/index');
const scoreRoutes = require('./src/routes/scoreRoutes');
const router = require('./src/routes/router');

// Sequelize 로깅 비활성화
sequelize.options.logging = false;

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', router);
app.use('/api/score', scoreRoutes);

const initializeApp = async () => {
    try {
        await sequelize.authenticate();
        console.log('데이터베이스 연결이 성공적으로 설정되었습니다.');
        await sequelize.sync({ force: true });
        console.log('데이터베이스가 동기화되었습니다.');

        await importData();
        console.log('모든 데이터 임포트가 완료되었습니다.');

        app.listen(port, () => {
            console.log(`앱이 포트 ${port}에서 실행 중입니다.`);
        });
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
        process.exit(1);
    }
}

initializeApp();

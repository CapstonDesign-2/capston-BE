const fs = require('fs').promises;
const path = require('path');
const { User } = require('../index');

const importUserData = async () => {
    try {
        // userData.json 파일 읽기
        const userDataPath = path.join(__dirname, '../../data/userData.json');
        const userData = await fs.readFile(userDataPath, 'utf8');
        const users = JSON.parse(userData);

        // 각 유저 데이터를 DB에 저장
        for (const user of users) {
            await User.upsert(user);
        }

        console.log('유저 데이터 임포트 완료:', users.length, '개의 데이터가 처리됨');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('userData.json 파일이 없습니다. 유저 데이터 임포트를 건너뜁니다.');
            return;
        }
        throw error;
    }
};

module.exports = importUserData; 
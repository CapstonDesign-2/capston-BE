const fs = require('fs');
const path = require('path');

// 게임 데이터를 저장할 JSON 파일 경로 수정
const GAME_DATA_FILE = path.join(__dirname, '../../data/game_data.json');
// 또는
// const GAME_DATA_FILE = path.resolve(process.cwd(), 'data/game_data.json');

console.log('게임 데이터 파일 경로:', GAME_DATA_FILE);  // 경로 확인용 로그

// 게임 데이터 저장 함수
const saveGameData = (gameData) => {
    try {
        let existingData = [];
        
        if (fs.existsSync(GAME_DATA_FILE)) {
            const fileContent = fs.readFileSync(GAME_DATA_FILE, 'utf8');
            existingData = JSON.parse(fileContent || '[]');
        }

        const gameIndex = existingData.findIndex(game => game.gameName === gameData.gameName);
        if (gameIndex !== -1) {
            existingData[gameIndex] = gameData;
        } else {
            existingData.push(gameData);
        }

        fs.writeFileSync(GAME_DATA_FILE, JSON.stringify(existingData, null, 2));
        return true;
    } catch (error) {
        console.error('게임 데이터 저장 중 오류:', error);
        return false;
    }
};

// 게임 데이터 초기화 함수
const initializeGameData = async (db) => {
    try {
        // 파일이 없으면 빈 배열로 초기화된 파일 생성
        if (!fs.existsSync(GAME_DATA_FILE)) {
            fs.writeFileSync(GAME_DATA_FILE, '[]');
            console.log('새로운 게임 데이터 파일이 생성되었습니다.');
            return;
        }

        const fileContent = fs.readFileSync(GAME_DATA_FILE, 'utf8');
        let gameData;
        
        try {
            gameData = JSON.parse(fileContent || '[]');
        } catch (e) {
            console.log('게임 데이터 파일이 비어있거나 잘못되었습니다. 새로 초기화합니다.');
            fs.writeFileSync(GAME_DATA_FILE, '[]');
            return;
        }

        if (gameData && gameData.length > 0) {
            // DB에 저장
            for (const game of gameData) {
                await db.Game.findOrCreate({
                    where: { gameName: game.gameName },
                    defaults: {
                        ...game,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            }
            console.log('게임 데이터 초기화 완료');
        } else {
            console.log('저장된 게임 데이터가 없습니다.');
        }
    } catch (error) {
        console.error('게임 데이터 초기화 중 오류:', error);
    }
};

module.exports = {
    saveGameData,
    initializeGameData
};

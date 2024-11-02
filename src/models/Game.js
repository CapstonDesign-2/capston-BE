const { Sequelize, DataTypes } = require('sequelize');

module.exports = class Game extends Sequelize.Model {
    static init(sequelize) {{
        return super.init({
            gameId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            gameName: {
                type: DataTypes.STRING(100),
            },
            recommendedCPU: {
                type: DataTypes.STRING(100),
            },
            recommendedGPU: {
                type: DataTypes.STRING(100),
            },
            recommendedRAM: {
                type: DataTypes.STRING(100),
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Game',
            tableName: 'game',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    }
}

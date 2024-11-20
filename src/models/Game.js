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
            gameThumbnail: {
                type: DataTypes.STRING(100),
            },
            recommendedCPUScore: {
                type: DataTypes.INTEGER,
            },
            recommendedGPUScore: {
                type: DataTypes.INTEGER,
            },
            minimumCPUScore: {
                type: DataTypes.INTEGER,
            },
            minimumGPUScore: {
                type: DataTypes.INTEGER,
            },
            minimumRAMScore: {
                type: DataTypes.INTEGER,
            },
            maximumCPUScore: {
                type: DataTypes.INTEGER,
            },
            maximumGPUScore: {
                type: DataTypes.INTEGER,
            },
            minimumTotalScore: {
                type: DataTypes.INTEGER,
            },
            recommendedTotalScore: {
                type: DataTypes.INTEGER,
            },
            maximumTotalScore: {
                type: DataTypes.INTEGER,
            },
            matchedHardware: {
                type: DataTypes.JSON,
                allowNull: true
            }
        }, {
            sequelize,
            timestamps: true,
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

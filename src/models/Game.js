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
                type: DataTypes.STRING(200),
            },
            recommendedCPUScore: {
                type: DataTypes.INTEGER,
            },
            recommendedGPUScore: {
                type: DataTypes.INTEGER,
            },
            recommendedRAMScore: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0
            },
            recommendedTotalScore: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0
            },
            minimumCPUScore: {
                type: DataTypes.INTEGER,
            },
            minimumGPUScore: {
                type: DataTypes.INTEGER,
            },
            minimumRAMScore: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            minimumTotalScore: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
            maximumCPUScore: {
                type: DataTypes.INTEGER,
            },
            maximumGPUScore: {
                type: DataTypes.INTEGER,
            },
            maximumRAMScore: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0
            },
            maximumTotalScore: {
                type: DataTypes.FLOAT,
                allowNull: false
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

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class BaseScore extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            baseScoreId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            cpuBaseScore: {
                type: DataTypes.FLOAT,
            },
            gpuBaseScore: {
                type: DataTypes.FLOAT,
            },
            ramBaseScore: {
                type: DataTypes.FLOAT,
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'baseScore',
            tableName: 'baseScore',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    }

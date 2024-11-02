const { Sequelize, DataTypes } = require('sequelize');

module.exports = class User extends Sequelize.Model {
    static init(sequelize) {{
        return super.init({
            serialNum: {
                type: DataTypes.STRING(100),
                primaryKey: true,
            },
            myCPU: {
                type: DataTypes.STRING(100),
            },
            myGPU: {
                type: DataTypes.STRING(100),
            },
            myRAM: {
                type: DataTypes.STRING(100),
            },
            cpuScore: {
                type: DataTypes.FLOAT,
            },
            gpuScore: {
                type: DataTypes.FLOAT,
            },
            ramScore: {
                type: DataTypes.FLOAT,
            },
            totalScore: {
                type: DataTypes.FLOAT,
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'User',
            tableName: 'user',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    }
}

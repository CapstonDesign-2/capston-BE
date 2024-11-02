const { Sequelize, DataTypes } = require('sequelize');

module.exports = class CPU extends Sequelize.Model {
    static init(sequelize) {{
        return super.init({
            cpuId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            cpuName: {
                type: DataTypes.STRING(100),
            },
            cpuPrice: {
                type: DataTypes.FLOAT,
            },
            cpuScore: {
                type: DataTypes.INTEGER,
            },
            baseScore: {
                type: DataTypes.FLOAT,
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'CPU',
            tableName: 'cpu',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    }
}

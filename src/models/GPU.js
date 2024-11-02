const { Sequelize, DataTypes } = require('sequelize');

module.exports = class GPU extends Sequelize.Model {
    static init(sequelize) {{
        return super.init({
            gpuId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            gpuName: {
                type: DataTypes.STRING(100),
            },
            gpuPrice: {
                type: DataTypes.FLOAT,
            },
            gpuScore: {
                type: DataTypes.INTEGER,
            },
            baseScore: {
                type: DataTypes.FLOAT,
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'GPU',
            tableName: 'gpu',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    }
}

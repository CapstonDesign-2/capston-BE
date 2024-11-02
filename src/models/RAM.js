const { Sequelize, DataTypes } = require('sequelize');

module.exports = class RAM extends Sequelize.Model {
    static init(sequelize) {{
        return super.init({
            ramId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            ramName: {
                type: DataTypes.STRING(100),
            },
            ramPrice: {
                type: DataTypes.FLOAT,
            },
            ramScore: {
                type: DataTypes.INTEGER,
            },
            baseScore: {
                type: DataTypes.FLOAT,
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'RAM',
            tableName: 'ram',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    }
}

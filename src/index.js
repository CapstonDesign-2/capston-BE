'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'test';
const config = require('../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    port: config.port
  });
}

const CPU = require('./models/CPU');
const GPU = require('./models/GPU');
const RAM = require('./models/RAM');
const baseScore = require('./models/baseScore');
const User = require('./models/User');
CPU.init(sequelize);
GPU.init(sequelize);
RAM.init(sequelize);
baseScore.init(sequelize);
User.init(sequelize);

db.CPU = CPU;
db.GPU = GPU;
db.RAM = RAM;
db.BaseScore = baseScore;
db.User = User; 

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

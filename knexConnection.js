const knex = require("knex");
require('dotenv').config();
const knexConfig = require('./knexfile');

// const knexConnect = knex(knexConfig.production);

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const knexConnect = knex(config);

module.exports = knexConnect;
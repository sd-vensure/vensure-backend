const express = require('express');
const { getToken } = require('./refreshController');
const refreshRouter = express.Router();

refreshRouter.get("/get-access-token", getToken);

module.exports = refreshRouter;
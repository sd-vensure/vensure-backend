const express = require("express");
const { getLastNumbers } = require("./formController");
const router = express.Router();

router.get("/get-last-numbers",getLastNumbers);


module.exports = router
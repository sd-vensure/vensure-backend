const express = require("express");
const { getLastNumbers, getPAFFormforPafID } = require("./formController");
const router = express.Router();

router.get("/get-last-numbers",getLastNumbers);

router.get("/get-paf-form/:pafid",getPAFFormforPafID);


module.exports = router
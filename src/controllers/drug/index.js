const express = require("express");
const { addDrug, getDrug, addInnovator, getInnovator } = require("./drugController");
const router = express.Router();

router.post("/add",addDrug);
router.get("/get",getDrug);

router.post("/addInnovator",addInnovator)
router.get("/getInnovator",getInnovator);

module.exports = router
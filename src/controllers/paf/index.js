const express = require("express");
const { addPaf, getPaf, addStakeHolder, viewStakeHolder } = require("./pafController");
const router = express.Router();

router.post("/add",addPaf);
router.get("/get",getPaf);

router.post("/add-stakeholder",addStakeHolder);
router.get("/view-stakeholder",viewStakeHolder);


module.exports = router
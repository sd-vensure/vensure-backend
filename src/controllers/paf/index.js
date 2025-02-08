const express = require("express");
const { addPaf, getPaf, addStakeHolder, viewStakeHolder, getMasterTypes } = require("./pafController");
const router = express.Router();

router.post("/add",addPaf);
router.get("/get",getPaf);

router.post("/add-stakeholder",addStakeHolder);
router.get("/view-stakeholder",viewStakeHolder);

router.get("/get-master-types",getMasterTypes)


module.exports = router
const express = require("express");
const { addPaf, getPaf, addStakeHolder, viewStakeHolder, getMasterTypes, approvePaf, revisePAF, addPafNew, createPAFForm } = require("./pafController");
const { authMiddlewareUser } = require("../../middleware");
const router = express.Router();

// router.post("/add",authMiddlewareUser,addPaf);
router.post("/add-new",authMiddlewareUser,addPafNew);

router.post("/create-paf-form",authMiddlewareUser,createPAFForm)

router.post("/revise",authMiddlewareUser,revisePAF);
router.post("/status-change/:pafid",authMiddlewareUser,approvePaf);
router.get("/get",getPaf);

router.post("/add-stakeholder",addStakeHolder);
router.get("/view-stakeholder",viewStakeHolder);

router.get("/get-master-types",getMasterTypes)


module.exports = router
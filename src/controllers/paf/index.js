const express = require("express");
const { addPaf, getPaf, addStakeHolder, viewStakeHolder, getMasterTypes, approvePaf, revisePAF } = require("./pafController");
const { authMiddlewareUser } = require("../../middleware");
const router = express.Router();

router.post("/add",authMiddlewareUser,addPaf);
router.post("/revise",authMiddlewareUser,revisePAF);
router.post("/approve/:pafid",authMiddlewareUser,approvePaf);
router.get("/get",getPaf);

router.post("/add-stakeholder",addStakeHolder);
router.get("/view-stakeholder",viewStakeHolder);

router.get("/get-master-types",authMiddlewareUser,getMasterTypes)


module.exports = router
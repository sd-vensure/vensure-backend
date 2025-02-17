const express = require("express");
const { getLastNumbers, getPAFFormforPafID, updateAssignDepartment } = require("./formController");
const { authMiddlewareUser } = require("../../middleware");
const router = express.Router();

router.get("/get-last-numbers",getLastNumbers);

router.get("/get-paf-form/:pafid",getPAFFormforPafID);

router.put("/update",authMiddlewareUser,updateAssignDepartment);

module.exports = router
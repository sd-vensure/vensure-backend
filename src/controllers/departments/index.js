const express = require("express");
const router = express.Router();
const { addDepartment,getDepartment } = require("./departmentController")

router.post("/add", addDepartment);
router.get("/get",getDepartment);

module.exports = router
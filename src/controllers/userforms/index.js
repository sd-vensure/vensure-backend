const express = require("express");
const { authMiddlewareUser } = require("../../middleware");
const { addForm, viewMyForms, getParticularForm, getFormsDepartment, sendForVerification, getInProgressForms, approveReject, updateFormData, getTotalFormsTotalUsers, sendDepartmentFinancialYear, getSubmittedForms } = require("./userformController");
const router = express.Router();

router.post("/add",authMiddlewareUser,addForm);
router.get("/viewmyform/:userid",authMiddlewareUser,viewMyForms);
router.get("/getparticularform/:uniqueid",authMiddlewareUser,getParticularForm);
router.get("/getformdepartment/:departmentid",authMiddlewareUser,getFormsDepartment);
router.get("/sendforverification/:uniqueid",authMiddlewareUser,sendForVerification);
router.post("/senddepartmentfinancialyear",authMiddlewareUser,sendDepartmentFinancialYear);
router.get("/approvedecline/:uniqueid/:val",authMiddlewareUser,approveReject);
router.get("/getinprogressforms",authMiddlewareUser,getInProgressForms);
router.get("/getsubmittedforms",authMiddlewareUser,getSubmittedForms);
router.post("/totalformstotalusers",authMiddlewareUser,getTotalFormsTotalUsers);
router.put("/update/:uniqueid",authMiddlewareUser,updateFormData);


module.exports = router
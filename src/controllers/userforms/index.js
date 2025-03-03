const express = require("express");
const { authMiddlewareUser } = require("../../middleware");
const {viewMyFormsNew, addForm, viewMyForms, getParticularForm,getParticularFormNew, getFormsDepartment, sendForVerification, getInProgressForms, approveReject, updateFormData, getTotalFormsTotalUsers, sendDepartmentFinancialYear, getSubmittedForms, addNewForm, updateFormDataNew } = require("./userformController");
const router = express.Router();

router.post("/add",authMiddlewareUser,addForm);
router.post("/addnew",authMiddlewareUser,addNewForm);

router.get("/viewmyform/:userid",authMiddlewareUser,viewMyForms);
router.get("/viewmyformnew/:userid",authMiddlewareUser,viewMyFormsNew);

router.get("/getparticularform/:uniqueid",authMiddlewareUser,getParticularForm);
router.get("/getparticularformnew/:uniqueid",authMiddlewareUser,getParticularFormNew);

router.get("/getformdepartment/:departmentid",authMiddlewareUser,getFormsDepartment);
router.get("/sendforverification/:uniqueid",authMiddlewareUser,sendForVerification);
router.post("/senddepartmentfinancialyear",authMiddlewareUser,sendDepartmentFinancialYear);
router.get("/approvedecline/:uniqueid/:val",authMiddlewareUser,approveReject);
router.get("/getinprogressforms",authMiddlewareUser,getInProgressForms);
router.get("/getsubmittedforms",authMiddlewareUser,getSubmittedForms);
router.post("/totalformstotalusers",authMiddlewareUser,getTotalFormsTotalUsers);

router.put("/update/:uniqueid",authMiddlewareUser,updateFormData);
router.put("/updatenew/:uniqueid",authMiddlewareUser,updateFormDataNew);


module.exports = router
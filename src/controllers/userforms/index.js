const express = require("express");
const { authMiddlewareUser } = require("../../middleware");
const {getPendingFormsForMarks,viewMyFormsNew, addForm, viewMyForms, getParticularForm,getParticularFormNew, getFormsDepartment, sendForVerification, getInProgressForms, approveReject, updateFormData, getTotalFormsTotalUsers, sendDepartmentFinancialYear, getSubmittedForms, addNewForm, updateFormDataNew, getFormsDepartmentNew, getTotalFormsTotalUsersNew, sendToDepartmentHead, approveRejectNew, updateFormDateAndMarks, getSubmittedFormsNew, editRequestForm, acceptEditRequest, viewEditRequests, updateFormDataSpecialNew, getassignedformstome } = require("./userformController");
const router = express.Router();

router.post("/add",authMiddlewareUser,addForm);
router.post("/addnew",authMiddlewareUser,addNewForm);

router.get("/viewmyform/:userid",authMiddlewareUser,viewMyForms);
router.get("/viewmyformnew/:userid",authMiddlewareUser,viewMyFormsNew);

router.get("/getparticularform/:uniqueid",authMiddlewareUser,getParticularForm);
router.get("/getparticularformnew/:uniqueid",authMiddlewareUser,getParticularFormNew);

router.get("/getformdepartment/:departmentid",authMiddlewareUser,getFormsDepartment);
router.get("/getformdepartmentnew/:departmentid",authMiddlewareUser,getFormsDepartmentNew);

router.get("/sendtodepartmenthead/:uniqueid",authMiddlewareUser,sendToDepartmentHead);

router.get("/sendforverification/:uniqueid",authMiddlewareUser,sendForVerification);

router.post("/senddepartmentfinancialyear",authMiddlewareUser,sendDepartmentFinancialYear);

router.get("/approvedecline/:uniqueid/:val",authMiddlewareUser,approveReject);
router.get("/approvedeclinenew/:uniqueid/:val",authMiddlewareUser,approveRejectNew);

router.get("/getinprogressforms",authMiddlewareUser,getInProgressForms);

router.get("/getsubmittedforms",authMiddlewareUser,getSubmittedForms);
router.get("/getsubmittedformsnew",authMiddlewareUser,getSubmittedFormsNew);

router.post("/totalformstotalusers",authMiddlewareUser,getTotalFormsTotalUsers);
// router.post("/totalformstotalusersnew",authMiddlewareUser,getTotalFormsTotalUsersNew);  this gives for department need to check
router.post("/getassignedformstome",authMiddlewareUser,getassignedformstome);


router.post("/getpendingmarksassign",authMiddlewareUser,getPendingFormsForMarks);


router.put("/update/:uniqueid",authMiddlewareUser,updateFormData);
router.put("/updatenew/:uniqueid",authMiddlewareUser,updateFormDataNew);
router.put("/updatespecialnew/:uniqueid/:requestid",authMiddlewareUser,updateFormDataSpecialNew);

router.put("/updatedateandmarks",authMiddlewareUser,updateFormDateAndMarks);


router.post("/editrequest",authMiddlewareUser,editRequestForm)
router.get("/vieweditrequest/:financial",authMiddlewareUser,viewEditRequests)
router.put("/acceptrejectrequest",acceptEditRequest)



module.exports = router
const express = require("express");
const { registerUser, loginUser, testMiddleware, logoutUser, updatePassword, insertingvalueshod, insertingvaluesemp } = require("./userController");
const { authMiddlewareUser } = require("../../middleware");
const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser)
router.post("/updatepassword",authMiddlewareUser,updatePassword)
router.post("/logout",logoutUser)
router.post("/testmiddleware",authMiddlewareUser,testMiddleware);

router.get("/inserting-values-hod",insertingvalueshod)
router.get("/inserting-values-emp",insertingvaluesemp)

module.exports = router
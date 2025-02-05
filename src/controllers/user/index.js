const express = require("express");
const { registerUser, loginUser, testMiddleware } = require("./userController");
const { authMiddlewareUser } = require("../../middleware");
const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser)
router.post("/testmiddleware",authMiddlewareUser,testMiddleware)
// router.put("/update", updateCustomer)
// router.post("/get", getCustomer)

module.exports = router
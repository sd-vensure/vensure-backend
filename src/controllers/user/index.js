const express = require("express");
const { registerUser, loginUser, testMiddleware, logoutUser, insertingvalues } = require("./userController");
const { authMiddlewareUser } = require("../../middleware");
const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser)
router.post("/logout",logoutUser)
router.post("/testmiddleware",authMiddlewareUser,testMiddleware);

router.get("/inserting-values",insertingvalues)

module.exports = router
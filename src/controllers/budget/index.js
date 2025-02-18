const express = require("express");
const {  getBudget, addBudgetEntries, updateBudgetstatus } = require("./budgetController");
const { authMiddlewareUser } = require("../../middleware");
const router = express.Router();

router.post("/add",authMiddlewareUser, addBudgetEntries);
// router.put("/update",, updateBudgetEntries);
router.get("/get/:pafid",getBudget);
router.post("/update-budget-status/:budgetid",authMiddlewareUser,updateBudgetstatus);

module.exports = router
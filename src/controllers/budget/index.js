const express = require("express");
const {  getBudget } = require("./budgetController");
const router = express.Router();

// router.post("/add", addBudgetEntries);
// router.put("/update", updateBudgetEntries);
router.get("/get/:pafid",getBudget);

module.exports = router
const express = require("express");
const { addPaf, getPaf } = require("./pafController");
const router = express.Router();

router.post("/add",addPaf);
router.get("/get",getPaf);

module.exports = router
const router = require("express").Router();
const userRoutes = require("./controllers/user");
const drugRoutes = require("./controllers/drug");


router.use("/user",userRoutes)
router.use("/drug",drugRoutes)


module.exports=router
const router = require("express").Router();
const userRoutes = require("./controllers/user");
const drugRoutes = require("./controllers/drug");
const pafRoutes = require("./controllers/paf");


router.use("/user",userRoutes)
router.use("/drug",drugRoutes)
router.use("/paf",pafRoutes)


module.exports=router
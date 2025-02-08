const router = require("express").Router();
const userRoutes = require("./controllers/user");
const drugRoutes = require("./controllers/drug");
const pafRoutes = require("./controllers/paf");
const refreshRoutes = require("./controllers/refresh");


router.use("/user",userRoutes)
router.use("/drug",drugRoutes)
router.use("/paf",pafRoutes)
router.use("/refresh",refreshRoutes)


module.exports=router
const router = require("express").Router();
const userRoutes = require("./controllers/user");
const drugRoutes = require("./controllers/drug");
const pafRoutes = require("./controllers/paf");
const refreshRoutes = require("./controllers/refresh");
const formRoutes = require("./controllers/form");
const departmentRoutes = require("./controllers/departments");
const budgetRoutes = require("./controllers/budget");
const userFormRoutes = require("./controllers/userforms");


router.use("/user",userRoutes)
router.use("/drug",drugRoutes)
router.use("/paf",pafRoutes)
router.use("/refresh",refreshRoutes)
router.use("/form",formRoutes)
router.use("/department",departmentRoutes)
router.use("/budget",budgetRoutes)
router.use("/userform",userFormRoutes)


module.exports=router
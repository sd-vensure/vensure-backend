const jwt = require("jsonwebtoken");
const knexConnect = require("../../knexConnection");
const { checkUser } = require("../controllers/user/userHElper");


const authMiddlewareUser = async (req, res, next) => {

    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (token) {
            const token = authHeader.split(' ')[1];

            // console.log(authHeader)
            jwt.verify(
                token,
                process.env.ACCESS_PRIVATE_KEY,
                async (err, decoded) => {
                    if (err) {
                        console.log(err)
                        return res.status(403).json({ status: false, message: "Token Expired or Broken" });
                    }

                    if (decoded) {
                        req.user_id = decoded.user_id;

                        let dataresp = await checkUser(decoded.user_id);
                        if (dataresp.status) {
                            req.department_id = dataresp.data.department_id;
                            req.department_name = dataresp.data.department_name;
                            req.emp_id = dataresp.data.emp_id;
                            if(dataresp.data.designated_data)
                            {
                                req.designated_user_id= dataresp.data.designated_data.designated_user_id,
                                req.designated_designation= dataresp.data.designated_data.designated_designation,
                                req.designated_department_id= dataresp.data.designated_data.designated_department_id,
                                req.designated_user_first_name= dataresp.data.designated_data.designated_user_first_name
                            }
                            // console.log(dataresp,"this is dataresp")
                        }

                        req.user_email = decoded.user_email;
                        req.user_name = decoded.user_name;
                        next();
                        // return res.status(200).json({ status: true, data: decoded });
                    }

                }
            );
        }
        else {
            return res.status(200).json({ status: false, message: "Unauthorized Access 1" });

        }
    }
    else {
        return res.status(403).json({ status: false, error: "Unauthorized Access 2" });
    }



}

module.exports = { authMiddlewareUser }
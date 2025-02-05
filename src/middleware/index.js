const jwt = require("jsonwebtoken");
const knexConnect = require("../../knexConnection")


const authMiddlewareUser = async (req, res, next) => {

    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (token) {
            const token = authHeader.split(' ')[1];

            // console.log(authHeader)
            jwt.verify(
                token,
                process.env.SECRET_KEY,
                async (err, decoded) => {
                    if (err) {
                        console.log(err)
                        return res.status(200).json({ status: false, message: "Token Expired or Broken" });
                    }

                    if (decoded) {
                        console.log(decoded)
                        req.user_id = decoded.user_id;
                        req.user_email = decoded.user_email;
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
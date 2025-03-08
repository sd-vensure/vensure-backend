const jwt = require('jsonwebtoken');
const { checkRefresh, deleteRefresh } = require('./refreshHelper');
const { checkUser } = require('../user/userHElper');
const { generateAccessToken } = require('../../helpers');
const knexConnect = require('../../../knexConnection');

const getToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshJwt) {
        return res.status(200).json({ status: false, message: "No Cookie Found" });
    }
    else {
        const refreshToken = cookies.refreshJwt;
        const findRefresh = await checkRefresh(refreshToken);
        if (!findRefresh) {
            return res.status(200).json({ status: false, message: "Invalid Refresh Token Sent" });
        }
        else if (findRefresh) {

            jwt.verify(
                refreshToken,
                process.env.REFRESH_PRIVATE_KEY,
                async (err, decoded) => {
                    if (err) {
                        const deleteToken = await deleteRefresh(refreshToken);
                        // res.clearCookie('refreshJwt', { httpOnly: true});
                        res.cookie('refreshJwt', refreshToken, {
                            httpOnly: true,
                            sameSite: 'None', // Allow cross-site cookies
                            secure: process.env.NODE_ENV === 'production', // Only set 'secure' in production environment
                            maxAge: process.env.COOKIE_EXPIRE_TIME_HOURS * 60 * 60 * 1000
                        });

                        return res.status(403).json({ status: false, error: "Invalid Refresh Token Sent" });
                    }
                    else {
                        const check = await checkUser(decoded.user_id);
                        if (!check.status) {
                            return res.status(403).json({ status: false, error: "Invalid Refresh Token Sent" });
                        }
                        else if (check.status) {
                            const user_id = decoded.user_id;
                            const user_email = decoded.user_email;
                            const user_name = decoded.user_name;
                            let datatoencrypt = {
                                user_id, user_email, user_name
                            }
                            const accessToken = generateAccessToken(datatoencrypt);

                            console.log(check.data)
                            let userdata = null
                            let rolesreturn = check.data.roles == "" ? [] : JSON.parse(check.data.roles)

                            userdata = { ...check.data, "roles": rolesreturn }

                            let fetchdesignatedperson = await knexConnect('emp_reporting_mapper')
                                .select('user.*', 'emp_reporting_mapper.*')
                                .join('user', 'user.user_id', 'emp_reporting_mapper.reporting_id')
                                .where('emp_reporting_mapper.emp_id', userdata.user_id);

                            departmenthead = {
                                "designation": fetchdesignatedperson[0].designation,
                                "department_id": fetchdesignatedperson[0].department_id,
                                "user_first_name": fetchdesignatedperson[0].user_first_name,
                                "user_contact": fetchdesignatedperson[0].user_contact,
                                "user_id": fetchdesignatedperson[0].user_id,
                            }


                            return res.status(200).json({ status: true, data: { ...userdata, departmenthead }, token: accessToken, message: "New Token Generated Successfully" });
                        }
                    }
                }
            );
        }
    }
}

module.exports = { getToken }
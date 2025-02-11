const jwt = require('jsonwebtoken');
const { checkRefresh, deleteRefresh } = require('./refreshHelper');
const { checkUser } = require('../user/userHElper');
const { generateAccessToken } = require('../../helpers');

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
                            return res.status(200).json({ status: true, data: check.data, token: accessToken, message: "New Token Generated Successfully" });
                        }
                    }
                }
            );
        }
    }
}

module.exports = { getToken }
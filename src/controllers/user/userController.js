const argon2d = require("argon2");
const knexConnect = require("../../../knexConnection");
const { isValidEmail, isIndianMobileNumber } = require("./userHElper");
const { comparePassword, generateToken, generateRefreshToken, generateAccessToken } = require("../../helpers");
const date = require('date-and-time');
const { saveRefresh, checkRefresh, deleteRefresh } = require("../refresh/refreshHelper");

const registerUser = async (req, res) => {
    let {
        user_first_name, user_last_name, user_email, user_contact, user_password
    } = req.body;

    // console.log(req.body)

    const hashedpassword = await argon2d.hash(user_password);

    user_first_name = user_first_name.trim()
    user_last_name = user_last_name ? user_last_name.trim() : null
    user_email = user_email = user_email ? user_email.trim() : null

    user_contact = user_contact ? user_contact.trim() : null

    if (!isIndianMobileNumber(user_contact)) {
        return res.send({
            status: false,
            message: "Please send a proper Indian Number"
        })
    }

    if (!isValidEmail(user_email)) {
        return res.send({
            status: false,
            message: "Please provide a valid email"
        })
    }

    try {

        let checkemailexist = await knexConnect("user")
            .select()
            .where({
                user_email
            });

        if (checkemailexist.length > 0) {
            return res.send({
                status: false,
                message: "Email ID already exists"
            })
        }

        let insertdata = await knexConnect("user")
            .insert({
                user_first_name, user_last_name, user_email, user_contact, "user_password": hashedpassword,
                user_created_at: knexConnect.raw('UTC_TIMESTAMP()'),
                user_updated_at: knexConnect.raw('UTC_TIMESTAMP()'),
            });


        // let customer_id = insertdata[0];

        // let newdate = new Date();
        // const datetime = date.format(newdate, 'YYYY-MM-DD HH:mm:ss');

        // let uniquestring = generateUniqueString(10)


        // let insertuniquestring = await knexConnect("customer_verification")
        //     .insert({
        //         "customer_id": customer_id,
        //         "token": uniquestring,
        //         "cv_created_at": datetime
        //     })

        // let final_link = process.env.WEBSITE_URL + "/verification/register?tk=" + uniquestring;
        // await emailRegistrationUser(customer_email, customer_first_name, final_link)

        return res.send({
            status: true,
            message: "User registered successfully."
        })

    } catch (error) {

        return res.send({
            status: false,
            message: "Error Occured",
            data: error.message
        })

    }

}


const loginUser = async (req, res) => {

    let {
        email, password
    } = req.body;

    email = email ? email.trim() : null
    password = password ? password.trim() : null

    try {

        if (!(email && password)) {
            return res.send({
                status: false,
                message: "Please provide email and password"
            })
        }

        let checkemail = await knexConnect("user")
            .select()
            .where(
                {
                    "user_email": email
                }
            )

        if (checkemail.length == 0) {
            return res.send({
                status: false,
                message: "No such user exists"
            })
        }

        if (checkemail[0].user_active == "N") {
            return res.send({
                status: false,
                message: "User is blocked"
            })
        }

        let userdata = checkemail[0];

        let passwordcompare = await comparePassword(userdata.user_password, password);

        if (passwordcompare) {

            let encryptdata = {
                user_id: userdata.user_id,
                user_email: userdata.user_email
            }

            let tokengenerated = generateToken(encryptdata)

            let updatetoken = await knexConnect("user")
                .update({
                    "user_token_login": tokengenerated,
                    "user_updated_at": knexConnect.raw('UTC_TIMESTAMP()')
                })
                .where("user_id", userdata.user_id);

            delete userdata.user_active;
            delete userdata.user_token_login;
            delete userdata.user_password;


            const refreshTokenExpire = process.env.COOKIE_EXPIRE_TIME_HOURS;
            const refreshToken = generateRefreshToken(userdata.user_first_name);
            const accessToken = generateAccessToken(userdata.user_first_name);
            let now = new Date();
            const createdAt = date.format(now, 'YYYY-MM-DD HH:mm:ss');
            const expiryAt = date.format(date.addHours(now, +refreshTokenExpire), 'YYYY-MM-DD HH:mm:ss');
            const saveToken = await saveRefresh(userdata.user_first_name, refreshToken, createdAt, expiryAt);
            // res.cookie('refreshJwt', refreshToken, { httpOnly: true });
            res.cookie('refreshJwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: process.env.COOKIE_EXPIRE_TIME_HOURS * 60 * 60 * 1000 });



            return res.send({
                status: true,
                message: "Login Successfull",
                data: userdata,
                token: tokengenerated
            })

        }
        else {
            return res.send({
                status: false,
                message: "Password does not match",
            })
        }



    } catch (error) {
        return res.send({
            status: false,
            message: "Error Occured",
            data: error.message
        })
    }
}

const testMiddleware = async (req, res) => {

    res.send({
        "status": true,
        "userid": req.user_id,
        "email": req.user_email
    })

}

const logoutUser=async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshJwt) {
        res.status(200).json({ status: false, message: "No Cookie Found" });
    }
    else {
        const refreshToken = cookies.refreshJwt;
        const findRefresh = await checkRefresh(refreshToken);
        if (!findRefresh) {
            // res.clearCookie('refreshJwt', { httpOnly: true });
            res.cookie('refreshJwt', "", {
                httpOnly: true,
                sameSite: 'None', // Allow cross-site cookies
                secure: process.env.NODE_ENV === 'production', // Only set 'secure' in production environment
                maxAge: process.env.COOKIE_EXPIRE_TIME_HOURS * 60 * 60 * 1000
              });
            res.status(200).json({ status: true, message: "Admin Logged Out" });
        }
        else if (findRefresh) {
            const deleteToken = await deleteRefresh(refreshToken);
            // res.clearCookie('refreshJwt', { httpOnly: true });
            res.cookie('refreshJwt', "", {
                httpOnly: true,
                sameSite: 'None', // Allow cross-site cookies
                secure: process.env.NODE_ENV === 'production', // Only set 'secure' in production environment
                maxAge: process.env.COOKIE_EXPIRE_TIME_HOURS * 60 * 60 * 1000
              });
            res.status(200).json({ status: true, message: "Admin Logged Out" });
        }
    }
}

module.exports = { registerUser, loginUser, testMiddleware,logoutUser }
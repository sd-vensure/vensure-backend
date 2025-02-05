const argon2d = require("argon2");
const knexConnect = require("../../../knexConnection");
const { isValidEmail, isIndianMobileNumber } = require("./userHElper");
const { comparePassword, generateToken } = require("../../helpers");

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
        "status":true,
        "userid":req.user_id,
        "email":req.user_email
    })

}

module.exports = { registerUser, loginUser,testMiddleware }
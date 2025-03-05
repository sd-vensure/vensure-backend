const argon2d = require("argon2");
const knexConnect = require("../../../knexConnection");
const { isValidEmail, isIndianMobileNumber } = require("./userHElper");
const { comparePassword, generateToken, generateRefreshToken, generateAccessToken } = require("../../helpers");
const date = require('date-and-time');
const { saveRefresh, checkRefresh, deleteRefresh } = require("../refresh/refreshHelper");

const registerUser = async (req, res) => {
    let {
        user_first_name, user_last_name, user_email, user_contact, user_password, department_id, emp_id, designation, doj
    } = req.body;

    // console.log(req.body)

    const hashedpassword = await argon2d.hash(user_password);

    user_first_name = user_first_name.trim()
    user_last_name = user_last_name ? user_last_name.trim() : null
    user_email = user_email ? user_email.trim() : null
    designation = designation ? designation.trim() : null

    department_id = (department_id=="" || department_id==null) ? null:parseInt(department_id) ;
    doj = (doj=="" || doj==null) ? null : doj

    user_contact = user_contact ? user_contact.trim() : null

    // if (!isIndianMobileNumber(user_contact)) {
    //     return res.send({
    //         status: false,
    //         message: "Please send a proper Indian Number"
    //     })
    // }

    // if (!isValidEmail(user_email)) {
    //     return res.send({
    //         status: false,
    //         message: "Please provide a valid email"
    //     })
    // }

    try {

        let checkempidexist = await knexConnect("user")
            .select()
            .where({
                emp_id
            });

        if (checkempidexist.length > 0) {
            return res.send({
                status: false,
                message: "Employee ID already exists"
            })
        }

        let insertdata = await knexConnect("user")
            .insert({
                user_first_name, user_last_name, user_email, user_contact, "user_password": hashedpassword,
                department_id, emp_id, designation, doj,
                user_created_at: knexConnect.raw('UTC_TIMESTAMP()'),
                user_updated_at: knexConnect.raw('UTC_TIMESTAMP()'),
            });

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
        id, password
    } = req.body;

    id = id ? (id.trim()).toUpperCase() : null
    password = password ? password.trim() : null

    try {

        if (!(id && password)) {
            return res.send({
                status: false,
                message: "Please provide email and password"
            })
        }

        // let checkemail = await knexConnect("user")
        //     .select()
        //     .where(
        //         {
        //             "user_email": email
        //         }
        //     )

        let checkemail = await knexConnect('user')
            .select('*') // Select all columns from the user table
            .join('department', 'department.department_id', '=', 'user.department_id') // Perform the join
            .where('user.emp_id', id); // Filter by user_id

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
        // let department_id = checkemail[0].department_id;

        // let department_name = await knexConnect("department").select("*").where("department_id", department_id);

        // userdata = { ...userdata, "department_name": department_name[0].department_name };

        let passwordcompare = await comparePassword(userdata.user_password, password);

        if (passwordcompare) {

            let encryptdata = {
                user_id: userdata.user_id,
                user_email: userdata.user_email,
                user_name: userdata.user_first_name
            }

            // let tokengenerated = generateToken(encryptdata)

            delete userdata.user_active;
            delete userdata.user_token_login;
            delete userdata.user_password;

            let rolesreturn = (userdata.roles == "" || userdata.roles==null) ? [] : JSON.parse(userdata.roles)

            userdata = { ...userdata, "roles": rolesreturn }

            //Fetch Designated Person Name and ID

            let fetchdesignatedperson= await knexConnect('emp_reporting_mapper')
            .select('user.*', 'emp_reporting_mapper.*')
            .join('user', 'user.user_id', 'emp_reporting_mapper.reporting_id')
            .where('emp_reporting_mapper.emp_id', userdata.user_id);

            let departmenthead=null

            if(fetchdesignatedperson && Array.isArray(fetchdesignatedperson) && fetchdesignatedperson.length>0)
            {
                departmenthead={
                    "designation":fetchdesignatedperson[0].designation,
                    "department_id":fetchdesignatedperson[0].department_id,
                    "user_first_name":fetchdesignatedperson[0].user_first_name,
                    "user_contact":fetchdesignatedperson[0].user_contact,
                    "user_id":fetchdesignatedperson[0].user_id,
                }
            }

            const refreshTokenExpire = process.env.COOKIE_EXPIRE_TIME_HOURS;
            const refreshToken = generateRefreshToken(encryptdata);
            const accessToken = generateAccessToken(encryptdata);
            let now = new Date();
            const createdAt = date.format(now, 'YYYY-MM-DD HH:mm:ss');
            const expiryAt = date.format(date.addHours(now, +refreshTokenExpire), 'YYYY-MM-DD HH:mm:ss');
            const saveToken = await saveRefresh(userdata.user_first_name, refreshToken, createdAt, expiryAt);
            // res.cookie('refreshJwt', refreshToken, { httpOnly: true });
            res.cookie('refreshJwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: process.env.COOKIE_EXPIRE_TIME_HOURS * 60 * 60 * 1000 });


            return res.send({
                status: true,
                message: "Login Successfull",
                data: {...userdata,departmenthead},
                token: accessToken
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

const logoutUser = async (req, res) => {
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

const insertingvalues = async (req, res) => {

    try {

        let data = [
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": null,
                "master_subitem_id": null,
                "master_item_name": "CRITICAL ACTION POINTS"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4001",
                "master_subitem_id": null,
                "master_item_name": "CMO Finalization"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4002",
                "master_subitem_id": null,
                "master_item_name": "QbD batches "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4003",
                "master_subitem_id": null,
                "master_item_name": "API availability (500 gms)"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4004",
                "master_subitem_id": null,
                "master_item_name": "PSD Data for new batch"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4005",
                "master_subitem_id": null,
                "master_item_name": "Compatibility batches Analysis"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4006",
                "master_subitem_id": null,
                "master_item_name": "Reproducible Batches-(Dissolution Pending)"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4007",
                "master_subitem_id": null,
                "master_item_name": "Client Query Response"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4008",
                "master_subitem_id": null,
                "master_item_name": "PDE"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4009",
                "master_subitem_id": null,
                "master_item_name": "IPR clearance"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4010",
                "master_subitem_id": null,
                "master_item_name": "PDR"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4011",
                "master_subitem_id": null,
                "master_item_name": "6M data release"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4012",
                "master_subitem_id": null,
                "master_item_name": "Over all project presentation "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4013",
                "master_subitem_id": null,
                "master_item_name": "Over all project presentation "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4014",
                "master_subitem_id": null,
                "master_item_name": "Unknown Impurity conclusion"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4015",
                "master_subitem_id": null,
                "master_item_name": "Dissolution Method Report for Filling to be check"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4016",
                "master_subitem_id": null,
                "master_item_name": "Tech Pack sharing"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4017",
                "master_subitem_id": null,
                "master_item_name": "Buffer Capacity "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1001",
                "master_item_id": "4018",
                "master_subitem_id": null,
                "master_item_name": "Partical size verification(vimata lab)"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": null,
                "master_subitem_id": null,
                "master_item_name": "PROTOTYPE DEVELOPMENT STAGE"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4019",
                "master_subitem_id": null,
                "master_item_name": "PDS"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4020",
                "master_subitem_id": null,
                "master_item_name": "RLD availability- Pred Forte"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4021",
                "master_subitem_id": null,
                "master_item_name": "Q1Q2 sameness approval - Omnipred"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4022",
                "master_subitem_id": null,
                "master_item_name": "Reverse Engineering"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4023",
                "master_subitem_id": null,
                "master_item_name": "Samples for method development"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": null,
                "master_item_name": "Tentative analytical method development completion"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8001",
                "master_item_name": "Assay"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8002",
                "master_item_name": "Related Substance"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8003",
                "master_item_name": "Dissolution"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8004",
                "master_item_name": "PSD"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8005",
                "master_item_name": "Soluble prednisolone"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8006",
                "master_item_name": "Viscosity"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8007",
                "master_item_name": "Osmolarity"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8008",
                "master_item_name": "Surface tension"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4024",
                "master_subitem_id": "8009",
                "master_item_name": "BKC"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4025",
                "master_subitem_id": null,
                "master_item_name": "STP / MDR preparation "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4026",
                "master_subitem_id": null,
                "master_item_name": "STP / MDR Approval"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4027",
                "master_subitem_id": null,
                "master_item_name": "RLD Characterization "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4028",
                "master_subitem_id": null,
                "master_item_name": "RLD Characterization (Omnipred)"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4029",
                "master_subitem_id": null,
                "master_item_name": "Initial stability batches initiation "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4030",
                "master_subitem_id": null,
                "master_item_name": "Particle size reduction process optimization "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4031",
                "master_subitem_id": null,
                "master_item_name": "IIG clearance"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4032",
                "master_subitem_id": null,
                "master_item_name": "Characterization of test & reference as per BE recommendation"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4033",
                "master_subitem_id": null,
                "master_item_name": "1M Stability samples"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4034",
                "master_subitem_id": null,
                "master_item_name": "1M Stability analysis completion"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4035",
                "master_subitem_id": null,
                "master_item_name": "Trade dress finalisation"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4036",
                "master_subitem_id": null,
                "master_item_name": "Prototype Stability Initiation "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4037",
                "master_subitem_id": null,
                "master_item_name": "Prototype development with 1 M stability "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4038",
                "master_subitem_id": null,
                "master_item_name": "Final Stability Data 3M "
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4039",
                "master_subitem_id": null,
                "master_item_name": "Final Stability Data 6M"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4040",
                "master_subitem_id": null,
                "master_item_name": "Product Development Report Signoff"
            },
            {
                "master_type_id": "1",
                "master_header_id": "1002",
                "master_item_id": "4041",
                "master_subitem_id": null,
                "master_item_name": "TT Package Readiness"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": null,
                "master_subitem_id": null,
                "master_item_name": "T0 ACTIVITY"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4042",
                "master_subitem_id": null,
                "master_item_name": "PAF signing"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4043",
                "master_subitem_id": null,
                "master_item_name": "API source identification "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4044",
                "master_subitem_id": null,
                "master_item_name": "Availability of CoA, PSD data, CEP / DMF information"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4045",
                "master_subitem_id": null,
                "master_item_name": "Quotation from API supplier"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4046",
                "master_subitem_id": null,
                "master_item_name": "CDA Execution with API supplier"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4047",
                "master_subitem_id": null,
                "master_item_name": "Availability of open part DMF"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4048",
                "master_subitem_id": null,
                "master_item_name": "Finalization of API source "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4049",
                "master_subitem_id": null,
                "master_item_name": "Availability of T&A License"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4050",
                "master_subitem_id": null,
                "master_item_name": "Availability of import license (RLD)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4051",
                "master_subitem_id": null,
                "master_item_name": "Availability of import license (API)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4052",
                "master_subitem_id": null,
                "master_item_name": "IP Landscape by V-Ensure"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4053",
                "master_subitem_id": null,
                "master_item_name": "Formulation Development strategy"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4054",
                "master_subitem_id": null,
                "master_item_name": "Analytical method development strategy"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4055",
                "master_subitem_id": null,
                "master_item_name": "RA Strategy "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4056",
                "master_subitem_id": null,
                "master_item_name": "Procurement of innovator samples (RLD)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4057",
                "master_subitem_id": null,
                "master_item_name": "Procurement of API "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4058",
                "master_subitem_id": null,
                "master_item_name": "Procurement of raw material "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4059",
                "master_subitem_id": null,
                "master_item_name": "Procurement of packing material "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4060",
                "master_subitem_id": null,
                "master_item_name": "Procurement of columns, standards, impurities (Parallel)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1003",
                "master_item_id": "4061",
                "master_subitem_id": null,
                "master_item_name": "StageGate 0 Completion"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": null,
                "master_subitem_id": null,
                "master_item_name": "PROTOTYPE DEVELOPMENT STAGE"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4062",
                "master_subitem_id": null,
                "master_item_name": "PDS"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4063",
                "master_subitem_id": null,
                "master_item_name": "Samples for method development"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4064",
                "master_subitem_id": null,
                "master_item_name": "Analytical method development"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4064",
                "master_subitem_id": "8010",
                "master_item_name": "Assay"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4064",
                "master_subitem_id": "8011",
                "master_item_name": "Related Substance (RS,Robtness,FD)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4064",
                "master_subitem_id": "8012",
                "master_item_name": "Dissolution"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4065",
                "master_subitem_id": null,
                "master_item_name": "MDR "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4065",
                "master_subitem_id": "8013",
                "master_item_name": "Assay"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4065",
                "master_subitem_id": "8014",
                "master_item_name": "Related Substance"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4065",
                "master_subitem_id": "8015",
                "master_item_name": "Dissolution"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4066",
                "master_subitem_id": null,
                "master_item_name": "STP"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4066",
                "master_subitem_id": "8016",
                "master_item_name": "Assay"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4066",
                "master_subitem_id": "8017",
                "master_item_name": "Related Substance"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4066",
                "master_subitem_id": "8018",
                "master_item_name": "Dissolution"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4067",
                "master_subitem_id": null,
                "master_item_name": "API Characterization \n(Physical and minimum Chemical Analysis) "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4068",
                "master_subitem_id": null,
                "master_item_name": "RLD Characterization \n(Physical and minimum Chemical Analysis) "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4069",
                "master_subitem_id": null,
                "master_item_name": "Preformulation Study data \n(Solubility and DECS)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4070",
                "master_subitem_id": null,
                "master_item_name": "Initial stability batches initiation (1st)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4071",
                "master_subitem_id": null,
                "master_item_name": "Multimedia Dissolution Matching / Discrimination Method Development Report Sign Off"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4072",
                "master_subitem_id": null,
                "master_item_name": "Tooling finalization"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4073",
                "master_subitem_id": null,
                "master_item_name": "Breakability study"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4074",
                "master_subitem_id": null,
                "master_item_name": "Dissolution comparison with bio strength"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4075",
                "master_subitem_id": null,
                "master_item_name": "IIG clearance"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4076",
                "master_subitem_id": null,
                "master_item_name": "IP Clearance"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4077",
                "master_subitem_id": null,
                "master_item_name": "Trade dress finalisation"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4078",
                "master_subitem_id": null,
                "master_item_name": "Final Stability Initiation"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4079",
                "master_subitem_id": null,
                "master_item_name": "Final Stability batch initial analysis"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4080",
                "master_subitem_id": null,
                "master_item_name": "Final development with 1 M stability"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4081",
                "master_subitem_id": null,
                "master_item_name": "Final Stability Data 3M/6M "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1004",
                "master_item_id": "4082",
                "master_subitem_id": null,
                "master_item_name": "FINAL FORMULA AND PROCESS FOR IP CLEARANCE (PILOT STAGE)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": null,
                "master_subitem_id": null,
                "master_item_name": "READY FOR PILOT BE"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4083",
                "master_subitem_id": null,
                "master_item_name": "BE center finalization & protocol initiation"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4084",
                "master_subitem_id": null,
                "master_item_name": "BE NOC & RLD license application & receipt"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4085",
                "master_subitem_id": null,
                "master_item_name": "VSRs of Pilot BE Proposed Composition and docs upload in Provision Software"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4086",
                "master_subitem_id": null,
                "master_item_name": "Biowaiver"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4087",
                "master_subitem_id": null,
                "master_item_name": "RLD procurement for Pilot & Pivotal BE"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4088",
                "master_subitem_id": null,
                "master_item_name": "Elemental Impurity Assessment for final formula"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4089",
                "master_subitem_id": null,
                "master_item_name": "Nitrosomine of final formula "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4090",
                "master_subitem_id": null,
                "master_item_name": "10-15 Pager Development Report to Justify about the selection of manufacturing process and How you arraived at the Pilot BE Compsosition"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4091",
                "master_subitem_id": null,
                "master_item_name": "QbD/ OFAT Design Finalization  (for Process Optimization Batches relavant to Pilot Bio Formula, as a minimum Requirements)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4092",
                "master_subitem_id": null,
                "master_item_name": "QbD/ OFAT Trials Complition (for Process Optimization Batches relavant to Pilot Bio Formula, as a minimum Requirements)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4093",
                "master_subitem_id": null,
                "master_item_name": "IP Clearance sign off  Before Pilot BE Studies"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4094",
                "master_subitem_id": null,
                "master_item_name": "Stage Gate - 2 Presentation\n(Permission for Pilot Bio Initiation or Skip) (PPT sign Off)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4095",
                "master_subitem_id": null,
                "master_item_name": "Batch manufacturing for pilot BE"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4096",
                "master_subitem_id": null,
                "master_item_name": "Sample availability at BE center (Pilot BE)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1005",
                "master_item_id": "4097",
                "master_subitem_id": null,
                "master_item_name": "Successful Pilot BE Studies completion"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": null,
                "master_subitem_id": null,
                "master_item_name": "AMV, SCALE-UP, EB & PIVOTAL BE"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4098",
                "master_subitem_id": null,
                "master_item_name": "Sending Samples for Method validation  (Post Pilot BE Clearance) Justification Note if samples given for AMV, Before Pilot BE Clearance "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4099",
                "master_subitem_id": null,
                "master_item_name": "TT Documents Draft Readiness as per FRD TT Checklist "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4100",
                "master_subitem_id": null,
                "master_item_name": "TT Documents Draft Readiness as per FRD TT Checklist "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4101",
                "master_subitem_id": null,
                "master_item_name": "QbD Protocol Sign Off "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4102",
                "master_subitem_id": null,
                "master_item_name": "QbD Studies Completion and Report Sign Off"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4103",
                "master_subitem_id": null,
                "master_item_name": "API , excipient method feasibility "
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4104",
                "master_subitem_id": null,
                "master_item_name": "Interim PDR upto Section 2.3.4 (Updated risk Assessment of the Manufacturing Process, Lab Scale and Updated Stability, Photostability and XRD Data for PDR, Review and Sign Off) Rest of the Points As Blank Template"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4105",
                "master_subitem_id": null,
                "master_item_name": "Method validation Protocol preparation"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4106",
                "master_subitem_id": null,
                "master_item_name": "Method feasibility & AMV requirement procurment"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4107",
                "master_subitem_id": null,
                "master_item_name": "AMV Initiation"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4108",
                "master_subitem_id": null,
                "master_item_name": "AMV completion"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4109",
                "master_subitem_id": null,
                "master_item_name": "Scale-up batch manufacturing"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4110",
                "master_subitem_id": null,
                "master_item_name": "Scale-up report signoff"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4111",
                "master_subitem_id": null,
                "master_item_name": "Stage Gate - IV PPT (Permission For taking  Exhibit Batch)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4112",
                "master_subitem_id": null,
                "master_item_name": "Exhibit batch manufacturing"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4113",
                "master_subitem_id": null,
                "master_item_name": "Exhibit batch stability loading"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4114",
                "master_subitem_id": null,
                "master_item_name": "Identification of CRO for Pivotal BE studies"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4115",
                "master_subitem_id": null,
                "master_item_name": "Getting quotation and Design Finalization (Pivotal)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4116",
                "master_subitem_id": null,
                "master_item_name": "Pivotal BE NOC Application filling"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4117",
                "master_subitem_id": null,
                "master_item_name": "Pivotal BE NOC Availability"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4118",
                "master_subitem_id": null,
                "master_item_name": "RLD Procurement Completion for Pivotal BE"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4119",
                "master_subitem_id": null,
                "master_item_name": "Exhibit Batch Stability Data review upto 2M   (Minimum before Pivotal BE)"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4120",
                "master_subitem_id": null,
                "master_item_name": "Pivotal BE initiation"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4121",
                "master_subitem_id": null,
                "master_item_name": "Successful Pivotal BE Studies completion"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4122",
                "master_subitem_id": null,
                "master_item_name": "6M Stability of EB"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4123",
                "master_subitem_id": null,
                "master_item_name": "PDR Signoff"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4124",
                "master_subitem_id": null,
                "master_item_name": "Product Filing"
            },
            {
                "master_type_id": "2",
                "master_header_id": "1006",
                "master_item_id": "4125",
                "master_subitem_id": null,
                "master_item_name": "Deficency Queries and Approval Stage"
            }
        ]

        let insertresp = await knexConnect("master_form")
            .insert(data)

        return res.send(true)

    } catch (error) {
        console.log(error)
        return res.send(false)
    }
}

module.exports = { registerUser, loginUser, testMiddleware, logoutUser, insertingvalues }
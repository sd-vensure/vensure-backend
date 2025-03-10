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

    department_id = (department_id == "" || department_id == null) ? null : parseInt(department_id);
    doj = (doj == "" || doj == null) ? null : doj

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

            let rolesreturn = (userdata.roles == "" || userdata.roles == null) ? [] : JSON.parse(userdata.roles)

            userdata = { ...userdata, "roles": rolesreturn }

            //Fetch Designated Person Name and ID

            let fetchdesignatedperson = await knexConnect('emp_reporting_mapper')
                .select('user.*', 'emp_reporting_mapper.*','user.emp_id as main_emp_id')
                .join('user', 'user.user_id', 'emp_reporting_mapper.reporting_id')
                .where('emp_reporting_mapper.emp_id', userdata.user_id);

            let departmenthead = null

            if (fetchdesignatedperson && Array.isArray(fetchdesignatedperson) && fetchdesignatedperson.length > 0) {
                departmenthead = {
                    "designation": fetchdesignatedperson[0].designation,
                    "department_id": fetchdesignatedperson[0].department_id,
                    "user_first_name": fetchdesignatedperson[0].user_first_name,
                    "user_contact": fetchdesignatedperson[0].user_contact,
                    "user_id": fetchdesignatedperson[0].user_id,
                    "emp_id": fetchdesignatedperson[0].main_emp_id            
                }
            }

            const refreshTokenExpire = process.env.COOKIE_EXPIRE_TIME_HOURS;
            const refreshToken = generateRefreshToken(encryptdata);
            const accessToken = generateAccessToken(encryptdata);
            let now = new Date();
            const createdAt = date.format(now, 'YYYY-MM-DD HH:mm:ss');
            const expiryAt = date.format(date.addHours(now, +refreshTokenExpire), 'YYYY-MM-DD HH:mm:ss');
            const saveToken = await saveRefresh(userdata.user_first_name, refreshToken, createdAt, expiryAt);
            res.cookie('refreshJwt', refreshToken, { httpOnly: true });
            // res.cookie('refreshJwt', refreshToken, { httpOnly: false, sameSite: 'None', secure: true, maxAge: process.env.COOKIE_EXPIRE_TIME_HOURS * 60 * 60 * 1000 });


            return res.send({
                status: true,
                message: "Login Successfull",
                data: { ...userdata, departmenthead },
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

const updatePassword = async (req, res) => {

    let user_id = req.user_id || null;
    let password = req.body.password || null;


    if (!user_id) {
        return res.send({
            status: false,
            message: "User ID not recieved"
        })
    }

    if (!password) {
        return res.send({
            status: false,
            message: "Please send password"
        })
    }

    try {

        const hashedpassword = await argon2d.hash(password);

        let updatepass = await knexConnect("user").update({
            "user_password": hashedpassword,
            "change_password": "N"
        }).where("user_id", user_id)

        return res.send({
            status: true,
            message: "Password Updated"
        })

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
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

const insertingvalueshod = async (req, res) => {

    try {

        let data =
            [
                {
                    "user_first_name": "Abhinav Kumar Narendra Singh",
                    "emp_id": "IDVE850",
                    "department_id": "14",
                    "user_password": "IDVE850",
                    "designation": "Assistant Manager ",
                    "doj": "2024-05-14"
                },
                {
                    "user_first_name": "Amit Chandrakant Patil",
                    "emp_id": "IDVE860",
                    "department_id": "14",
                    "user_password": "IDVE860",
                    "designation": "Sr. Executive",
                    "doj": "2024-06-19"
                },
                {
                    "user_first_name": "Amol Gadhave",
                    "emp_id": "IDVE471",
                    "department_id": "2",
                    "user_password": "IDVE471",
                    "designation": "Assistant Manager ",
                    "doj": "2021-12-01"
                },
                {
                    "user_first_name": "Anand Kumar Shukla",
                    "emp_id": "IDVE865",
                    "department_id": "2",
                    "user_password": "IDVE865",
                    "designation": "Manager",
                    "doj": "2024-07-16"
                },
                {
                    "user_first_name": "Ankush Ravindra Deshmukh",
                    "emp_id": "IDVE847",
                    "department_id": "20",
                    "user_password": "IDVE847",
                    "designation": "Asst. Manager",
                    "doj": "2024-05-06"
                },
                {
                    "user_first_name": "Apurva Goje",
                    "emp_id": "IDVE813",
                    "department_id": "9",
                    "user_password": "IDVE813",
                    "designation": "Sr. Officer",
                    "doj": "2024-02-19"
                },
                {
                    "user_first_name": "Arjun Chopra",
                    "emp_id": "IDVE370",
                    "department_id": "6",
                    "user_password": "IDVE370",
                    "designation": "Manager",
                    "doj": "2021-03-19"
                },
                {
                    "user_first_name": "Ashwin trinidad",
                    "emp_id": "IDVE849",
                    "department_id": "1",
                    "user_password": "IDVE849",
                    "designation": "CFO",
                    "doj": "2024-05-07"
                },
                {
                    "user_first_name": "Avinash Jaiswal",
                    "emp_id": "IDVE171",
                    "department_id": "20",
                    "user_password": "IDVE171",
                    "designation": "Deputy General Manager",
                    "doj": "2016-10-17"
                },
                {
                    "user_first_name": "Avinash Nimbaji Salunkhe",
                    "emp_id": "IDVE307",
                    "department_id": "9",
                    "user_password": "IDVE307",
                    "designation": "Senior Manager",
                    "doj": "2021-09-22"
                },
                {
                    "user_first_name": "Bandu Sandurao Birsane",
                    "emp_id": "IDVE737",
                    "department_id": "20",
                    "user_password": "IDVE737",
                    "designation": "Manager",
                    "doj": "2023-06-05"
                },
                {
                    "user_first_name": "Bhakti Basare",
                    "emp_id": "IDVE612",
                    "department_id": "7",
                    "user_password": "IDVE612",
                    "designation": "Research Scientist",
                    "doj": "2022-06-13"
                },
                {
                    "user_first_name": "Bibhuti Ray",
                    "emp_id": "IDVE916",
                    "department_id": "6",
                    "user_password": "IDVE916",
                    "designation": "Dy. Manager",
                    "doj": "2024-12-23"
                },
                {
                    "user_first_name": "Deepak Shivaji Fulmali",
                    "emp_id": "IDVE771",
                    "department_id": "18",
                    "user_password": "IDVE771",
                    "designation": "Sr. Manager",
                    "doj": "2023-10-09"
                },
                {
                    "user_first_name": "Dinesh Rohidas Rathod",
                    "emp_id": "IDVE908",
                    "department_id": "7",
                    "user_password": "IDVE908",
                    "designation": "Sr. Research Scientist",
                    "doj": "2024-12-12"
                },
                {
                    "user_first_name": "Gaurav Dhamane",
                    "emp_id": "IDVE414",
                    "department_id": "10",
                    "user_password": "IDVE414",
                    "designation": "Manager",
                    "doj": "2021-07-09"
                },
                {
                    "user_first_name": "Girish Pande",
                    "emp_id": "IDVE241",
                    "department_id": "14",
                    "user_password": "IDVE241",
                    "designation": "Assistant General Manager",
                    "doj": "2018-12-26"
                },
                {
                    "user_first_name": "Gorakh Nirmal",
                    "emp_id": "IDVE395",
                    "department_id": "20",
                    "user_password": "IDVE395",
                    "designation": "Sr. VP",
                    "doj": "2021-06-12"
                },
                {
                    "user_first_name": "Kanhu Charan Harihar Pradhan",
                    "emp_id": "IDVE745",
                    "department_id": "2",
                    "user_password": "IDVE745",
                    "designation": "Manager",
                    "doj": "2023-07-17"
                },
                {
                    "user_first_name": "Kavita Hanumant Shinde",
                    "emp_id": "IDVE884",
                    "department_id": "3",
                    "user_password": "IDVE884",
                    "designation": "Deputy Manager",
                    "doj": "2024-09-27"
                },
                {
                    "user_first_name": "Khemchandra Murlidhar Dadare",
                    "emp_id": "IDVE569",
                    "department_id": "2",
                    "user_password": "IDVE569",
                    "designation": "Senior Manager",
                    "doj": "2022-03-22"
                },
                {
                    "user_first_name": "Kunwar Satyaprakash Singh",
                    "emp_id": "IDVE725",
                    "department_id": "20",
                    "user_password": "IDVE725",
                    "designation": "Manager",
                    "doj": "2023-04-12"
                },
                {
                    "user_first_name": "Manoj Ramdas Ghogare",
                    "emp_id": "IDVE084",
                    "department_id": "6",
                    "user_password": "IDVE084",
                    "designation": "Assistant Manager ",
                    "doj": "2014-04-18"
                },
                {
                    "user_first_name": "Mudit Srivastava",
                    "emp_id": "IDVE356",
                    "department_id": "6",
                    "user_password": "IDVE356",
                    "designation": "Manager",
                    "doj": "2021-03-04"
                },
                {
                    "user_first_name": "Narayan Raktade",
                    "emp_id": "IDVE003",
                    "department_id": "3",
                    "user_password": "IDVE003",
                    "designation": "General Manager",
                    "doj": "2010-10-16"
                },
                {
                    "user_first_name": "Naveen Karupothula",
                    "emp_id": "IDVE936",
                    "department_id": "15",
                    "user_password": "IDVE936",
                    "designation": "Manager",
                    "doj": "2025-01-27"
                },
                {
                    "user_first_name": "Paras Pravin Sathbhaya",
                    "emp_id": "IDVE253",
                    "department_id": "1",
                    "user_password": "IDVE253",
                    "designation": "Deputy General Manager",
                    "doj": "2019-03-18"
                },
                {
                    "user_first_name": "Prakash Maruti Devan",
                    "emp_id": "IDVE945",
                    "department_id": "24",
                    "user_password": "IDVE945",
                    "designation": "Manager",
                    "doj": "2025-02-08"
                },
                {
                    "user_first_name": "Pranali Manore",
                    "emp_id": "IDVE429",
                    "department_id": "9",
                    "user_password": "IDVE429",
                    "designation": "Sr. Executive",
                    "doj": "2021-08-04"
                },
                {
                    "user_first_name": "Randheer Deepnarayan Singh",
                    "emp_id": "IDVE153",
                    "department_id": "6",
                    "user_password": "IDVE153",
                    "designation": "Assistant General Manager",
                    "doj": "2016-04-13"
                },
                {
                    "user_first_name": "Ranjita Tabib",
                    "emp_id": "IDVE788",
                    "department_id": "6",
                    "user_password": "IDVE788",
                    "designation": "Deputy Manager",
                    "doj": "2023-11-29"
                },
                {
                    "user_first_name": "Rohan Deepak Zade",
                    "emp_id": "IDVE942",
                    "department_id": "20",
                    "user_password": "IDVE942",
                    "designation": "Manager",
                    "doj": "2025-02-06"
                },
                {
                    "user_first_name": "Rushikesh Harish Dhankute",
                    "emp_id": "IDVE924",
                    "department_id": "3",
                    "user_password": "IDVE924",
                    "designation": "Dy. Manager",
                    "doj": "2025-01-08"
                },
                {
                    "user_first_name": "Sachin Galande",
                    "emp_id": "IDVE491",
                    "department_id": "20",
                    "user_password": "IDVE491",
                    "designation": "Manager",
                    "doj": "2022-01-20"
                },
                {
                    "user_first_name": "Sachin Mirge",
                    "emp_id": "IDVE689",
                    "department_id": "7",
                    "user_password": "IDVE689",
                    "designation": "Assistant Manager",
                    "doj": "2022-12-05"
                },
                {
                    "user_first_name": "Sachin Vilas Deshmukh",
                    "emp_id": "IDVE013",
                    "department_id": "3",
                    "user_password": "IDVE013",
                    "designation": "Deputy Manager ",
                    "doj": "2011-08-05"
                },
                {
                    "user_first_name": "Sagar Bajirao Jagadale",
                    "emp_id": "IDVE925",
                    "department_id": "2",
                    "user_password": "IDVE925",
                    "designation": "Assistant Manager",
                    "doj": "2025-01-10"
                },
                {
                    "user_first_name": "Sanjay Shankar Jadhav",
                    "emp_id": "IDVE646",
                    "department_id": "2",
                    "user_password": "IDVE646",
                    "designation": "Deputy General Manager",
                    "doj": "2022-08-17"
                },
                {
                    "user_first_name": "Saswat Padhi",
                    "emp_id": "IDVE007",
                    "department_id": "7",
                    "user_password": "IDVE007",
                    "designation": "Deputy General Manager",
                    "doj": "2010-09-01"
                },
                {
                    "user_first_name": "Shivaprasad Venkateshwarlu Vemula",
                    "emp_id": "IDVE160",
                    "department_id": "11",
                    "user_password": "IDVE160",
                    "designation": "Manager",
                    "doj": "2016-06-01"
                },
                {
                    "user_first_name": "Soma De",
                    "emp_id": "IDVE727",
                    "department_id": "8",
                    "user_password": "IDVE727",
                    "designation": "Sterile Head",
                    "doj": "2023-04-24"
                },
                {
                    "user_first_name": "Subhash Maruti Nile",
                    "emp_id": "IDVE114",
                    "department_id": "3",
                    "user_password": "IDVE114",
                    "designation": "Deputy Manager",
                    "doj": "2015-02-09"
                },
                {
                    "user_first_name": "Sujit Ganpat Kadam",
                    "emp_id": "IDVE888",
                    "department_id": "5",
                    "user_password": "IDVE888",
                    "designation": "Manager",
                    "doj": "2024-10-07"
                },
                {
                    "user_first_name": "Sujit Sakpal",
                    "emp_id": "IDVE477",
                    "department_id": "17",
                    "user_password": "IDVE477",
                    "designation": "President",
                    "doj": "2021-12-01"
                },
                {
                    "user_first_name": "Swapnil Yashwant Bhide",
                    "emp_id": "IDVE449",
                    "department_id": "13",
                    "user_password": "IDVE449",
                    "designation": "Assistant Manager ",
                    "doj": "2021-09-20"
                },
                {
                    "user_first_name": "Vaishali Rajendra Dumbre",
                    "emp_id": "IDVE211",
                    "department_id": "19",
                    "user_password": "IDVE211",
                    "designation": "Manager",
                    "doj": "2018-04-25"
                }
                ,

                {
                    "user_first_name": "Sathyanarayana Vemula",
                    "emp_id": "SATHYA",
                    "department_id": "25",
                    "user_password": "Sathya",
                    "designation": "CEO",
                    "doj": "2010-01-01"
                },
                {
                    "user_first_name": "Nirav Vashi",
                    "emp_id": "NIRAV",
                    "department_id": "25",
                    "user_password": "NIRAV",
                    "designation": "Business Development",
                    "doj": "2010-01-01"
                }
            ]

        const datatopush = await Promise.all(
            data.map(async (ele) => ({
                ...ele,
                user_password: await argon2d.hash(ele.user_password)
            }))
        );

        let insertresp = await knexConnect("user")
            .insert(datatopush)

        return res.send(datatopush)

    } catch (error) {
        console.log(error)
        return res.send(false)
    }
}


const insertingvaluesemp = async (req, res) => {

    try {

        let data = [
            {
                "emp_id": "5404",
                "user_first_name": "Aditi Rajendra Khatal",
                "designation": "Apprentice",
                "doj": "2025-02-24",
                "user_password": "5404",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE911",
                "user_first_name": "Ajay Sharad Tarwade",
                "designation": "Associate",
                "doj": "2024-12-16",
                "user_password": "IDVE911",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE770",
                "user_first_name": "Ajit Jagannath Raut",
                "designation": "Sr. Officer",
                "doj": "2023-10-09",
                "user_password": "IDVE770",
                "department_id": "13"
            },
            {
                "emp_id": "5406",
                "user_first_name": "Akash Narayan Pawar",
                "designation": "Apprentice",
                "doj": "2025-02-24",
                "user_password": "5406",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE613",
                "user_first_name": "Akash Uttam Kasbe",
                "designation": "Assistant Manager ",
                "doj": "2022-06-14",
                "user_password": "IDVE613",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE705",
                "user_first_name": "Akhil Ashok Shinde",
                "designation": "Sr. Officer",
                "doj": "2023-01-04",
                "user_password": "IDVE705",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE796",
                "user_first_name": "Akhilesh Kumar Nayak",
                "designation": "Jr. Officer",
                "doj": "2023-12-01",
                "user_password": "IDVE796",
                "department_id": "1"
            },
            {
                "emp_id": "IDVE874",
                "user_first_name": "Akshata Mohan Gharat",
                "designation": "Officer",
                "doj": "2024-08-26",
                "user_password": "IDVE874",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE774",
                "user_first_name": "Akshay Ashok Jailkar",
                "designation": "Officer",
                "doj": "2023-10-09",
                "user_password": "IDVE774",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE856",
                "user_first_name": "Akshay Datta Bekawade",
                "designation": "Jr. Operator",
                "doj": "2024-06-10",
                "user_password": "IDVE856",
                "department_id": "16"
            },
            {
                "emp_id": "IDVE802",
                "user_first_name": "Akshay Mane",
                "designation": "Assistant Manager ",
                "doj": "2024-01-04",
                "user_password": "IDVE802",
                "department_id": "11"
            },
            {
                "emp_id": "IDVE930",
                "user_first_name": "Akshay Prakash Langade",
                "designation": "Office",
                "doj": "2025-01-20",
                "user_password": "IDVE930",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE803",
                "user_first_name": "Akshay Samadhan Sapkal",
                "designation": "Officer",
                "doj": "2024-01-04",
                "user_password": "IDVE803",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE851",
                "user_first_name": "Amey Padge",
                "designation": "Jr. Officer ",
                "doj": "2024-05-15",
                "user_password": "IDVE851",
                "department_id": "9"
            },
            {
                "emp_id": "IDVE829",
                "user_first_name": "Amit Sambhaji Yadav",
                "designation": "Officer",
                "doj": "2024-03-21",
                "user_password": "IDVE829",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE748",
                "user_first_name": "Amol Arun Shinde",
                "designation": "Officer",
                "doj": "2023-07-24",
                "user_password": "IDVE748",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE890",
                "user_first_name": "Amol Sudhakar Patil",
                "designation": "Sr. Officer",
                "doj": "2024-10-25",
                "user_password": "IDVE890",
                "department_id": "13"
            },
            {
                "emp_id": "IDVE741",
                "user_first_name": "Aniket Ithape",
                "designation": "Research Associate",
                "doj": "2023-06-12",
                "user_password": "IDVE741",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE941",
                "user_first_name": "Aniket Machindra More",
                "designation": "Officer",
                "doj": "2025-02-12",
                "user_password": "IDVE941",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE923",
                "user_first_name": "Aniket Nandkumar Vagare",
                "designation": "Research Associate",
                "doj": "2025-01-08",
                "user_password": "IDVE923",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE713",
                "user_first_name": "Aniket Ramchandra Narute",
                "designation": "JTO",
                "doj": "2023-02-13",
                "user_password": "IDVE713",
                "department_id": "18"
            },
            {
                "emp_id": "6040",
                "user_first_name": "Aniket Sanjay Bahiral",
                "designation": "Apprentice",
                "doj": "2025-01-20",
                "user_password": "6040",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE066",
                "user_first_name": "Anil Pundlik Patil",
                "designation": "Senior Manager",
                "doj": "2013-08-21",
                "user_password": "IDVE066",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE879",
                "user_first_name": "Anjali Dnyaneshwar Vethekar",
                "designation": "Executive ",
                "doj": "2024-09-16",
                "user_password": "IDVE879",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE753",
                "user_first_name": "Aparna Sushant Gaikwad",
                "designation": "Sr. Officer",
                "doj": "2023-08-16",
                "user_password": "IDVE753",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE761",
                "user_first_name": "Apurva Jain",
                "designation": "Sr. Officer",
                "doj": "2023-09-04",
                "user_password": "IDVE761",
                "department_id": "5"
            },
            {
                "emp_id": "IDVE718",
                "user_first_name": "Archana Chavan",
                "designation": "Executive",
                "doj": "2023-03-21",
                "user_password": "IDVE718",
                "department_id": "2"
            },
            {
                "emp_id": "5263",
                "user_first_name": "Arham Shahnawaz Khan",
                "designation": "Apprentice",
                "doj": "2024-04-15",
                "user_password": "5263",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE951",
                "user_first_name": "Arvind Mangal Patil",
                "designation": "Operator",
                "doj": "2025-02-18",
                "user_password": "IDVE951",
                "department_id": "16"
            },
            {
                "emp_id": "IDVE854",
                "user_first_name": "Ashish Kekan",
                "designation": "Research Associate ",
                "doj": "2024-06-03",
                "user_password": "IDVE854",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE871",
                "user_first_name": "Ashutosh Tarkeshwar Singh",
                "designation": "Manager",
                "doj": "2024-08-05",
                "user_password": "IDVE871",
                "department_id": "1"
            },
            {
                "emp_id": "IDVE216",
                "user_first_name": "Atish Maruti Desai",
                "designation": "Senior Officer Documentation ",
                "doj": "2018-07-02",
                "user_password": "IDVE216",
                "department_id": "5"
            },
            {
                "emp_id": "IDVE661",
                "user_first_name": "Avantika Santosh Mande",
                "designation": "Jr. Research Associate",
                "doj": "2022-10-06",
                "user_password": "IDVE661",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE781",
                "user_first_name": "Avinash Swami",
                "designation": "Research Associate",
                "doj": "2023-10-20",
                "user_password": "IDVE781",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE454",
                "user_first_name": "Bhagyashree Shelke",
                "designation": "Officer",
                "doj": "2021-10-11",
                "user_password": "IDVE454",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE792",
                "user_first_name": "Bhakti Patil",
                "designation": "Jr. Research Associate",
                "doj": "2023-12-06",
                "user_password": "IDVE792",
                "department_id": "5"
            },
            {
                "emp_id": "IDVE299",
                "user_first_name": "Bhimrao Budhappa Nagansure",
                "designation": "Jr. Officer",
                "doj": "2020-08-01",
                "user_password": "IDVE299",
                "department_id": "22"
            },
            {
                "emp_id": "IDVE401",
                "user_first_name": "Bhushan Krishna Raut",
                "designation": "Sr. Officer",
                "doj": "2021-06-23",
                "user_password": "IDVE401",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE883",
                "user_first_name": "Chandrakant Kantilal Badgujar",
                "designation": "Executive ",
                "doj": "2024-09-23",
                "user_password": "IDVE883",
                "department_id": "2"
            },
            {
                "emp_id": "6041",
                "user_first_name": "Chandraprakash Ramesh Deore",
                "designation": "Apprentice",
                "doj": "2025-01-20",
                "user_password": "6041",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE932",
                "user_first_name": "Chetan Patil",
                "designation": "Operator",
                "doj": "2025-01-23",
                "user_password": "IDVE932",
                "department_id": "16"
            },
            {
                "emp_id": "IDVE919",
                "user_first_name": "Chetan Pradip Kate",
                "designation": "Officer",
                "doj": "2025-01-08",
                "user_password": "IDVE919",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE159",
                "user_first_name": "Chutra M. Gurung",
                "designation": "Deputy Manager ",
                "doj": "2016-05-26",
                "user_password": "IDVE159",
                "department_id": "1"
            },
            {
                "emp_id": "IDVE644",
                "user_first_name": "Darshana Pranay Pashte",
                "designation": "Sr. Officer",
                "doj": "2022-08-16",
                "user_password": "IDVE644",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE937",
                "user_first_name": "Dattatray Bharat Patil",
                "designation": "Sr. Officer",
                "doj": "2025-01-27",
                "user_password": "IDVE937",
                "department_id": "16"
            },
            {
                "emp_id": "6031",
                "user_first_name": "Debasis Gantayat",
                "designation": "Apprentice",
                "doj": "2024-11-25",
                "user_password": "6031",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE835",
                "user_first_name": "Deepak Nanasaheb Dawange",
                "designation": "Officer",
                "doj": "2024-04-04",
                "user_password": "IDVE835",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE608",
                "user_first_name": "Dhananjay Ashok Netake",
                "designation": "Jr. Officer",
                "doj": "2022-06-08",
                "user_password": "IDVE608",
                "department_id": "14"
            },
            {
                "emp_id": "5389",
                "user_first_name": "Digambar Rajendra Salunkhe",
                "designation": "Apprentice",
                "doj": "2025-02-03",
                "user_password": "5389",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE776",
                "user_first_name": "Dinesh Sampat Bhabad",
                "designation": "Officer",
                "doj": "2023-10-16",
                "user_password": "IDVE776",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE848",
                "user_first_name": "Dipesh Dilip Bhagane",
                "designation": "Officer",
                "doj": "2024-05-06",
                "user_password": "IDVE848",
                "department_id": "20"
            },
            {
                "emp_id": "6025",
                "user_first_name": "Dnyandev Shejwal",
                "designation": "Apprentice",
                "doj": "2024-09-03",
                "user_password": "6025",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE863",
                "user_first_name": "Dnyaneshwar Laxman Parte",
                "designation": "Assistant Manager ",
                "doj": "2024-07-05",
                "user_password": "IDVE863",
                "department_id": "1"
            },
            {
                "emp_id": "IDVE552",
                "user_first_name": "Ganesh Karwar",
                "designation": "Research Scientist",
                "doj": "2022-02-14",
                "user_password": "IDVE552",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE772",
                "user_first_name": "Ganesh Vasant Pawale",
                "designation": "Sr. Officer",
                "doj": "2023-10-09",
                "user_password": "IDVE772",
                "department_id": "13"
            },
            {
                "emp_id": "IDVE610",
                "user_first_name": "Gaurav Bagul",
                "designation": "Research Scientist",
                "doj": "2022-06-13",
                "user_password": "IDVE610",
                "department_id": "3"
            },
            {
                "emp_id": "6022",
                "user_first_name": "Girisha Chaudhari",
                "designation": "Apprentice",
                "doj": "2024-09-03",
                "user_password": "6022",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE359",
                "user_first_name": "Gopal Bhawsar",
                "designation": "Assistant Manager ",
                "doj": "2021-03-05",
                "user_password": "IDVE359",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE560",
                "user_first_name": "Haresh Bhopi",
                "designation": "Technical Officer",
                "doj": "2022-03-01",
                "user_password": "IDVE560",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE723",
                "user_first_name": "Haresh Patil",
                "designation": "Officer",
                "doj": "2023-04-11",
                "user_password": "IDVE723",
                "department_id": "11"
            },
            {
                "emp_id": "6026",
                "user_first_name": "Harshad Lalaso Pawar",
                "designation": "Apprentice",
                "doj": "2024-09-09",
                "user_password": "6026",
                "department_id": "5"
            },
            {
                "emp_id": "IDVE878",
                "user_first_name": "Harshada Karnakal",
                "designation": "Research Associate",
                "doj": "2024-09-16",
                "user_password": "IDVE878",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE899",
                "user_first_name": "Harshal Santosh More",
                "designation": "Associate",
                "doj": "2024-12-02",
                "user_password": "IDVE899",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE954",
                "user_first_name": "Harshal Supadu Patil",
                "designation": "Apprentice",
                "doj": "2025-02-24",
                "user_password": "IDVE954",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE682",
                "user_first_name": "Himanee Vijay Gharat",
                "designation": "Research Associate",
                "doj": "2022-11-14",
                "user_password": "IDVE682",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE901",
                "user_first_name": "Himanshu Maurya",
                "designation": "Officer",
                "doj": "2024-12-02",
                "user_password": "IDVE901",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE907",
                "user_first_name": "Himanshu Suresh Patil",
                "designation": "Jr. Research Associate",
                "doj": "2024-12-09",
                "user_password": "IDVE907",
                "department_id": "7"
            },
            {
                "emp_id": "5171",
                "user_first_name": "Hritik Ravindra Popeta",
                "designation": "Apprentice",
                "doj": "2024-11-01",
                "user_password": "5171",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE913",
                "user_first_name": "Indrajit Yashawant Pawar",
                "designation": "Executive",
                "doj": "2024-12-16",
                "user_password": "IDVE913",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE836",
                "user_first_name": "Jagdish Kishor Patil",
                "designation": "Operator",
                "doj": "2024-04-04",
                "user_password": "IDVE836",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE731",
                "user_first_name": "Jyotishri Jalindar Chavan",
                "designation": "Officer",
                "doj": "2023-05-15",
                "user_password": "IDVE731",
                "department_id": "13"
            },
            {
                "emp_id": "IDVE943",
                "user_first_name": "Kalpesh Anil Patil",
                "designation": "Jr. Associate",
                "doj": "2025-02-06",
                "user_password": "IDVE943",
                "department_id": "21"
            },
            {
                "emp_id": "IDVE798",
                "user_first_name": "Kalyani Rajanish Mapuskar",
                "designation": "Associate",
                "doj": "2024-01-02",
                "user_password": "IDVE798",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE762",
                "user_first_name": "Kamlesh Deore",
                "designation": "Sr. Research Associate",
                "doj": "2023-09-04",
                "user_password": "IDVE762",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE492",
                "user_first_name": "Kaustubh Raghunath Mhatre",
                "designation": "Jr. Executive",
                "doj": "2022-01-24",
                "user_password": "IDVE492",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE953",
                "user_first_name": "Kaveri Shinde",
                "designation": "Sr. Research Associate",
                "doj": "2025-02-24",
                "user_password": "IDVE953",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE831",
                "user_first_name": "Kiran Manik Tarate",
                "designation": "Officer",
                "doj": "2024-03-21",
                "user_password": "IDVE831",
                "department_id": "16"
            },
            {
                "emp_id": "IDVE906",
                "user_first_name": "Kishor Anil Pawar",
                "designation": "Research Associate",
                "doj": "2024-12-09",
                "user_password": "IDVE906",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE820",
                "user_first_name": "Krushana Udayrao Deshamukh",
                "designation": "Officer",
                "doj": "2024-03-04",
                "user_password": "IDVE820",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE903",
                "user_first_name": "Kunal Vijay Khadse",
                "designation": "Jr. Research Associate",
                "doj": "2024-12-02",
                "user_password": "IDVE903",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE015",
                "user_first_name": "Lalit Anant Shinde",
                "designation": "Sr. Executive",
                "doj": "2012-02-10",
                "user_password": "IDVE015",
                "department_id": "9"
            },
            {
                "emp_id": "IDVE846",
                "user_first_name": "Latika Vilas Sawant",
                "designation": "Officer",
                "doj": "2024-05-06",
                "user_password": "IDVE846",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE928",
                "user_first_name": "Lukesh Gopal Rote",
                "designation": "Research Associate",
                "doj": "2025-01-17",
                "user_password": "IDVE928",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE800",
                "user_first_name": "Machindra Sadu Mhaskar",
                "designation": "Jr. Associate",
                "doj": "2024-01-02",
                "user_password": "IDVE800",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE912",
                "user_first_name": "Mahendra Dilip Pawar",
                "designation": "Officer",
                "doj": "2024-12-16",
                "user_password": "IDVE912",
                "department_id": "2"
            },
            {
                "emp_id": "5387",
                "user_first_name": "Mahesh Balasaheb Shinde",
                "designation": "Apprentice",
                "doj": "2025-01-08",
                "user_password": "5387",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE857",
                "user_first_name": "Mahesh Ramdas Khane",
                "designation": "Associate",
                "doj": "2024-06-10",
                "user_password": "IDVE857",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE090",
                "user_first_name": "Mangesh Vamanrao Gaikwad",
                "designation": "Assistant Manager ",
                "doj": "2014-07-14",
                "user_password": "IDVE090",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE940",
                "user_first_name": "Manish Kumavat",
                "designation": "Sr. Officer",
                "doj": "2025-08-04",
                "user_password": "IDVE940",
                "department_id": "11"
            },
            {
                "emp_id": "IDVE900",
                "user_first_name": "Maqsud Patel",
                "designation": "Research Associate",
                "doj": "2024-12-02",
                "user_password": "IDVE900",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE842",
                "user_first_name": "Mayur Dilip Sonawane",
                "designation": "Sr. Officer",
                "doj": "2024-04-18",
                "user_password": "IDVE842",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE933",
                "user_first_name": "Mayur Lukaji Mahale",
                "designation": "Officer",
                "doj": "2025-01-23",
                "user_password": "IDVE933",
                "department_id": "16"
            },
            {
                "emp_id": "5298",
                "user_first_name": "Mayuri Akshay Sapkal",
                "designation": "Apprentice",
                "doj": "2024-07-08",
                "user_password": "5298",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE931",
                "user_first_name": "Minish Nandkumar Kurangale",
                "designation": "Officer",
                "doj": "2025-01-23",
                "user_password": "IDVE931",
                "department_id": "24"
            },
            {
                "emp_id": "IDVE918",
                "user_first_name": "More Sunil Manchakrao",
                "designation": "Jr. Research Associate",
                "doj": "2025-01-02",
                "user_password": "IDVE918",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE777",
                "user_first_name": "Mukesh Manik Ahire",
                "designation": "Sr. Officer",
                "doj": "2023-10-16",
                "user_password": "IDVE777",
                "department_id": "13"
            },
            {
                "emp_id": "IDVE755",
                "user_first_name": "Namrata Pradeep Jagtap",
                "designation": "Sr. Officer",
                "doj": "2023-08-16",
                "user_password": "IDVE755",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE926",
                "user_first_name": "Neha Ghadigaonkar",
                "designation": "Research Associate",
                "doj": "2025-01-13",
                "user_password": "IDVE926",
                "department_id": "7"
            },
            {
                "emp_id": "6037",
                "user_first_name": "Neha Shinde",
                "designation": "Apprentice",
                "doj": "2024-12-23",
                "user_password": "6037",
                "department_id": "3"
            },
            {
                "emp_id": "5248",
                "user_first_name": "Nikita Babasaheb Mahapure",
                "designation": "Apprentice",
                "doj": "2024-03-04",
                "user_password": "5248",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE599",
                "user_first_name": "Nikita Ramdas Kale",
                "designation": "Officer",
                "doj": "2022-05-24",
                "user_password": "IDVE599",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE269",
                "user_first_name": "Nilesh Trimbak Jadhav",
                "designation": "Deputy Manager",
                "doj": "2019-07-15",
                "user_password": "IDVE269",
                "department_id": "11"
            },
            {
                "emp_id": "IDVE629",
                "user_first_name": "Nilima Ajay Chaudhari",
                "designation": "Sr. Officer",
                "doj": "2022-07-12",
                "user_password": "IDVE629",
                "department_id": "1"
            },
            {
                "emp_id": "IDVE830",
                "user_first_name": "Nitin Sakharam Hubale",
                "designation": "Officer",
                "doj": "2024-03-21",
                "user_password": "IDVE830",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE655",
                "user_first_name": "Om Prakash Bhurbhure",
                "designation": "Sr. Research Associate",
                "doj": "2022-09-19",
                "user_password": "IDVE655",
                "department_id": "8"
            },
            {
                "emp_id": "IDVE322",
                "user_first_name": "Omkar Pore",
                "designation": "Officer",
                "doj": "2020-12-21",
                "user_password": "IDVE322",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE735",
                "user_first_name": "Onkar Jadhav",
                "designation": "Executive",
                "doj": "2023-06-05",
                "user_password": "IDVE735",
                "department_id": "4"
            },
            {
                "emp_id": "IDVE818",
                "user_first_name": "Onkar Keshav Kachare",
                "designation": "Officer",
                "doj": "2024-03-04",
                "user_password": "IDVE818",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE866",
                "user_first_name": "Pabitro Paritosh Vishvas",
                "designation": "Operator",
                "doj": "2024-07-16",
                "user_password": "IDVE866",
                "department_id": "16"
            },
            {
                "emp_id": "IDVE944",
                "user_first_name": "Pankaj Kashinath Bagul",
                "designation": "Sr. Officer",
                "doj": "2025-02-07",
                "user_password": "IDVE944",
                "department_id": "2"
            },
            {
                "emp_id": "6042",
                "user_first_name": "Pankaj Sahu",
                "designation": "Apprentice",
                "doj": "2025-02-14",
                "user_password": "6042",
                "department_id": "5"
            },
            {
                "emp_id": "IDVE947",
                "user_first_name": "Pawan Arun More",
                "designation": "Associate",
                "doj": "2025-02-10",
                "user_password": "IDVE947",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE793",
                "user_first_name": "Pawan Kumar Prajapati",
                "designation": "Officer",
                "doj": "2023-12-11",
                "user_password": "IDVE793",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE624",
                "user_first_name": "Pooja Raju Shinde",
                "designation": "Sr. Research Associate",
                "doj": "2022-07-01",
                "user_password": "IDVE624",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE880",
                "user_first_name": "Pradeep Babasaheb Rathod",
                "designation": "Officer",
                "doj": "2024-09-16",
                "user_password": "IDVE880",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE765",
                "user_first_name": "Pradip Jagannath Parande",
                "designation": "Executive",
                "doj": "2023-09-25",
                "user_password": "IDVE765",
                "department_id": "2"
            },
            {
                "emp_id": "5200",
                "user_first_name": "Pranav Prakash Suryavanshi",
                "designation": "Apprentice",
                "doj": "2024-11-28",
                "user_password": "5200",
                "department_id": "23"
            },
            {
                "emp_id": "IDVE744",
                "user_first_name": "Prasad Ashok Lawande",
                "designation": "Sr. Officer",
                "doj": "2023-07-11",
                "user_password": "IDVE744",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE797",
                "user_first_name": "Prasad Sanjay Vavhal",
                "designation": "Jr. Research Associate",
                "doj": "2024-01-02",
                "user_password": "IDVE797",
                "department_id": "5"
            },
            {
                "emp_id": "5394",
                "user_first_name": "Prasad Shankar Galande",
                "designation": "Apprentice",
                "doj": "2025-02-12",
                "user_password": "5394",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE832",
                "user_first_name": "Prasad Subhash Shinde",
                "designation": "Officer",
                "doj": "2024-03-26",
                "user_password": "IDVE832",
                "department_id": "23"
            },
            {
                "emp_id": "IDVE780",
                "user_first_name": "Prashant Arjun Patil",
                "designation": "Officer",
                "doj": "2023-10-19",
                "user_password": "IDVE780",
                "department_id": "2"
            },
            {
                "emp_id": "5407",
                "user_first_name": "Prashant Sunil Suryawanshi",
                "designation": "Apprentice",
                "doj": "2025-02-24",
                "user_password": "5407",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE934",
                "user_first_name": "Prashant Surve",
                "designation": "Operator",
                "doj": "2025-01-24",
                "user_password": "IDVE934",
                "department_id": "16"
            },
            {
                "emp_id": "6035",
                "user_first_name": "Prathmesh Shirsekar",
                "designation": "Apprentice",
                "doj": "2024-12-09",
                "user_password": "6035",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE915",
                "user_first_name": "Pratibha Kadu Pagar",
                "designation": "Jr. Research Associate",
                "doj": "2024-12-18",
                "user_password": "IDVE915",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE895",
                "user_first_name": "Pratik Baban Jadhav",
                "designation": "Operator",
                "doj": "2024-11-13",
                "user_password": "IDVE895",
                "department_id": "16"
            },
            {
                "emp_id": "IDVE917",
                "user_first_name": "Pratik Kisan Patangrao",
                "designation": "Operator",
                "doj": "2024-12-24",
                "user_password": "IDVE917",
                "department_id": "16"
            },
            {
                "emp_id": "6017",
                "user_first_name": "Pratik More",
                "designation": "Apprentice",
                "doj": "2024-06-24",
                "user_password": "6017",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE497",
                "user_first_name": "Pratiksha Anil Deshmukh",
                "designation": "Officer",
                "doj": "2022-02-01",
                "user_password": "IDVE497",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE590",
                "user_first_name": "Pravin Meditiya",
                "designation": "Research Scientist",
                "doj": "2022-05-16",
                "user_password": "IDVE590",
                "department_id": "8"
            },
            {
                "emp_id": "IDVE710",
                "user_first_name": "Pritesh Pundlik Patil",
                "designation": "Jr. Officer",
                "doj": "2023-01-24",
                "user_password": "IDVE710",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE791",
                "user_first_name": "Priti Milind Koli",
                "designation": " Research Associate",
                "doj": "2023-12-05",
                "user_password": "IDVE791",
                "department_id": "15"
            },
            {
                "emp_id": "IDVE717",
                "user_first_name": "Rachana Shinde",
                "designation": "Jr. Research Associate",
                "doj": "2023-02-20",
                "user_password": "IDVE717",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE921",
                "user_first_name": "Rahul Dnyaneshwar Shingare",
                "designation": "Associate",
                "doj": "2025-01-08",
                "user_password": "IDVE921",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE756",
                "user_first_name": "Rajendra Nalawade",
                "designation": "Assistant Manager",
                "doj": "2023-08-17",
                "user_password": "IDVE756",
                "department_id": "6"
            },
            {
                "emp_id": "5377",
                "user_first_name": "Ranjit Shahaji Mhaske",
                "designation": "Apprentice",
                "doj": "2024-12-23",
                "user_password": "5377",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE660",
                "user_first_name": "Rashmirekha Purnchand Raut",
                "designation": "Jr. Research Associate",
                "doj": "2022-10-06",
                "user_password": "IDVE660",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE416",
                "user_first_name": "Ravindra Pawar",
                "designation": "Assistant Manager ",
                "doj": "2021-07-08",
                "user_password": "IDVE416",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE331",
                "user_first_name": "Renba Gangadhar Tithe",
                "designation": "Officer",
                "doj": "2021-01-15",
                "user_password": "IDVE331",
                "department_id": "20"
            },
            {
                "emp_id": "5405",
                "user_first_name": "Revati Vitthal Mahanwar",
                "designation": "Apprentice",
                "doj": "2025-02-24",
                "user_password": "5405",
                "department_id": "20"
            },
            {
                "emp_id": "6036",
                "user_first_name": "Rituja Ghatkar",
                "designation": "Apprentice",
                "doj": "2024-12-09",
                "user_password": "6036",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE862",
                "user_first_name": "Rohan Mishra",
                "designation": "Assistant Manager ",
                "doj": "2024-06-25",
                "user_password": "IDVE862",
                "department_id": "4"
            },
            {
                "emp_id": "IDVE885",
                "user_first_name": "Rohan Subhash Shitole",
                "designation": "Deputy Manager",
                "doj": "2024-09-27",
                "user_password": "IDVE885",
                "department_id": "1"
            },
            {
                "emp_id": "5275",
                "user_first_name": "Rohan Tulshiram Gharat",
                "designation": "Apprentice",
                "doj": "2024-05-06",
                "user_password": "5275",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE663",
                "user_first_name": "Rohini Prakashrao Garad",
                "designation": "Sr. Officer",
                "doj": "2022-10-12",
                "user_password": "IDVE663",
                "department_id": "20"
            },
            {
                "emp_id": "6027",
                "user_first_name": "Rohit Eknath Katkar",
                "designation": "Apprentice",
                "doj": "2024-09-23",
                "user_password": "6027",
                "department_id": "10"
            },
            {
                "emp_id": "IDVE816",
                "user_first_name": "Rohit Mande",
                "designation": "Jr. Research Associate",
                "doj": "2024-03-01",
                "user_password": "IDVE816",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE712",
                "user_first_name": "Rohit Maskar",
                "designation": "Sr. Officer",
                "doj": "2023-02-13",
                "user_password": "IDVE712",
                "department_id": "11"
            },
            {
                "emp_id": "IDVE651",
                "user_first_name": "Roshani Bhadane",
                "designation": "Sr. Research Associate",
                "doj": "2022-09-05",
                "user_password": "IDVE651",
                "department_id": "10"
            },
            {
                "emp_id": "IDVE740",
                "user_first_name": "Roshani Kamble",
                "designation": "Sr. Research Associate",
                "doj": "2023-06-12",
                "user_password": "IDVE740",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE867",
                "user_first_name": "Rupesh Deshmukh",
                "designation": "Sr. Research Associate ",
                "doj": "2024-07-17",
                "user_password": "IDVE867",
                "department_id": "5"
            },
            {
                "emp_id": "IDVE870",
                "user_first_name": "Sachin Anant Kadam",
                "designation": "Assistant Manager ",
                "doj": "2024-07-22",
                "user_password": "IDVE870",
                "department_id": "1"
            },
            {
                "emp_id": "IDVE129",
                "user_first_name": "Sachin Dhondappa Hugge",
                "designation": "Assistant Manager ",
                "doj": "2015-05-23",
                "user_password": "IDVE129",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE381",
                "user_first_name": "Sagar P Nagvekar",
                "designation": "Executive",
                "doj": "2021-04-19",
                "user_password": "IDVE381",
                "department_id": "19"
            },
            {
                "emp_id": "5167",
                "user_first_name": "Sahil Manohar Thombre",
                "designation": "Apprentice",
                "doj": "2024-10-16",
                "user_password": "5167",
                "department_id": "23"
            },
            {
                "emp_id": "IDVE946",
                "user_first_name": "Sakshi Dilip Deshmukh",
                "designation": "Associate",
                "doj": "2025-02-10",
                "user_password": "IDVE946",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE927",
                "user_first_name": "Sakshi Dilip Jadhav",
                "designation": "Jr. Research Associate",
                "doj": "2025-01-15",
                "user_password": "IDVE927",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE893",
                "user_first_name": "Samadhan Dnyanoba Maske",
                "designation": "Officer",
                "doj": "2024-11-06",
                "user_password": "IDVE893",
                "department_id": "13"
            },
            {
                "emp_id": "IDVE886",
                "user_first_name": "Samadhan Hanmantrao Ghorpade",
                "designation": "Sr. Research Scientist",
                "doj": "2024-09-27",
                "user_password": "IDVE886",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE562",
                "user_first_name": "Sandesh Mande",
                "designation": "Officer",
                "doj": "2022-03-07",
                "user_password": "IDVE562",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE615",
                "user_first_name": "Sangram Sadashiv Pawar",
                "designation": "Sr. Research Associate",
                "doj": "2022-06-15",
                "user_password": "IDVE615",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE864",
                "user_first_name": "Sanket Vitthal Patil",
                "designation": "Associate",
                "doj": "2024-07-16",
                "user_password": "IDVE864",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE716",
                "user_first_name": "Sanvi Manish Patade",
                "designation": "Sr. Research Associate",
                "doj": "2023-02-20",
                "user_password": "IDVE716",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE767",
                "user_first_name": "Sarita Tushar Disale",
                "designation": "Executive",
                "doj": "2023-09-25",
                "user_password": "IDVE767",
                "department_id": "2"
            },
            {
                "emp_id": "5201",
                "user_first_name": "Sarvesh Deepak Patil",
                "designation": "Apprentice",
                "doj": "2024-12-06",
                "user_password": "5201",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE837",
                "user_first_name": "Saurabh Santosh Chavan",
                "designation": "Operator",
                "doj": "2024-04-04",
                "user_password": "IDVE837",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE474",
                "user_first_name": "Shailesh Chandrakant Kondilkar",
                "designation": "Sr. Officer",
                "doj": "2021-12-22",
                "user_password": "IDVE474",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE859",
                "user_first_name": "Sharyu Shankar Mhaskar",
                "designation": "Officer",
                "doj": "2024-06-18",
                "user_password": "IDVE859",
                "department_id": "9"
            },
            {
                "emp_id": "IDVE327",
                "user_first_name": "Shital Shingote",
                "designation": "Sr. Officer",
                "doj": "2020-12-01",
                "user_password": "IDVE327",
                "department_id": "1"
            },
            {
                "emp_id": "IDVE896",
                "user_first_name": "Shivaji Dinkar Shinde",
                "designation": "Sr. Officer",
                "doj": "2024-11-18",
                "user_password": "IDVE896",
                "department_id": "16"
            },
            {
                "emp_id": "IDVE804",
                "user_first_name": "Shivam Amarpal Sen",
                "designation": "Officer",
                "doj": "2024-01-04",
                "user_password": "IDVE804",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE323",
                "user_first_name": "Shoheb Sayed",
                "designation": "Deputy Manager ",
                "doj": "2020-12-22",
                "user_password": "IDVE323",
                "department_id": "3"
            },
            {
                "emp_id": "5308",
                "user_first_name": "Shraddha Hanumant Sawant",
                "designation": "Apprentice",
                "doj": "2024-08-16",
                "user_password": "5308",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE766",
                "user_first_name": "Shrikant Ramesh Bankar",
                "designation": "Executive",
                "doj": "2023-09-25",
                "user_password": "IDVE766",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE572",
                "user_first_name": "Shubh Khushal Sharma",
                "designation": "Jr. Officer",
                "doj": "2022-11-01",
                "user_password": "IDVE572",
                "department_id": "9"
            },
            {
                "emp_id": "IDVE861",
                "user_first_name": "Shubham Sanjay Bhavsar",
                "designation": "Jr. Associate",
                "doj": "2024-06-24",
                "user_password": "IDVE861",
                "department_id": "13"
            },
            {
                "emp_id": "IDVE948",
                "user_first_name": "Shubham Santosh Palkar",
                "designation": "Jr. Officer",
                "doj": "2025-02-12",
                "user_password": "IDVE948",
                "department_id": "9"
            },
            {
                "emp_id": "IDVE783",
                "user_first_name": "Shyam Waware",
                "designation": "Jr. Research Associate",
                "doj": "2023-11-06",
                "user_password": "IDVE783",
                "department_id": "3"
            },
            {
                "emp_id": "6032",
                "user_first_name": "Sibasankar Sahu",
                "designation": "Apprentice",
                "doj": "2024-11-25",
                "user_password": "6032",
                "department_id": "7"
            },
            {
                "emp_id": "5305",
                "user_first_name": "Simran Rajkumar Jaiswal",
                "designation": "Apprentice",
                "doj": "2024-08-05",
                "user_password": "5305",
                "department_id": "13"
            },
            {
                "emp_id": "IDVE905",
                "user_first_name": "Sneha Samadhan Patil",
                "designation": "Jr. Research Associate",
                "doj": "2024-12-03",
                "user_password": "IDVE905",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE650",
                "user_first_name": "Sneha Suraj Walmiki",
                "designation": "Jr. Officer",
                "doj": "2022-09-01",
                "user_password": "IDVE650",
                "department_id": "9"
            },
            {
                "emp_id": "IDVE482",
                "user_first_name": "Snehal Dalvi",
                "designation": "Officer",
                "doj": "2022-01-10",
                "user_password": "IDVE482",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE785",
                "user_first_name": "Somesh Dayaram Mahale",
                "designation": "Jr. Associate",
                "doj": "2023-11-20",
                "user_password": "IDVE785",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE805",
                "user_first_name": "Sonu Rathod",
                "designation": "Jr. Research Associate",
                "doj": "2024-01-08",
                "user_password": "IDVE805",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE834",
                "user_first_name": "Soumit Samanta",
                "designation": "Jr. Research Associate",
                "doj": "2024-04-01",
                "user_password": "IDVE834",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE826",
                "user_first_name": "Souvik Chowdhury",
                "designation": "Research Associate",
                "doj": "2024-03-18",
                "user_password": "IDVE826",
                "department_id": "15"
            },
            {
                "emp_id": "IDVE658",
                "user_first_name": "Srikanth Ramesh Vemula",
                "designation": "Executive",
                "doj": "2022-09-21",
                "user_password": "IDVE658",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE578",
                "user_first_name": "Srishti Tiwari",
                "designation": "Company Secretary",
                "doj": "2022-04-18",
                "user_password": "IDVE578",
                "department_id": "12"
            },
            {
                "emp_id": "IDVE747",
                "user_first_name": "Sualeh Patel",
                "designation": "Sr. Officer",
                "doj": "2023-07-17",
                "user_password": "IDVE747",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE920",
                "user_first_name": "Suchit Suresh Mane",
                "designation": "Sr. Officer",
                "doj": "2025-01-08",
                "user_password": "IDVE920",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE714",
                "user_first_name": "Sumedh Sunil Kamble",
                "designation": "Jr. Officer",
                "doj": "2023-02-20",
                "user_password": "IDVE714",
                "department_id": "14"
            },
            {
                "emp_id": "5219",
                "user_first_name": "Sumit Deepak Kadam",
                "designation": "Apprentice",
                "doj": "2024-12-29",
                "user_password": "5219",
                "department_id": "14"
            },
            {
                "emp_id": "5255",
                "user_first_name": "Sumit Rajendra Mule",
                "designation": "Apprentice",
                "doj": "2024-04-04",
                "user_password": "5255",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE811",
                "user_first_name": "Sunil Sataba Patil",
                "designation": "Sr. Officer",
                "doj": "2024-02-12",
                "user_password": "IDVE811",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE938",
                "user_first_name": "Supriya Ramesh Panchyariya",
                "designation": "Research Associate",
                "doj": "2025-01-28",
                "user_password": "IDVE938",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE635",
                "user_first_name": "Suraj Ramdas Patil",
                "designation": "Jr. Operator",
                "doj": "2022-07-25",
                "user_password": "IDVE635",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE882",
                "user_first_name": "Suraj Shivaji Naugare",
                "designation": "Sr. Officer",
                "doj": "2024-09-23",
                "user_password": "IDVE882",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE769",
                "user_first_name": "Surendra Jawale",
                "designation": "Manager",
                "doj": "2023-10-03",
                "user_password": "IDVE769",
                "department_id": "19"
            },
            {
                "emp_id": "IDVE935",
                "user_first_name": "Sushma Bhiva Padalkar",
                "designation": "Research Associate",
                "doj": "2025-01-27",
                "user_password": "IDVE935",
                "department_id": "3"
            },
            {
                "emp_id": "6034",
                "user_first_name": "Suvarna Deokar",
                "designation": "Apprentice",
                "doj": "2024-12-09",
                "user_password": "6034",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE892",
                "user_first_name": "Suyog Nivrutti Cheke",
                "designation": "Officer",
                "doj": "2024-11-06",
                "user_password": "IDVE892",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE768",
                "user_first_name": "Swapnarani Mohapatra",
                "designation": "Executive",
                "doj": "2023-09-25",
                "user_password": "IDVE768",
                "department_id": "20"
            },
            {
                "emp_id": "6033",
                "user_first_name": "Swapnil Dhale",
                "designation": "Apprentice",
                "doj": "2024-12-09",
                "user_password": "6033",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE894",
                "user_first_name": "Swati Vijay Pujari",
                "designation": "Sr. Officer",
                "doj": "2024-11-11",
                "user_password": "IDVE894",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE858",
                "user_first_name": "Swati Wabale",
                "designation": "Research Associate",
                "doj": "2024-06-17",
                "user_password": "IDVE858",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE670",
                "user_first_name": "Tapan Biswal",
                "designation": "Operator",
                "doj": "2022-11-01",
                "user_password": "IDVE670",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE949",
                "user_first_name": "Tejas Ananda Shinde",
                "designation": "Jr. Research Associate",
                "doj": "2025-02-12",
                "user_password": "IDVE949",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE952",
                "user_first_name": "Uddhav Pralhad Ghule",
                "designation": "Sr. Executive",
                "doj": "2025-02-19",
                "user_password": "IDVE952",
                "department_id": "6"
            },
            {
                "emp_id": "IDVE764",
                "user_first_name": "Vaibhav Jadhav",
                "designation": "Jr. Research Associate",
                "doj": "2023-09-11",
                "user_password": "IDVE764",
                "department_id": "8"
            },
            {
                "emp_id": "IDVE904",
                "user_first_name": "Vaishnavi Murlidhar Borole",
                "designation": "Jr. Research Associate",
                "doj": "2024-12-03",
                "user_password": "IDVE904",
                "department_id": "5"
            },
            {
                "emp_id": "IDVE914",
                "user_first_name": "Vikas Sarjerao Dalavi",
                "designation": "Executive",
                "doj": "2024-12-16",
                "user_password": "IDVE914",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE751",
                "user_first_name": "Vikas Vishwkarma",
                "designation": "Officer",
                "doj": "2023-08-07",
                "user_password": "IDVE751",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE397",
                "user_first_name": "Vikram Shete",
                "designation": "Sr. Executive",
                "doj": "2021-06-17",
                "user_password": "IDVE397",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE685",
                "user_first_name": "Vikram Zate",
                "designation": "Jr. Executive",
                "doj": "2022-11-25",
                "user_password": "IDVE685",
                "department_id": "1"
            },
            {
                "emp_id": "IDVE801",
                "user_first_name": "Vinay Dattatray Bhoir",
                "designation": "Jr. Associate",
                "doj": "2024-01-02",
                "user_password": "IDVE801",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE855",
                "user_first_name": "Vinayak Ashok Kavitake",
                "designation": "JTO",
                "doj": "2024-06-04",
                "user_password": "IDVE855",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE910",
                "user_first_name": "Vinayak Dattatrey Natuskar",
                "designation": "Sr. Operator",
                "doj": "2024-12-16",
                "user_password": "IDVE910",
                "department_id": "16"
            },
            {
                "emp_id": "IDVE146",
                "user_first_name": "VinayKumar Kishun Gupta",
                "designation": "Sr. Research Scientist",
                "doj": "2015-12-16",
                "user_password": "IDVE146",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE641",
                "user_first_name": "Vinod Mahadeo Phuge",
                "designation": "Manager",
                "doj": "2022-08-13",
                "user_password": "IDVE641",
                "department_id": "23"
            },
            {
                "emp_id": "IDVE950",
                "user_first_name": "Vinod Walunj",
                "designation": "Jr. Officer",
                "doj": "2025-02-14",
                "user_password": "IDVE950",
                "department_id": "19"
            },
            {
                "emp_id": "IDVE603",
                "user_first_name": "Virendra Kardile",
                "designation": "Sr. Research Associate",
                "doj": "2022-06-01",
                "user_password": "IDVE603",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE814",
                "user_first_name": "Vishal Ashokrao Deshmukh",
                "designation": "Assistant Manager ",
                "doj": "2024-02-19",
                "user_password": "IDVE814",
                "department_id": "20"
            },
            {
                "emp_id": "IDVE277",
                "user_first_name": "Vishal Jagannath Yadav",
                "designation": "Research Scientist",
                "doj": "2019-09-12",
                "user_password": "IDVE277",
                "department_id": "3"
            },
            {
                "emp_id": "IDVE724",
                "user_first_name": "Vishal Patil",
                "designation": "Sr. Officer",
                "doj": "2023-04-11",
                "user_password": "IDVE724",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE909",
                "user_first_name": "Vrushali Patil",
                "designation": "Jr. Research Associate",
                "doj": "2024-12-13",
                "user_password": "IDVE909",
                "department_id": "5"
            },
            {
                "emp_id": "IDVE438",
                "user_first_name": "Wajid Shaikh",
                "designation": "Sr. Executive",
                "doj": "2021-09-01",
                "user_password": "IDVE438",
                "department_id": "2"
            },
            {
                "emp_id": "IDVE887",
                "user_first_name": "Yash Deepak Shinde",
                "designation": "Officer",
                "doj": "2024-09-30",
                "user_password": "IDVE887",
                "department_id": "20"
            },
            {
                "emp_id": "5207",
                "user_first_name": "Yash Pradeep Mandhare",
                "designation": "Apprentice",
                "doj": "2024-11-28",
                "user_password": "5207",
                "department_id": "18"
            },
            {
                "emp_id": "5388",
                "user_first_name": "Yash Rajendra Birari",
                "designation": "Apprentice",
                "doj": "2025-01-10",
                "user_password": "5388",
                "department_id": "18"
            },
            {
                "emp_id": "IDVE668",
                "user_first_name": "Yash Shivkar",
                "designation": "Officer",
                "doj": "2022-10-20",
                "user_password": "IDVE668",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE373",
                "user_first_name": "Yogesh Katore",
                "designation": "Executive",
                "doj": "2021-03-22",
                "user_password": "IDVE373",
                "department_id": "2"
            },
            {
                "emp_id": "6023",
                "user_first_name": "Yogesh Purkar",
                "designation": "Apprentice",
                "doj": "2024-09-03",
                "user_password": "6023",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE726",
                "user_first_name": "Yogesh Shivaji Shirsath",
                "designation": "Officer",
                "doj": "2023-04-17",
                "user_password": "IDVE726",
                "department_id": "14"
            },
            {
                "emp_id": "IDVE843",
                "user_first_name": "Yogesh Suresh Kamble",
                "designation": "Officer",
                "doj": "2024-04-22",
                "user_password": "IDVE843",
                "department_id": "20"
            },
            {
                "emp_id": "6007",
                "user_first_name": "Yogini Badhan",
                "designation": "Apprentice",
                "doj": "2024-12-02",
                "user_password": "6007",
                "department_id": "7"
            },
            {
                "emp_id": "IDVE929",
                "user_first_name": "Zeeshan Mohasinkhan Arab",
                "designation": "Research Scientist",
                "doj": "2025-01-17",
                "user_password": "IDVE929",
                "department_id": "6"
            }
        ]

        const datatopush = await Promise.all(
            data.map(async (ele) => ({
                ...ele,
                user_password: await argon2d.hash(ele.user_password)
            }))
        );

        let insertresp = await knexConnect("user")
            .insert(datatopush)

        return res.send(datatopush)

    } catch (error) {
        console.log(error)
        return res.send(false)
    }
}

module.exports = { updatePassword, registerUser, loginUser, testMiddleware, logoutUser, insertingvalueshod, insertingvaluesemp }
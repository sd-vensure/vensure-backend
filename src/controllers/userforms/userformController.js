const argon2d = require("argon2");
const knexConnect = require("../../../knexConnection");
const date = require('date-and-time');
const { generateAlphanumericString } = require("./userformHelper");
const moment = require("moment")

const addForm = async (req, res) => {

    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    let data = req.body.data;
    let uniqueid = generateAlphanumericString()

    try {

        let datatopush = data.map((item) => {
            return {
                "form_id": uniqueid,
                "type": item.type,
                "date": item.date,
                "remarks": item.remarks

            }
        })

        const insertformdata = await knexConnect("user_form").insert(datatopush);
        const insertformtrack = await knexConnect("user_form_track").insert({
            "form_id": uniqueid,
            "department_id": req.department_id,
            "user_id": req.user_id,
            "created_by": req.user_name,
            "created_at": formattedDate
        })

        return res.send({
            status: true,
            message: "Form Added Successfully",
            data: uniqueid
        })

    } catch (error) {

        return res.send({
            status: false,
            message: "Error Occured",
            data: error.message
        })

    }

}


const viewMyForms = async (req, res) => {

    let user_id = req.params.userid;

    try {

        // let data=await knexConnect("user_form_track").select("*").where("user_id",user_id);


        let data = await knexConnect("user_form_track")
            .select(
                "user_form_track.*",
                "user.*",
                "department.*"
            )
            .join("user", "user_form_track.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track.department_id")
            .where("user_form_track.user_id", user_id);



        if (data && data.length > 0) {
            return res.send({
                status: true,
                message: "Form found Successfully",
                data: data
            })
        }
        else if (data.length == 0) {
            return res.send({
                status: false,
                message: "No Form Found"
            })
        }
        else {
            return res.send({
                status: false,
                message: "Something went wrong"
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


const getFormsDepartment = async (req, res) => {

    let departmentid = req.params.departmentid;

    try {

        // let data=await knexConnect("user_form_track").select("*").where("user_id",user_id);


        let data = await knexConnect("user_form_track")
            .select(
                "user_form_track.*",
                "user.*",
                "department.*"
            )
            .join("user", "user_form_track.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track.department_id")
            .where("user_form_track.department_id", departmentid);



        if (data && data.length > 0) {
            return res.send({
                status: true,
                message: "Form found Successfully",
                data: data
            })
        }
        else if (data.length == 0) {
            return res.send({
                status: false,
                message: "No Form Found"
            })
        }
        else {
            return res.send({
                status: false,
                message: "Something went wrong"
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


const getParticularForm = async (req, res) => {

    let uniqueid = req.params.uniqueid;

    try {

        let data = await knexConnect("user_form_track")
            .select(
                "user_form_track.*",
                "user_form.*",
                "user.*",
            )
            .join("user", "user_form_track.user_id", "user.user_id")
            .join("user_form", "user_form.form_id", "user_form_track.form_id")
            .where("user_form_track.form_id", uniqueid);



        if (data && data.length > 0) {
            return res.send({
                status: true,
                message: "Form found Successfully",
                data: data
            })
        }
        else if (data.length == 0) {
            return res.send({
                status: false,
                message: "No Form Found"
            })
        }
        else {
            return res.send({
                status: false,
                message: "Something went wrong"
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


const sendForVerification = async (req, res) => {

    let uniqueid = req.params.uniqueid;

    try {

        let data = await knexConnect("user_form_track")
            .update(
                {
                    "is_shared": "Y",
                    "is_verified": "In Progress"
                }
            )
            .where("form_id", uniqueid);

        return res.send({
            status: true,
            message: "Sent for Approval"
        })

    } catch (error) {

        return res.send({
            status: false,
            message: "Error Occured",
            data: error.message
        })

    }

}


const approveReject = async (req, res) => {

    let uniqueid = req.params.uniqueid;
    let value = req.params.val;

    try {

        let data = await knexConnect("user_form_track")
            .update(
                {
                    "is_verified": value
                }
            )
            .where("form_id", uniqueid);

        return res.send({
            status: true,
            message: "Status Updated"
        })

    } catch (error) {

        return res.send({
            status: false,
            message: "Error Occured",
            data: error.message
        })

    }

}


const updateFormData = async (req, res) => {

    let uniqueid = req.params.uniqueid;
    let data = req.body.data;

    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    try {

        let datatopush = data.map((item) => {
            return {
                "form_id": uniqueid,
                "type": item.type,
                "date": item.date,
                "remarks": item.remarks
            }
        })

        let removeentries = await knexConnect("user_form").where("form_id", uniqueid).del();
        let insertformdata = await knexConnect("user_form").insert(datatopush);
        let updatetrackform = await knexConnect("user_form_track").update({
            "edited_by": req.user_id,
            "updated_at": formattedDate
        }).where("form_id", uniqueid);

        return res.send({
            status: true,
            message: "Status Updated"
        })

    } catch (error) {

        return res.send({
            status: false,
            message: "Error Occured",
            data: error.message
        })

    }

}


const getInProgressForms = async (req, res) => {

    try {

        let data = await knexConnect("user_form_track")
            .select(
                "user_form_track.*",
                "user.*",
                "department.*"
            )
            .join("user", "user_form_track.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track.department_id")
            .where("user_form_track.is_verified", "In Progress");



        if (data && data.length > 0) {
            return res.send({
                status: true,
                message: "Form found Successfully",
                data: data
            })
        }
        else if (data.length == 0) {
            return res.send({
                status: false,
                message: "No Form Found"
            })
        }
        else {
            return res.send({
                status: false,
                message: "Something went wrong"
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



module.exports = { addForm, viewMyForms, getParticularForm, getFormsDepartment, sendForVerification, getInProgressForms, approveReject,updateFormData }
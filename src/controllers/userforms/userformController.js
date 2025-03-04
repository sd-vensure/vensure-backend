const argon2d = require("argon2");
const knexConnect = require("../../../knexConnection");
const date = require('date-and-time');
const { generateAlphanumericString } = require("./userformHelper");
const moment = require("moment")

const addForm = async (req, res) => {

    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    let data = req.body.data;
    let financialyear = req.body.finance;
    let uniqueid = generateAlphanumericString(15)

    try {

        let checkformpresent = await knexConnect("user_form_track").select("*").where("financial_year", financialyear).andWhere("user_id", req.user_id);

        if (checkformpresent.length > 0) {
            return res.send({
                status: false,
                message: "Form already submitted for the financial year.",
            })
        }

        let datatopush = data.map((item) => {
            return {
                "form_id": uniqueid,
                "type": item.type,
                "quarter": item.quarter,
                "activity": item.activity
            }
        })

        const insertformdata = await knexConnect("user_form").insert(datatopush);
        const insertformtrack = await knexConnect("user_form_track").insert({
            "form_id": uniqueid,
            "department_id": req.department_id,
            "user_id": req.user_id,
            "created_by": req.user_name,
            "created_at": formattedDate,
            "financial_year": financialyear
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


const addNewForm = async (req, res) => {

    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    let data = req.body.data;
    let financialyear = req.body.finance;
    let uniqueformid = generateAlphanumericString(10)

    try {

        let datatopush = [];

        data.map((ele, index) => {
            let createobj = {};
            let category_id = ele.id;
            let category_name = ele.name;
            let include_kpi = ele.include_kpis
            let form_id = uniqueformid;

            createobj = { ...createobj, category_id, category_name, form_id, include_kpi };

            ele.kras.length > 0 &&
                ele.kras.map((ele1, index1) => {
                    let kra_id = generateAlphanumericString(10)
                    let kra_text = ele1.text;
                    createobj = { ...createobj, kra_id, kra_text, "kpi_id": null, "kpi_text": null, "kpi_target": null, "kpi_quarter": null, "kpi_weightage": null };
                    datatopush.push(createobj)

                    ele1.kpis && ele1.kpis.length > 0 && ele1.kpis.map((ele2, index2) => {
                        createobj = {
                            ...createobj,
                            kpi_id: generateAlphanumericString(15),
                            kpi_text: ele2.name,
                            kpi_target: ele2.date,
                            kpi_quarter: ele2.quarter,
                            kpi_weightage: ele2.number
                        }
                        datatopush.push(createobj)
                    })



                })

            // datatopush.push(createobj)

        })

        let insertformdata = await knexConnect("user_form_new").insert(datatopush);
        let datafortrack = {
            "form_id": uniqueformid,
            "department_id": req.department_id,
            "user_id": req.user_id,
            "created_by": req.user_name,
            "created_at": formattedDate,
            "financial_year": financialyear
        }

        let insertformdatatrack = await knexConnect("user_form_track_new").insert(datafortrack);


        return res.send({
            status: true,
            message: "Form Added Successfully",
            data: datatopush
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

const viewMyFormsNew = async (req, res) => {

    let user_id = req.params.userid;

    try {

        // let data=await knexConnect("user_form_track").select("*").where("user_id",user_id);


        let data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user.*",
                "department.*"
            )
            .join("user", "user_form_track_new.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track_new.department_id")
            .where("user_form_track_new.user_id", user_id);

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


const getFormsDepartmentNew = async (req, res) => {

    let departmentid = req.params.departmentid;

    try {

        // let data=await knexConnect("user_form_track").select("*").where("user_id",user_id);


        let data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user.*",
                "department.*"
            )
            .join("user", "user_form_track_new.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track_new.department_id")
            .where("user_form_track_new.department_id", departmentid)


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


const getParticularFormNew = async (req, res) => {

    let uniqueid = req.params.uniqueid;

    try {

        let data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user_form_new.*",
                "user.*",
            )
            .join("user", "user_form_track_new.user_id", "user.user_id")
            .join("user_form_new", "user_form_new.form_id", "user_form_track_new.form_id")
            .where("user_form_track_new.form_id", uniqueid);

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


const sendToDepartmentHead = async (req, res) => {

    let uniqueid = req.params.uniqueid;

    try {

        let data = await knexConnect("user_form_track_new")
            .update(
                {
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


const sendDepartmentFinancialYear = async (req, res) => {

    let finance = req.body.finance;
    let department_id = req.department_id;

    try {

        let data = await knexConnect("user_form_track")
            .update(
                {
                    "is_shared": "Y"
                }
            )
            .where("financial_year", finance)
            .andWhere("department_id", department_id);


        return res.send({
            status: true,
            message: "Forms Shared."
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

const approveRejectNew = async (req, res) => {

    let uniqueid = req.params.uniqueid;
    let value = req.params.val;

    try {

        let data = await knexConnect("user_form_track_new")
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
                "quarter": item.quarter,
                "activity": item.activity
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



const updateFormDataNew = async (req, res) => {

    let uniqueid = req.params.uniqueid;
    let data = req.body.data;

    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    try {

        let removeentries = await knexConnect("user_form_new").where("form_id", uniqueid).del();

        let datatopush = [];

        data.map((ele, index) => {
            let createobj = {};
            let category_id = ele.category_id;
            let category_name = ele.category_name;
            let include_kpi = ele.include_kpi;
            let form_id = uniqueid;

            createobj = { ...createobj, category_id, category_name, form_id, include_kpi };

            ele.kras.length > 0 &&
                ele.kras.map((ele1, index1) => {
                    let kra_id = generateAlphanumericString(10)
                    let kra_text = ele1.text;
                    createobj = { ...createobj, kra_id, kra_text, "kpi_id": null, "kpi_text": null, "kpi_target": null, "kpi_quarter": null, "kpi_weightage": null };
                    datatopush.push(createobj)

                    ele1.kpis && ele1.kpis.length > 0 && ele1.kpis.map((ele2, index2) => {
                        createobj = {
                            ...createobj,
                            kpi_id: generateAlphanumericString(15),
                            kpi_text: ele2.name,
                            kpi_target: ele2.target,
                            kpi_quarter: ele2.quarter,
                            kpi_weightage: ele2.number,
                            kpi_complete: ele2.completion,
                            kpi_obtained: ele2.obtained
                        }
                        datatopush.push(createobj)
                    })

                })

        })

        let insertformdata = await knexConnect("user_form_new").insert(datatopush);


        let updatetrackform = await knexConnect("user_form_track_new").update({
            "updated_by": req.user_id,
            "updated_at": formattedDate
        }).where("form_id", uniqueid);

        return res.send({
            status: true,
            message: "Status Updated",
            data: datatopush
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


const getSubmittedForms = async (req, res) => {

    try {

        let data = await knexConnect("user_form_track")
            .select(
                "user_form_track.*",
                "user.*",
                "department.*"
            )
            .join("user", "user_form_track.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track.department_id")
            .where("user_form_track.is_shared", "Y");


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

const getTotalFormsTotalUsers = async (req, res) => {

    let financial_year = req.body.financial_year || null;
    let department_name = req.department_name;
    let department_id = req.department_id;

    try {

        let data = await knexConnect("user").count("* as total").where("department_id", department_id);
        let count = await knexConnect("user_form_track").count("* as total").where("department_id", department_id).andWhere("financial_year", financial_year);
        let singleentry = await knexConnect("user_form_track").count("* as total").where("department_id", department_id).andWhere("financial_year", financial_year).andWhere("is_shared", "N")


        let entries_data = await knexConnect("user_form_track")
            .select(
                "user_form_track.*",
                "user.*",
                "department.*"
            )
            .join("user", "user_form_track.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track.department_id")
            // .where("user_form_track.is_verified", "In Progress")
            .where("user_form_track.financial_year", financial_year)

        if (entries_data.length > 0) {
            return res.send({
                status: true,
                message: "Data Found",
                total_persons: data[0].total,
                total_forms_filled: count[0].total,
                not_shared_forms: singleentry[0].total,
                entries: entries_data
            })
        }
        else {
            return res.send({
                status: false,
                message: "No forms found",
                total_persons: data[0].total,
                total_forms_filled: count[0].total,
                not_shared_forms: singleentry[0].total,
                entries: entries_data
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


const getTotalFormsTotalUsersNew = async (req, res) => {

    let financial_year = req.body.financial_year || null;
    let department_name = req.department_name;
    let department_id = req.department_id;

    try {

        let data = await knexConnect("user").count("* as total").where("department_id", department_id);
        let count = await knexConnect("user_form_track_new").count("* as total").where("department_id", department_id).andWhere("financial_year", financial_year);
        let singleentry = await knexConnect("user_form_track_new").count("* as total").where("department_id", department_id).andWhere("financial_year", financial_year).andWhere("is_shared", "N")


        let entries_data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user.*",
                "department.*"
            )
            .join("user", "user_form_track_new.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track_new.department_id")
            // .where("user_form_track.is_verified", "In Progress")
            .where("user_form_track_new.financial_year", financial_year)
            .whereNot("user_form_track_new.is_verified", "Pending");

        if (entries_data.length > 0) {
            return res.send({
                status: true,
                message: "Data Found",
                total_persons: data[0].total,
                total_forms_filled: count[0].total,
                not_shared_forms: singleentry[0].total,
                entries: entries_data
            })
        }
        else {
            return res.send({
                status: false,
                message: "No forms found",
                total_persons: data[0].total,
                total_forms_filled: count[0].total,
                not_shared_forms: singleentry[0].total,
                entries: entries_data
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


const updateFormDateAndMarks = async (req, res) => {

    let data = req.body.data;

    try {


        let datatopush = [];

        data.map((ele, index) => {

            ele.kras.length > 0 &&
                ele.kras.map((ele1, index1) => {

                    ele1.kpis && ele1.kpis.length > 0 && ele1.kpis.map((ele2, index2) => {

                        datatopush.push({
                            "kpi_id": ele2.id,
                            "kpi_complete": (ele2.completion == "" || ele2.completion == null) ? null : ele2.completion,
                            "kpi_obtained": (ele2.obtained == "" || ele2.obtained == null) ? null : ele2.obtained
                        })
                    })

                })

        })

        const updateQuery = datatopush.map(update => {
            return knexConnect('user_form_new')
                .where('kpi_id', update.kpi_id)
                .update(update);
        });

        let resp = await Promise.all(updateQuery)

        // let insertformdata = await knexConnect("user_form_new").insert(datatopush);


        return res.send({
            status: true,
            message: "Status Updated",
            data: datatopush
        })

    } catch (error) {

        return res.send({
            status: false,
            message: "Error Occured",
            data: error.message
        })

    }

}



module.exports = { updateFormDateAndMarks, approveRejectNew, getTotalFormsTotalUsersNew, sendToDepartmentHead, updateFormDataNew, getFormsDepartmentNew, addNewForm, viewMyFormsNew, getSubmittedForms, sendDepartmentFinancialYear, getTotalFormsTotalUsers, addForm, viewMyForms, getParticularForm, getParticularFormNew, getFormsDepartment, sendForVerification, getInProgressForms, approveReject, updateFormData }
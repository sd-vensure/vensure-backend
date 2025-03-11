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

        let checkformpresent = await knexConnect("user_form_track_new").select("*").where("financial_year", financialyear).andWhere("user_id", req.user_id);

        if (checkformpresent.length > 0) {
            return res.send({
                status: false,
                message: "Form already submitted for the financial year.",
            })
        }

        let datatopush = [];

        data.map((ele, index) => {
            let createobj = {};
            let category_id = ele.id;
            let category_name = ele.name;
            let include_kpi = ele.include_kpis
            let form_id = uniqueformid;

            createobj = { ...createobj, category_id, category_name, form_id, include_kpi };

            if (ele.kras.length > 0) {


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
                            datatopush.push({ ...createobj })
                        })



                    })
            }
            else {
                datatopush.push({ ...createobj, "kra_id": null, "kra_text": null, "kpi_id": null, "kpi_text": null, "kpi_target": null, "kpi_quarter": null, "kpi_weightage": null })
            }


        })

        let insertformdata = await knexConnect("user_form_new").insert(datatopush);

        let datafortrack = {
            "form_id": uniqueformid,
            "department_id": req.department_id,
            "designated_id": req.designated_user_id,
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


        // let data = await knexConnect("user_form_track_new")
        //     .select(
        //         "user_form_track_new.*",
        //         "user.*",
        //         "department.*"
        //     )
        //     .join("user", "user_form_track_new.user_id", "user.user_id")
        //     .join("department", "department.department_id", "user_form_track_new.department_id")
        //     .where("user_form_track_new.user_id", user_id);

        let data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user.*",
                "department.*",
                knexConnect.raw("head_user.user_first_name as department_head_name"),
                knexConnect.raw("head_user.emp_id as department_head_empid"),
                knexConnect.raw("head_user.user_id as department_head_userid")
            )
            .join("user", "user_form_track_new.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track_new.department_id")
            .leftJoin("emp_reporting_mapper", "emp_reporting_mapper.emp_id", "user_form_track_new.user_id")
            .leftJoin("user as head_user", "head_user.user_id", "emp_reporting_mapper.reporting_id")
            .where("user_form_track_new.user_id", user_id);


        if (data && data.length > 0) {

            let arrayofformids = [];

            data.map((ele) => {
                arrayofformids.push(ele.form_id)
            })

            // let categorycount = await knexConnect("user_form_new")
            //     .select("form_id", "category_id")
            //     .sum("kpi_weightage as total_weightage") // Sum kpi_weightage instead of count
            //     .whereIn("form_id", arrayofformids) // Filter only given form_ids
            //     .groupBy("form_id", "category_id");

            let categorycount = await knexConnect("user_form_new")
                .select("form_id", "category_id")
                .sum({ total_weightage: knexConnect.raw("COALESCE(kpi_weightage, 0)") }) // Handle NULL values
                .whereIn("form_id", arrayofformids) // Filter only given form_ids
                .groupBy("form_id", "category_id");

            const formattedData = categorycount.reduce((acc, item) => {
                let existingForm = acc.find((f) => f.form_id === item.form_id);
                if (!existingForm) {
                    existingForm = { form_id: item.form_id, categoriesdata: [] };
                    acc.push(existingForm);
                }
                existingForm.categoriesdata.push({ category_id: item.category_id, total: item.total_weightage });
                return acc;
            }, []);

            let finaldatatosend = [];

            data.map((ele) => {
                let formid = ele.form_id;

                let catfound = formattedData.find((vv) => vv.form_id == formid);

                finaldatatosend.push({ ...ele, categoriesdata: catfound.categoriesdata })
            })

            return res.send({
                status: true,
                message: "Form found Successfully",
                data: finaldatatosend
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
    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    try {

        let data = await knexConnect("user_form_track_new")
            .update(
                {
                    "is_shared": "Y",
                    "shared_datetime": formattedDate
                }
            )
            .where("form_id", uniqueid);

        return res.send({
            status: true,
            message: "Shared with HR"
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
    let userid = req.params.userid;
    let reportingid = req.params.reportingid;
    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');


    try {

        if (parseInt(userid) == parseInt(reportingid)) {
            let data = await knexConnect("user_form_track_new")
                .update(
                    {
                        "is_verified": "Verified",
                        "is_shared": "Y",
                        "shared_datetime": formattedDate
                    }
                )
                .where("form_id", uniqueid);
        }
        else {
            let data = await knexConnect("user_form_track_new")
                .update(
                    {
                        "is_verified": "In Progress"
                    }
                )
                .where("form_id", uniqueid);
        }


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
    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');


    try {

        let data = await knexConnect("user_form_track")
            .update(
                {
                    "is_shared": "Y",
                    "shared_datetime": formattedDate
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
            let include_kpi = ele.include_kpis;
            let form_id = uniqueid;

            createobj = { ...createobj, category_id, category_name, form_id, include_kpi };
            if (ele.kras.length > 0) {

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
            }
            else {
                datatopush.push({ ...createobj, "kra_id": null, "kra_text": null, "kpi_id": null, "kpi_text": null, "kpi_target": null, "kpi_quarter": null, "kpi_weightage": null })
            }

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


const updateFormDataSpecialNew = async (req, res) => {

    let uniqueid = req.params.uniqueid;
    let request_id = req.params.requestid;

    let uniquenew = generateAlphanumericString(10);

    let data = req.body.data;

    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    try {


        let datatopush = [];

        data.map((ele, index) => {
            let createobj = {};
            let category_id = ele.category_id;
            let category_name = ele.category_name;
            let include_kpi = ele.include_kpis;
            let form_id = uniquenew;

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
            "updated_at": formattedDate,
            "form_id": uniquenew
        }).where("form_id", uniqueid);

        let updaterequesttable = await knexConnect("edit_form_request").update({
            "edit_status": "Done",
            "new_form_id": uniquenew
        }).where("request_id", request_id)

        return res.send({
            status: true,
            message: "Status Updated",
            // data: datatopush
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


const getSubmittedFormsNew = async (req, res) => {

    let financialyear = req.query.financial;

    try {

        let data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user.*",
                "department.*",
                "designated_user.user_first_name as department_head_name",
                "designated_user.user_id as department_head_userid",
                "designated_user.emp_id as department_head_empid",
                "designated_user.designation as department_head_designation"
            )
            .join("user", "user_form_track_new.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track_new.department_id")
            .leftJoin("emp_reporting_mapper", "emp_reporting_mapper.emp_id", "user.user_id") // Get the designated_id
            .leftJoin("user as designated_user", "designated_user.user_id", "emp_reporting_mapper.reporting_id") // Fetch the designated user's name
            .where("user_form_track_new.is_shared", "Y")
            .andWhere("user_form_track_new.financial_year", financialyear)

        // console.log(data, "this is new data")


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
    let user_id = req.user_id;

    try {

        let data = await knexConnect("user").count("* as total").where("department_id", department_id);
        let count = await knexConnect("user_form_track_new").count("* as total").where("department_id", department_id).andWhere("financial_year", financial_year);
        let singleentry = await knexConnect("user_form_track_new").count("* as total").where("designated_id", user_id).andWhere("financial_year", financial_year).andWhere("is_shared", "N")


        // let entries_data = await knexConnect("user_form_track_new")
        //     .select(
        //         "user_form_track_new.*",
        //         "user.*",
        //         "department.*"
        //     )
        //     .join("user", "user_form_track_new.user_id", "user.user_id")
        //     .join("department", "department.department_id", "user_form_track_new.department_id")
        //     .where("user_form_track_new.financial_year", financial_year)
        //     .whereNot("user_form_track_new.is_verified", "Pending");

        let entries_data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user.*",
                "department.*",
                knexConnect.raw("head_user.user_first_name as department_head_name"),
                knexConnect.raw("head_user.emp_id as department_head_empid"),
                knexConnect.raw("head_user.user_id as department_head_userid")
            )
            .join("user", "user_form_track_new.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track_new.department_id")
            .leftJoin("emp_reporting_mapper", "emp_reporting_mapper.emp_id", "user_form_track_new.user_id")
            .leftJoin("user as head_user", "head_user.user_id", "emp_reporting_mapper.reporting_id")
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


const getassignedformstome = async (req, res) => {

    let financial_year = req.body.financial_year || null;
    let department_name = req.department_name;
    let department_id = req.department_id;
    let user_id = req.user_id;

    try {

        let data = await knexConnect("user").count("* as total").where("department_id", department_id);
        let count = await knexConnect("user_form_track_new").count("* as total").where("department_id", department_id).andWhere("financial_year", financial_year);
        let singleentry = await knexConnect("user_form_track_new").count("* as total").where("designated_id", user_id).andWhere("financial_year", financial_year).andWhere("is_shared", "N")


        // let entries_data = await knexConnect("user_form_track_new")
        //     .select(
        //         "user_form_track_new.*",
        //         "user.*",
        //         "department.*"
        //     )
        //     .join("user", "user_form_track_new.user_id", "user.user_id")
        //     .join("department", "department.department_id", "user_form_track_new.department_id")
        //     .where("user_form_track_new.financial_year", financial_year)
        //     .whereNot("user_form_track_new.is_verified", "Pending");

        // let entries_data = await knexConnect("user_form_track_new")
        //     .select(
        //         "user_form_track_new.*",
        //         "user.*",
        //         "department.*",
        //         knexConnect.raw("head_user.user_first_name as department_head_name"),
        //         knexConnect.raw("head_user.emp_id as department_head_empid"),
        //         knexConnect.raw("head_user.user_id as department_head_userid")
        //     )
        //     .join("user", "user_form_track_new.user_id", "user.user_id")
        //     .join("department", "department.department_id", "user_form_track_new.department_id")
        //     .leftJoin("emp_reporting_mapper", "emp_reporting_mapper.emp_id", "user_form_track_new.user_id")
        //     .leftJoin("user as head_user", "head_user.user_id", "emp_reporting_mapper.reporting_id")
        //     .where("user_form_track_new.financial_year", financial_year)
        //     .whereNot("user_form_track_new.is_verified", "Pending");

        let entries_data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user.*",
                "department.*",
                knexConnect.raw("head_user.user_first_name as department_head_name"),
                knexConnect.raw("head_user.emp_id as department_head_empid"),
                knexConnect.raw("head_user.user_id as department_head_userid")
            )
            .join("user", "user_form_track_new.user_id", "user.user_id")
            .join("department", "department.department_id", "user_form_track_new.department_id")
            .leftJoin("emp_reporting_mapper", "emp_reporting_mapper.emp_id", "user_form_track_new.user_id")
            .leftJoin("user as head_user", "head_user.user_id", "emp_reporting_mapper.reporting_id")
            .where("user_form_track_new.financial_year", financial_year)
            .whereNot("user_form_track_new.is_verified", "Pending")
            .andWhere("emp_reporting_mapper.reporting_id", user_id); // Filter by given user_id as reporting_id


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


const getPendingFormsForMarks = async (req, res) => {

    let user_id = req.user_id;
    // let user_id = 10;
    let financial = req.body.financial;

    try {

        // let data=await knexConnect("user_form_track_new")
        // .select("user_form_track_new.*","user_form_new.*")
        // .join("user_form_new","user_form_new.","user_form_track_new.designated_id")

        // let data = await knexConnect("user_form_track_new")
        //     .distinct("user_form_track_new.*", "user_form_new.form_id") // Select form_id and all user_form_new columns
        //     .join("user_form_new", "user_form_new.form_id", "user_form_track_new.form_id") // Join on form_id
        //     .where("user_form_track_new.designated_id", user_id) // Filter by designated_id
        //     .whereNotNull("user_form_new.kpi_id") // kpi_id != null
        //     .whereNotNull("user_form_new.kpi_target") // kpi_target != null
        //     .whereNull("user_form_new.kpi_obtained"); // kpi_obtained = null


        // let data = await knexConnect("user_form_track_new")
        //     .select("user_form_track_new.*") // Select all columns from user_form_track_new
        //     .join("user_form_new", "user_form_new.form_id", "user_form_track_new.form_id") // Join on form_id
        //     .where("user_form_track_new.designated_id", user_id) // Filter by designated_id
        //     .whereNotNull("user_form_new.kpi_id") // kpi_id != null
        //     .whereNotNull("user_form_new.kpi_target") // kpi_target != null
        //     .whereNull("user_form_new.kpi_obtained") // kpi_obtained = null
        //     .groupBy("user_form_track_new.form_id"); // Ensures distinct form_id while keeping all data

        // let data = await knexConnect("user_form_track_new")
        //     .select("user_form_track_new.*", "user.user_first_name", "user.emp_id", "user.designation", "department.department_name as department_name") // Select all from user_form_track_new and user
        //     .join("user_form_new", "user_form_new.form_id", "user_form_track_new.form_id") // Join with user_form_new on form_id
        //     .join("user", "user_form_track_new.user_id", "user.user_id") // Join with user table on user_id
        //     .join("department", "department.department_id", "user.department_id") // Join with user table on user_id
        //     .where("user_form_track_new.designated_id", user_id) // Filter by designated_id
        //     .andWhere("user_form_track_new.financial_year", financial) // Filter by designated_id
        //     .where((qb) => {
        //         qb.whereNotNull("user_form_new.kpi_id")
        //             .whereNotNull("user_form_new.kpi_complete")
        //             .whereNull("user_form_new.kpi_obtained");
        //     })
        //     .groupBy("user_form_track_new.form_id"); // Ensure distinct form_id while keeping user data

        let data = await knexConnect("user_form_track_new")
            .select(
                "user_form_track_new.*",
                "user.user_first_name",
                "user.emp_id",
                "user.designation",
                "user.doj",
                "department.department_name as department_name",
                knexConnect.raw("head_user.user_first_name as department_head_name"),
                knexConnect.raw("head_user.emp_id as department_head_empid"),
                knexConnect.raw("head_user.user_id as department_head_userid")
            )
            .join("user_form_new", "user_form_new.form_id", "user_form_track_new.form_id") // Join with user_form_new on form_id
            .join("user", "user_form_track_new.user_id", "user.user_id") // Join with user table on user_id
            .join("department", "department.department_id", "user.department_id") // Join with department table on department_id
            .leftJoin("emp_reporting_mapper", "emp_reporting_mapper.emp_id", "user.user_id") // Get reporting_id
            .leftJoin("user as head_user", "head_user.user_id", "emp_reporting_mapper.reporting_id") // Get department head details
            .where("user_form_track_new.designated_id", user_id) // Filter by designated_id
            .andWhere("user_form_track_new.financial_year", financial) // Filter by financial year
            .where((qb) => {
                qb.whereNotNull("user_form_new.kpi_id")
                    .whereNotNull("user_form_new.kpi_complete")
                    .whereNull("user_form_new.kpi_obtained");
            })
            .groupBy("user_form_track_new.form_id", "head_user.user_id", "head_user.user_first_name", "head_user.emp_id"); // Group by form_id and department head details




        if (data.length > 0) {
            return res.send({
                status: true,
                data: data,
                message: "Data Found"
            })
        }
        else {
            return res.send({
                status: false,
                data: [],
                message: "No Form Found"
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


const editRequestForm = async (req, res) => {
    let data = req.body.data;
    let user_id = req.user_id;
    let user_name = req.user_name;
    let emp_id = req.emp_id;

    try {

        let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');


        let checkoldrequest = await knexConnect("edit_form_request")
            .select("*")
            .where({
                "form_id": data.form_id,
                "request_status": "Pending"
            })
            .orWhere(function () {
                this.where("request_status", "Accepted")
                    .andWhere("edit_status", "Pending");
            });

        if (checkoldrequest.length > 0) {
            return res.send({
                status: false,
                message: "Request already present."
            })
        }

        let insertrequest = await knexConnect("edit_form_request")
            .insert({
                "form_id": data.form_id,
                "requested_by_name": user_name,
                "requested_by_id": user_id,
                "requested_by_empid": emp_id,
                "request_created_on": formattedDate,
                "request_for_userid": data.user_id,
                "request_for_name": data.user_first_name,
                "request_for_empid": data.emp_id,
                "financial_year": data.financial_year,
            })

        return res.send({
            status: true,
            message: "Request Created Successfully."
        })

    } catch (error) {

        return res.send({
            status: false,
            message: "Error Occured",
            data: error.message
        })

    }
}

const viewEditRequests = async (req, res) => {
    let financial = req.params.financial;

    let user_id = req.query.userid || null;

    try {

        // let data = await knexConnect("edit_form_request")
        //     .select("*")
        //     .where({
        //         "financial_year": financial
        //     })

        let query = knexConnect("edit_form_request")
            .select("*")
            .where({
                "financial_year": financial
            });

        if (user_id) {
            query = query.andWhere({
                "requested_by_id": user_id
            });
        }


        let data = await query;

        if (data.length > 0) {

            return res.send({
                status: true,
                message: "Requests found.",
                data: data
            })
        }
        else {
            return res.send({
                status: false,
                message: "No requests found."
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

const acceptEditRequest = async (req, res) => {
    let requestid = req.body.requestid;
    let status = req.body.status;
    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    try {

        let updatestatus = await knexConnect("edit_form_request").update({
            "request_status": status,
            "request_accepted_on": formattedDate
        }).where("request_id", requestid)

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



const addQuery = async (req, res) => {
    let queryby_userid = req.user_id;
    let queryby_empid = req.emp_id;
    let queryby_name = req.user_name;
    let question = req.body.question ? req.body.question.trim() : "No question provided";
    let queryby_date = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
        let insetdata = await knexConnect("queries").insert({
            queryby_userid, queryby_empid, queryby_name, queryby_date, question
        })

        return res.send({
            status: true,
            message: "Question Submitted Successfully."
        })

    } catch (error) {

        console.log(error)

        return res.send({
            status: false,
            message: "Something went wrong."
        })


    }
}


const answerQuery = async (req, res) => {
    let answerby_userid = req.user_id;
    let answerby_empid = req.emp_id;
    let answerby_name = req.user_name;
    let query_id = req.body.query_id;
    let answer = req.body.answer ? req.body.answer.trim() : "No answer provided";
    let answerby_date = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
        let insetdata = await knexConnect("queries").update({
            answerby_userid, answerby_empid, answerby_name, answerby_date, answer
        }).where("query_id", query_id)

        return res.send({
            status: true,
            message: "Answer Submitted Successfully."
        })

    } catch (error) {

        console.log(error)

        return res.send({
            status: false,
            message: "Something went wrong."
        })


    }
}



const myQueries = async (req, res) => {

    let emp_id = req.emp_id;

    if (!emp_id) {
        return res.send({
            status: false,
            message: "EMP ID not recieved"
        })
    }

    try {

        let response = await knexConnect("queries").select("*").where("queryby_empid", emp_id);

        if (response && Array.isArray(response) && response.length > 0) {
            return res.send({
                status: true,
                message: "List Found",
                data: response
            })
        }
        else {
            return res.send({
                status: false,
                message: "No List Found",
                data: []
            })
        }


    } catch (error) {
        console.log(error)
        return res.send({
            status: false,
            message: "Something went wrong",
            data: []
        })

    }
}


const allQueries = async (req, res) => {

    try {

        let response = await knexConnect("queries").select("*");

        if (response && Array.isArray(response) && response.length > 0) {
            return res.send({
                status: true,
                message: "List Found",
                data: response
            })
        }
        else {
            return res.send({
                status: false,
                message: "No List Found",
                data: []
            })
        }


    } catch (error) {
        console.log(error)
        return res.send({
            status: false,
            message: "Something went wrong",
            data: []
        })

    }
}




module.exports = {
    acceptEditRequest, viewEditRequests, updateFormDataSpecialNew, getassignedformstome, addQuery, myQueries, allQueries, answerQuery,
    getPendingFormsForMarks, getSubmittedFormsNew,
    updateFormDateAndMarks, approveRejectNew,
    getTotalFormsTotalUsersNew, sendToDepartmentHead,
    updateFormDataNew, getFormsDepartmentNew, addNewForm,
    viewMyFormsNew, getSubmittedForms, sendDepartmentFinancialYear,
    getTotalFormsTotalUsers, addForm, viewMyForms, getParticularForm,
    getParticularFormNew, getFormsDepartment, sendForVerification,
    getInProgressForms, approveReject, updateFormData, editRequestForm
}
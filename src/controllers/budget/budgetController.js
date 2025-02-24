const knexConnect = require("../../../knexConnection");
const { getBudgetPaf, insertNewBudget } = require("./budgetHelper");
const moment = require("moment")

const addBudgetEntries = async (req, res) => {

    let data = req.body.data;

    if (!data) {
        return res.send({
            status: false,
            message: "Data not recieved"
        })
    }

    try {

        let datatosend = [];

        data.map((ele) => {
            datatosend.push({
                "q1": ele.q1,
                "q2": ele.q2,
                "q3": ele.q3,
                "q4": ele.q4,
                "paf_id": ele.paf_id,
                "paf_unique": ele.paf_unique,
                "department_id": ele.department_id,
                "department_name": ele.department_name,
                "pafform_id": ele.pafform_id || null,
                "pafform_header_id": ele.pafform_header_id || null,
                "pafform_item_name": ele.pafform_item_name,
                "budget_updated_by": req.user_name,
                "budget_updated_at": moment().format('YYYY-MM-DD HH:mm:ss'),
                "costhead":ele.costhead
            })
        })

        let response = await insertNewBudget(datatosend)

        if (response) {

            // let updatebudgetstatus = await knexConnect("paf_details").update({
            //     budget_recieve: "Y"
            // }).where({ paf_id: datatosend[0].paf_id });

            return res.send({
                status: true,
                message: "Added PAF Budget Successfully"
            })
        }
        else {
            return res.send({
                status: false,
                message: "Couldnt insert the data"
            })
        }


    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong",
            data: error.message
        })
    }

}

const getBudget = async (req, res) => {

    let pafid = req.params.pafid;

    try {

        let response = await getBudgetPaf(pafid);

        if (response) {
            if (response.length > 0) {
                return res.send({
                    status: true,
                    message: "Budget Entries found",
                    data: response
                })
            }
            else {
                return res.send({
                    status: false,
                    message: "No budget found for the particular PAF"
                })
            }

        }
        else {
            return res.send({
                status: false,
                message: "Could not fetch budget"
            })
        }

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
        })
    }

}

const updateBudgetstatus = async (req, res) => {
    let budgetid = req.params.budgetid;

    let status = req.body.status;

    try {

        const updatestatus = await knexConnect("budget_paf").update({
            "budget_approved_by": req.user_name,
            "budget_status": status
        }).where("budget_id", budgetid)

        return res.send({
            status: true,
            message: "Budget status updated"
        })

    } catch (error) {
        return res.send({
            status: true,
            message: "Something went wrong",
            data: error.message
        })
    }
}

module.exports = { getBudget, addBudgetEntries,updateBudgetstatus }
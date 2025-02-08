const knexConnect = require("../../../knexConnection");
const { pafInsert, pafGet } = require("./pafHelper");
const moment = require("moment")

const addPaf = async (req, res) => {
    let {
        client_information, driving_market, paf_initiated_on, brief_scope, api_sources, sku, import_license_api, import_license_rld, drug_id,
        composition_array, stakeholders
    } = req.body;


    let compositions_selected = composition_array && Array.isArray(composition_array) && composition_array.length > 0 ? JSON.stringify(composition_array) : null;
    stakeholders = stakeholders && Array.isArray(stakeholders) && stakeholders.length > 0 ? JSON.stringify(stakeholders) : null;

    client_information = client_information ? client_information.trim() : null;
    driving_market = driving_market && Array.isArray(driving_market) && driving_market.length > 0 ? JSON.stringify(driving_market) : null;

    paf_initiated_on = paf_initiated_on ? paf_initiated_on : null;
    brief_scope = brief_scope ? brief_scope.trim() : null;

    api_sources = api_sources ? api_sources.trim() : null;
    sku = sku ? sku.trim() : null;

    import_license_api = import_license_api ? import_license_api.trim() : null
    import_license_rld = import_license_rld ? import_license_rld.trim() : null

    drug_id = drug_id ? drug_id : null

    let paf_unique = "PAF-TEST";


    if (!(stakeholders && compositions_selected && client_information && driving_market && paf_initiated_on && brief_scope && api_sources && sku && import_license_api && import_license_rld)) {
        return res.send({
            status: false,
            message: "Please provide all details"
        })
    }

    if (!drug_id) {
        return res.send({
            status: false,
            "message": "Please provide drug id"
        })
    }


    try {

        const totalEntries = 10; // This is the variable holding total entries, replace with actual value
        const startDate = moment(); // Current date (today's date)
        const endDate = moment().add(1, 'days'); // Example: Next day's date

        // Format the start and end dates
        const startDateFormatted = startDate.format('YYYY');
        const endDateFormatted = parseInt(endDate.format('YY')) + 1;

        let count = await knexConnect("paf_details").count('* as count');
        let finalcount=parseInt(count[0].count)+1;
        // console.log(count[0].count);

        // Create the linear string
        paf_unique = `VE/21/${startDateFormatted}-${endDateFormatted}/${finalcount}`;

        const insertpaf = await pafInsert({ client_information, driving_market, paf_initiated_on, brief_scope, api_sources, sku, import_license_api, import_license_rld, paf_unique, drug_id, compositions_selected,stakeholders })

        if (insertpaf) {
            return res.send({
                status: true,
                message: "PAF added successfully"
            })
        }
        else {
            return res.send({
                status: false,
                message: "Error adding PAF"
            })
        }

    } catch (error) {
        console.log(error)

        return res.send({
            status: false,
            message: "Somtehing went wrong"
        })

    }


}

const getPaf = async (req, res) => {
    let pafId = req.query.pafId || null;

    try {
        let pafdata = await pafGet(pafId);

        if (pafdata) {
            if (pafdata.length > 0) {
                return res.send({
                    status: true,
                    message: "PAF List",
                    data: pafdata
                })
            }
            else {
                return res.send({
                    status: false,
                    message: "PAF List not found"
                })
            }
        }
        else {
            return res.send({
                status: false,
                message: "No PAF list found"
            })
        }

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
        })

    }
}

const addStakeHolder = async (req, res) => {

    let { stakeholder_name, designation } = req.body;

    stakeholder_name = stakeholder_name ? stakeholder_name.trim() : null;
    designation = designation ? designation.trim() : null;

    if (!(stakeholder_name && designation)) {
        return res.send({
            status: false,
            message: "Please send all details"
        })
    }

    try {

        const insertstakeholder = await knexConnect("stakeholder").insert({
            "stakeholder_name": stakeholder_name,
            "stakeholder_designation": designation
        })

        return res.send({
            status: true,
            message: "Stakeholder inserted successfully.",
        })


    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
        })
    }

}

const viewStakeHolder = async (req, res) => {

    let stakeholder_id = req.query.id || null;

    try {

        let query = knexConnect("stakeholder").select("*")

        if (stakeholder_id) {
            query = query.where("stakeholder_id", stakeholder_id)
        }

        let response = await query;

        return res.send({
            status: true,
            message: "Stakeholder List found.",
            data: response
        })


    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
        })
    }

}

module.exports = { addPaf, getPaf, addStakeHolder, viewStakeHolder }
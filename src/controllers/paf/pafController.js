const knexConnect = require("../../../knexConnection");
const { pafInsert, pafGet } = require("./pafHelper");

const addPaf = async (req, res) => {
    let {
        client_information, driving_market, paf_initiated_on, brief_scope, api_sources, sku, import_license_api, import_license_rld, drug_id
    } = req.body;

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


    if (!(client_information && driving_market && paf_initiated_on && brief_scope && api_sources && sku && import_license_api && import_license_rld)) {
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

        const insertpaf = await pafInsert({ client_information, driving_market, paf_initiated_on, brief_scope, api_sources, sku, import_license_api, import_license_rld, paf_unique, drug_id })

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

module.exports = { addPaf, getPaf }
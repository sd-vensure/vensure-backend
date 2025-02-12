const knexConnect = require("../../../knexConnection");
const { getMasterFormforMasterId, insertNewPafForm } = require("../form/formHelper");
const { pafInsert, pafGet, approvePafCall, getFinancialYear } = require("./pafHelper");
const moment = require("moment")

const addPaf = async (req, res) => {
    let {
        client_information, driving_market, paf_initiated_on, brief_scope, api_sources, sku, import_license_api, import_license_rld, drug_id,
        composition_array, stakeholders, master_type, include_form_headers
    } = req.body;

    let paf_created_by = req.user_name || "NA"


    let compositions_selected = composition_array && Array.isArray(composition_array) && composition_array.length > 0 ? JSON.stringify(composition_array) : null;
    include_form_headers = include_form_headers && Array.isArray(include_form_headers) && include_form_headers.length > 0 ? include_form_headers : null;
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
    master_type = master_type ? master_type : null

    let paf_unique = "PAF-TEST";


    if (!(include_form_headers && stakeholders && master_type && compositions_selected && client_information && driving_market && paf_initiated_on && brief_scope && api_sources && sku && import_license_api && import_license_rld)) {
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

        let count = await knexConnect("paf_details")
            .count('* as count')
            .where('paf_unique', 'like', '%01'); // This ensures paf_unique ends with '01'
        let finalcount = parseInt(count[0].count) + 1;

        // console.log(count[0].count);

        // Create the linear string
        let financialyear = getFinancialYear()
        paf_unique = `VE/${finalcount}/${financialyear}/01`;

        let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

        const insertpaf = await pafInsert({ client_information, driving_market, paf_initiated_on, brief_scope, api_sources, sku, import_license_api, import_license_rld, paf_unique, drug_id, compositions_selected, stakeholders, "master_type_id": master_type, paf_created_by, "paf_created_at": formattedDate })

        if (insertpaf) {

            let formsdata = await getMasterFormforMasterId(master_type);

            if (formsdata.length > 0) {
                let finaldata = formsdata.map((row, index) => {

                    let findpaf = include_form_headers.find((ee) => ee.master_header_id == row.master_header_id)

                    return {
                        pafform_type_id: row.master_type_id,
                        pafform_header_id: row.master_header_id,
                        pafform_item_id: row.master_item_id,
                        pafform_subitem_id: row.master_subitem_id,
                        pafform_item_name: row.master_item_name,
                        header_status: findpaf.status_selected,
                        pafform_target: findpaf.target_date_selected.trim() == "" ? null : findpaf.target_date_selected,
                        header_timeline: findpaf.timeline_selected,
                        paf_id: insertpaf // Add your custom 'paf_id' here
                    };
                });

                const insertpafform = await insertNewPafForm(finaldata)

                if (insertpafform) {

                    return res.send({
                        status: true,
                        message: "PAf and Form created successfully."
                    })

                }

                else {

                    return res.send({
                        status: false,
                        message: "PAf Created,Master Form found but New PAF Form not created"
                    })

                }

            }
            else {

                return res.send({
                    status: false,
                    message: "PAF created no master form found"
                })

            }



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

const addPafNew = async (req, res) => {
    let {
        drug_name,
        drug_api,
        drug_innovator,
        compositions,
        master_type_id,
        client_name,
        brief_scope,
        sku,
        api_sources,
        import_license_rld,
        import_license_api,
        selectedcountry,
        selectedstakeholders
    } = req.body;

    let paf_created_by = req.user_name || "NA"

    if (paf_created_by == "NA") {
        return res.send({
            status: false,
            message: "Please login and try again"
        })
    }

    drug_name = drug_name ? drug_name.trim() : null;
    drug_api = drug_api ? drug_api.trim() : null;
    drug_innovator = drug_innovator ? drug_innovator.trim() : null;
    compositions = compositions ? compositions.trim() : null;
    master_type_id = master_type_id ? master_type_id.trim() : null;
    client_name = client_name ? client_name.trim() : null;
    brief_scope = brief_scope ? brief_scope.trim() : null;
    sku = sku ? sku.trim() : null;
    api_sources = api_sources ? api_sources.trim() : null;
    import_license_rld = import_license_rld ? import_license_rld.trim() : null;
    import_license_api = import_license_api ? import_license_api.trim() : null;

    selectedcountry = selectedcountry && Array.isArray(selectedcountry) && selectedcountry.length > 0 ? JSON.stringify(selectedcountry) : null;
    selectedstakeholders = selectedstakeholders && Array.isArray(selectedstakeholders) && selectedstakeholders.length > 0 ? JSON.stringify(selectedstakeholders) : null;

    let count = await knexConnect("paf_details")
        .count('* as count')
        .where('paf_unique', 'like', '%01'); 

    let finalcount = parseInt(count[0].count) + 1;
    let financialyear = getFinancialYear()
    
    let paf_unique = `VE/${finalcount}/${financialyear}/01`;

    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    if (!(selectedcountry && selectedstakeholders && drug_name && drug_api && drug_innovator && compositions && master_type_id && client_name && brief_scope && sku && api_sources && import_license_rld && import_license_api)) {
        return res.send({
            status: false,
            message: "Please provide all details"
        })
    }

    try {

        let sendobj={
        drug_name,
        drug_api,
        drug_innovator,
        compositions,
        master_type_id,
        client_name,
        brief_scope,
        sku,
        api_sources,
        import_license_rld,
        import_license_api,
        "driving_market":selectedcountry,
        "stakeholders":selectedstakeholders,
        paf_unique,
        paf_created_by,
        paf_created_at:formattedDate
        }

        const insertpaf=await pafInsert(sendobj);

        if(insertpaf)
        {

            return res.send({
                status: true,
                message: "PAF added successfully."
            })

        }
        else{

            return res.send({
                status: false,
                message: "Could not insert PAF"
            })

        }


    } catch (error) {

        return res.send({
            status: false,
            message: "Something went wrong",
            data:error.message
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


const getMasterTypes = async (req, res) => {

    try {

        const response = await knexConnect("master_type")
            .select("*")
            .join("master_form", "master_type.master_type_id", "=", "master_form.master_type_id")
            .whereNull("master_form.master_item_id")
            .whereNull("master_form.master_subitem_id");



        const transformedData = response.reduce((acc, { master_type_id, master_type_name, ...rest }) => {
            let typeGroup = acc.find(item => item.master_type_id === master_type_id);

            if (!typeGroup) {
                typeGroup = { master_type_id, master_type_name, items: [] };
                acc.push(typeGroup);
            }

            typeGroup.items.push(rest);

            return acc;
        }, []);

        return res.send({
            status: true,
            message: "MasterTypes List found.",
            data: transformedData
        })


    } catch (error) {
        console.log(error)
        return res.send({
            status: false,
            message: "Something went wrong"
        })
    }

}

const approvePaf = async (req, res) => {
    let pafid = req.params.pafid;
    let user_name = req?.user_name;

    let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
        const approvepaf = await approvePafCall(pafid, user_name, formattedDate);

        if (approvepaf) {
            return res.send({
                status: true,
                message: "PAF Approved"
            })
        }
        else {

            return res.send({
                status: false,
                message: "Not approved"
            })

        }

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
        })

    }
}

const revisePAF = async (req, res) => {
    let {
        client_information, driving_market, paf_initiated_on, brief_scope, api_sources, sku, import_license_api, import_license_rld, drug_id,
        composition_array, stakeholders, master_type, include_form_headers, paf_unique
    } = req.body;

    let paf_created_by = req.user_name || "NA"


    let compositions_selected = composition_array && Array.isArray(composition_array) && composition_array.length > 0 ? JSON.stringify(composition_array) : null;
    include_form_headers = include_form_headers && Array.isArray(include_form_headers) && include_form_headers.length > 0 ? include_form_headers : null;
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
    master_type = master_type ? master_type : null

    if (!(include_form_headers && stakeholders && master_type && compositions_selected && client_information && driving_market && paf_initiated_on && brief_scope && api_sources && sku && import_license_api && import_license_rld)) {
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

        // let count = await knexConnect("paf_details")
        //     .count('* as count')
        //     .where('paf_unique', 'like', '%01'); // This ensures paf_unique ends with '01'
        // let finalcount = parseInt(count[0].count) + 1;

        // let financialyear = getFinancialYear()
        // paf_unique = `VE/${finalcount}/${financialyear}/01`;

        let lastPart = paf_unique.split('/').pop(); // "01"

        let incrementedLastPart = (parseInt(lastPart) + 1).toString().padStart(2, '0'); // "02"

        // Replace the old last part with the incremented value
        let newPafUnique = paf_unique.slice(0, paf_unique.lastIndexOf('/') + 1) + incrementedLastPart;

        paf_unique = newPafUnique;

        let formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

        const insertpaf = await pafInsert({ client_information, driving_market, paf_initiated_on, brief_scope, api_sources, sku, import_license_api, import_license_rld, paf_unique, drug_id, compositions_selected, stakeholders, "master_type_id": master_type, paf_created_by, "paf_created_at": formattedDate })

        if (insertpaf) {

            let formsdata = await getMasterFormforMasterId(master_type);

            if (formsdata.length > 0) {
                let finaldata = formsdata.map((row, index) => {

                    let findpaf = include_form_headers.find((ee) => ee.master_header_id == row.master_header_id)

                    return {
                        pafform_type_id: row.master_type_id,
                        pafform_header_id: row.master_header_id,
                        pafform_item_id: row.master_item_id,
                        pafform_subitem_id: row.master_subitem_id,
                        pafform_item_name: row.master_item_name,
                        header_status: findpaf.status_selected,
                        pafform_target: findpaf.target_date_selected.trim() == "" ? null : findpaf.target_date_selected,
                        header_timeline: findpaf.timeline_selected,
                        paf_id: insertpaf // Add your custom 'paf_id' here
                    };
                });

                const insertpafform = await insertNewPafForm(finaldata)

                if (insertpafform) {

                    return res.send({
                        status: true,
                        message: "PAf and Form created successfully."
                    })

                }

                else {

                    return res.send({
                        status: false,
                        message: "PAf Created,Master Form found but New PAF Form not created"
                    })

                }

            }
            else {

                return res.send({
                    status: false,
                    message: "PAF created no master form found"
                })

            }



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

module.exports = { addPaf, getPaf, addPafNew, addStakeHolder, viewStakeHolder, getMasterTypes, approvePaf, revisePAF }
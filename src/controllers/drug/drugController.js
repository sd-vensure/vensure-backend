const knexConnect = require("../../../knexConnection");
const { insertDrug, getDrugs, getInnovators, insertcomposition } = require("./drugHelper");

const addDrug = async (req, res) => {
    let {
        drug_name, drug_api, innovator_id, drug_composition, master_type_id
    } = req.body;

    drug_name = drug_name ? drug_name.trim() : null
    drug_api = drug_api ? drug_api.trim() : null

    innovator_id = innovator_id ? innovator_id : null
    master_type_id = master_type_id ? master_type_id : null

    drug_composition = drug_composition && Array.isArray(drug_composition) && drug_composition.length > 0 ? drug_composition : null

    if (!(drug_name && master_type_id && drug_api && innovator_id && drug_composition)) {
        return res.send({
            status: false,
            message: "Please send all details properly"
        })
    }

    try {

        console.log("reached 1")
        let druginsertresp = await insertDrug({
            drug_name, drug_api, innovator_id,master_type_id
        })

        console.log("reached 2")

        if (druginsertresp) {

            // console.log(druginsertresp)

            let temp_array = []
            drug_composition.map((ele) => {
                temp_array.push({ "drug_composition_name": ele, "drug_id": druginsertresp })
            })

            console.log(temp_array)

            let insertcompositiondata = await insertcomposition(temp_array);

            if (insertcompositiondata) {
                return res.send({
                    status: true,
                    message: "Drug and Composition added successfully."
                })
            }
            else {

                return res.send({
                    status: false,
                    message: "Drug added, Composition not added."
                })

            }

        }
        else {

            return res.send({
                status: false,
                message: "Drug entry failed."
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

const getDrug = async (req, res) => {

    let drug_id = req.query.drugId || null;

    try {

        const drugdata = await getDrugs(drug_id);

        if (drugdata) {
            return res.send({
                status: true,
                message: "Drug found.",
                data: drugdata
            })
        }
        else {

            return res.send({
                status: false,
                message: "Drug not found."
            })

        }



    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong."
        })

    }
}


const addInnovator = async (req, res) => {

    let { innovatorName } = req.body;

    innovatorName = innovatorName ? innovatorName.trim() : null;

    if (!innovatorName) {
        return res.send({
            status: false,
            message: "Please send innovator name."
        })
    }

    try {

        const innovatorinsert = await knexConnect("innovator").insert({ "innovator_name": innovatorName });

        return res.send({
            status: true,
            message: "Innovator added successfully."
        })

    } catch (error) {

        return res.send({
            status: false,
            message: "Something went wrong"
        })

    }


}

const getInnovator = async (req, res) => {

    let innovator_id = req.query.innovatorId || null;

    try {

        const innovatordata = await getInnovators(innovator_id);

        if (innovatordata) {
            return res.send({
                status: true,
                message: "Innovator found.",
                data: innovatordata
            })
        }
        else {

            return res.send({
                status: false,
                message: "Innovator not found."
            })

        }

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong."
        })

    }
}



module.exports = { addDrug, getDrug, addInnovator, getInnovator }
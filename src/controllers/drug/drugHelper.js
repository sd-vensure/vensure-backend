const knexConnect = require("../../../knexConnection")

const insertDrug = async (data) => {

    try {

        const response = await knexConnect("drug").insert(data);
        return response[0];

    } catch (error) {
        return false;

    }


}

const getDrugs = async (id) => {

    try {

        let query = knexConnect('drug')
            .join('innovator', 'drug.innovator_id', '=', 'innovator.innovator_id')
            .select('drug.*', 'innovator.*'); // Default select

        // If drug_id is provided, add a where condition to filter by drug_id
        if (id) {
            query = query.where('drug.drug_id', id);
        }

        const response = await query;

        if (response && response.length > 0) {
            return response;
        }
        else {
            return false;
        }

    } catch (error) {
        return false;

    }


}


const getInnovators = async (id) => {

    try {

        let query = knexConnect('innovator')
            .select("*"); // Default select

        // If drug_id is provided, add a where condition to filter by drug_id
        if (id) {
            query = query.where('innovator_id', id);
        }

        const response = await query;

        if (response && response.length > 0) {
            return response;
        }
        else {
            return false;
        }

    } catch (error) {
        return false;

    }


}


module.exports = { insertDrug, getDrugs, getInnovators }
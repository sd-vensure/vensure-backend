const knexConnect = require("../../../knexConnection")

const insertDrug = async (data) => {

    try {

        const response = await knexConnect("drug").insert(data);
        console.log(response)
        return response[0];

    } catch (error) {
        console.log(error)
        return false;

    }

}

const insertcomposition = async (data) => {

    try {
        const insertcompositions = await knexConnect("drug_composition").insert(data);

        return true;

    } catch (error) {

        return false

    }


}


const getDrugs = async (id) => {

    try {

        let query = knexConnect('drug')
            .join('innovator', 'drug.innovator_id', '=', 'innovator.innovator_id')
            .leftJoin('drug_composition', 'drug.drug_id', '=', 'drug_composition.drug_id')
            .select(
                'drug.*',
                'innovator.*',
                'drug_composition.*'
            );

        // If drug_id is provided, add a where condition to filter by drug_id
        if (id) {
            query = query.where('drug.drug_id', id);
        }

        const response = await query;

        if (response && response.length > 0) {

            // const groupedByDrug = response.reduce((acc, item) => {
            //     const drugId = item.drug_id;
            //     if (!acc[drugId]) {
            //         acc[drugId] = {
            //             drug_id: item.drug_id,
            //             drug_name: item.drug_name,
            //             drug_api: item.drug_api,
            //             innovator_id: item.innovator_id,
            //             innovator_name: item.innovator_name,
            //             drug_active: item.drug_active,
            //             compositions: []
            //         };
            //     }

            //     acc[drugId].compositions.push({
            //         composition_id: item.drug_composition_id,
            //         composition_name: item.drug_composition_name
            //     });

            //     return acc;
            // }, {});

            // const result = Object.values(groupedByDrug);

            const drugMap = new Map();

            // Single loop through the data
            for (const item of response) {
                if (!drugMap.has(item.drug_id)) {
                    // Create new drug entry
                    drugMap.set(item.drug_id, {
                        drug_id: item.drug_id,
                        drug_name: item.drug_name,
                        drug_api: item.drug_api,
                        innovator_id: item.innovator_id,
                        innovator_name: item.innovator_name,
                        master_type_id:item.master_type_id,
                        drug_active: item.drug_active,
                        compositions: []
                    });
                }

                // Add composition
                drugMap.get(item.drug_id).compositions.push({
                    composition_id: item.drug_composition_id,
                    composition_name: item.drug_composition_name
                });
            }

            // Convert to array
            const result = Array.from(drugMap.values());

            return result;
        }
        else {
            return false;
        }

    } catch (error) {

        console.log(error)
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


module.exports = { insertDrug, getDrugs, getInnovators, insertcomposition }
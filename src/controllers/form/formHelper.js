const knexConnect = require("../../../knexConnection");

const getLastBiggestNumbers = async (id) => {
    try {

        let response = await knexConnect('master_form')
            .select(
                knexConnect.raw('MAX(master_header_id) AS master_header_id'),
                knexConnect.raw('MAX(master_item_id) AS master_item_id'),
                knexConnect.raw('MAX(master_subitem_id) AS master_subitem_id')
            ).where("master_type_id", id);

        return response;

    } catch (error) {
        console.log(error)
        return false;
    }
}

module.exports = { getLastBiggestNumbers }

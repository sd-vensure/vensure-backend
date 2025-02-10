const knexConnect = require("../../../knexConnection");

const getLastBiggestNumbers = async (id) => {
    try {

        let response = await knexConnect('paf_forms')
            .select(
                knexConnect.raw('MAX(pafform_header_id) AS pafform_header_id'),
                knexConnect.raw('MAX(pafform_item_id) AS pafform_item_id'),
                knexConnect.raw('MAX(pafform_subitem_id) AS pafform_subitem_id')
            ).where("paf_id", id);

        return response;

    } catch (error) {
        console.log(error)
        return false;
    }
}


const getMasterFormforMasterId = async (id) => {
    try {

        let response=await knexConnect("master_form").select("*").where("master_type_id",id);

        return response;

    } catch (error) {
        console.log(error)
        return false;
    }
}


const insertNewPafForm=async(data)=>{
    try {

        let response=await knexConnect("paf_forms").insert(data);

        return true;

    } catch (error) {
        console.log(error)
        return false;
    }
}

const getPAFFrom=async(id)=>{
    try {
        let response = await knexConnect("paf_forms").select("*").where("paf_id", id);
        return response;
    } catch (error) {
        return false;
        
    }
}



module.exports = { getLastBiggestNumbers,getMasterFormforMasterId,insertNewPafForm,getPAFFrom }

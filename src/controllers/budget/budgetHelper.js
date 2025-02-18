const knexConnect = require("../../../knexConnection");

const insertNewBudget = async (data) => {

    try {
        let response = await knexConnect("budget_paf").insert(data);
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }

}

const getBudgetPaf = async (paf_id) => {
    try {

        let response = await knexConnect("budget_paf").select("*").where("paf_id", paf_id);
        return response;

    } catch (error) {
        return false
    }
}

module.exports = { insertNewBudget, getBudgetPaf }
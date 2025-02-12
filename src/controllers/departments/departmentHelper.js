const knexConnect = require("../../../knexConnection");

const insertDepartment = async (data) => {

    try {
        const insertdepart = await knexConnect("department").insert(data);

        return true;

    } catch (error) {
        console.log(error)
        return false;
    }

}

const getDepartments = async (department_id) => {
    try {

        let query = knexConnect("department").select("*");

        if (department_id) {
            query = query.where("department_id", department_id)
        };

        const data=await query;

        return data;


    } catch (error) {
        return fasle;
    }
}

module.exports = { insertDepartment, getDepartments }
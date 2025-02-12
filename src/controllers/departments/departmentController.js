const knexConnect = require("../../../knexConnection");

const { insertDepartment, getDepartments } = require('./departmentHelper')

const addDepartment = async (req, res) => {
    let {
        department_name
    } = req.body;

    department_name = department_name ? department_name.trim() : null

    if (!(department_name)) {
        return res.send({
            status: false,
            message: "Please send department name."
        })
    }

    try {

        let insertdepartment = await insertDepartment({
            department_name
        })

        if (insertdepartment) {
            return res.send({
                status: true,
                message: "Department added successfully"
            })

        }
        else {
            return res.send({
                status: false,
                message: "Couldn't create new department"
            })
        }

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
        })
    }


}

const getDepartment = async (req, res) => {

    let department_id = req.query.departmentId || null;

    try {

        const departmentdata = await getDepartments(department_id);

        if (departmentdata && departmentdata.length>0) {
            
            return res.send({
                status: true,
                message: "Department found.",
                data: departmentdata
            })
        }
        else {

            return res.send({
                status: false,
                message: "Department not found."
            })

        }

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong."
        })

    }
}



module.exports = { addDepartment,getDepartment }
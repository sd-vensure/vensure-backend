const knexConnect = require("../../../knexConnection");

const isIndianMobileNumber = (number) => {
    // Check if length is 10 and if it contains only digits
    const isTenDigits = number ? number.length === 10 : false;
    const isDigitsOnly = number ? /^\d+$/.test(number) : false;

    // Validate if it starts with digits between 6 and 9 (common for Indian mobile numbers)
    const isValidStart = number ? /^[6-9]/.test(number) : false;

    return isTenDigits && isDigitsOnly && isValidStart;
}

const isValidEmail = (email) => {
    // Regular expression for validating an email address
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email ? emailPattern.test(email) : false;
}


const checkUser = async (user_id) => {

    try {
        let resp = await knexConnect('user')
            .select('*') // Select all columns from the user table
            .join('department', 'department.department_id', '=', 'user.department_id') // Perform the join
            .where('user.user_id', user_id); // Filter by user_id

        if (resp === undefined) {

            return {
                status: false,
                data: undefined,
                message: "No Such User Exists"
            }

        }
        else {

            let fetchdesignatedperson= await knexConnect('emp_reporting_mapper')
            .select('user.*', 'emp_reporting_mapper.*')
            .join('user', 'user.user_id', 'emp_reporting_mapper.reporting_id')
            .where('emp_reporting_mapper.emp_id', user_id);

            let designated_data=null

            if(fetchdesignatedperson && Array.isArray(fetchdesignatedperson) && fetchdesignatedperson.length>0)
            {
                designated_data={
                    "designated_designation":fetchdesignatedperson[0].designation,
                    "designated_department_id":fetchdesignatedperson[0].department_id,
                    "designated_user_first_name":fetchdesignatedperson[0].user_first_name,
                    "designated_user_contact":fetchdesignatedperson[0].user_contact,
                    "designated_user_id":fetchdesignatedperson[0].user_id
                }
            }

            let datatopass={...resp[0],designated_data};

            return {
                status: true,
                data: datatopass,
                message: "Data Found"
            }
        }

    } catch (error) {
        return {
            status: false,
            message: "Something Went Wrong",
            error: "Something Went Wrong",
            actualError: error
        }
    }


}

module.exports = { isIndianMobileNumber, isValidEmail, checkUser }
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
        const resp = await knexConnect('user')
            .select('*') // Select all columns from the user table
            .join('department', 'department.department_id', '=', 'user.department_id') // Perform the join
            .where('user.user_id', user_id); // Filter by user_id


        // console.log(resp)

        if (resp === undefined) {

            return {
                status: false,
                data: undefined,
                message: "No Such User Exists"
            }

        }
        else {
            return {
                status: true,
                data: resp[0],
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
const knexConnect = require("../../../knexConnection");
const moment = require("moment");
const { getLastBiggestNumbers } = require("./formHelper");


const getLastNumbers = async (req, res) => {

    let id = req.query.id || null;

    try {

        let getLastBiggestNumber = await getLastBiggestNumbers(id)

        return res.send({
            status: true,
            message: "MasterTypes List found.",
            data: getLastBiggestNumber
        })


    } catch (error) {
        console.log(error)
        return res.send({
            status: false,
            message: "Something went wrong"
        })
    }

}

module.exports = { getLastNumbers }
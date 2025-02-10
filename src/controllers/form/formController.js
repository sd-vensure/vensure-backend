const knexConnect = require("../../../knexConnection");
const moment = require("moment");
const { getLastBiggestNumbers, getPAFFrom } = require("./formHelper");


const getLastNumbers = async (req, res) => {

    let id = req.query.id || null;

    try {

        let getLastBiggestNumber = await getLastBiggestNumbers(id)

        return res.send({
            status: true,
            message: "PaF form last numbers found.",
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

const getPAFFormforPafID = async (req, res) => {
    let paf_id = req.params.pafid;

    try {

    let resp=await getPAFFrom(paf_id);
    
    if(resp && resp.length>0)
    {
        return res.send({
            status: true,
            message: "PAF form found",
            data:resp
        })
    }
    else{
        return res.send({
            status: false,
            message: "Form not found"
        })

    }
        

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
        })
    }
}

module.exports = { getLastNumbers, getPAFFormforPafID }
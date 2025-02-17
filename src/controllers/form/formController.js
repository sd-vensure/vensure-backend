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


const updateAssignDepartment = async (req, res) => {
    
    let data=req.body.data;

    const updates = data.reduce((acc, { pafform_id, pafform_team }) => {
        acc.pafform_team.push(`WHEN pafform_id = ${pafform_id} THEN '${pafform_team}'`);
        return acc;
      }, { pafform_team: [] });

    try {

    let resp= await knexConnect('paf_forms')
    .update({
        pafform_team: knexConnect.raw(`CASE ${updates.pafform_team.join(' ')} ELSE pafform_team END`)
    });

    let paf_data=await knexConnect("paf_forms").select("*").where("pafform_id",data[0].pafform_id);

    let paf_id=paf_data[0].paf_id;

    console.log(paf_id)
    console.log(req.user_name)
    console.log(req.user_id)
    console.log(req.user_email)

    let paf_update=await knexConnect("paf_details").update({
        "assign_departments":"Y",
        "department_assigned_by":req.user_name,
        "department_assigned_at": moment().format('YYYY-MM-DD HH:mm:ss')
    }).where("paf_id",paf_id);
    
    if(resp)
    {
        return res.send({
            status: true,
            message: "Update Success",
        })
    }
    else{
        return res.send({
            status: false,
            message: "Update Failed"
        })

    }
        

    } catch (error) {
        return res.send({
            status: false,
            message: "Something went wrong"
        })
    }
}

module.exports = { getLastNumbers, getPAFFormforPafID,updateAssignDepartment }
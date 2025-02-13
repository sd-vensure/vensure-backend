const { getBudgetPaf } = require("./budgetHelper");

const getBudget=async(req,res)=>{
    
    let pafid = req.params.pafid;

    try {

        let response=await getBudgetPaf(pafid);

        if(response)
        {
            if(response.length>0)
            {
                return res.send({
                    status:true,
                    message:"Budget Entries found",
                    data:response
                })
            }
            else{
                return res.send({
                    status:false,
                    message:"No budget found for the particular PAF"
                })
            }

        }
        else{
            return res.send({
                status:false,
                message:"Could not fetch budget"
            })
        }
        
    } catch (error) {
        return res.send({
            status:false,
            message:"Something went wrong"
        })
    }

}

module.exports={getBudget}
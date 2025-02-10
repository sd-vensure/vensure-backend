const knexConnect = require("../../../knexConnection")

 const pafInsert = async(data) => {
    try {
        const insertresp=await knexConnect("paf_details").insert(data);
        return insertresp[0];
    } catch (error) {
        console.log(error)
        return false;
    }
}

const pafGet=async(id)=>{
    // try {

    //     let query = knexConnect('paf_details as pd')
    //     .join('drug as d', 'pd.drug_id', 'd.drug_id')
    //     .leftJoin('drug_composition as dc', 'd.drug_id', 'dc.drug_id') // Assuming there's a mapping table
    //     .leftJoin('innovator as i', 'd.innovator_id', 'i.innovator_id')
    //     .select(
    //         'pd.*',
    //         'd.*',
    //         'i.*',
    //         'dc.drug_composition_id as composition_id',
    //         'dc.drug_composition_name as composition_name'
    //     );

    //     if (id) {
    //         query = query.where('pd.paf_id', id);
    //     }

    //     const result = await query;

    //     const data = result.reduce((acc, row) => {
    //         let drug = acc.find(item => item.drug_id === row.drug_id);
    
    //         if (!drug) {
    //             drug = {
    //                 ...row,
    //                 compositions: []
    //             };
    //             acc.push(drug);
    //         }
    
    //         if (row.composition_id) {
    //             drug.compositions.push({
    //                 composition_id: row.composition_id,
    //                 composition_name: row.composition_name
    //             });
    //         }
    
    //         delete drug.composition_id;
    //         delete drug.composition_name;
    
    //         return acc;
    //     }, []);
    
    //     return data;
        
    // } catch (error) {
    //     console.log(error)
    //     return false;
    // }


    try {
        let query = knexConnect('paf_details as pd')
            .join('drug as d', 'pd.drug_id', 'd.drug_id')
            .leftJoin('drug_composition as dc', 'd.drug_id', 'dc.drug_id')
            .leftJoin('innovator as i', 'd.innovator_id', 'i.innovator_id')
            .select(
                'pd.*',
                'd.*',
                'i.*',
                'dc.drug_composition_id as composition_id',
                'dc.drug_composition_name as composition_name'
            )
            .orderBy('pd.paf_id'); // Order by paf_id
    
        if (id) {
            query = query.where('pd.paf_id', id);
        }
    
        const result = await query;
    
        const data = result.reduce((acc, row) => {
            // Find or create paf_id group
            let paf = acc.find(item => item.paf_id === row.paf_id);
    
            if (!paf) {
                paf = {
                    paf_id: row.paf_id,
                    drugs: []
                };
                acc.push(paf);
            }
    
            // Find or create drug under the current paf_id
            let drug = paf.drugs.find(item => item.drug_id === row.drug_id);
    
            if (!drug) {
                drug = {
                    ...row,
                    compositions: []
                };
                paf.drugs.push(drug);
            }
    
            // Add composition if exists
            if (row.composition_id) {
                drug.compositions.push({
                    composition_id: row.composition_id,
                    composition_name: row.composition_name
                });
            }
    
            // Remove composition fields from the drug object
            delete drug.composition_id;
            delete drug.composition_name;
    
            return acc;
        }, []);
    
        // Flatten the structure and get only the drugs with compositions
        const flattenedData = data.reduce((acc, paf) => {
            paf.drugs.forEach(drug => {
                acc.push({
                    ...drug,
                    paf_id: paf.paf_id // Add paf_id to each drug
                });
            });
            return acc;
        }, []);
    
        return flattenedData;
    
    } catch (error) {
        console.log(error);
        return false;
    }
    
    
    
}

module.exports={pafInsert,pafGet}

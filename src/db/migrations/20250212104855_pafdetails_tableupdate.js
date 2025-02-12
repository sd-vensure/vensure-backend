/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema
        .dropTableIfExists('drug') 
        .dropTableIfExists('drug_composition') 
        .dropTableIfExists('innovator') 
        .dropTableIfExists('paf_details') 
        .createTable("paf_details",(table)=>{
            table.increments('paf_id').primary();
            
            table.string("drug_name").notNullable();
            table.text("drug_api").notNullable();
            table.string("drug_innovator").notNullable();
            table.bigInteger("master_type_id").notNullable();
            table.text("compositions").notNullable();
            
            table.text("client_name").notNullable();
            table.text("driving_market").nullable();
            
            table.text("brief_scope").nullable();
            table.text("api_sources").nullable();
            table.text("sku").nullable();

            table.string("import_license_api").notNullable();
            table.string("import_license_rld").notNullable();
            
            table.text("stakeholders").notNullable();

            table.string("paf_created_by").nullable();
            table.dateTime("paf_created_at").nullable();
            
            table.string("paf_approved_by").nullable();
            table.dateTime("paf_approved_at").nullable();


        });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

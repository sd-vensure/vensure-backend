/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema
        .dropTableIfExists('form_type_master') 
        .dropTableIfExists('form_header_master') 
        .dropTableIfExists('form_item_master') 
        .dropTableIfExists('form_subitem_master') 
        .createTable('master_type', (table) => {
            table.increments('master_type_id').primary();
            table.string('master_type_name').notNullable();
        })
        .createTable("master_form",(table)=>{
            table.increments('master_form_id').primary();
            table.integer('master_type_id').nullable();
            table.integer('master_header_id').nullable();
            table.integer('master_item_id').nullable();
            table.integer('master_subitem_id').nullable();
            table.text('master_item_name').nullable();
            table.text('master_team').nullable();
            table.text('master_progress').nullable();
            table.date('master_target').nullable();
            table.date('master_start').nullable();
            table.date('master_end').nullable();
            table.text('master_remarks').nullable();
        })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

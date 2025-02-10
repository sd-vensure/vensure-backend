/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable("paf_forms",(table)=>{
            table.increments('pafform_id').primary();
            table.integer('paf_id').notNullable();
            table.integer('pafform_type_id').nullable();
            table.integer('pafform_header_id').nullable();
            table.integer('pafform_item_id').nullable();
            table.integer('pafform_subitem_id').nullable();
            table.text('pafform_item_name').nullable();
            table.text('pafform_team').nullable();
            table.text('pafform_progress').nullable();
            table.date('pafform_target').nullable();
            table.date('pafform_start').nullable();
            table.date('pafform_end').nullable();
            table.text('pafform_remarks').nullable();
        })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

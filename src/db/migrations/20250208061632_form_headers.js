/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('form_header_master', (table) => {
        table.increments('form_header_master_id').primary();
        table.integer('form_type_master_id').notNullable();
        
        table.text('header_name').notNullable();
      })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

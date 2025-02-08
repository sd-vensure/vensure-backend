/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('form_type_master', (table) => {
      table.increments('form_type_master_id').primary();
      table.enum('form_type', ['Oral', 'Injection']).notNullable().unique();
    })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

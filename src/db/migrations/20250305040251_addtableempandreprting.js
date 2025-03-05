/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('emp_reporting_mapper', (table) => {
        table.increments('emp_reporting_id').primary();
        table.bigInteger("emp_id").notNullable();    
        table.bigInteger("reporting_id").notNullable();    
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

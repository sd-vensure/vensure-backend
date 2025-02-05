/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('drug_composition', (table) => {
        table.increments('drug_composition_id').primary();
        table.string('drug_composition_name').notNullable();
        table.string('drug_id').notNullable(); 
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

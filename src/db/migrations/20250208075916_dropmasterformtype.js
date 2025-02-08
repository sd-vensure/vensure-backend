/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {

    return knex.schema
        .dropTableIfExists('form_type_master') 
        .createTable('form_type_master', (table) => {
            table.increments('form_type_master_id').primary();
            table.string('form_type', 100).notNullable();
        });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};

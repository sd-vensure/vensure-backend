/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {

    return knex.schema.createTable('drug', (table) => {
        table.increments('drug_id').primary();
        table.string('drug_name').notNullable();
        table.string('drug_api').notNullable();
        table.bigint('innovator_id').nullable();
        table.datetime('drug_created_at').nullable();
        table.enu('drug_active', ['Y', 'N']).defaultTo('Y');
    });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};

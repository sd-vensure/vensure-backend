/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('paf_details', (table) => {
        table.increments('paf_id').primary();
        table.string('paf_unique').notNullable();
        table.string('client_information').notNullable();
        table.string('driving_market').nullable();
        table.datetime('paf_initiated_on').nullable();
        table.string('brief_scope').nullable();
        table.string('api_sources').nullable();
        table.string('sku').nullable();
        table.string('import_license_api').nullable();
        table.string('import_license_rld').nullable();
        table.bigint('drug_id').notNullable();
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

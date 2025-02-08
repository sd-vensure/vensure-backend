/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('form_item_master', (table) => {
        table.increments('form_item_master_id').primary();
        table.integer('form_type_master_id').notNullable();
        table.integer('form_header_master_id').notNullable();

        table.text('item_name').nullable();
        table.text('team').nullable();
        table.text('progress').nullable();
        table.date('target').nullable();
        table.date('start').nullable();
        table.date('end').nullable();
        table.text('remarks').nullable();

      })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

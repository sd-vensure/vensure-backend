/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('budget_paf', (table) => {
        table.bigInteger('pafform_id').nullable();
        table.bigInteger('pafform_header_id').nullable();
        table.bigInteger('pafform_item_name').nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

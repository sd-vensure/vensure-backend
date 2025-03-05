/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('edit_form_request', (table) => {
        table.string('request_for_name').nullable();
        table.bigInteger('request_for_userid').nullable();
        table.string('request_for_empid').nullable();
        table.string('financial_year').nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

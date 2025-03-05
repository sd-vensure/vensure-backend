/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.alterTable('edit_form_request', (table) => {
        table.enum('request_status', ["Accpet","Reject","Pending"]).defaultTo("Pending").nullable().alter();
    });
   
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.alterTable('user_form_track', (table) => {
        table.enum('is_verified', ["Verified", "Rejected", "In Progress", "Pending"]).defaultTo("Pending").alter();
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

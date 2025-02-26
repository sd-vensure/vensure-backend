/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.table('paf_forms', function(table) {
        table.enu('milestone',["Active","Inactive"]).defaultTo("Inactive"); // Change column to string
      });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

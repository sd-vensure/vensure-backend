/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('user_form_track', (table) => {
        table.increments('sr_no').primary();
        table.string('form_id').notNullable();
        table.integer('department_id').nullable();
        table.string('user_id').nullable();
        table.string('created_by').nullable();
        table.string('edited_by').nullable();
        table.enum('is_shared',["Y","N"]).defaultTo("N");
        table.enum('is_verified',["Y","N"]).defaultTo("N");
      })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

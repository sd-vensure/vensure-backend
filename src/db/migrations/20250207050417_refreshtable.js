/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('refresh', (table) => {
        table.increments('id').primary();
        table.string('user_id', 30);
        table.string('refresh_token', 500);
        table.datetime('generated_at');
        table.datetime('expired_at');
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

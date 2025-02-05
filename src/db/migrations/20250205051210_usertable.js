/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('user', (table) => {
        table.increments('user_id').primary();
        table.string('user_first_name',30).notNullable();
        table.string('user_last_name',30).nullable();
        table.string('user_email',100).nullable();
        table.string('user_contact',15).nullable();
        table.datetime('user_created_at').nullable();
        table.datetime('user_updated_at').nullable();
        table.string('user_gender',20).nullable();
        table.enu('user_active', ['Y','N']).defaultTo('Y');
        table.string('user_password',200).notNullable();
        table.string('user_token_login',150).nullable();    
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

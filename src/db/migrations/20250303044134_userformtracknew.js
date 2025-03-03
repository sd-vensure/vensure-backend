/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {

    return knex.schema.createTable('user_form_track_new', (table) => {
        table.increments('sr_no').primary();
        table.string('form_id').notNullable();
        table.integer('department_id').nullable();
        table.integer('user_id').nullable();
        table.string('created_by').nullable();
        table.string('updated_by').nullable();
        table.datetime('created_at').nullable();
        table.datetime('updated_at').nullable();
    })

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};

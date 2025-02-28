/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {

    return knex.schema
        .dropTableIfExists('user_form')
        .createTable('user_form', (table) => {
            table.increments('sr_no').primary();
            table.string('form_id').notNullable();
            table.enu('type',["KRA","KPI"]).defaultTo("KRA");
            table.enu('quarter',["Q1","Q2","Q3","Q4"]).defaultTo("Q1");
            table.text('activity').nullable();
        });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};

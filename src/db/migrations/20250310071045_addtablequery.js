/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('queries', (table) => {
        table.increments('query_id').primary();
        table.string("queryby_empid").nullable();
        table.bigInteger("queryby_userid").nullable();
        table.text("queryby_name").nullable();
        table.datetime('queryby_date').nullable();
        table.text("question").nullable();
        table.string("answerby_empid").nullable();
        table.bigInteger("answerby_userid").nullable();
        table.text("answerby_name").nullable();
        table.text("answer").nullable();
        table.datetime('answerby_date').nullable();
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

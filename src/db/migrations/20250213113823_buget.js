/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('budget_paf', (table) => {
        table.increments('budget_id').primary();
        table.bigInteger('paf_id').nullable();
        table.string('paf_unique').nullable();
        table.integer('department_id').nullable();
        table.text('department_name').nullable();
        table.string('amount').nullable();
        table.string('budget_updated_by').nullable();
        table.datetime('budget_updated_at').nullable();
      })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

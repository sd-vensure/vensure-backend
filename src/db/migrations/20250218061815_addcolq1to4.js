/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema
    .dropTableIfExists('budget_paf') 
    .createTable('budget_paf', (table) => {
        table.increments('budget_id').primary();
        table.bigInteger('paf_id').nullable();
        table.string('paf_unique').nullable();
        table.integer('department_id').nullable();
        table.text('department_name').nullable();
        table.string('q1').nullable();
        table.string('q2').nullable();
        table.string('q3').nullable();
        table.string('q4').nullable();
        table.string('budget_updated_by').nullable();
        table.datetime('budget_updated_at').nullable();
        table.string('budget_approved_by').nullable();
        table.enu('budget_status',["Approved","Rejected","Pending"]).defaultTo("Pending");
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

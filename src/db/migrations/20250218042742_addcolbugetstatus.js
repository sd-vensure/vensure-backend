/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.table('budget_paf', (table) => {
        table.enu('quarter',["Q1","Q2","Q3","Q4"]).nullable();
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

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('user_form_new', (table) => {
        
        table.increments('sr_no').primary();
        table.string('form_id').notNullable();

        table.integer('category_id').notNullable();
        table.string('kra_id').nullable();
        table.text('kra_text').nullable();
        
        
        table.string('kpi_id').nullable();
        table.text('kpi_text').nullable();
        table.date('kpi_target').nullable();
        table.string('kpi_quarter',10).nullable();
        table.integer('kpi_weightage',10).nullable();

      })
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

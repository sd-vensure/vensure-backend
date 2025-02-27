/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {   

    return knex.schema.createTable('user_form', (table) => {
        table.increments('sr_no').primary();
        table.string('form_id').notNullable();
        table.string('type').nullable();
        table.date('department_id').nullable();
        table.text('remarks').nullable();
      })


  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

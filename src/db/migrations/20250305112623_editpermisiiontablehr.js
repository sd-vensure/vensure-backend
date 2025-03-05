/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

    return knex.schema.createTable('edit_form_request', (table) => {
        table.increments('request_id').primary();
        table.string("form_id",100).notNullable();    
        table.string("requested_by_name",100).notNullable();    
        table.string("requested_by_id",100).notNullable();    
        table.string("requested_by_empid",100).notNullable();    
        table.enum("request_status",["Accpet","Reject","Pending"]).defaultTo('Pending').notNullable();    
        table.enum("edit_status",["Pending","Done"]).defaultTo('Pending').notNullable();
        table.datetime("request_created_on").nullable(); 
        table.datetime("request_accepted_on").nullable(); 
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('department').truncate()
  await knex('department').insert([
    {
        "department_name": "Accounts"
    },
    {
        "department_name": "AL"
    },
    {
        "department_name": "ARD"
    },
    {
        "department_name": "BD"
    },
    {
        "department_name": "DQA"
    },
    {
        "department_name": "DRA"
    },
    {
        "department_name": "FRD"
    },
    {
        "department_name": "FRD INJ"
    },
    {
        "department_name": "HR and Admin"
    },
    {
        "department_name": "IPM"
    },
    {
        "department_name": "IT"
    },
    {
        "department_name": "Legal"
    },
    {
        "department_name": "Microbiology"
    },
    {
        "department_name": "P and E"
    },
    {
        "department_name": "PM"
    },
    {
        "department_name": "PD"
    },
    {
        "department_name": "President"
    },
    {
        "department_name": "Production"
    },
    {
        "department_name": "Purchase and SCM"
    },
    {
        "department_name": "QA"
    },
    {
        "department_name": "RA"
    },
    {
        "department_name": "Store"
    },
    {
        "department_name": "Warehouse"
    },
    {
        "department_name": "WH"
    }
]);
};

import { Knex } from "knex";

const tableName = "todos";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(tableName, (table) => {
    table.increments("todo_id");
    table.string("title");
    table.dateTime("dueDate");

    table.timestamps(false, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(tableName);
}

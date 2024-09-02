import type { Knex } from "knex";

export const up = async (knex: Knex) => {
  return knex.schema.createTable("todos", (table) => {
    table.increments("id");
    table.string("title");

    table.integer("user_id").references("id").inTable("users");
  });
};

export const down = async (knex: Knex) => {
  return knex.schema.dropTable("todos");
};

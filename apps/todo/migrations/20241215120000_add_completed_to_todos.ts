import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	return knex.schema.alterTable("todos", (table) => {
		table.boolean("completed").notNullable().defaultTo(false);
	});
};

export const down = async (knex: Knex) => {
	return knex.schema.alterTable("todos", (table) => {
		table.dropColumn("completed");
	});
};

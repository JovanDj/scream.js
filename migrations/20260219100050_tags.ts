import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	await knex.schema.createTable("tags", (table) => {
		table.increments("id");
		table.string("name").notNullable().unique();
		table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
		table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
	});
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable("tags");
};

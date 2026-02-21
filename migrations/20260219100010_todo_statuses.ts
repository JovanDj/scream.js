import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	await knex.schema.createTable("todo_statuses", (table) => {
		table.increments("id");
		table.string("code").notNullable().unique();
		table.string("label").notNullable();
		table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
		table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
	});

	const now = knex.fn.now();
	await knex("todo_statuses").insert([
		{ code: "open", created_at: now, label: "Open", updated_at: now },
		{ code: "completed", created_at: now, label: "Completed", updated_at: now },
	]);
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable("todo_statuses");
};

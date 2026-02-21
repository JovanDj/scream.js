import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	await knex.schema.createTable("todo_priorities", (table) => {
		table.increments("id");
		table.string("code").notNullable().unique();
		table.string("label").notNullable();
		table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
		table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
	});

	const now = knex.fn.now();
	await knex("todo_priorities").insert([
		{ code: "low", created_at: now, label: "Low", updated_at: now },
		{ code: "medium", created_at: now, label: "Medium", updated_at: now },
		{ code: "high", created_at: now, label: "High", updated_at: now },
	]);
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable("todo_priorities");
};

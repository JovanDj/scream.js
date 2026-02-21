import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	await knex.schema.createTable("project_statuses", (table) => {
		table.increments("id");
		table.string("code").notNullable().unique();
		table.string("label").notNullable();
		table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
		table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
	});

	const now = knex.fn.now();
	await knex("project_statuses").insert([
		{ code: "active", created_at: now, label: "Active", updated_at: now },
		{ code: "archived", created_at: now, label: "Archived", updated_at: now },
	]);
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable("project_statuses");
};

import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	await knex.schema.createTable("projects", (table) => {
		table.increments("id");
		table.string("name").notNullable().unique();
		table
			.integer("status_id")
			.notNullable()
			.references("id")
			.inTable("project_statuses")
			.onDelete("RESTRICT");
		table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
		table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
		table.index(["status_id"], "projects_status_idx");
	});
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable("projects");
};

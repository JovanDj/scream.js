import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	await knex.schema.createTable("project_notes", (table) => {
		table.increments("id");
		table
			.integer("project_id")
			.notNullable()
			.references("id")
			.inTable("projects")
			.onDelete("CASCADE");
		table.string("title", 255).notNullable();
		table.text("body").notNullable();
		table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
		table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
		table.index(["project_id"], "project_notes_project_idx");
	});
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable("project_notes");
};

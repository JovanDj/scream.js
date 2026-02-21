import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	await knex.schema.createTable("todo_tags", (table) => {
		table
			.integer("todo_id")
			.notNullable()
			.references("id")
			.inTable("todos")
			.onDelete("CASCADE");
		table
			.integer("tag_id")
			.notNullable()
			.references("id")
			.inTable("tags")
			.onDelete("CASCADE");
		table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
		table.primary(["todo_id", "tag_id"]);
	});
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable("todo_tags");
};

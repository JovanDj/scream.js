import type { Knex } from "knex";

export const up = async (knex: Knex) => {
	await knex.schema.createTable("todos", (table) => {
		table.increments("id");
		table
			.integer("project_id")
			.references("id")
			.inTable("projects")
			.onDelete("CASCADE");
		table.string("title").notNullable();
		table.text("description").notNullable().defaultTo("");
		table
			.integer("priority_id")
			.notNullable()
			.references("id")
			.inTable("todo_priorities")
			.onDelete("RESTRICT");
		table
			.integer("status_id")
			.notNullable()
			.references("id")
			.inTable("todo_statuses")
			.onDelete("RESTRICT");
		table.dateTime("due_at");
		table.dateTime("completed_at");
		table.integer("version").notNullable().defaultTo(0);
		table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
		table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
		table.check("version >= 0");
		table.index(["project_id"], "todos_project_idx");
		table.index(["status_id"], "todos_status_idx");
		table.index(["priority_id"], "todos_priority_idx");
		table.index(["due_at"], "todos_due_idx");
	});
};

export const down = async (knex: Knex) => {
	await knex.schema.dropTable("todos");
};

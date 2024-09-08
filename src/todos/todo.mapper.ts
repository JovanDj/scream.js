import { KnexDataMapper } from "@scream.js/database/knex-data-mapper.js";
import type { Knex } from "knex";
import { Todo } from "./todo.js";
import type { TodoRow } from "./todo.row.js";

export class TodoMapper extends KnexDataMapper<Todo, TodoRow> {
	protected override primaryKey = "id";
	protected override tableName = "todos";

	constructor(protected override _db: Knex) {
		super(_db);
	}

	toEntity(row: TodoRow) {
		const todo = new Todo(row.id, row.title);

		return todo;
	}

	toRow(entity: Partial<Todo>): Partial<TodoRow> {
		return {
			title: entity.title ?? "",
		};
	}
}

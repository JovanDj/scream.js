import type { Database, DatabaseHandle } from "@scream.js/database/db.js";
import type {
	Todo,
	TodoFindAllOptions,
	TodoPriority,
	TodoStatusCode,
	TodoWriteInput,
} from "./todo.js";
import {
	toTodo,
	toTodoInsertRecord,
	toTodoUpdateRecord,
} from "./todo.mapper.js";
import { todoRowValidator } from "./todo.schema.js";
import type { TodoRepository } from "./todo.service.js";

export class KnexTodoRepository implements TodoRepository {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	static create(db: Database) {
		return new KnexTodoRepository(db);
	}

	async delete(id: number) {
		const affectedRows = await this.#db("todos").where({ id }).del();
		return affectedRows > 0;
	}

	async findAll(options?: Readonly<TodoFindAllOptions>) {
		const scope = options?.scope ?? "all";
		const query = this.#baseQuery();

		if (options?.projectId) {
			query.andWhere({ "todos.project_id": options.projectId });
		}

		if (options?.search && options.search.trim().length > 0) {
			query.andWhereLike("todos.title", `%${options.search.trim()}%`);
		}

		if (scope === "open") {
			query.where({ "todo_statuses.code": "open" });
		}

		if (scope === "completed") {
			query.where({ "todo_statuses.code": "completed" });
		}

		if (scope === "dueToday") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) = date('now', 'localtime')");
		}

		if (scope === "overdue") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) < date('now', 'localtime')");
		}

		const rows = await query.orderBy("todos.id", "desc");
		return rows.map((row) => this.#toTodo(row));
	}

	async findById(id: number) {
		const row = await this.#baseQuery().where({ "todos.id": id }).first();
		if (!row) {
			return undefined;
		}

		return this.#toTodo(row);
	}

	async insert(input: Readonly<TodoWriteInput>) {
		const now = new Date().toISOString();
		const priorityId = await this.#findPriorityId(input.priority);
		const statusId = await this.#findStatusId(input.statusCode);
		const [row] = await this.#db("todos")
			.insert(toTodoInsertRecord(input, now, priorityId, statusId))
			.returning(["id"]);

		const created = await this.findById(Number(row["id"]));
		if (!created) {
			throw new Error("Todo creation failed");
		}

		return created;
	}

	async save(todo: Todo) {
		const priorityId = await this.#findPriorityId(todo.priority);
		const statusId = await this.#findStatusId(todo.statusCode);
		const affectedRows = await this.#db("todos")
			.where({ id: todo.id })
			.update(toTodoUpdateRecord(todo, priorityId, statusId));

		if (affectedRows === 0) {
			return undefined;
		}

		return this.findById(todo.id);
	}

	async transaction<T>(
		callback: (repository: TodoRepository) => Promise<T>,
	): Promise<T> {
		if ("transaction" in this.#db) {
			return this.#db.transaction(async (tx) => {
				return callback(new KnexTodoRepository(tx));
			});
		}

		return callback(this);
	}

	async #findPriorityId(priority: TodoPriority) {
		const row = await this.#db("todo_priorities")
			.where({ code: priority })
			.first("id");

		if (!row) {
			throw new Error(`Todo priority lookup not found: ${priority}`);
		}

		return Number(row["id"]);
	}

	async #findStatusId(code: TodoStatusCode) {
		const row = await this.#db("todo_statuses").where({ code }).first("id");
		if (!row) {
			throw new Error(`Todo status lookup not found: ${code}`);
		}

		return Number(row["id"]);
	}

	#baseQuery() {
		return this.#db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.select(
				"todos.id",
				"todos.title",
				"todos.description",
				"todos.project_id",
				"todos.due_at",
				"todos.completed_at",
				"todos.created_at",
				"todos.updated_at",
				this.#db.ref("todo_priorities.code").as("priority_code"),
				this.#db.ref("todo_statuses.code").as("status_code"),
			);
	}

	#toTodo(row: unknown) {
		const parsed = todoRowValidator.validate(row);
		if (!parsed.success) {
			throw new Error("Invalid todo row");
		}

		return toTodo(parsed.data);
	}
}

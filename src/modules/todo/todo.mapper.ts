import type { Database, DatabaseHandle } from "@scream.js/database/db.js";
import {
	Todo,
	type TodoFindAllOptions,
	type TodoPriority,
	type TodoSnapshot,
	type TodoStatusCode,
	type TodoWriteInput,
} from "./todo.js";
import { todoRowValidator } from "./todo.schema.js";

export class TodoMapper {
	readonly #db: DatabaseHandle;

	constructor(db: DatabaseHandle) {
		this.#db = db;
	}

	static create(db: Database) {
		return new TodoMapper(db);
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
			.insert(this.#toTodoInsertRecord(input, now, priorityId, statusId))
			.returning(["id"]);

		const created = await this.findById(Number(row["id"]));
		if (!created) {
			throw new Error("Todo creation failed");
		}

		return created;
	}

	async update(todo: Todo) {
		const priorityId = await this.#findPriorityId(todo.priority);
		const statusId = await this.#findStatusId(todo.statusCode);
		const affectedRows = await this.#db("todos")
			.where({ id: todo.id })
			.update(this.#toTodoUpdateRecord(todo, priorityId, statusId));

		if (affectedRows === 0) {
			return undefined;
		}

		return this.findById(todo.id);
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

	#toTodo(row: unknown) {
		const parsed = todoRowValidator.validate(row);
		if (!parsed.success) {
			throw new Error("Invalid todo row");
		}

		const snapshot: TodoSnapshot = {
			completedAt: parsed.data.completed_at ?? null,
			createdAt: parsed.data.created_at ?? new Date().toISOString(),
			description: parsed.data.description ?? "",
			dueAt: parsed.data.due_at ?? null,
			id: parsed.data.id,
			priority: parsed.data.priority_code ?? "medium",
			projectId: parsed.data.project_id ?? null,
			statusCode: parsed.data.status_code ?? "open",
			title: parsed.data.title,
			updatedAt: parsed.data.updated_at ?? new Date().toISOString(),
		};

		return new Todo(snapshot);
	}

	#toTodoInsertRecord(
		input: Readonly<TodoWriteInput>,
		now: string,
		priorityId: number,
		statusId: number,
	) {
		return {
			completed_at: input.statusCode === "completed" ? now : null,
			created_at: now,
			description: input.description,
			due_at: input.dueAt,
			priority_id: priorityId,
			project_id: input.projectId,
			status_id: statusId,
			title: input.title,
			updated_at: now,
		};
	}

	#toTodoUpdateRecord(todo: Todo, priorityId: number, statusId: number) {
		return {
			completed_at: todo.completedAt,
			description: todo.description,
			due_at: todo.dueAt,
			priority_id: priorityId,
			project_id: todo.projectId,
			status_id: statusId,
			title: todo.title,
			updated_at: todo.updatedAt,
		};
	}
}

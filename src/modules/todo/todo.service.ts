import type { Database } from "@scream.js/database/db.js";
import { createValidator } from "@scream.js/validator/create-validator.js";
import { schema } from "@scream.js/validator/schema.js";

type TodoWriteResult = { id: number } | undefined;
export type TodoScope = "all" | "completed" | "dueToday" | "open" | "overdue";
export type TodoRecord = {
	completedAt: string | null;
	createdAt: string;
	description: string;
	dueAt: string | null;
	id: number;
	priority: "low" | "medium" | "high";
	projectId: number | null;
	statusCode: "open" | "completed";
	title: string;
	updatedAt: string;
};

export class TodoService {
	readonly #db: Database;

	static #idValue = schema.coerce.number().int().positive();
	static #priorityValue = schema.enum(["low", "medium", "high"]);
	static #statusCodeValue = schema.enum(["open", "completed"]);
	static #dueAtValue = schema
		.string()
		.optional()
		.default("")
		.transform((value) => value.trim())
		.refine(
			(value) => value.length < 1 || !Number.isNaN(new Date(value).getTime()),
			{
				message: "Invalid date",
			},
		)
		.transform((value) => {
			if (value.length < 1) {
				return null;
			}

			return new Date(value).toISOString();
		});
	static #lookupIdRowSchema = schema.object({
		id: TodoService.#idValue,
	});
	static #todoRowSchema = schema.object({
		completed_at: schema.string().nullable().optional(),
		created_at: schema.string().optional(),
		description: schema.string().optional(),
		due_at: schema.string().nullable().optional(),
		id: TodoService.#idValue,
		priority_code: TodoService.#priorityValue.optional(),
		project_id: TodoService.#idValue.nullable().optional(),
		status_code: TodoService.#statusCodeValue.optional(),
		title: schema.string().nonempty(),
		updated_at: schema.string().optional(),
	});
	static #todoRecordSchema = TodoService.#todoRowSchema.transform((row) => ({
		completedAt: row.completed_at ?? null,
		createdAt: row.created_at ?? new Date().toISOString(),
		description: row.description ?? "",
		dueAt: row.due_at ?? null,
		id: row.id,
		priority: row.priority_code ?? "medium",
		projectId: row.project_id ?? null,
		statusCode: row.status_code ?? "open",
		title: row.title,
		updatedAt: row.updated_at ?? new Date().toISOString(),
	}));

	static idParamValidator() {
		return createValidator(TodoService.#idValue);
	}

	static listQueryValidator() {
		return createValidator(
			schema.object({
				projectId: TodoService.#idValue.optional(),
				search: schema
					.string()
					.optional()
					.default("")
					.transform((value) => value.trim()),
				status: schema
					.enum(["all", "completed", "dueToday", "open", "overdue"])
					.optional()
					.default("all"),
			}),
		);
	}

	static createBodyValidator() {
		return createValidator(
			schema.strictObject({
				description: schema
					.string()
					.default("")
					.transform((value) => value.trim()),
				dueAt: TodoService.#dueAtValue,
				priority: TodoService.#priorityValue.default("medium"),
				projectId: schema.preprocess(
					(value) => (value === "" ? undefined : value),
					TodoService.#idValue.optional(),
				),
				statusCode: TodoService.#statusCodeValue.default("open"),
				title: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, {
						message: "Required",
					}),
			}),
		);
	}

	static updateBodyValidator() {
		return TodoService.createBodyValidator();
	}

	static parseLookupIdRow(row: unknown) {
		return TodoService.#lookupIdRowSchema.parse(row);
	}

	static parseLookupIdRows(rows: unknown) {
		return TodoService.#lookupIdRowSchema
			.array()
			.parse(rows)
			.map((row) => row.id);
	}

	static parseTodoRow(row: unknown): TodoRecord {
		return TodoService.#todoRecordSchema.parse(row);
	}

	static parseTodoRows(rows: unknown): TodoRecord[] {
		return TodoService.#todoRecordSchema.array().parse(rows);
	}

	constructor(db: Database) {
		this.#db = db;
	}

	async index(input: { projectId?: number; scope: TodoScope; search: string }) {
		const query = this.#db("todos")
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

		if (input.projectId !== undefined) {
			query.andWhere({ "todos.project_id": input.projectId });
		}
		if (input.search.trim().length > 0) {
			query.andWhereLike("todos.title", `%${input.search.trim()}%`);
		}
		if (input.scope === "open") {
			query.where({ "todo_statuses.code": "open" });
		}
		if (input.scope === "completed") {
			query.where({ "todo_statuses.code": "completed" });
		}
		if (input.scope === "dueToday") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) = date('now', 'localtime')");
		}
		if (input.scope === "overdue") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) < date('now', 'localtime')");
		}

		return TodoService.parseTodoRows(await query.orderBy("todos.id", "desc"));
	}

	async findById(id: number) {
		const row = await this.#db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": id })
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
			)
			.first();

		return row ? TodoService.parseTodoRow(row) : undefined;
	}

	async create(input: {
		description: string;
		dueAt: string | null;
		priority: "low" | "medium" | "high";
		projectId?: number;
		statusCode: "open" | "completed";
		title: string;
	}) {
		return this.#db.transaction(async (tx) => {
			const priority = await tx("todo_priorities")
				.where({ code: input.priority })
				.first("id");
			const status = await tx("todo_statuses")
				.where({ code: input.statusCode })
				.first("id");
			if (!priority || !status) {
				throw new Error("Todo lookup not found");
			}

			const now = new Date().toISOString();
			const [row] = await tx("todos")
				.insert({
					completed_at: input.statusCode === "completed" ? now : null,
					created_at: now,
					description: input.description,
					due_at: input.dueAt,
					priority_id: TodoService.parseLookupIdRow(priority).id,
					project_id: input.projectId ?? null,
					status_id: TodoService.parseLookupIdRow(status).id,
					title: input.title,
					updated_at: now,
				})
				.returning(["id"]);

			return TodoService.parseLookupIdRow(row);
		});
	}

	async update(input: {
		id: number;
		description: string;
		dueAt: string | null;
		priority: "low" | "medium" | "high";
		projectId?: number;
		statusCode: "open" | "completed";
		title: string;
	}): Promise<TodoWriteResult> {
		return this.#db.transaction(async (tx) => {
			const current = await this.#loadForWrite(tx, input.id);
			if (!current) {
				return undefined;
			}

			const priority = await tx("todo_priorities")
				.where({ code: input.priority })
				.first("id");
			const status = await tx("todo_statuses")
				.where({ code: input.statusCode })
				.first("id");
			if (!priority || !status) {
				throw new Error("Todo lookup not found");
			}

			const now = new Date().toISOString();
			const completedAt =
				input.statusCode === "completed" ? (current.completedAt ?? now) : null;

			const affectedRows = await tx("todos")
				.where({ id: input.id })
				.update({
					completed_at: completedAt,
					description: input.description,
					due_at: input.dueAt,
					priority_id: TodoService.parseLookupIdRow(priority).id,
					project_id: input.projectId ?? null,
					status_id: TodoService.parseLookupIdRow(status).id,
					title: input.title,
					updated_at: now,
				});

			if (affectedRows === 0) {
				return undefined;
			}

			return { id: input.id };
		});
	}

	async toggle(input: { id: number }): Promise<TodoWriteResult> {
		return this.#db.transaction(async (tx) => {
			const current = await this.#loadForWrite(tx, input.id);
			if (!current) {
				return undefined;
			}

			const nextStatusCode =
				current.statusCode === "completed" ? "open" : "completed";
			const status = await tx("todo_statuses")
				.where({ code: nextStatusCode })
				.first("id");
			if (!status) {
				throw new Error("todo_statuses lookup not found");
			}

			const now = new Date().toISOString();
			const affectedRows = await tx("todos")
				.where({ id: input.id })
				.update({
					completed_at:
						nextStatusCode === "completed"
							? (current.completedAt ?? now)
							: null,
					status_id: TodoService.parseLookupIdRow(status).id,
					updated_at: now,
				});

			if (affectedRows === 0) {
				return undefined;
			}

			return { id: input.id };
		});
	}

	async delete(id: number) {
		const affectedRows = await this.#db("todos").where({ id }).del();
		return affectedRows > 0;
	}

	async #loadForWrite(
		tx: Database,
		id: number,
	): Promise<TodoRecord | undefined> {
		const row = await tx("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": id })
			.select(
				"todos.id",
				"todos.title",
				"todos.description",
				"todos.project_id",
				"todos.due_at",
				"todos.completed_at",
				"todos.created_at",
				"todos.updated_at",
				tx.ref("todo_priorities.code").as("priority_code"),
				tx.ref("todo_statuses.code").as("status_code"),
			)
			.first();

		return row ? TodoService.parseTodoRow(row) : undefined;
	}
}

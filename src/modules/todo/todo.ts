import type { Knex } from "knex";
import { z } from "zod/v4";

export class Todo {
	static readonly #prioritySchema = z.enum(["low", "medium", "high"]);
	static readonly #statusSchema = z.enum(["open", "completed"]);
	static readonly #rowSchema = z.object({
		completed_at: z.string().nullable().optional(),
		created_at: z.string().optional(),
		description: z.string().optional(),
		due_at: z.string().nullable().optional(),
		id: z.coerce.number(),
		priority_code: Todo.#prioritySchema.optional(),
		project_id: z.coerce.number().nullable().optional(),
		status_code: Todo.#statusSchema.optional(),
		title: z.string().nonempty(),
		updated_at: z.string().optional(),
		version: z.coerce.number().optional(),
	});

	static async #findPriorityId(
		db: Knex | Knex.Transaction,
		priority: "low" | "medium" | "high",
	) {
		const row = await db("todo_priorities").where({ code: priority }).first("id");
		if (!row) {
			throw new Error(`Todo priority lookup not found: ${priority}`);
		}
		return Number(row["id"]);
	}

	static async #findStatusId(
		db: Knex | Knex.Transaction,
		code: "open" | "completed",
	) {
		const row = await db("todo_statuses").where({ code }).first("id");
		if (!row) {
			throw new Error(`Todo status lookup not found: ${code}`);
		}
		return Number(row["id"]);
	}

	static #baseQuery(db: Knex | Knex.Transaction) {
		return db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.select(
				"todos.id",
				"todos.title",
				"todos.description",
				"todos.project_id",
				"todos.due_at",
				"todos.completed_at",
				"todos.version",
				"todos.created_at",
				"todos.updated_at",
				db.ref("todo_priorities.code").as("priority_code"),
				db.ref("todo_statuses.code").as("status_code"),
			);
	}

	readonly #id: number;
	readonly #title: string;
	readonly #description: string;
	readonly #projectId: number | null;
	readonly #priority: "low" | "medium" | "high";
	readonly #statusCode: "open" | "completed";
	readonly #dueAt: string | null;
	readonly #completedAt: string | null;
	readonly #version: number;
	readonly #createdAt: string;
	readonly #updatedAt: string;

	constructor(snapshot: {
		id: number;
		title: string;
		description: string;
		projectId: number | null;
		priority: "low" | "medium" | "high";
		statusCode: "open" | "completed";
		dueAt: string | null;
		completedAt: string | null;
		version: number;
		createdAt: string;
		updatedAt: string;
	}) {
		this.#id = snapshot.id;
		this.#title = snapshot.title;
		this.#description = snapshot.description;
		this.#projectId = snapshot.projectId;
		this.#priority = snapshot.priority;
		this.#statusCode = snapshot.statusCode;
		this.#dueAt = snapshot.dueAt;
		this.#completedAt = snapshot.completedAt;
		this.#version = snapshot.version;
		this.#createdAt = snapshot.createdAt;
		this.#updatedAt = snapshot.updatedAt;
	}

	get id() {
		return this.#id;
	}

	get title() {
		return this.#title;
	}

	get description() {
		return this.#description;
	}

	get projectId() {
		return this.#projectId;
	}

	get priority() {
		return this.#priority;
	}

	get statusCode() {
		return this.#statusCode;
	}

	get dueAt() {
		return this.#dueAt;
	}

	get completedAt() {
		return this.#completedAt;
	}

	get version() {
		return this.#version;
	}

	get createdAt() {
		return this.#createdAt;
	}

	get updatedAt() {
		return this.#updatedAt;
	}

	static async create(
		db: Knex | Knex.Transaction,
		input: Readonly<{
			description: string;
			dueAt: string | null;
			priority: "low" | "medium" | "high";
			projectId: number | null;
			statusCode: "open" | "completed";
			title: string;
		}>,
	) {
		const now = new Date().toISOString();
		const completedAt = input.statusCode === "completed" ? now : null;
		const priorityId = await Todo.#findPriorityId(db, input.priority);
		const statusId = await Todo.#findStatusId(db, input.statusCode);
		const [row] = await db("todos")
			.insert({
				completed_at: completedAt,
				created_at: now,
				description: input.description,
				due_at: input.dueAt,
				priority_id: priorityId,
				project_id: input.projectId,
				status_id: statusId,
				title: input.title,
				updated_at: now,
				version: 0,
			})
			.returning(["id"]);

		const created = await Todo.findById(db, Number(row["id"]));
		if (!created) {
			throw new Error("Todo creation failed");
		}

		return created;
	}

	apply(
		input: Readonly<{
			description: string;
			dueAt: string | null;
			priority: "low" | "medium" | "high";
			projectId: number | null;
			statusCode: "open" | "completed";
			title: string;
		}>,
	) {
		const now = new Date().toISOString();
		const completedAt =
			input.statusCode === "completed" ? (this.#completedAt ?? now) : null;

		return new Todo({
			completedAt,
			createdAt: this.#createdAt,
			description: input.description,
			dueAt: input.dueAt,
			id: this.#id,
			priority: input.priority,
			projectId: input.projectId,
			statusCode: input.statusCode,
			title: input.title,
			updatedAt: now,
			version: this.#version,
		});
	}

	async save(db: Knex | Knex.Transaction) {
		const nextVersion = this.version + 1;
		const priorityId = await Todo.#findPriorityId(db, this.priority);
		const statusId = await Todo.#findStatusId(db, this.statusCode);

		const affectedRows = await db("todos")
			.where({
				id: this.id,
				version: this.version,
			})
			.update({
				completed_at: this.completedAt,
				description: this.description,
				due_at: this.dueAt,
				priority_id: priorityId,
				project_id: this.projectId,
				status_id: statusId,
				title: this.title,
				updated_at: this.updatedAt,
				version: nextVersion,
			});

		if (affectedRows === 0) {
			throw new Error("Todo update conflict or not found");
		}

		return new Todo({
			completedAt: this.completedAt,
			createdAt: this.createdAt,
			description: this.description,
			dueAt: this.dueAt,
			id: this.id,
			priority: this.priority,
			projectId: this.projectId,
			statusCode: this.statusCode,
			title: this.title,
			updatedAt: this.updatedAt,
			version: nextVersion,
		});
	}

	static async deleteById(db: Knex | Knex.Transaction, id: number) {
		const affectedRows = await db("todos").where({ id }).del();
		return affectedRows > 0;
	}

	static #fromRow(row: unknown) {
		const parsed = Todo.#rowSchema.parse(row);
		return new Todo({
			completedAt: parsed.completed_at ?? null,
			createdAt: parsed.created_at ?? new Date().toISOString(),
			description: parsed.description ?? "",
			dueAt: parsed.due_at ?? null,
			id: parsed.id,
			priority: parsed.priority_code ?? "medium",
			projectId: parsed.project_id ?? null,
			statusCode: parsed.status_code ?? "open",
			title: parsed.title,
			updatedAt: parsed.updated_at ?? new Date().toISOString(),
			version: parsed.version ?? 0,
		});
	}

	static async findById(
		db: Knex | Knex.Transaction,
		id: number,
	): Promise<Todo | undefined> {
		const row = await Todo.#baseQuery(db).where({ "todos.id": id }).first();

		if (!row) {
			return undefined;
		}

		return Todo.#fromRow(row);
	}

	static async findAll(
		db: Knex | Knex.Transaction,
		options?: {
			projectId?: number;
			scope?: "all" | "completed" | "dueToday" | "open" | "overdue";
			search?: string;
		},
	) {
		const scope = options?.scope ?? "all";
		const query = Todo.#baseQuery(db);

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

		return rows.map((row) => Todo.#fromRow(row));
	}
}

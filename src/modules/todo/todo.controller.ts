import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import type { Resource } from "@scream.js/http/resource.js";
import { schema } from "@scream.js/validator/schema.js";

type TodoScope = "all" | "completed" | "dueToday" | "open" | "overdue";

export class TodosController implements Resource {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async index(ctx: HttpContext) {
		const parsedQuery = schema
			.object({
				projectId: schema.coerce.number().int().positive().optional(),
				search: schema
					.string()
					.optional()
					.default("")
					.transform((value) => value.trim()),
				status: schema
					.enum(["all", "completed", "dueToday", "open", "overdue"])
					.optional()
					.default("all"),
			})
			.safeParse(ctx.query());

		if (!parsedQuery.success) {
			return ctx.notFound();
		}

		const options: {
			projectId?: number;
			scope: TodoScope;
			search: string;
		} = {
			scope: parsedQuery.data.status,
			search: parsedQuery.data.search,
		};

		if (parsedQuery.data.projectId !== undefined) {
			options.projectId = parsedQuery.data.projectId;
		}

		const scope = options.scope ?? "all";
		const listOptions: {
			projectId?: number;
			scope: TodoScope;
			search: string;
		} = {
			scope,
			search: options.search,
		};

		if (options.projectId !== undefined) {
			listOptions.projectId = options.projectId;
		}

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

		if (listOptions.projectId !== undefined) {
			query.andWhere({ "todos.project_id": listOptions.projectId });
		}
		if (listOptions.search.trim().length > 0) {
			query.andWhereLike("todos.title", `%${listOptions.search.trim()}%`);
		}
		if (listOptions.scope === "open") {
			query.where({ "todo_statuses.code": "open" });
		}
		if (listOptions.scope === "completed") {
			query.where({ "todo_statuses.code": "completed" });
		}
		if (listOptions.scope === "dueToday") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) = date('now', 'localtime')");
		}
		if (listOptions.scope === "overdue") {
			query.where({ "todo_statuses.code": "open" });
			query.whereRaw("date(todos.due_at) < date('now', 'localtime')");
		}

		const todos = schema
			.array(
				schema.object({
					completed_at: schema.string().nullable().optional(),
					created_at: schema.string().optional(),
					description: schema.string().optional(),
					due_at: schema.string().nullable().optional(),
					id: schema.coerce.number().int().positive(),
					priority_code: schema.enum(["low", "medium", "high"]).optional(),
					project_id: schema.coerce
						.number()
						.int()
						.positive()
						.nullable()
						.optional(),
					status_code: schema.enum(["open", "completed"]).optional(),
					title: schema.string().nonempty(),
					updated_at: schema.string().optional(),
				}),
			)
			.transform((rows) =>
				rows.map((row) => ({
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
				})),
			)
			.parse(await query.orderBy("todos.id", "desc"));

		const todoViews = todos.map((todo) => ({
			dueDate: todo.dueAt ? todo.dueAt.slice(0, 10) : "",
			id: todo.id,
			isCompleted: todo.statusCode === "completed",
			priority: todo.priority,
			statusCode: todo.statusCode,
			title: todo.title,
		}));

		const createFilterUrl = (input: {
			projectId: number | undefined;
			search: string;
			status: TodoScope;
		}) => {
			const params = new URLSearchParams();
			if (input.status !== "all") {
				params.set("status", input.status);
			}
			if (input.search.length > 0) {
				params.set("search", input.search);
			}
			if (input.projectId !== undefined) {
				params.set("projectId", input.projectId.toString());
			}

			const query = params.toString();
			return query.length > 0 ? `/todos?${query}` : "/todos";
		};

		return ctx.render("index", {
			filters: {
				all: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "all",
				}),
				completed: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "completed",
				}),
				dueToday: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "dueToday",
				}),
				open: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "open",
				}),
				overdue: createFilterUrl({
					projectId: parsedQuery.data.projectId,
					search: parsedQuery.data.search,
					status: "overdue",
				}),
			},
			hasProjectId: parsedQuery.data.projectId !== undefined,
			pageTitle: "Todos",
			projectId: parsedQuery.data.projectId,
			search: parsedQuery.data.search,
			status: parsedQuery.data.status,
			todos: todoViews,
		});
	}

	async show(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const row = await this.#db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": todoId })
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
		if (!row) {
			return ctx.notFound();
		}
		const todo = schema
			.object({
				completed_at: schema.string().nullable().optional(),
				created_at: schema.string().optional(),
				description: schema.string().optional(),
				due_at: schema.string().nullable().optional(),
				id: schema.coerce.number().int().positive(),
				priority_code: schema.enum(["low", "medium", "high"]).optional(),
				project_id: schema.coerce
					.number()
					.int()
					.positive()
					.nullable()
					.optional(),
				status_code: schema.enum(["open", "completed"]).optional(),
				title: schema.string().nonempty(),
				updated_at: schema.string().optional(),
			})
			.transform((parsedRow) => ({
				completedAt: parsedRow.completed_at ?? null,
				createdAt: parsedRow.created_at ?? new Date().toISOString(),
				description: parsedRow.description ?? "",
				dueAt: parsedRow.due_at ?? null,
				id: parsedRow.id,
				priority: parsedRow.priority_code ?? "medium",
				projectId: parsedRow.project_id ?? null,
				statusCode: parsedRow.status_code ?? "open",
				title: parsedRow.title,
				updatedAt: parsedRow.updated_at ?? new Date().toISOString(),
			}))
			.parse(row);

		return ctx.render("show", {
			pageTitle: `Todo | ${todo.id}`,
			todoDescription: todo.description,
			todoDueAt: todo.dueAt ? todo.dueAt.slice(0, 10) : "",
			todoId: todo.id,
			todoIsCompleted: todo.statusCode === "completed",
			todoPriority: todo.priority,
			todoStatusCode: todo.statusCode,
			todoTitle: todo.title,
		});
	}

	async create(ctx: HttpContext) {
		return ctx.render("create", {
			errors: {},
			fields: {
				description: "",
				dueAt: "",
				isCompleted: false,
				isHighPriority: false,
				isLowPriority: false,
				isMediumPriority: true,
				isOpen: true,
				priority: "medium",
				statusCode: "open",
				title: "",
			},
			pageTitle: "New Todo",
		});
	}

	async store(ctx: HttpContext) {
		const parsed = schema
			.strictObject({
				description: schema
					.string()
					.default("")
					.transform((value) => value.trim()),
				dueAt: schema
					.string()
					.optional()
					.default("")
					.transform((value) => value.trim())
					.refine(
						(value) =>
							value.length < 1 || !Number.isNaN(new Date(value).getTime()),
						{
							message: "Invalid date",
						},
					)
					.transform((value) => {
						if (value.length < 1) {
							return null;
						}

						return new Date(value).toISOString();
					}),
				priority: schema.enum(["low", "medium", "high"]).default("medium"),
				projectId: schema.preprocess(
					(value) => (value === "" ? undefined : value),
					schema.coerce.number().int().positive().optional(),
				),
				statusCode: schema.enum(["open", "completed"]).default("open"),
				title: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, {
						message: "Required",
					}),
			})
			.safeParse(ctx.body());

		if (!parsed.success) {
			return ctx.render("create", {
				errors: parsed.error.issues.reduce<Record<string, string[]>>(
					(errors, issue) => {
						const key = issue.path.join(".");
						if (!errors[key]) {
							errors[key] = [];
						}
						errors[key].push(issue.message);
						return errors;
					},
					{},
				),
				fields: {
					description: "",
					dueAt: "",
					isCompleted: false,
					isHighPriority: false,
					isLowPriority: false,
					isMediumPriority: true,
					isOpen: true,
					priority: "medium",
					statusCode: "open",
					title: "",
				},
				pageTitle: "New Todo",
			});
		}

		const input: {
			description: string;
			dueAt: string | null;
			priority: "low" | "medium" | "high";
			projectId?: number;
			statusCode: "open" | "completed";
			title: string;
		} = {
			description: parsed.data.description,
			dueAt: parsed.data.dueAt,
			priority: parsed.data.priority,
			statusCode: parsed.data.statusCode,
			title: parsed.data.title,
		};
		if (parsed.data.projectId !== undefined) {
			input.projectId = parsed.data.projectId;
		}

		const result = await this.#db.transaction(async (tx) => {
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
					priority_id: schema
						.object({
							id: schema.coerce.number().int().positive(),
						})
						.parse(priority).id,
					project_id: input.projectId ?? null,
					status_id: schema
						.object({
							id: schema.coerce.number().int().positive(),
						})
						.parse(status).id,
					title: input.title,
					updated_at: now,
				})
				.returning(["id"]);

			return schema
				.object({
					id: schema.coerce.number().int().positive(),
				})
				.parse(row);
		});

		return ctx.redirect(`/todos/${result.id}`);
	}

	async edit(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const row = await this.#db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": todoId })
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
		if (!row) {
			return ctx.notFound();
		}
		const todo = schema
			.object({
				completed_at: schema.string().nullable().optional(),
				created_at: schema.string().optional(),
				description: schema.string().optional(),
				due_at: schema.string().nullable().optional(),
				id: schema.coerce.number().int().positive(),
				priority_code: schema.enum(["low", "medium", "high"]).optional(),
				project_id: schema.coerce
					.number()
					.int()
					.positive()
					.nullable()
					.optional(),
				status_code: schema.enum(["open", "completed"]).optional(),
				title: schema.string().nonempty(),
				updated_at: schema.string().optional(),
			})
			.transform((parsedRow) => ({
				completedAt: parsedRow.completed_at ?? null,
				createdAt: parsedRow.created_at ?? new Date().toISOString(),
				description: parsedRow.description ?? "",
				dueAt: parsedRow.due_at ?? null,
				id: parsedRow.id,
				priority: parsedRow.priority_code ?? "medium",
				projectId: parsedRow.project_id ?? null,
				statusCode: parsedRow.status_code ?? "open",
				title: parsedRow.title,
				updatedAt: parsedRow.updated_at ?? new Date().toISOString(),
			}))
			.parse(row);

		return ctx.render("edit", {
			action: `/todos/${todo.id}`,
			errors: {},
			fields: {
				description: todo.description,
				dueAt: todo.dueAt ? todo.dueAt.slice(0, 10) : "",
				isCompleted: todo.statusCode === "completed",
				isHighPriority: todo.priority === "high",
				isLowPriority: todo.priority === "low",
				isMediumPriority: todo.priority === "medium",
				isOpen: todo.statusCode === "open",
				priority: todo.priority,
				statusCode: todo.statusCode,
				title: todo.title,
			},
			pageTitle: `Edit Todo #${todo.id}`,
			submitLabel: "Update",
			todoId: todo.id,
		});
	}

	async update(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const parsed = schema
			.strictObject({
				description: schema
					.string()
					.default("")
					.transform((value) => value.trim()),
				dueAt: schema
					.string()
					.optional()
					.default("")
					.transform((value) => value.trim())
					.refine(
						(value) =>
							value.length < 1 || !Number.isNaN(new Date(value).getTime()),
						{
							message: "Invalid date",
						},
					)
					.transform((value) => {
						if (value.length < 1) {
							return null;
						}

						return new Date(value).toISOString();
					}),
				priority: schema.enum(["low", "medium", "high"]).default("medium"),
				projectId: schema.preprocess(
					(value) => (value === "" ? undefined : value),
					schema.coerce.number().int().positive().optional(),
				),
				statusCode: schema.enum(["open", "completed"]).default("open"),
				title: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, {
						message: "Required",
					}),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			return ctx.render("edit", {
				action: `/todos/${todoId}`,
				errors: parsed.error.issues.reduce<Record<string, string[]>>(
					(errors, issue) => {
						const key = issue.path.join(".");
						if (!errors[key]) {
							errors[key] = [];
						}
						errors[key].push(issue.message);
						return errors;
					},
					{},
				),
				fields: {
					description: "",
					dueAt: "",
					isCompleted: false,
					isHighPriority: false,
					isLowPriority: false,
					isMediumPriority: true,
					isOpen: true,
					priority: "medium",
					statusCode: "open",
					title: "",
				},
				pageTitle: `Edit Todo #${todoId}`,
				submitLabel: "Update",
				todoId,
			});
		}

		const input: {
			id: number;
			description: string;
			dueAt: string | null;
			priority: "low" | "medium" | "high";
			projectId?: number;
			statusCode: "open" | "completed";
			title: string;
		} = {
			description: parsed.data.description,
			dueAt: parsed.data.dueAt,
			id: todoId,
			priority: parsed.data.priority,
			statusCode: parsed.data.statusCode,
			title: parsed.data.title,
		};
		if (parsed.data.projectId !== undefined) {
			input.projectId = parsed.data.projectId;
		}

		const result = await this.#db.transaction(async (tx) => {
			const currentRow = await tx("todos")
				.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
				.join("todo_statuses", "todos.status_id", "todo_statuses.id")
				.where({ "todos.id": input.id })
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
			if (!currentRow) {
				return undefined;
			}

			const current = schema
				.object({
					completed_at: schema.string().nullable().optional(),
					created_at: schema.string().optional(),
					description: schema.string().optional(),
					due_at: schema.string().nullable().optional(),
					id: schema.coerce.number().int().positive(),
					priority_code: schema.enum(["low", "medium", "high"]).optional(),
					project_id: schema.coerce
						.number()
						.int()
						.positive()
						.nullable()
						.optional(),
					status_code: schema.enum(["open", "completed"]).optional(),
					title: schema.string().nonempty(),
					updated_at: schema.string().optional(),
				})
				.transform((parsedRow) => ({
					completedAt: parsedRow.completed_at ?? null,
					createdAt: parsedRow.created_at ?? new Date().toISOString(),
					description: parsedRow.description ?? "",
					dueAt: parsedRow.due_at ?? null,
					id: parsedRow.id,
					priority: parsedRow.priority_code ?? "medium",
					projectId: parsedRow.project_id ?? null,
					statusCode: parsedRow.status_code ?? "open",
					title: parsedRow.title,
					updatedAt: parsedRow.updated_at ?? new Date().toISOString(),
				}))
				.parse(currentRow);

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
					priority_id: schema
						.object({
							id: schema.coerce.number().int().positive(),
						})
						.parse(priority).id,
					project_id: input.projectId ?? null,
					status_id: schema
						.object({
							id: schema.coerce.number().int().positive(),
						})
						.parse(status).id,
					title: input.title,
					updated_at: now,
				});

			if (affectedRows === 0) {
				return undefined;
			}

			return { id: input.id };
		});

		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}

	async destroy(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const deleted = (await this.#db("todos").where({ id: todoId }).del()) > 0;
		if (!deleted) {
			return ctx.notFound();
		}

		return ctx.redirect("/todos");
	}

	async toggle(ctx: HttpContext) {
		const parsedTodoId = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		if (!parsedTodoId.success) {
			return ctx.notFound();
		}
		const todoId = parsedTodoId.data;

		const result = await this.#db.transaction(async (tx) => {
			const currentRow = await tx("todos")
				.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
				.join("todo_statuses", "todos.status_id", "todo_statuses.id")
				.where({ "todos.id": todoId })
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
			if (!currentRow) {
				return undefined;
			}

			const current = schema
				.object({
					completed_at: schema.string().nullable().optional(),
					created_at: schema.string().optional(),
					description: schema.string().optional(),
					due_at: schema.string().nullable().optional(),
					id: schema.coerce.number().int().positive(),
					priority_code: schema.enum(["low", "medium", "high"]).optional(),
					project_id: schema.coerce
						.number()
						.int()
						.positive()
						.nullable()
						.optional(),
					status_code: schema.enum(["open", "completed"]).optional(),
					title: schema.string().nonempty(),
					updated_at: schema.string().optional(),
				})
				.transform((parsedRow) => ({
					completedAt: parsedRow.completed_at ?? null,
					createdAt: parsedRow.created_at ?? new Date().toISOString(),
					description: parsedRow.description ?? "",
					dueAt: parsedRow.due_at ?? null,
					id: parsedRow.id,
					priority: parsedRow.priority_code ?? "medium",
					projectId: parsedRow.project_id ?? null,
					statusCode: parsedRow.status_code ?? "open",
					title: parsedRow.title,
					updatedAt: parsedRow.updated_at ?? new Date().toISOString(),
				}))
				.parse(currentRow);

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
				.where({ id: todoId })
				.update({
					completed_at:
						nextStatusCode === "completed"
							? (current.completedAt ?? now)
							: null,
					status_id: schema
						.object({
							id: schema.coerce.number().int().positive(),
						})
						.parse(status).id,
					updated_at: now,
				});

			if (affectedRows === 0) {
				return undefined;
			}

			return { id: todoId };
		});
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/todos/${result.id}`);
	}
}
